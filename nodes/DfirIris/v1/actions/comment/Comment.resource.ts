import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as create from './create.operation';
import * as deleteComment from './deleteComment.operation';
import * as getAll from './getAll.operation';
import * as update from './update.operation';

export { create, deleteComment, getAll, update };

export const resource: INodeProperties[] = [
	buildOperationProperty('comment', 'getAll'),
	...create.description,
	...deleteComment.description,
	...getAll.description,
	...update.description,
];
