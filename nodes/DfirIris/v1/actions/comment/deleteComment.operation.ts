import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from 'n8n-workflow';

import { apiRequest } from '../../transport';
import { types, utils } from '../../helpers';
import * as local from './commonDescription';

const properties: INodeProperties[] = [
	local.rObjectName,
	local.rObjectId,
	local.rCommentId,

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
		resource: ['comment'],
		operation: ['deleteComment'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const query: IDataObject = { cid: this.getNodeParameter('cid', i, 0) as number };
	let response;

	const obj_name = this.getNodeParameter('obj_name', i) as string;
	const obj_id = utils.sanitizeSinglePathSegment(
		this.getNodeParameter('obj_id', i),
		this.getNode(),
		i,
		'Object ID',
	);
	const comment_id = utils.sanitizeSinglePathSegment(
		this.getNodeParameter('comment_id', i),
		this.getNode(),
		i,
		'Comment ID',
	);
	const uri_base = obj_name === 'alert' ? 'alerts' : `case/${obj_name}`

	response = await apiRequest.call(
		this,
		'POST',
		`${uri_base}/${encodeURIComponent(obj_id)}/comments/${encodeURIComponent(comment_id)}/delete`,
		{},
		query,
	);

	const options = this.getNodeParameter('options', i, {});
	const isRaw = (options.isRaw as boolean) || false;
	
	if (!isRaw) response = [{ status: 'success' }];

	const executionData = this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(response as IDataObject[]),
		{ itemData: { item: i } },
	);

	return executionData;
}
