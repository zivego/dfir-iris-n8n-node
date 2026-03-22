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
	{...local.assetName, required: true},
	{...local.assetType, required: true},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		options: [
			local.assetAnalysisStatus,
			local.assetCompromiseStatus,
			local.assetDescription,
			local.assetDomain,
			local.assetInfo,
			local.assetIP,
			local.assetTags,
			types.customAttributes,
			local.iocReference,
		],
	},

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
		operation: ['update'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const cid = this.getNodeParameter('cid', i, 0) as number;
	const query: IDataObject = { cid };
	let response;
	const body: IDataObject = {};
	const apiMode = await getCredentialApiMode.call(this);
	const assetId = this.getNodeParameter(local.assetId.name, i) as number;

	body.asset_type_id = this.getNodeParameter(local.assetType.name, i) as number;
	body.asset_name = this.getNodeParameter(local.assetName.name, i) as string;
	utils.addAdditionalFields.call(this, body, i);

	response =
		apiMode === 'next'
			? await apiRequest.call(this, 'PUT', buildNextCaseScopedEndpoint(cid, 'assets', assetId), body)
			: await apiRequest.call(this, 'POST', `${endpoint}/update/${assetId}`, body, query);

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
