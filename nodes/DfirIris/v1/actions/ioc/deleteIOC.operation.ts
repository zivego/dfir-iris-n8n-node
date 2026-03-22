import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { endpoint } from './IOC.resource';
import { buildNextCaseScopedEndpoint } from '../../compatibility';
import { apiRequest, getCredentialApiMode } from '../../transport';
import { types } from '../../helpers';
import * as local from './commonDescription';

const properties: INodeProperties[] = [
	{...local.iocId, required: true},
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
		resource: ['ioc'],
		operation: ['deleteIOC'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const cid = this.getNodeParameter('cid', i, 0) as number;
	const query: IDataObject = { cid };
	let response;
	const apiMode = await getCredentialApiMode.call(this);
	const iocId = this.getNodeParameter(local.iocId.name, i) as number;

	response =
		apiMode === 'next'
			? await apiRequest.call(
					this,
					'DELETE',
					buildNextCaseScopedEndpoint(cid, 'iocs', iocId),
					{},
					{},
					{ json: false, returnFullResponse: true },
				)
			: await apiRequest.call(this, 'POST', `${endpoint}/delete/${iocId}`, {}, query);

	const options = this.getNodeParameter('options', i, {});
	const isRaw = (options.isRaw as boolean) || false;
	
	if (!isRaw) response = [{ status: 'success' }];

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject[]),
		{ itemData: { item: i } },
	);

	return executionData;
}
