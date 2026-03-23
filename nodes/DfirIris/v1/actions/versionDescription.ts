/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import { NodeConnectionTypes, type INodeTypeDescription } from 'n8n-workflow';

import * as apiRequest from './apiRequest/ApiRequest.resource';
import * as alert from './alert/Alert.resource';
import * as asset from './asset/Asset.resource';
import * as icase from './case/Case.resource';
import * as comment from './comment/Comment.resource';
import * as datastoreFile from './datastoreFile/DatastoreFile.resource';
import * as datastoreFolder from './datastoreFolder/DatastoreFolder.resource';
import * as evidence from './evidence/Evidence.resource';
import * as ioc from './ioc/IOC.resource';
import * as iModule from './module/Module.resource';
import * as note from './note/Note.resource';
import * as noteDirectory from './noteDirectory/NoteDirectory.resource';
import * as task from './task/Task.resource';
import * as manage from './manage/Manage.resource';
import * as timeline from './timeline/Timeline.resource';

import { buildResourceProperty } from '../compatibility';
import { cidDescription } from '../helpers/types';

export const versionDescription: INodeTypeDescription = {
	displayName: 'DFIR IRIS',
	name: 'zivegoDfirIris',
	group: ['input'],
	version: [1, 2],
	subtitle: '={{ $parameter["resource"] + ": " + $parameter["operation"] }}',
	description: 'works with DFIR IRIS IRP',
	defaults: {
		name: 'DFIR IRIS',
	},
	inputs: [NodeConnectionTypes.Main],
	outputs: [NodeConnectionTypes.Main],
	credentials: [
		{
			name: 'zivegoDfirIrisApi',
			required: true,
		},
	],
	properties: [
		buildResourceProperty(),
		...cidDescription,
		...apiRequest.resource,
		...alert.resource,
		...asset.resource,
		...icase.resource,
		...comment.resource,
		...datastoreFile.resource,
		...datastoreFolder.resource,
		...evidence.resource,
		...ioc.resource,
		...iModule.resource,
		...manage.resource,
		...note.resource,
		...noteDirectory.resource,
		...task.resource,
		...timeline.resource,
	],
};
