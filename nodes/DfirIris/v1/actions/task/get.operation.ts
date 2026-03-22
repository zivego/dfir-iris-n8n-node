import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { endpoint } from './Task.resource';
import { buildNextCaseScopedEndpoint, extractNextResponseData } from '../../compatibility';
import { apiRequest, getCredentialApiMode } from '../../transport';
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
		displayName: 'Task Name or ID',
		name: 'id',
		type: 'options',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getTasks',
			loadOptionsDependsOn: ['cid'],
		},
		default: '',
		required: true,
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
		resource: ['task'],
		operation: ['get'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const cid = this.getNodeParameter('cid', i, 0) as number;
	const query: IDataObject = { cid };
	let response;
	const apiMode = await getCredentialApiMode.call(this);
	const taskId = this.getNodeParameter('id', i) as number;

	response =
		apiMode === 'next'
			? await apiRequest.call(this, 'GET', buildNextCaseScopedEndpoint(cid, 'tasks', taskId), {})
			: await apiRequest.call(this, 'GET', `${endpoint}/${taskId}`, {}, query);

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
