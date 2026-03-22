import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as addEvent from './addEvent.operation';
import * as deleteEvent from './deleteEvent.operation';
import * as flagEvent from './flagEvent.operation';
import * as fetchEvent from './fetchEvent.operation';
import * as getTimelineState from './getTimelineState.operation';
import * as updateEvent from './updateEvent.operation';
import * as queryTimeline from './queryTimeline.operation';

export { addEvent, deleteEvent, flagEvent, fetchEvent, getTimelineState, updateEvent, queryTimeline };

export const endpoint = 'case/timeline';

export const resource: INodeProperties[] = [
	buildOperationProperty('timeline', 'addEvent'),
	...addEvent.description,
	...deleteEvent.description,
	...fetchEvent.description,
	...flagEvent.description,
	...getTimelineState.description,
	...updateEvent.description,
	...queryTimeline.description,
];
