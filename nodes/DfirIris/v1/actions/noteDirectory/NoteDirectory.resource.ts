import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as create from './create.operation';
import * as deleteNoteDirectory from './deleteNoteDirectory.operation';
import * as getAll from './getAll.operation';
import * as update from './update.operation';

export { create, deleteNoteDirectory, getAll, update };

export const endpoint = 'case/notes/directories';

export const resource: INodeProperties[] = [
	buildOperationProperty('noteDirectory', 'getAll'),
	...create.description,
	...deleteNoteDirectory.description,
	...getAll.description,
	...update.description,
];
