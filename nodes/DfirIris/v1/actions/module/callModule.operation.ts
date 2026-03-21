import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { NodeOperationError, updateDisplayOptions } from 'n8n-workflow';

import { apiRequest } from '../../transport';
import { utils } from '../../helpers';

const properties: INodeProperties[] = [
	{
		displayName: 'Case Object Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Asset', value: 'asset' },
			{ name: 'Case', value: 'case' },
			{ name: 'Event', value: 'event' },
			{ name: 'Evidence', value: 'evidence' },
			{ name: 'Global Task', value: 'global_task' },
			{ name: 'IOC', value: 'ioc' },
			{ name: 'Note', value: 'note' },
			{ name: 'Task', value: 'task' },
		],
		default: 'case',
	},
	{
		displayName: 'Select Module Name or ID',
		name: 'moduleData',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getModules',
			loadOptionsDependsOn: ['type'],
		},
		default: '',
		// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-options
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a> with syntax: "hook_name;manual_hook_ui_name;module_name"',
	},
	{
		displayName: 'Module Targets',
		name: 'targetsString',
		type: 'string',
		default: '',
		description: 'Comma-separated list of the object IDs. E.g. task IDs, ioc IDs, etc',
	},
];

const displayOptions = {
	show: {
		resource: ['module'],
		operation: ['callModule'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const query: IDataObject = { cid: this.getNodeParameter('cid', i, 0) as number };
	const body: IDataObject = {};
	const moduleData = this.getNodeParameter('moduleData', i) as string;
	const [hookName, hookUiName, moduleName, ...unexpectedParts] = moduleData
		.split(';')
		.map((entry) => entry.trim());

	if (
		unexpectedParts.length > 0 ||
		!hookName ||
		!hookUiName ||
		!moduleName
	) {
		throw new NodeOperationError(
			this.getNode(),
			'Module Data must use the format "hook_name;manual_hook_ui_name;module_name"',
			{ itemIndex: i },
		);
	}

	body.hook_name = hookName;
	body.hook_ui_name = hookUiName;
	body.module_name = moduleName;

	body.type = this.getNodeParameter('type', i) as string;
	body.targets = utils.parseCommaSeparatedStrings(this.getNodeParameter('targetsString', i));

	const response = await apiRequest.call(this, 'POST', 'dim/hooks/call', body, query);

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject),
		{ itemData: { item: i } },
	);

	return executionData;
}
