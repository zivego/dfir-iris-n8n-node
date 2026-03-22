import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as getTree from './getTree.operation';

import * as addFolder from './addFolder.operation';
import * as moveFolder from './moveFolder.operation';
import * as renameFolder from './renameFolder.operation';
import * as deleteFolder from './deleteFolder.operation';

export { getTree, addFolder, moveFolder, renameFolder, deleteFolder };

export const endpoint = 'datastore';

export const resource: INodeProperties[] = [
	buildOperationProperty('datastoreFolder', 'getTree'),
	...getTree.description,

	...addFolder.description,
	...moveFolder.description,
	...renameFolder.description,
	...deleteFolder.description,
];
