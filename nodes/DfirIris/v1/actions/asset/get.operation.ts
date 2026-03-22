import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { endpoint } from './Asset.resource';
import { buildNextCaseScopedEndpoint, extractNextResponseData } from '../../compatibility';
import { apiRequest, getCredentialApiMode } from '../../transport';
import { types, utils } from '../../helpers';
import * as local from './commonDescription';

const properties: INodeProperties[] = [
	{...local.assetId, required: true},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [...types.returnRaw, ...types.fieldProperties(types.assetFields)],
	},
];

const displayOptions = {
	show: {
		resource: ['asset'],
		operation: ['get'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const cid = this.getNodeParameter('cid', i, 0) as number;
	const query: IDataObject = { cid };
	let response;
	const apiMode = await getCredentialApiMode.call(this);
	const assetId = this.getNodeParameter(local.assetId.name, i) as number;

	response =
		apiMode === 'next'
			? await apiRequest.call(this, 'GET', buildNextCaseScopedEndpoint(cid, 'assets', assetId), {})
			: await apiRequest.call(this, 'GET', `${endpoint}/${assetId}`, {}, query);

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
