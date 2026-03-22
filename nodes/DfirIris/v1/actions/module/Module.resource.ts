import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as callModule from './callModule.operation';
import * as listTasks from './listTasks.operation';
import * as listHooks from './listHooks.operation';

export { callModule, listHooks, listTasks };

export const resource: INodeProperties[] = [
	buildOperationProperty('module', 'callModule'),
	...callModule.description,
	...listTasks.description,
	...listHooks.description,
];
