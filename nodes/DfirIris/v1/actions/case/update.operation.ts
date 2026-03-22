import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { endpoint } from './Case.resource';
import { extractNextResponseData } from '../../compatibility';
import { apiRequest, getCredentialApiMode } from '../../transport';
import { types, utils } from '../../helpers';
import * as icase from './commonDescription';

const fields = [
	'case_customer',
	'case_description',
	'case_id',
	'case_name',
	'case_soc_id',
	'case_tags',
	'case_uuid',
	'classification_id',
	'close_date',
	'closing_note',
	'custom_attributes',
	'modification_history',
	'open_date',
	'owner_id',
	'protagonists',
	'state_id',
	'status_id',
	'user_id',
];

const properties: INodeProperties[] = [
	icase.rCaseId,
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		options: [
			icase.caseName,
			icase.caseSocId,
			icase.caseClassification,
			icase.caseOwner,
			icase.caseReviewer,
			icase.caseState,
			icase.caseStatus,
			icase.caseSeverity,
			icase.caseTags,
			types.customAttributes,
		],
	},

	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [...types.returnRaw, ...types.fieldProperties(fields)],
	},
];

const displayOptions = {
	show: {
		resource: ['case'],
		operation: ['update'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const query: IDataObject = {};
	let response;
	const body: IDataObject = {};
	const apiMode = await getCredentialApiMode.call(this);
	const caseId = this.getNodeParameter('case_id', i, 0) as number;

	utils.addAdditionalFields.call(this, body, i);

	const options = this.getNodeParameter('options', i, {});

	response =
		apiMode === 'next'
			? await apiRequest.call(this, 'PUT', `api/v2/cases/${caseId}`, body, query)
			: await apiRequest.call(this, 'POST', `${endpoint}/update/${caseId}`, body, query);

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
