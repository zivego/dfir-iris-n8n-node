import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as create from './create.operation';
import * as deleteTask from './deleteTask.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as update from './update.operation';

export { create, deleteTask, get, getAll, update };

export const endpoint = 'case/tasks';

export const resource: INodeProperties[] = [
	buildOperationProperty('task', 'getAll'),
	...create.description,
	...deleteTask.description,
	...get.description,
	...getAll.description,
	...update.description,
];
