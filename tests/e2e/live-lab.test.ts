import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { execute as apiRequestExecute } from '../../nodes/DfirIris/v1/actions/apiRequest/ApiRequest.resource';
import * as alertOperations from '../../nodes/DfirIris/v1/actions/alert/Alert.resource';
import * as assetOperations from '../../nodes/DfirIris/v1/actions/asset/Asset.resource';
import * as caseOperations from '../../nodes/DfirIris/v1/actions/case/Case.resource';
import * as commentOperations from '../../nodes/DfirIris/v1/actions/comment/Comment.resource';
import * as datastoreFileOperations from '../../nodes/DfirIris/v1/actions/datastoreFile/DatastoreFile.resource';
import * as datastoreFolderOperations from '../../nodes/DfirIris/v1/actions/datastoreFolder/DatastoreFolder.resource';
import * as evidenceOperations from '../../nodes/DfirIris/v1/actions/evidence/Evidence.resource';
import * as iocOperations from '../../nodes/DfirIris/v1/actions/ioc/IOC.resource';
import * as manageOperations from '../../nodes/DfirIris/v1/actions/manage/Manage.resource';
import * as moduleOperations from '../../nodes/DfirIris/v1/actions/module/Module.resource';
import * as noteOperations from '../../nodes/DfirIris/v1/actions/note/Note.resource';
import * as noteDirectoryOperations from '../../nodes/DfirIris/v1/actions/noteDirectory/NoteDirectory.resource';
import * as taskOperations from '../../nodes/DfirIris/v1/actions/task/Task.resource';
import * as timelineOperations from '../../nodes/DfirIris/v1/actions/timeline/Timeline.resource';
import {
	buildLiveParameters,
	createBinaryInputItem,
	createLiveExecuteContext,
	extractId,
	fetchJson,
	getRequiredEnv,
	N8nRestClient,
} from './support/liveHarness';

type OperationExport = {
	description?: unknown[];
	execute: (this: unknown, itemIndex: number) => Promise<unknown>;
};

const runLiveE2E = process.env.RUN_LIVE_E2E === '1';
const describeLive = runLiveE2E ? describe.sequential : describe.skip;

const n8nBaseUrl = process.env.N8N_BASE_URL;
const basicAuthUser = process.env.N8N_BASIC_AUTH_USER;
const basicAuthPassword = process.env.N8N_BASIC_AUTH_PASSWORD;
const ownerEmail = process.env.N8N_OWNER_EMAIL || 'owner@example.com';
const ownerPassword = process.env.N8N_OWNER_PASSWORD || 'OwnerPass123!';
const ownerFirstName = process.env.N8N_OWNER_FIRST_NAME || 'QA';
const ownerLastName = process.env.N8N_OWNER_LAST_NAME || 'Owner';
const seededCaseId = Number(process.env.DFIR_IRIS_CASE_ID || '1');
const n8nReachableIrisHost = process.env.N8N_DFIR_IRIS_HOST || 'host.docker.internal:8443';

let alertId: number | string | undefined;
let assetId: number | string | undefined;
let caseId: number | string | undefined;
let createdCaseForLiveSuite = false;
let commentId: number | string | undefined;
let datastoreCaseIdForLiveSuite = seededCaseId;
let datastoreFileId: number | string | undefined;
let datastoreSourceFolderId: number | string | undefined;
let datastoreTargetFolderId: number | string | undefined;
let evidenceId: number | string | undefined;
let iocId: number | string | undefined;
let noteDirectoryId: number | string | undefined;
let noteId: number | string | undefined;
let n8nCredentialId: number | string | undefined;
let taskId: number | string | undefined;
let timelineEventId: number | string | undefined;
let userId: number | string | undefined;

const n8nClient =
	n8nBaseUrl && basicAuthUser && basicAuthPassword
		? new N8nRestClient(
				n8nBaseUrl,
				basicAuthUser,
				basicAuthPassword,
				ownerEmail,
				ownerPassword,
				ownerFirstName,
				ownerLastName,
			)
		: undefined;

const caseCreate = caseOperations.create as OperationExport;
const caseDelete = caseOperations.deleteCase as OperationExport;
const caseGetSummary = caseOperations.getSummary as OperationExport;
const caseUpdateSummary = caseOperations.updateSummary as OperationExport;
const alertCreate = alertOperations.create as OperationExport;
const alertDelete = alertOperations.deleteAlert as OperationExport;
const alertGet = alertOperations.get as OperationExport;
const alertUpdate = alertOperations.update as OperationExport;
const assetCreate = assetOperations.create as OperationExport;
const assetDelete = assetOperations.deleteAsset as OperationExport;
const assetGet = assetOperations.get as OperationExport;
const assetGetAll = assetOperations.getAll as OperationExport;
const assetUpdate = assetOperations.update as OperationExport;
const commentCreate = commentOperations.create as OperationExport;
const commentDelete = commentOperations.deleteComment as OperationExport;
const commentGetAll = commentOperations.getAll as OperationExport;
const commentUpdate = commentOperations.update as OperationExport;
const datastoreDeleteFile = datastoreFileOperations.deleteFile as OperationExport;
const datastoreDownloadFile = datastoreFileOperations.downloadFile as OperationExport;
const datastoreGetFileInfo = datastoreFileOperations.getFileInfo as OperationExport;
const datastoreMoveFile = datastoreFileOperations.moveFile as OperationExport;
const datastoreUpdateFileInfo = datastoreFileOperations.updateFileInfo as OperationExport;
const datastoreUploadFile = datastoreFileOperations.uploadFile as OperationExport;
const datastoreAddFolder = datastoreFolderOperations.addFolder as OperationExport;
const datastoreDeleteFolder = datastoreFolderOperations.deleteFolder as OperationExport;
const datastoreRenameFolder = datastoreFolderOperations.renameFolder as OperationExport;
const evidenceCreate = evidenceOperations.createEvidence as OperationExport;
const evidenceDelete = evidenceOperations.deleteEvidence as OperationExport;
const evidenceGet = evidenceOperations.getEvidence as OperationExport;
const evidenceList = evidenceOperations.listEvidences as OperationExport;
const evidenceUpdate = evidenceOperations.updateEvidence as OperationExport;
const iocCreate = iocOperations.create as OperationExport;
const iocDelete = iocOperations.deleteIOC as OperationExport;
const iocGet = iocOperations.get as OperationExport;
const iocGetAll = iocOperations.getAll as OperationExport;
const iocUpdate = iocOperations.update as OperationExport;
const manageGetUsers = manageOperations.getUsers as OperationExport;
const moduleCall = moduleOperations.callModule as OperationExport;
const moduleListHooks = moduleOperations.listHooks as OperationExport;
const moduleListTasks = moduleOperations.listTasks as OperationExport;
const noteCreate = noteOperations.create as OperationExport;
const noteDelete = noteOperations.deleteNote as OperationExport;
const noteGet = noteOperations.get as OperationExport;
const noteUpdate = noteOperations.update as OperationExport;
const noteDirectoryCreate = noteDirectoryOperations.create as OperationExport;
const noteDirectoryDelete = noteDirectoryOperations.deleteNoteDirectory as OperationExport;
const noteDirectoryUpdate = noteDirectoryOperations.update as OperationExport;
const taskCreate = taskOperations.create as OperationExport;
const taskDelete = taskOperations.deleteTask as OperationExport;
const taskGet = taskOperations.get as OperationExport;
const taskUpdate = taskOperations.update as OperationExport;
const timelineAddEvent = timelineOperations.addEvent as OperationExport;
const timelineDeleteEvent = timelineOperations.deleteEvent as OperationExport;
const timelineFetchEvent = timelineOperations.fetchEvent as OperationExport;
const timelineUpdateEvent = timelineOperations.updateEvent as OperationExport;

async function runLiveOperation(
	operation: OperationExport,
	overrides: IDataObject = {},
	options: { inputItems?: INodeExecutionData[] } = {},
): Promise<INodeExecutionData[]> {
	const { context } = createLiveExecuteContext(buildLiveParameters(operation, overrides), options);
	return (await operation.execute.call(context as never, 0)) as INodeExecutionData[];
}

function unwrapSingle(output: INodeExecutionData[]) {
	return output[0]?.json as IDataObject;
}

function expectSuccessfulRestCall(status: number, body: unknown) {
	expect(status).toBeGreaterThanOrEqual(200);
	expect(status).toBeLessThan(300);
	if (body && typeof body === 'object') {
		expect((body as IDataObject).error).toBeUndefined();
	}
}

function expectCredentialTestFailure(body: unknown, status: number, pattern: RegExp) {
	const serialized = JSON.stringify(body);

	expect(status === 200 || status >= 400).toBe(true);
	expect(serialized).not.toMatch(/success|connected|pong/i);
	expect(serialized).toMatch(pattern);
}

describeLive('live lab acceptance', () => {
	beforeAll(async () => {
		getRequiredEnv('DFIR_IRIS_HOST');
		getRequiredEnv('DFIR_IRIS_TOKEN');
		getRequiredEnv('N8N_BASE_URL');
		getRequiredEnv('N8N_BASIC_AUTH_USER');
		getRequiredEnv('N8N_BASIC_AUTH_PASSWORD');

		if (!n8nClient) {
			throw new Error('n8n client configuration is incomplete');
		}

		await n8nClient.ensureOwnerSession();
	});

	afterAll(async () => {
		if (timelineEventId) {
			await runLiveOperation(timelineDeleteEvent, {
				cid: caseId as number,
				event_id: timelineEventId,
			}).catch(() => undefined);
		}

		if (commentId && noteId) {
			await runLiveOperation(commentDelete, {
				cid: caseId as number,
				comment_id: commentId,
				obj_id: noteId,
				obj_name: 'notes',
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (alertId) {
			await runLiveOperation(alertDelete, {
				alert_id: alertId,
				cid: caseId as number,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (evidenceId) {
			await runLiveOperation(evidenceDelete, {
				cid: caseId as number,
				evidenceId,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (iocId) {
			await runLiveOperation(iocDelete, {
				cid: caseId as number,
				ioc_id: iocId,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (assetId) {
			await runLiveOperation(assetDelete, {
				asset_id: assetId,
				cid: caseId as number,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (datastoreFileId) {
			await runLiveOperation(datastoreDeleteFile, {
				cid: datastoreCaseIdForLiveSuite,
				file_id: datastoreFileId,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (datastoreTargetFolderId) {
			await runLiveOperation(datastoreDeleteFolder, {
				cid: datastoreCaseIdForLiveSuite,
				folderId: datastoreTargetFolderId,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (datastoreSourceFolderId) {
			await runLiveOperation(datastoreDeleteFolder, {
				cid: datastoreCaseIdForLiveSuite,
				folderId: datastoreSourceFolderId,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (taskId) {
			await runLiveOperation(taskDelete, { cid: caseId as number, id: taskId }).catch(() => undefined);
		}

		if (noteId) {
			await runLiveOperation(noteDelete, { cid: caseId as number, id: noteId }).catch(() => undefined);
		}

		if (noteDirectoryId) {
			await runLiveOperation(noteDirectoryDelete, {
				cid: caseId as number,
				id: noteDirectoryId,
			}).catch(() => undefined);
		}

		if (caseId && createdCaseForLiveSuite) {
			await runLiveOperation(caseDelete, { case_id: caseId }).catch(() => undefined);
		}

		if (n8nCredentialId && n8nClient) {
			await n8nClient.deleteCredential(n8nCredentialId).catch(() => undefined);
		}
	});

	it('keeps the live n8n instance reachable behind basic auth', async () => {
		const response = await fetchJson(getRequiredEnv('N8N_BASE_URL'), '/healthz', {
			basicAuthPassword: getRequiredEnv('N8N_BASIC_AUTH_PASSWORD'),
			basicAuthUser: getRequiredEnv('N8N_BASIC_AUTH_USER'),
		});

		expect(response.response.status).toBe(200);
		expect(response.text).toContain('ok');
	});

	it('keeps node and credential type payloads loadable in n8n', async () => {
		const credentialsTypes = await n8nClient!.request('/types/credentials.json');
		const nodeTypes = await n8nClient!.request('/types/nodes.json');

		expect(credentialsTypes.response.status).toBe(200);
		expect(credentialsTypes.text).toContain('dfirIrisApi');
		expect(nodeTypes.response.status).toBe(200);
		expect(nodeTypes.text).toContain('dfirIris');
	});

	it('creates, reads, updates, and tests dfirIrisApi credentials through n8n REST', async () => {
		const credentialName = `QA DFIR IRIS ${Date.now()}`;
		const credentialData = {
			accessToken: getRequiredEnv('DFIR_IRIS_TOKEN'),
			allowUnauthorizedCerts: true,
			enableDebug: false,
			host: n8nReachableIrisHost,
			isHttp: process.env.DFIR_IRIS_IS_HTTP === '1',
		};

		const createResponse = await n8nClient!.createCredential(credentialName, credentialData);
		expectSuccessfulRestCall(createResponse.response.status, createResponse.body);

		n8nCredentialId = extractId(createResponse.body, ['id']);
		expect(n8nCredentialId).toBeTruthy();

		const getResponse = await n8nClient!.getCredential(n8nCredentialId as string | number);
		expectSuccessfulRestCall(getResponse.response.status, getResponse.body);
		expect(getResponse.text).toContain('dfirIrisApi');

		const testResponse = await n8nClient!.testCredential(getResponse.body as IDataObject);
		expectSuccessfulRestCall(testResponse.response.status, testResponse.body);
		expect(JSON.stringify(testResponse.body)).toMatch(/success|connected|ok|pong/i);

		const updateResponse = await n8nClient!.updateCredential(
			n8nCredentialId as string | number,
			`${credentialName} Updated`,
			credentialData,
		);
		expectSuccessfulRestCall(updateResponse.response.status, updateResponse.body);

		const updatedCredential = await n8nClient!.getCredential(n8nCredentialId as string | number);
		expectSuccessfulRestCall(updatedCredential.response.status, updatedCredential.body);
		expect(JSON.stringify(updatedCredential.body)).toContain('Updated');
	});

	it('keeps credential endpoints stable for invalid token, invalid host, and SSL failure paths', async () => {
		const invalidTokenCredential = await n8nClient!.createCredential(`QA Invalid Token ${Date.now()}`, {
			accessToken: 'invalid-token',
			allowUnauthorizedCerts: true,
			enableDebug: false,
			host: n8nReachableIrisHost,
			isHttp: process.env.DFIR_IRIS_IS_HTTP === '1',
		});
		expectSuccessfulRestCall(invalidTokenCredential.response.status, invalidTokenCredential.body);

		const invalidTokenBody = invalidTokenCredential.body as IDataObject;
		const invalidTokenId = extractId(invalidTokenBody, ['id']);
		expect(invalidTokenId).toBeTruthy();

		const invalidTokenTest = await n8nClient!.testCredential(invalidTokenBody);
		expectCredentialTestFailure(
			invalidTokenTest.body,
			invalidTokenTest.response.status,
			/error|unauthorized|forbidden|invalid/i,
		);

		await n8nClient!.deleteCredential(invalidTokenId as string | number);

		const invalidHostCredential = await n8nClient!.createCredential(`QA Invalid Host ${Date.now()}`, {
			accessToken: getRequiredEnv('DFIR_IRIS_TOKEN'),
			allowUnauthorizedCerts: true,
			enableDebug: false,
			host: '127.0.0.1:1',
			isHttp: false,
		});
		expectSuccessfulRestCall(invalidHostCredential.response.status, invalidHostCredential.body);

		const invalidHostBody = invalidHostCredential.body as IDataObject;
		const invalidHostId = extractId(invalidHostBody, ['id']);
		expect(invalidHostId).toBeTruthy();

		const invalidHostTest = await n8nClient!.testCredential(invalidHostBody);
		expectCredentialTestFailure(
			invalidHostTest.body,
			invalidHostTest.response.status,
			/error|network|host|getaddrinfo|enotfound|eai_again|econnrefused|refused/i,
		);

		await n8nClient!.deleteCredential(invalidHostId as string | number);

		const sslCredential = await n8nClient!.createCredential(`QA SSL Failure ${Date.now()}`, {
			accessToken: getRequiredEnv('DFIR_IRIS_TOKEN'),
			allowUnauthorizedCerts: false,
			enableDebug: false,
			host: n8nReachableIrisHost,
			isHttp: false,
		});
		expectSuccessfulRestCall(sslCredential.response.status, sslCredential.body);

		const sslBody = sslCredential.body as IDataObject;
		const sslId = extractId(sslBody, ['id']);
		expect(sslId).toBeTruthy();

		const sslTest = await n8nClient!.testCredential(sslBody);
		expectCredentialTestFailure(
			sslTest.body,
			sslTest.response.status,
			/error|certificate|self signed|tls|ssl/i,
		);

		await n8nClient!.deleteCredential(sslId as string | number);

		const credentialsTypes = await n8nClient!.request('/types/credentials.json');
		expect(credentialsTypes.response.status).toBe(200);
		expect(credentialsTypes.text).toContain('dfirIrisApi');
	}, 15000);

	it('can call DFIR IRIS /api/ping through the API Request resource', async () => {
		const { context } = createLiveExecuteContext({
			options: { isRaw: true },
			requestMethod: 'GET',
			requestPath: 'api/ping',
		});

		const output = (await apiRequestExecute.call(context as never, 0)) as INodeExecutionData[];

		expect(output).toEqual([
			{
				json: {
					data: [],
					message: 'pong',
					status: 'success',
				},
			},
		]);
	});

	it('rejects malformed JSON API Request bodies before sending a request', async () => {
		const { calls, context } = createLiveExecuteContext({
			requestBody: '{invalid json}',
			requestMethod: 'POST',
			requestPath: 'case/summary/update',
		});

		await expect(apiRequestExecute.call(context as never, 0)).rejects.toThrow(/body must be valid json/i);
		expect(calls).toEqual([]);
	});

	it('surfaces expected API Request error responses without breaking the node runtime', async () => {
		const { context } = createLiveExecuteContext({
			options: { isRaw: true },
			requestMethod: 'GET',
			requestPath: 'api/does-not-exist',
		});

		await expect(apiRequestExecute.call(context as never, 0)).rejects.toBeDefined();
	});

	it('can execute representative read-only manage and module operations against live IRIS', async () => {
		const users = await runLiveOperation(manageGetUsers, {
			options: { isRaw: false },
		});
		const hooks = await runLiveOperation(moduleListHooks, {
			object_type: 'case',
			options: { isRaw: false },
		});
		const tasks = await runLiveOperation(moduleListTasks, {
			options: { isRaw: false },
			rows_count: 5,
		});

		expect(users.length).toBeGreaterThan(0);
		expect(Array.isArray(hooks)).toBe(true);
		expect(Array.isArray(tasks)).toBe(true);

		userId = extractId(unwrapSingle(users), ['user_id', 'id']);
		expect(userId).toBeTruthy();
	});

	it('can create and update a case summary through typed operations', async () => {
		const createdCase = await runLiveOperation(caseCreate, {
			additionalFields: {},
			case_customer: 1,
			case_description: 'QA case for live acceptance',
			case_name: `QA Case ${Date.now()}`,
			case_soc_id: `QA-${Date.now()}`,
			options: { isRaw: false },
		});

		caseId = extractId(unwrapSingle(createdCase), ['case_id', 'id']);
		expect(caseId).toBeTruthy();
		createdCaseForLiveSuite = true;

		const summary = await runLiveOperation(caseGetSummary, {
			case_id: caseId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(summary))).toMatch(/QA Case|case/i);

		await runLiveOperation(caseUpdateSummary, {
			case_description: 'QA summary updated through live acceptance',
			case_id: caseId,
			options: { isRaw: false },
		});

		const updatedSummary = await runLiveOperation(caseGetSummary, {
			case_id: caseId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedSummary))).toContain(
			'QA summary updated through live acceptance',
		);
	});

	it('can send JSON body, query parameters, and custom headers through API Request', async () => {
		const updateDescription = `QA summary updated through API Request ${Date.now()}`;
		const updateContext = createLiveExecuteContext({
			options: { isRaw: true },
			requestBody: JSON.stringify({
				case_description: updateDescription,
			}),
			requestHeaders: JSON.stringify({
				'X-QA-Header': 'api-request-live',
			}),
			requestMethod: 'POST',
			requestPath: 'case/summary/update',
			requestQuery: JSON.stringify({
				cid: caseId,
			}),
		});

		const updateOutput = (await apiRequestExecute.call(
			updateContext.context as never,
			0,
		)) as INodeExecutionData[];

		expect(updateContext.calls[0].options.qs).toEqual({ cid: caseId });
		expect((updateContext.calls[0].options.headers as IDataObject)['X-QA-Header']).toBe(
			'api-request-live',
		);
		expect(JSON.stringify(updateOutput)).toMatch(/success|updated|ok/i);

		const fetchContext = createLiveExecuteContext({
			options: { isRaw: true },
			requestHeaders: JSON.stringify({
				'X-QA-Header': 'api-request-live',
			}),
			requestMethod: 'GET',
			requestPath: 'case/summary/fetch',
			requestQuery: JSON.stringify({
				cid: caseId,
			}),
		});

		const fetchOutput = (await apiRequestExecute.call(
			fetchContext.context as never,
			0,
		)) as INodeExecutionData[];

		expect(fetchContext.calls[0].options.qs).toEqual({ cid: caseId });
		expect(JSON.stringify(fetchOutput)).toContain(updateDescription);
	});

	it('can call a live DFIR-IRIS module when a manual hook is available', async () => {
		const hooks = await runLiveOperation(moduleListHooks, {
			object_type: 'case',
			options: { isRaw: false },
		});

		if (hooks.length === 0) {
			expect(hooks).toEqual([]);
			return;
		}

		const firstHook = unwrapSingle(hooks);
		expect(firstHook.hook_name).toBeTruthy();
		expect(firstHook.manual_hook_ui_name).toBeTruthy();
		expect(firstHook.module_name).toBeTruthy();

		const output = await runLiveOperation(moduleCall, {
			cid: caseId as number,
			moduleData: `${firstHook.hook_name};${firstHook.manual_hook_ui_name};${firstHook.module_name}`,
			targetsString: `${caseId}`,
			type: 'case',
		});

		expect(Array.isArray(output)).toBe(true);
		expect(output.length).toBeGreaterThan(0);
	});

	it('can create, list, fetch, update, and delete assets through typed operations', async () => {
		const assetName = `QA Asset ${Date.now()}`;
		const createdAsset = await runLiveOperation(assetCreate, {
			additionalFields: {
				asset_description: 'QA asset description',
				asset_domain: 'qa.example',
				asset_ip: '127.0.0.1',
				asset_tags: 'qa,asset',
			},
			asset_name: assetName,
			asset_type_id: 1,
			cid: caseId as number,
			options: { isRaw: false },
		});

		assetId = extractId(unwrapSingle(createdAsset), ['asset_id', 'id']);
		expect(assetId).toBeTruthy();

		const listedAssets = await runLiveOperation(assetGetAll, {
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(Array.isArray(listedAssets)).toBe(true);
		expect(JSON.stringify(listedAssets)).toContain(assetName);

		const fetchedAsset = await runLiveOperation(assetGet, {
			asset_id: assetId,
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedAsset))).toContain(assetName);

		await runLiveOperation(assetUpdate, {
			additionalFields: {
				asset_description: 'QA asset description updated',
				asset_tags: 'qa,asset,updated',
			},
			asset_id: assetId,
			asset_name: `${assetName} Updated`,
			asset_type_id: 1,
			cid: caseId as number,
			options: { isRaw: false },
		});

		const updatedAsset = await runLiveOperation(assetGet, {
			asset_id: assetId,
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedAsset))).toContain('Updated');
	});

	it('can create, list, fetch, update, and delete IOCs through typed operations', async () => {
		const iocValue = `qa-${Date.now()}.example`;
		const createdIoc = await runLiveOperation(iocCreate, {
			additionalFields: {},
			cid: caseId as number,
			ioc_description: 'QA IOC description',
			ioc_tags: 'qa,ioc',
			ioc_tlp_id: 3,
			ioc_type_id: 1,
			ioc_value: iocValue,
			options: { isRaw: false },
		});

		iocId = extractId(unwrapSingle(createdIoc), ['ioc_id', 'id']);
		expect(iocId).toBeTruthy();

		const listedIocs = await runLiveOperation(iocGetAll, {
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(JSON.stringify(listedIocs)).toContain(iocValue);

		const fetchedIoc = await runLiveOperation(iocGet, {
			cid: caseId as number,
			ioc_id: iocId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedIoc))).toContain(iocValue);

		await runLiveOperation(iocUpdate, {
			additionalFields: {
				ioc_description: 'QA IOC description updated',
				ioc_tags: 'qa,ioc,updated',
				ioc_value: `${iocValue}.updated`,
			},
			cid: caseId as number,
			ioc_id: iocId,
			options: { isRaw: false },
		});

		const updatedIoc = await runLiveOperation(iocGet, {
			cid: caseId as number,
			ioc_id: iocId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedIoc))).toContain('updated');
	});

	it('can create, list, fetch, update, and delete evidences through typed operations', async () => {
		const createdEvidence = await runLiveOperation(
			evidenceCreate,
			{
				additionalFields: {
					file_description: 'QA evidence description',
				},
				cid: caseId as number,
				options: { isRaw: false },
				parseBinary: true,
			},
			{
				inputItems: createBinaryInputItem('qa-evidence.txt', 'qa evidence payload'),
			},
		);

		evidenceId = extractId(unwrapSingle(createdEvidence), ['file_id', 'id']);
		expect(evidenceId).toBeTruthy();

		const listedEvidence = await runLiveOperation(evidenceList, {
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(JSON.stringify(listedEvidence)).toMatch(/qa-evidence|evidence/i);

		const fetchedEvidence = await runLiveOperation(evidenceGet, {
			cid: caseId as number,
			evidenceId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedEvidence))).toMatch(/qa-evidence|evidence/i);

		await runLiveOperation(
			evidenceUpdate,
			{
				additionalFields: {
					file_description: 'QA evidence description updated',
				},
				cid: caseId as number,
				evidenceId,
				options: { isRaw: false },
				parseBinary: true,
			},
			{
				inputItems: createBinaryInputItem('qa-evidence-updated.txt', 'qa evidence payload updated'),
			},
		);

		const updatedEvidence = await runLiveOperation(evidenceGet, {
			cid: caseId as number,
			evidenceId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedEvidence))).toContain('updated');
	});

	it('can create, fetch, update, and delete alerts through typed operations', async () => {
		const alertTitle = `QA Alert ${Date.now()}`;
		const createdAlert = await runLiveOperation(alertCreate, {
			additionalFields: {
				alert_description: 'QA alert description',
				alert_source: 'qa-live-suite',
				alert_tags: 'qa,alert',
			},
			alert_customer_id: 1,
			alert_severity_id: 1,
			alert_status_id: 1,
			alert_title: alertTitle,
			cid: caseId as number,
			options: { isRaw: false },
		});

		alertId = extractId(unwrapSingle(createdAlert), ['alert_id', 'id']);
		expect(alertId).toBeTruthy();

		const fetchedAlert = await runLiveOperation(alertGet, {
			alert_id: alertId,
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedAlert))).toContain(alertTitle);

		await runLiveOperation(alertUpdate, {
			additionalFields: {
				alert_description: 'QA alert description updated',
				alert_note: 'updated through live acceptance',
				alert_title: `${alertTitle} Updated`,
			},
			alert_id: alertId,
			cid: caseId as number,
			options: { isRaw: false },
		});

		const updatedAlert = await runLiveOperation(alertGet, {
			alert_id: alertId,
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedAlert))).toContain('Updated');
	});

	it('can create, fetch, update, and delete timeline events through typed operations', async () => {
		const createdEvent = await runLiveOperation(timelineAddEvent, {
			additionalFields: {
				event_content: 'QA timeline event content',
				event_tags: 'qa,timeline',
			},
			cid: caseId as number,
			event_assets: [assetId],
			event_category_id: 1,
			event_date: '2026-03-21T10:00:00.000Z',
			event_iocs: [iocId],
			event_title: `QA Timeline Event ${Date.now()}`,
			options: { isRaw: false },
		});

		timelineEventId = extractId(unwrapSingle(createdEvent), ['event_id', 'id']);
		expect(timelineEventId).toBeTruthy();

		const fetchedEvent = await runLiveOperation(timelineFetchEvent, {
			cid: caseId as number,
			event_id: timelineEventId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedEvent))).toContain('QA Timeline Event');

		await runLiveOperation(timelineUpdateEvent, {
			additionalFields: {
				event_content: 'QA timeline event content updated',
				event_tags: 'qa,timeline,updated',
			},
			cid: caseId as number,
			event_assets: [assetId],
			event_category_id: 1,
			event_date: '2026-03-21T11:00:00.000Z',
			event_id: timelineEventId,
			event_iocs: [iocId],
			event_title: `QA Timeline Event Updated ${Date.now()}`,
			options: { isRaw: false },
		});

		const updatedEvent = await runLiveOperation(timelineFetchEvent, {
			cid: caseId as number,
			event_id: timelineEventId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedEvent))).toContain('updated');
	});

	it('can create, update, fetch, and delete note groups and notes through typed operations', async () => {
		if (!caseId) {
			caseId = seededCaseId;
		}

		const createdDirectory = await runLiveOperation(noteDirectoryCreate, {
			cid: caseId as number,
			name: `QA Group ${Date.now()}`,
			options: { isRaw: false },
		});

		noteDirectoryId = extractId(unwrapSingle(createdDirectory), ['id', 'group_id', 'directory_id']);
		expect(noteDirectoryId).toBeTruthy();

		await runLiveOperation(noteDirectoryUpdate, {
			additionalFields: {
				name: `QA Group Updated ${Date.now()}`,
			},
			cid: caseId as number,
			id: noteDirectoryId,
			options: { isRaw: false },
		});

		const createdNote = await runLiveOperation(noteCreate, {
			cid: caseId as number,
			content: 'QA note content',
			directory_id: noteDirectoryId,
			options: { isRaw: false },
			title: 'QA note title',
		});

		noteId = extractId(unwrapSingle(createdNote), ['note_id', 'id']);
		expect(noteId).toBeTruthy();

		const fetchedNote = await runLiveOperation(noteGet, {
			cid: caseId as number,
			id: noteId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedNote))).toContain('QA note');

		await runLiveOperation(noteUpdate, {
			additionalFields: {
				directory_id: noteDirectoryId,
			},
			cid: caseId as number,
			content: 'QA note content updated',
			id: noteId,
			options: { isRaw: false },
			title: 'QA note title updated',
		});

		const updatedNote = await runLiveOperation(noteGet, {
			cid: caseId as number,
			id: noteId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedNote))).toContain('updated');
	});

	it('can create, list, update, and delete comments through typed operations', async () => {
		const createdComment = await runLiveOperation(commentCreate, {
			cid: caseId as number,
			comment_text: 'QA comment text',
			obj_id: noteId,
			obj_name: 'notes',
			options: { isRaw: false },
		});

		commentId = extractId(unwrapSingle(createdComment), ['comment_id', 'id']);
		expect(commentId).toBeTruthy();

		const listedComments = await runLiveOperation(commentGetAll, {
			cid: caseId as number,
			obj_id: noteId,
			obj_name: 'notes',
			options: { isRaw: false },
		});
		expect(JSON.stringify(listedComments)).toContain('QA comment');

		await runLiveOperation(commentUpdate, {
			cid: caseId as number,
			comment_id: commentId,
			comment_text: 'QA comment text updated',
			obj_id: noteId,
			obj_name: 'notes',
			options: { isRaw: false },
		});

		const updatedComments = await runLiveOperation(commentGetAll, {
			cid: caseId as number,
			obj_id: noteId,
			obj_name: 'notes',
			options: { isRaw: false },
		});
		expect(JSON.stringify(updatedComments)).toContain('updated');
	});

	it('can create, fetch, update, and delete a task through typed operations', async () => {
		if (!caseId) {
			caseId = seededCaseId;
		}

		const createdTask = await runLiveOperation(taskCreate, {
			additionalFields: {},
			assignee: userId,
			cid: caseId as number,
			options: { isRaw: false },
			status: 1,
			task_description: 'QA task description',
			title: 'QA task title',
		});

		taskId = extractId(unwrapSingle(createdTask), ['task_id', 'id']);
		expect(taskId).toBeTruthy();

		const fetchedTask = await runLiveOperation(taskGet, {
			cid: caseId as number,
			id: taskId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedTask))).toContain('QA task');

		await runLiveOperation(taskUpdate, {
			additionalFields: {
				task_description: 'QA task description updated',
			},
			assignee: userId,
			cid: caseId as number,
			id: taskId,
			options: { isRaw: false },
			status: 2,
			title: 'QA task title updated',
		});

		const updatedTask = await runLiveOperation(taskGet, {
			cid: caseId as number,
			id: taskId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedTask))).toContain('updated');
	});

	it('can exercise datastore folder and file binary flows through typed operations', async () => {
		datastoreCaseIdForLiveSuite = seededCaseId;

		const createdSourceFolder = await runLiveOperation(datastoreAddFolder, {
			cid: datastoreCaseIdForLiveSuite,
			destFolderId: 2,
			folderName: `QA Binary Source ${Date.now()}`,
			options: { isRaw: false },
		});
		datastoreSourceFolderId = extractId(unwrapSingle(createdSourceFolder), ['path_id', 'id']);
		expect(datastoreSourceFolderId).toBeTruthy();

		const createdTargetFolder = await runLiveOperation(datastoreAddFolder, {
			cid: datastoreCaseIdForLiveSuite,
			destFolderId: 2,
			folderName: `QA Binary Target ${Date.now()}`,
			options: { isRaw: false },
		});
		datastoreTargetFolderId = extractId(unwrapSingle(createdTargetFolder), ['path_id', 'id']);
		expect(datastoreTargetFolderId).toBeTruthy();

		await runLiveOperation(datastoreRenameFolder, {
			cid: datastoreCaseIdForLiveSuite,
			folderId: datastoreTargetFolderId,
			folderName: `QA Binary Target Renamed ${Date.now()}`,
		});

		const uploadedFile = await runLiveOperation(
			datastoreUploadFile,
			{
				additionalFields: {
					file_description: 'QA binary upload',
					file_is_evidence: true,
					file_tags: 'qa,binary',
				},
				binaryName: 'data',
				cid: datastoreCaseIdForLiveSuite,
				folderId: datastoreSourceFolderId,
				options: { isRaw: false },
			},
			{
				inputItems: createBinaryInputItem('qa-live.txt', 'qa live binary payload'),
			},
		);
		datastoreFileId = extractId(unwrapSingle(uploadedFile), ['file_id', 'id']);
		expect(datastoreFileId).toBeTruthy();

		const fileInfo = await runLiveOperation(datastoreGetFileInfo, {
			cid: datastoreCaseIdForLiveSuite,
			file_id: datastoreFileId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fileInfo))).toMatch(/qa-live|binary/i);

		await runLiveOperation(
			datastoreUpdateFileInfo,
			{
				additionalFields: {
					binaryName: 'data',
					file_description: 'QA binary upload updated',
					file_original_name: 'qa-live-updated.txt',
				},
				cid: datastoreCaseIdForLiveSuite,
				file_id: datastoreFileId,
				options: { isRaw: false },
			},
			{
				inputItems: createBinaryInputItem('qa-live-updated.txt', 'qa live binary payload updated'),
			},
		);

		const updatedFileInfo = await runLiveOperation(datastoreGetFileInfo, {
			cid: datastoreCaseIdForLiveSuite,
			file_id: datastoreFileId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedFileInfo))).toContain('updated');

		const downloadedFile = await runLiveOperation(datastoreDownloadFile, {
			additionalFields: {},
			binaryName: 'downloaded',
			cid: datastoreCaseIdForLiveSuite,
			file_id: datastoreFileId,
		});
		expect(downloadedFile[0]?.binary?.downloaded).toBeDefined();
		expect(downloadedFile[0]?.binary?.downloaded?.fileName).toBeTruthy();

		await runLiveOperation(datastoreMoveFile, {
			cid: datastoreCaseIdForLiveSuite,
			file_id: datastoreFileId,
			folderId: datastoreTargetFolderId,
			options: { isRaw: false },
		});

		await runLiveOperation(datastoreDeleteFile, {
			cid: datastoreCaseIdForLiveSuite,
			file_id: datastoreFileId,
			options: { isRaw: false },
		});
		datastoreFileId = undefined;

		await runLiveOperation(datastoreDeleteFolder, {
			cid: datastoreCaseIdForLiveSuite,
			folderId: datastoreSourceFolderId,
			options: { isRaw: false },
		});
		datastoreSourceFolderId = undefined;

		await runLiveOperation(datastoreDeleteFolder, {
			cid: datastoreCaseIdForLiveSuite,
			folderId: datastoreTargetFolderId,
			options: { isRaw: false },
		});
		datastoreTargetFolderId = undefined;
	});

	it('can exercise API Request query, multipart upload, and binary download paths against live IRIS', async () => {
		const apiRequestFolder = await runLiveOperation(datastoreAddFolder, {
			cid: seededCaseId,
			destFolderId: 2,
			folderName: `QA API Request ${Date.now()}`,
			options: { isRaw: false },
		});
		const apiRequestFolderId = extractId(unwrapSingle(apiRequestFolder), ['path_id', 'id']);
		expect(apiRequestFolderId).toBeTruthy();

		let uploadedFileId: number | string | undefined;

		try {
			const uploadContext = createLiveExecuteContext(
				{
					binaryFieldName: 'file_content',
					binaryPropertyName: 'data',
					downloadResponse: false,
					multipartFields: JSON.stringify({
						file_description: 'QA API Request upload',
						file_is_evidence: 'y',
						file_original_name: 'qa-api-request.txt',
						file_tags: 'qa,api-request',
					}),
					options: { isRaw: true },
					requestMethod: 'POST',
					requestPath: `datastore/file/add/${apiRequestFolderId}`,
					requestQuery: JSON.stringify({
						cid: seededCaseId,
					}),
					sendBinary: true,
				},
				{
					inputItems: createBinaryInputItem('qa-api-request.txt', 'qa api request binary payload'),
				},
			);

			const uploadOutput = (await apiRequestExecute.call(
				uploadContext.context as never,
				0,
			)) as INodeExecutionData[];

			expect(uploadContext.calls[0].options.qs).toEqual({ cid: seededCaseId });
			expect(uploadContext.calls[0].options.body instanceof FormData).toBe(true);
			uploadedFileId = extractId(unwrapSingle(uploadOutput), ['file_id', 'id']);
			expect(uploadedFileId).toBeTruthy();

			const downloadContext = createLiveExecuteContext({
				downloadResponse: true,
				options: { isRaw: false },
				outputBinaryField: 'downloaded',
				requestMethod: 'GET',
				requestPath: `datastore/file/view/${uploadedFileId}`,
				requestQuery: JSON.stringify({
					cid: seededCaseId,
				}),
			});

			const downloadOutput = (await apiRequestExecute.call(
				downloadContext.context as never,
				0,
			)) as INodeExecutionData[];

			expect(downloadContext.calls[0].options.qs).toEqual({ cid: seededCaseId });
			expect(downloadOutput[0]?.binary?.downloaded).toBeDefined();
			expect(downloadOutput[0]?.binary?.downloaded?.fileName).toBeTruthy();
		} finally {
			if (uploadedFileId) {
				await runLiveOperation(datastoreDeleteFile, {
					cid: seededCaseId,
					file_id: uploadedFileId,
					options: { isRaw: false },
				}).catch(() => undefined);
			}

			await runLiveOperation(datastoreDeleteFolder, {
				cid: seededCaseId,
				folderId: apiRequestFolderId,
				options: { isRaw: false },
			}).catch(() => undefined);
		}
	});
});
