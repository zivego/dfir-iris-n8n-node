import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { endpoint } from './Task.resource';
import {
	buildNextCaseScopedEndpoint,
	normalizeNextPaginatedItems,
} from '../../compatibility';
import { apiRequest, apiRequestAllNext, getCredentialApiMode } from '../../transport';
import { types, utils } from '../../helpers';

const fields = [
	'custom_attributes',
	'id',
	'modification_history',
	'task_assignees',
	'task_case_id',
	'task_close_date',
	'task_description',
	'task_last_update',
	'task_open_date',
	'task_status_id',
	'task_tags',
	'task_title',
	'task_userid_close',
	'task_userid_open',
	'task_userid_update',
	'task_uuid',
];

const properties: INodeProperties[] = [
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
		resource: ['task'],
		operation: ['getAll'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const cid = this.getNodeParameter('cid', i, 0) as number;
	const query: IDataObject = { cid };
	let response;
	const apiMode = await getCredentialApiMode.call(this);

	response =
		apiMode === 'next'
			? await apiRequestAllNext.call(this, 'GET', buildNextCaseScopedEndpoint(cid, 'tasks'), {}, {}, 0, 1)
			: await apiRequest.call(this, 'GET', `${endpoint}/list`, {}, query);

	const options = this.getNodeParameter('options', i, {});
	const isRaw = (options.isRaw as boolean) || false;
	
	// field remover
	if (Object.prototype.hasOwnProperty.call(options, 'fields') && response.data && typeof response.data === 'object') {
		const data = response.data as IDataObject;
		if (apiMode === 'next') {
			data.data = utils.fieldsRemover(normalizeNextPaginatedItems(response.data), options);
		} else if ('tasks' in data) {
			data.tasks = utils.fieldsRemover((data.tasks as IDataObject[]), options);
		}
	}
	
	if (!isRaw) response = apiMode === 'next' ? normalizeNextPaginatedItems(response.data) : (response.data as IDataObject).tasks;

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject[]),
		{ itemData: { item: i } },
	);

	return executionData;
}
