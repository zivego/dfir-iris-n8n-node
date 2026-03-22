import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { endpoint } from './Asset.resource';
import {
	buildNextCaseScopedEndpoint,
	normalizeNextPaginatedItems,
} from '../../compatibility';
import { apiRequest, apiRequestAllNext, getCredentialApiMode } from '../../transport';
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
	const cid = this.getNodeParameter('cid', i, 0) as number;
	const query: IDataObject = { cid };
	let response;
	const apiMode = await getCredentialApiMode.call(this);

	if (apiMode === 'next') {
		response = await apiRequestAllNext.call(
			this,
			'GET',
			buildNextCaseScopedEndpoint(cid, 'assets'),
			{},
			{},
			100,
			this.getNodeParameter('options.startPage', i, 1) as number,
		);
	} else {
		try {
			response = await apiRequest.call(this, 'GET', `${endpoint}/list`, {}, query);
		} catch {
			response = undefined;
		}

		if (!response || extractAssets(response.data).length === 0) {
			response = await apiRequest.call(this, 'GET', `${endpoint}/filter`, {}, query);
		}
	}

	const options = this.getNodeParameter('options', i, {});
	const isRaw = (options.isRaw as boolean) || false;
	
	// field remover
	if (
		Object.prototype.hasOwnProperty.call(options, 'fields') &&
		response.data &&
		typeof response.data === 'object' &&
		(apiMode === 'next' || 'assets' in response.data)
	) {
		const data = response.data as IDataObject;
		if (apiMode === 'next') {
			data.data = utils.fieldsRemover(normalizeNextPaginatedItems(response.data), options);
		} else {
			data.assets = utils.fieldsRemover((data.assets as IDataObject[]), options);
		}
	}
	if (!isRaw) response = apiMode === 'next' ? normalizeNextPaginatedItems(response.data) : (response.data as IDataObject).assets;

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject[]),
		{ itemData: { item: i } },
	);

	return executionData;
}
