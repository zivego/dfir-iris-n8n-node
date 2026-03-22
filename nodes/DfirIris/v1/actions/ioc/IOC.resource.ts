import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as create from './create.operation';
import * as deleteIOC from './deleteIOC.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as update from './update.operation';

export { create, deleteIOC, get, getAll, update };

export const endpoint = 'case/ioc';

export const resource: INodeProperties[] = [
	buildOperationProperty('ioc', 'getAll'),
	...create.description,
	...deleteIOC.description,
	...get.description,
	...getAll.description,
	...update.description,
];
