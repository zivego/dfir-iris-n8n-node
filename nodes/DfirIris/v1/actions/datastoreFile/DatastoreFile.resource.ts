import type { INodeProperties } from 'n8n-workflow';

import { buildOperationProperty } from '../../compatibility';
import * as uploadFile from './uploadFile.operation';
import * as updateFileInfo from './updateFileInfo.operation';
import * as getFileInfo from './getFileInfo.operation';
import * as downloadFile from './downloadFile.operation';
import * as moveFile from './moveFile.operation';
import * as deleteFile from './deleteFile.operation';

export { uploadFile, getFileInfo, updateFileInfo, downloadFile, moveFile, deleteFile };

export const endpoint = 'datastore';

export const resource: INodeProperties[] = [
	buildOperationProperty('datastoreFile', 'uploadFile'),
	...uploadFile.description,
	...getFileInfo.description,
	...updateFileInfo.description,
	...downloadFile.description,
	...moveFile.description,
	...deleteFile.description,
];
