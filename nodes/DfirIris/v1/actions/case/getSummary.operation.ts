import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { extractNextResponseData } from '../../compatibility';
import { apiRequest, getCredentialApiMode } from '../../transport';
import { types, utils } from '../../helpers';
import * as icase from './commonDescription';

const properties: INodeProperties[] = [
	icase.rCaseId,
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [...types.returnRaw],
	},
];

const displayOptions = {
	show: {
		resource: ['case'],
		operation: ['getSummary'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const caseId = this.getNodeParameter('case_id', i) as number;
	const query: IDataObject = { cid: caseId };
	let response;
	const apiMode = await getCredentialApiMode.call(this);

	response =
		apiMode === 'next'
			? await apiRequest.call(this, 'GET', `api/v2/cases/${caseId}`, {}, {})
			: await apiRequest.call(this, 'GET', `case/summary/fetch`, {}, query);

	const options = this.getNodeParameter('options', i, {});
	const isRaw = (options.isRaw as boolean) || false;
	
	// field remover
	if (Object.prototype.hasOwnProperty.call(options, 'fields')) {
		const responseData = apiMode === 'next' ? extractNextResponseData(response) : (response.data as IDataObject);
		response.data = utils.fieldsRemover(responseData, options);
	}
	if (!isRaw) response = apiMode === 'next' ? extractNextResponseData(response) : response.data;

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject[]),
		{ itemData: { item: i } },
	);

	return executionData;
}
