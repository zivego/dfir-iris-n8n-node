import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as getAssetTypes from './getAssetTypes.operation';
import * as getCaseCustomers from './getCaseCustomers.operation';
import * as getCaseClassifications from './getCaseClassifications.operation';
import * as getCaseStates from './getCaseStates.operation';
import * as getCaseTemplates from './getCaseTemplates.operation';
import * as getEvidenceTypes from './getEvidenceTypes.operation';
import * as getIOCTypes from './getIOCTypes.operation';
import * as getSeverities from './getSeverities.operation';
import * as getTaskStatuses from './getTaskStatuses.operation';
import * as getUsers from './getUsers.operation';

export { getAssetTypes, getCaseClassifications, getCaseStates, getCaseTemplates, getCaseCustomers, 
	getEvidenceTypes, getIOCTypes, getSeverities, getUsers, getTaskStatuses };
export const resource: INodeProperties[] = [
	buildOperationProperty('manage', 'getCaseClassifications'),
	...getAssetTypes.description,
	...getCaseClassifications.description,
	...getCaseCustomers.description,
	...getCaseStates.description,
	...getCaseTemplates.description,
	...getEvidenceTypes.description,
	...getIOCTypes.description,
	...getSeverities.description,
	...getUsers.description,
	...getTaskStatuses.description,
];
