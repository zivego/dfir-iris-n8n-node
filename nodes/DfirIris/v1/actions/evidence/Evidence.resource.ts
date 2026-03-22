import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as createEvidence from './createEvidence.operation';
import * as updateEvidence from './updateEvidence.operation';
import * as getEvidence from './getEvidence.operation';
import * as listEvidences from './listEvidences.operation';
import * as deleteEvidence from './deleteEvidence.operation';

export { createEvidence, updateEvidence, getEvidence, listEvidences, deleteEvidence };

export const endpoint = 'case/evidences';

export const resource: INodeProperties[] = [
	buildOperationProperty('evidence', 'createEvidence'),
	...createEvidence.description,
	...deleteEvidence.description,
	...getEvidence.description,
	...listEvidences.description,
	...updateEvidence.description,
];
