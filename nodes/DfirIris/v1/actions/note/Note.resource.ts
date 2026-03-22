import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as create from './create.operation';
import * as deleteNote from './deleteNote.operation';
import * as search from './search.operation';
import * as get from './get.operation';
import * as update from './update.operation';

export { create, deleteNote, get, search, update };

export const endpoint = 'case/notes';

export const resource: INodeProperties[] = [
	buildOperationProperty('note', 'get'),
	...create.description,
	...deleteNote.description,
	...get.description,
	...search.description,
	...update.description,
];
