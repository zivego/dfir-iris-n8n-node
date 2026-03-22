import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as create from './create.operation';
import * as deleteAlert from './deleteAlert.operation';
import * as get from './get.operation';
import * as getRelations from './getRelations.operation';
import * as filterAlerts from './filterAlerts.operation';
import * as update from './update.operation';
import * as countAlerts from './countAlerts.operation';
import * as batchUpdate from './batchUpdate.operation';
import * as batchDelete from './batchDelete.operation';
import * as escalate from './escalate.operation';
import * as merge from './merge.operation';
import * as unmerge from './unmerge.operation';

export {
	create,
	deleteAlert,
	get,
	getRelations,
	filterAlerts,
	update,
	countAlerts,
	batchUpdate,
	batchDelete,
	escalate,
	merge,
	unmerge,
};

export const endpoint = 'alerts';

export const resource: INodeProperties[] = [
	buildOperationProperty('alert', 'countAlerts'),
	...create.description,
	...deleteAlert.description,
	...get.description,
	...getRelations.description,
	...update.description,
	...filterAlerts.description,
	...countAlerts.description,
	...batchUpdate.description,
	...batchDelete.description,
	...escalate.description,
	...merge.description,
	...unmerge.description,
];
