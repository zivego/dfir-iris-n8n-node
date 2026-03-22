import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as create from './create.operation';
import * as deleteAsset from './deleteAsset.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as update from './update.operation';

export { create, deleteAsset, get, getAll, update };

export const endpoint = 'case/assets';

export const resource: INodeProperties[] = [
	buildOperationProperty('asset', 'getAll'),
	...create.description,
	...deleteAsset.description,
	...get.description,
	...getAll.description,
	...update.description,
];
