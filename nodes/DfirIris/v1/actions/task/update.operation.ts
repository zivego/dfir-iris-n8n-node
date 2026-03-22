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
		displayName: 'Task Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
	},
	{
		displayName: 'Task Assignee Name or ID',
		name: 'assignee',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getUsers',
		},
		default: '',
		required: true,
		description:
			'To whom assign a task. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Task Status',
		name: 'status',
		type: 'options',
		default: 1,
		options: [
			{
				value: 1,
				name: 'To Do',
			},
			{
				value: 2,
				name: 'In Progress',
			},
			{
				value: 3,
				name: 'On Hold',
			},
			{
				value: 4,
				name: 'Done',
			},
			{
				value: 5,
				name: 'Canceled',
			},
		],
		required: true,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		options: [
			{
				displayName: 'Task Description',
				name: 'task_description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
			},
			{
				displayName: 'Task Tags',
				name: 'task_tags',
				type: 'string',
				default: '',
				description: 'Task tags as comma-separated string',
			},
			{
				displayName: 'Custom Attributes',
				name: 'custom_attributes',
				type: 'json',
				default: 0,
				description: 'Add custom attributes',
			},
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
		resource: ['task'],
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
	const taskId = this.getNodeParameter('id', i) as number;

	body.task_title = this.getNodeParameter('title', i) as string;
	body.task_assignees_id = [this.getNodeParameter('assignee', i) as number];
	body.task_status_id = this.getNodeParameter('status', i) as number;
	utils.addAdditionalFields.call(this, body, i);

	response =
		apiMode === 'next'
			? await apiRequest.call(this, 'PUT', buildNextCaseScopedEndpoint(cid, 'tasks', taskId), body)
			: await apiRequest.call(this, 'POST', `${endpoint}/update/${taskId}`, body, query);

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
