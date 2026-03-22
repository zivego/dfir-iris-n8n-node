import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as create from './create.operation';
import * as deleteCase from './deleteCase.operation';
import * as getSummary from './getSummary.operation';
import * as countCases from './countCases.operation';
import * as filterCases from './filterCases.operation';
import * as update from './update.operation';
import * as updateSummary from './updateSummary.operation';
import * as exportCase from './exportCase.operation';
import * as addTaskLog from './addTaskLog.operation';

export {
	create,
	deleteCase,
	getSummary,
	filterCases,
	update,
	updateSummary,
	countCases,
	exportCase,
	addTaskLog
};

export const endpoint = 'manage/cases';

export const resource: INodeProperties[] = [
	buildOperationProperty('case', 'countCases'),
	...countCases.description,
	...create.description,
	...addTaskLog.description,
	...deleteCase.description,
	...exportCase.description,
	...filterCases.description,
	...getSummary.description,
	...update.description,
	...updateSummary.description,
];
