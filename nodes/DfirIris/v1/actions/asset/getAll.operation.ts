import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { endpoint } from './Asset.resource';
import { apiRequest } from '../../transport';
import { types, utils } from '../../helpers';

function extractAssets(data: unknown): IDataObject[] {
	if (!data || typeof data !== 'object' || !('assets' in (data as IDataObject))) {
		return [];
	}

	const assets = (data as IDataObject).assets;
	return Array.isArray(assets) ? (assets as IDataObject[]) : [];
}

const properties: INodeProperties[] = [
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
		operation: ['getAll'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const query: IDataObject = { cid: this.getNodeParameter('cid', i, 0) as number };
	let response;

	try {
		response = await apiRequest.call(this, 'GET', `${endpoint}/list`, {}, query);
	} catch {
		response = undefined;
	}

	if (!response || extractAssets(response.data).length === 0) {
		response = await apiRequest.call(this, 'GET', `${endpoint}/filter`, {}, query);
	}

	const options = this.getNodeParameter('options', i, {});
	const isRaw = (options.isRaw as boolean) || false;
	
	// field remover
	if (Object.prototype.hasOwnProperty.call(options, 'fields') && response.data && typeof response.data === 'object' && 'assets' in response.data) {
		const data = response.data as IDataObject;
		data.assets = utils.fieldsRemover((data.assets as IDataObject[]), options);
	}
	if (!isRaw) response = (response.data as IDataObject).assets;

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject[]),
		{ itemData: { item: i } },
	);

	return executionData;
}
