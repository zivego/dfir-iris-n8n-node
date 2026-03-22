import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { execute as apiRequestExecute } from '../../nodes/DfirIris/v1/actions/apiRequest/ApiRequest.resource';
import * as assetOperations from '../../nodes/DfirIris/v1/actions/asset/Asset.resource';
import * as caseOperations from '../../nodes/DfirIris/v1/actions/case/Case.resource';
import * as iocOperations from '../../nodes/DfirIris/v1/actions/ioc/IOC.resource';
import { router } from '../../nodes/DfirIris/v1/actions/router';
import * as taskOperations from '../../nodes/DfirIris/v1/actions/task/Task.resource';
import {
	buildLiveParameters,
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

const runLiveNextE2E = process.env.RUN_LIVE_E2E_NEXT === '1';
const describeLiveNext = runLiveNextE2E ? describe.sequential : describe.skip;

const n8nBaseUrl = process.env.N8N_NEXT_BASE_URL;
const basicAuthUser = process.env.N8N_NEXT_BASIC_AUTH_USER;
const basicAuthPassword = process.env.N8N_NEXT_BASIC_AUTH_PASSWORD;
const ownerEmail = process.env.N8N_NEXT_OWNER_EMAIL || 'owner@example.com';
const ownerPassword = process.env.N8N_NEXT_OWNER_PASSWORD || 'OwnerPass123!';
const ownerFirstName = process.env.N8N_NEXT_OWNER_FIRST_NAME || 'QA';
const ownerLastName = process.env.N8N_NEXT_OWNER_LAST_NAME || 'Owner';
const n8nReachableNextIrisHost = process.env.N8N_DFIR_IRIS_NEXT_HOST || 'host.docker.internal:18000';

let apiRequestCaseId: number | string | undefined;
let assetId: number | string | undefined;
let caseId: number | string | undefined;
let createdCaseForSuite = false;
let iocId: number | string | undefined;
let n8nCredentialId: number | string | undefined;
let taskId: number | string | undefined;

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
const caseFilterCases = caseOperations.filterCases as OperationExport;
const caseGetSummary = caseOperations.getSummary as OperationExport;
const caseUpdateSummary = caseOperations.updateSummary as OperationExport;
const assetCreate = assetOperations.create as OperationExport;
const assetDelete = assetOperations.deleteAsset as OperationExport;
const assetGet = assetOperations.get as OperationExport;
const assetGetAll = assetOperations.getAll as OperationExport;
const assetUpdate = assetOperations.update as OperationExport;
const iocCreate = iocOperations.create as OperationExport;
const iocDelete = iocOperations.deleteIOC as OperationExport;
const iocGet = iocOperations.get as OperationExport;
const iocGetAll = iocOperations.getAll as OperationExport;
const iocUpdate = iocOperations.update as OperationExport;
const taskCreate = taskOperations.create as OperationExport;
const taskDelete = taskOperations.deleteTask as OperationExport;
const taskGet = taskOperations.get as OperationExport;
const taskGetAll = taskOperations.getAll as OperationExport;
const taskUpdate = taskOperations.update as OperationExport;

function buildNextCredentials() {
	return {
		accessToken: getRequiredEnv('DFIR_IRIS_NEXT_TOKEN'),
		allowUnauthorizedCerts: true,
		apiMode: 'next' as const,
		enableDebug: false,
		host: getRequiredEnv('DFIR_IRIS_NEXT_HOST'),
		isHttp: process.env.DFIR_IRIS_NEXT_IS_HTTP !== '0',
	};
}

async function runNextOperation(
	operation: OperationExport,
	overrides: IDataObject = {},
	options: { inputItems?: INodeExecutionData[] } = {},
): Promise<INodeExecutionData[]> {
	const { context } = createLiveExecuteContext(buildLiveParameters(operation, overrides), {
		credentials: buildNextCredentials(),
		inputItems: options.inputItems,
	});
	return (await operation.execute.call(context as never, 0)) as INodeExecutionData[];
}

function unwrapSingle(output: INodeExecutionData[]) {
	return output[0]?.json as IDataObject;
}

function matchesId(value: unknown, expected: string | number | undefined) {
	return expected !== undefined && value !== undefined && String(value) === String(expected);
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

describeLiveNext('next/dev live lab acceptance', () => {
	beforeAll(async () => {
		getRequiredEnv('DFIR_IRIS_NEXT_HOST');
		getRequiredEnv('DFIR_IRIS_NEXT_TOKEN');
		getRequiredEnv('N8N_NEXT_BASE_URL');
		getRequiredEnv('N8N_NEXT_BASIC_AUTH_USER');
		getRequiredEnv('N8N_NEXT_BASIC_AUTH_PASSWORD');

		if (!n8nClient) {
			throw new Error('next n8n client configuration is incomplete');
		}

		await n8nClient.ensureOwnerSession();
	});

	afterAll(async () => {
		if (taskId) {
			await runNextOperation(taskDelete, { cid: caseId as number, id: taskId }).catch(() => undefined);
		}

		if (iocId) {
			await runNextOperation(iocDelete, {
				cid: caseId as number,
				ioc_id: iocId,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (assetId) {
			await runNextOperation(assetDelete, {
				asset_id: assetId,
				cid: caseId as number,
				options: { isRaw: false },
			}).catch(() => undefined);
		}

		if (caseId && createdCaseForSuite) {
			await runNextOperation(caseDelete, { case_id: caseId }).catch(() => undefined);
		}

		if (apiRequestCaseId) {
			const { context } = createLiveExecuteContext(
				{
					options: { isRaw: true },
					requestMethod: 'DELETE',
					requestPath: `api/v2/cases/${apiRequestCaseId}`,
				},
				{ credentials: buildNextCredentials() },
			);
			await apiRequestExecute.call(context as never, 0).catch(() => undefined);
		}

		if (n8nCredentialId && n8nClient) {
			await n8nClient.deleteCredential(n8nCredentialId).catch(() => undefined);
		}
	});

	it('keeps the next n8n instance reachable behind basic auth', async () => {
		const response = await fetchJson(getRequiredEnv('N8N_NEXT_BASE_URL'), '/healthz', {
			basicAuthPassword: getRequiredEnv('N8N_NEXT_BASIC_AUTH_PASSWORD'),
			basicAuthUser: getRequiredEnv('N8N_NEXT_BASIC_AUTH_USER'),
		});

		expect(response.response.status).toBe(200);
		expect(response.text).toContain('ok');
	});

	it('creates, reads, updates, and tests next-mode credentials through n8n REST', async () => {
		const credentialName = `QA DFIR IRIS Next ${Date.now()}`;
		const credentialData = {
			...buildNextCredentials(),
			host: n8nReachableNextIrisHost,
		};

		const createResponse = await n8nClient!.createCredential(credentialName, credentialData);
		expectSuccessfulRestCall(createResponse.response.status, createResponse.body);

		n8nCredentialId = extractId(createResponse.body, ['id']);
		expect(n8nCredentialId).toBeTruthy();

		const getResponse = await n8nClient!.getCredential(n8nCredentialId as string | number);
		expectSuccessfulRestCall(getResponse.response.status, getResponse.body);
		expect(getResponse.text).toContain('dfirIrisApi');
		expect(getResponse.text).toContain('"apiMode":"next"');

		const testResponse = await n8nClient!.testCredential(getResponse.body as IDataObject);
		expectSuccessfulRestCall(testResponse.response.status, testResponse.body);
		expect(JSON.stringify(testResponse.body)).toMatch(/success|connected|ok|pong/i);

		const updateResponse = await n8nClient!.updateCredential(
			n8nCredentialId as string | number,
			`${credentialName} Updated`,
			credentialData,
		);
		expectSuccessfulRestCall(updateResponse.response.status, updateResponse.body);
	});

	it('keeps next credential endpoints stable for invalid token and invalid host paths', async () => {
		const invalidTokenCredential = await n8nClient!.createCredential(`QA Next Invalid Token ${Date.now()}`, {
			...buildNextCredentials(),
			accessToken: 'invalid-token',
			host: n8nReachableNextIrisHost,
		});
		expectSuccessfulRestCall(invalidTokenCredential.response.status, invalidTokenCredential.body);

		const invalidTokenBody = invalidTokenCredential.body as IDataObject;
		const invalidTokenId = extractId(invalidTokenBody, ['id']);
		const invalidTokenTest = await n8nClient!.testCredential(invalidTokenBody);
		expectCredentialTestFailure(
			invalidTokenTest.body,
			invalidTokenTest.response.status,
			/error|unauthorized|forbidden|invalid/i,
		);
		await n8nClient!.deleteCredential(invalidTokenId as string | number);

		const invalidHostCredential = await n8nClient!.createCredential(`QA Next Invalid Host ${Date.now()}`, {
			...buildNextCredentials(),
			host: '127.0.0.1:1',
		});
		expectSuccessfulRestCall(invalidHostCredential.response.status, invalidHostCredential.body);

		const invalidHostBody = invalidHostCredential.body as IDataObject;
		const invalidHostId = extractId(invalidHostBody, ['id']);
		const invalidHostTest = await n8nClient!.testCredential(invalidHostBody);
		expectCredentialTestFailure(
			invalidHostTest.body,
			invalidHostTest.response.status,
			/error|network|host|getaddrinfo|enotfound|eai_again|econnrefused|refused/i,
		);
		await n8nClient!.deleteCredential(invalidHostId as string | number);
	}, 20000);

	it('rejects stable-only typed operations when next api mode is selected', async () => {
		const { context } = createLiveExecuteContext(
			{
				resource: 'alert',
				operation: 'create',
			},
			{ credentials: buildNextCredentials() },
		);

		await expect(router.call(context as never)).rejects.toThrow(/not available for api mode "next"/i);
	});

	it('can create, list, fetch, update, and delete cases through next typed operations', async () => {
		const createdCase = await runNextOperation(caseCreate, {
			additionalFields: {},
			case_customer: 1,
			case_description: 'QA next case for live acceptance',
			case_name: `QA Next Case ${Date.now()}`,
			case_soc_id: `QA-NEXT-${Date.now()}`,
			options: { isRaw: false },
		});

		caseId = extractId(unwrapSingle(createdCase), ['case_id', 'id']);
		expect(caseId).toBeTruthy();
		createdCaseForSuite = true;

		const filteredCases = await runNextOperation(caseFilterCases, {
			options: { isRaw: false, startPage: 1 },
			returnAll: false,
			limit: 50,
			sort_by: 'case_id',
			sort_dir: 'desc',
		});
		expect(filteredCases.length).toBeGreaterThan(0);

		const summary = await runNextOperation(caseGetSummary, {
			case_id: caseId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(summary))).toContain('QA Next Case');

		await runNextOperation(caseUpdateSummary, {
			case_description: 'QA next summary updated through live acceptance',
			case_id: caseId,
			options: { isRaw: false },
		});

		const updatedSummary = await runNextOperation(caseGetSummary, {
			case_id: caseId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(updatedSummary))).toContain(
			'QA next summary updated through live acceptance',
		);
	});

	it('can execute full asset lifecycle through next typed operations', async () => {
		const createdAsset = await runNextOperation(assetCreate, {
			additionalFields: {
				asset_description: 'asset via next typed flow',
				asset_ip: '10.77.0.10',
			},
			asset_name: `QA Next Asset ${Date.now()}`,
			asset_type_id: 1,
			cid: caseId as number,
			options: { isRaw: false },
		});

		assetId = extractId(unwrapSingle(createdAsset), ['asset_id', 'id']);
		expect(assetId).toBeTruthy();

		const listedAssets = await runNextOperation(assetGetAll, {
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(listedAssets.length).toBeGreaterThan(0);

		const fetchedAsset = await runNextOperation(assetGet, {
			asset_id: assetId,
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedAsset))).toContain('QA Next Asset');

		const updatedName = `QA Next Asset Updated ${Date.now()}`;
		await runNextOperation(assetUpdate, {
			additionalFields: {
				asset_description: 'asset updated via next typed flow',
			},
			asset_id: assetId,
			asset_name: updatedName,
			cid: caseId as number,
			options: { isRaw: false },
		});

		const fetchedUpdatedAsset = await runNextOperation(assetGet, {
			asset_id: assetId,
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedUpdatedAsset))).toContain(updatedName);
	});

	it('can execute full ioc lifecycle through next typed operations', async () => {
		const createdIoc = await runNextOperation(iocCreate, {
			additionalFields: {},
			cid: caseId as number,
			ioc_description: 'ioc via next typed flow',
			ioc_tags: 'qa,next',
			ioc_tlp_id: 2,
			ioc_type_id: 1,
			ioc_value: `next-validation-${Date.now()}.example`,
			options: { isRaw: false },
		});

		iocId = extractId(unwrapSingle(createdIoc), ['ioc_id', 'id']);
		expect(iocId).toBeTruthy();

		const listedIocs = await runNextOperation(iocGetAll, {
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(listedIocs.length).toBeGreaterThan(0);

		const fetchedIoc = await runNextOperation(iocGet, {
			cid: caseId as number,
			ioc_id: iocId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedIoc))).toContain('next-validation');

		const updatedValue = `next-validation-updated-${Date.now()}.example`;
		await runNextOperation(iocUpdate, {
			additionalFields: {
				ioc_description: 'ioc updated via next typed flow',
				ioc_tags: 'qa,next,updated',
				ioc_tlp_id: 2,
				ioc_type_id: 1,
				ioc_value: updatedValue,
			},
			cid: caseId as number,
			ioc_id: iocId,
			options: { isRaw: false },
		});

		const fetchedUpdatedIoc = await runNextOperation(iocGet, {
			cid: caseId as number,
			ioc_id: iocId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedUpdatedIoc))).toContain(updatedValue);
	});

	it('can execute full task lifecycle through next typed operations', async () => {
		const createdTask = await runNextOperation(taskCreate, {
			additionalFields: {},
			assignee: 1,
			cid: caseId as number,
			options: { isRaw: false },
			status: 1,
			task_description: 'task via next typed flow',
			title: `QA Next Task ${Date.now()}`,
		});

		taskId = extractId(unwrapSingle(createdTask), ['task_id', 'id']);
		expect(taskId).toBeTruthy();

		const listedTasks = await runNextOperation(taskGetAll, {
			cid: caseId as number,
			options: { isRaw: false },
		});
		expect(listedTasks.length).toBeGreaterThan(0);

		const fetchedTask = await runNextOperation(taskGet, {
			cid: caseId as number,
			id: taskId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedTask))).toContain('QA Next Task');

		const updatedTitle = `QA Next Task Updated ${Date.now()}`;
		await runNextOperation(taskUpdate, {
			additionalFields: {},
			assignee: 1,
			cid: caseId as number,
			id: taskId,
			options: { isRaw: false },
			status: 2,
			task_description: 'task updated via next typed flow',
			title: updatedTitle,
		});

		const fetchedUpdatedTask = await runNextOperation(taskGet, {
			cid: caseId as number,
			id: taskId,
			options: { isRaw: false },
		});
		expect(JSON.stringify(unwrapSingle(fetchedUpdatedTask))).toContain(updatedTitle);
	});

	it('can execute next API Request CRUD and expected error paths', async () => {
		const createContext = createLiveExecuteContext(
			{
				options: { isRaw: true },
				requestBody: JSON.stringify({
					case_customer_id: 1,
					case_description: 'QA next case created via API Request',
					case_name: `QA Next API Request ${Date.now()}`,
					case_soc_id: `QA-NEXT-API-${Date.now()}`,
				}),
				requestMethod: 'POST',
				requestPath: 'api/v2/cases',
			},
			{ credentials: buildNextCredentials() },
		);

		const createOutput = (await apiRequestExecute.call(
			createContext.context as never,
			0,
		)) as INodeExecutionData[];
		apiRequestCaseId = extractId(createOutput[0].json, ['case_id', 'id']);
		expect(apiRequestCaseId).toBeTruthy();

		const getContext = createLiveExecuteContext(
			{
				options: { isRaw: true },
				requestMethod: 'GET',
				requestPath: `api/v2/cases/${apiRequestCaseId}`,
			},
			{ credentials: buildNextCredentials() },
		);
		const getOutput = (await apiRequestExecute.call(getContext.context as never, 0)) as INodeExecutionData[];
		expect(JSON.stringify(getOutput)).toContain('QA Next API Request');

		const updateContext = createLiveExecuteContext(
			{
				options: { isRaw: true },
				requestBody: JSON.stringify({
					case_description: 'QA next case updated via API Request',
				}),
				requestHeaders: JSON.stringify({
					'X-QA-Header': 'next-api-request-live',
				}),
				requestMethod: 'PUT',
				requestPath: `api/v2/cases/${apiRequestCaseId}`,
			},
			{ credentials: buildNextCredentials() },
		);
		await apiRequestExecute.call(updateContext.context as never, 0);
		expect((updateContext.calls[0].options.headers as IDataObject)['X-QA-Header']).toBe(
			'next-api-request-live',
		);

		const malformedContext = createLiveExecuteContext(
			{
				requestBody: '{invalid json}',
				requestMethod: 'POST',
				requestPath: 'api/v2/cases',
			},
			{ credentials: buildNextCredentials() },
		);
		await expect(apiRequestExecute.call(malformedContext.context as never, 0)).rejects.toThrow(
			/body must be valid json/i,
		);

		const missingContext = createLiveExecuteContext(
			{
				options: { isRaw: true },
				requestMethod: 'GET',
				requestPath: 'api/v2/cases/999999999',
			},
			{ credentials: buildNextCredentials() },
		);
		await expect(apiRequestExecute.call(missingContext.context as never, 0)).rejects.toBeDefined();

		const deleteContext = createLiveExecuteContext(
			{
				options: { isRaw: true },
				requestMethod: 'DELETE',
				requestPath: `api/v2/cases/${apiRequestCaseId}`,
			},
			{ credentials: buildNextCredentials() },
		);
		await apiRequestExecute.call(deleteContext.context as never, 0);
		apiRequestCaseId = undefined;
	});
});
