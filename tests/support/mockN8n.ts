import { URL } from 'node:url';

import type {
	IBinaryData,
	IDataObject,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

export interface RecordedRequest {
	credentialType: string;
	options: IDataObject;
}

type ResponseFactory = (request: RecordedRequest) => Promise<unknown> | unknown;

const DEFAULT_BINARY_BUFFER = Buffer.from('dfir-iris-test-binary');

function clone<T>(value: T): T {
	if (value === undefined || value === null) {
		return value;
	}

	if (
		value instanceof FormData ||
		value instanceof Blob ||
		value instanceof ArrayBuffer ||
		value instanceof Uint8Array ||
		Buffer.isBuffer(value)
	) {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((entry) => clone(entry)) as T;
	}

	if (typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, clone(entry)]),
		) as T;
	}

	return value;
}

function getPathValue(source: IDataObject, name: string): unknown {
	if (Object.prototype.hasOwnProperty.call(source, name)) {
		return source[name];
	}

	return name.split('.').reduce<unknown>((current, part) => {
		if (current && typeof current === 'object' && part in (current as IDataObject)) {
			return (current as IDataObject)[part];
		}

		return undefined;
	}, source);
}

function buildCollectionDefaults(property: INodeProperties): IDataObject {
	const output: IDataObject = {};

	for (const option of property.options || []) {
		if (typeof option !== 'object' || option === null || !('name' in option)) {
			continue;
		}

		if (option.name === 'fields') {
			output[option.name] = '';
			continue;
		}

		if (option.name === 'inverseFields') {
			output[option.name] = false;
			continue;
		}

		if (option.name === 'startPage') {
			output[option.name] = 1;
			continue;
		}

		if (option.name === 'limit') {
			output[option.name] = 1;
			continue;
		}

		output[option.name] = buildValueFromProperty(option as INodeProperties);
	}

	return output;
}

function buildValueFromProperty(property: INodeProperties): unknown {
	if (property.name === 'queryUI') {
		return [];
	}

	if (property.default !== undefined && property.default !== '') {
		return clone(property.default);
	}

	switch (property.type) {
		case 'boolean':
			return false;
		case 'collection':
			return buildCollectionDefaults(property);
		case 'dateTime':
			return '2026-03-21T10:00:00.000Z';
		case 'json':
			return '{}';
		case 'multiOptions':
			return property.options?.[0] && typeof property.options[0] === 'object' && 'value' in property.options[0]
				? [property.options[0].value]
				: [];
		case 'number':
			return 1;
		case 'options':
			return property.options?.[0] && typeof property.options[0] === 'object' && 'value' in property.options[0]
				? property.options[0].value
				: 1;
		case 'string':
			return inferValueFromName(property.name);
		default:
			return property.default ?? null;
	}
}

function inferValueFromName(name: string): unknown {
	if (name === 'cid' || name === 'case_id' || name.endsWith('_id') || name === 'id') {
		return 1;
	}

	if (name === 'ids' || name.endsWith('_ids')) {
		return '1,2';
	}

	if (name === 'alert_ids') {
		return '1,2';
	}

	if (name === 'requestMethod') {
		return 'GET';
	}

	if (name === 'requestPath') {
		return 'api/ping';
	}

	if (name === 'requestBody' || name === 'requestHeaders' || name === 'requestQuery') {
		return '{}';
	}

	if (name === 'moduleData') {
		return '{}';
	}

	if (name === 'targetsString') {
		return '1,2';
	}

	if (name === 'type' || name === 'object_type') {
		return 'case';
	}

	if (name === 'binaryName' || name === 'binaryPropertyName' || name === 'outputBinaryField') {
		return 'data';
	}

	if (name === 'binaryFieldName') {
		return 'file_content';
	}

	if (name === 'folderName' || name === 'name') {
		return 'QA Folder';
	}

	if (name === 'module') {
		return 'module';
	}

	if (name === 'host') {
		return 'localhost:8443';
	}

	if (name.includes('title')) {
		return 'QA title';
	}

	if (name.includes('description') || name.includes('content') || name.includes('note')) {
		return 'QA description';
	}

	if (name.includes('search')) {
		return 'QA search';
	}

	if (name.includes('tags')) {
		return 'qa,automation';
	}

	if (name.includes('hash')) {
		return '0123456789abcdef';
	}

	if (name.includes('date')) {
		return '2026-03-21T10:00:00.000Z';
	}

	if (name.includes('rows_count') || name.includes('limit')) {
		return 1;
	}

	if (name.includes('status') || name.includes('severity') || name.includes('classification')) {
		return 1;
	}

	if (name.includes('assignee') || name.includes('customer') || name.includes('soc')) {
		return 1;
	}

	if (name.includes('size')) {
		return 42;
	}

	if (name.includes('obj_name')) {
		return 'case';
	}

	if (name.includes('obj_id') || name.includes('comment_id') || name.includes('eventId')) {
		return 1;
	}

	if (name.includes('path')) {
		return 'api/ping';
	}

	return `${name}-value`;
}

export function buildParametersFromDescription(
	description: INodeProperties[] | undefined,
	overrides: IDataObject = {},
): IDataObject {
	const params: IDataObject = {
		additionalFields: {},
		cid: 1,
		options: {
			fields: '',
			ignore_empty: false,
			inverseFields: false,
			isRaw: false,
			limit: 1,
			returnAll: false,
			sendEmptyFields: false,
			startPage: 1,
		},
	};

	for (const property of description || []) {
		if (!property.name || property.type === 'notice') {
			continue;
		}

		params[property.name] = buildValueFromProperty(property);
	}

	return { ...params, ...clone(overrides) };
}

export function summarizeRequest(record: RecordedRequest): IDataObject {
	const url = new URL(record.options.url as string);
	const body = record.options.body;
	let summarizedBody: unknown = body;

	if (body instanceof FormData) {
		summarizedBody = Array.from(body.entries()).map(([key, value]) => {
			if (typeof value === 'string') {
				return { key, type: 'string', value };
			}

			return {
				fileName: 'name' in value ? value.name : undefined,
				key,
				size: 'size' in value ? value.size : undefined,
				type: 'binary',
			};
		});
	}

	if (record.options.encoding === 'arraybuffer') {
		summarizedBody = '[binary-response]';
	}

	return {
		body: summarizedBody as never,
		credentialType: record.credentialType,
		headers: clone((record.options.headers || {}) as IDataObject),
		json: record.options.json,
		method: record.options.method as string,
		path: url.pathname.replace(/^\/+/, ''),
		qs: clone((record.options.qs || {}) as IDataObject),
		rejectUnauthorized: record.options.rejectUnauthorized as boolean,
		returnFullResponse: record.options.returnFullResponse as boolean,
		skipSslCertificateValidation: record.options.skipSslCertificateValidation as boolean,
	};
}

function getBaseEntity() {
	return {
		alert_id: 1,
		alert_title: 'QA Alert',
		asset_id: 1,
		asset_name: 'QA Asset',
		asset_type: 'Server',
		case_id: 1,
		case_name: 'QA Case',
		comment_id: 1,
		comment_text: 'QA comment',
		customer_id: 1,
		directory_id: 1,
		directory_name: 'QA Directory',
		event_id: 1,
		event_title: 'QA Event',
		filename: 'qa.txt',
		file_id: 1,
		file_uuid: 'file-uuid',
		hook_name: 'qa_hook',
		id: 1,
		ioc_id: 1,
		ioc_tlp_id: 3,
		ioc_type: 'domain',
		ioc_type_id: 1,
		ioc_value: 'example.org',
		manual_hook_ui_name: 'QA Hook',
		module_name: 'QA Module',
		name: 'QA Name',
		note_id: 1,
		owner: { name: 'QA Owner' },
		status_name: 'Open',
		task_id: 1,
		task_title: 'QA Task',
		total: 1,
		type: { name: 'Document' },
		user_active: true,
		user_email: 'qa@example.com',
		user_id: 1,
		user_name: 'QA User',
	};
}

function buildNoteGroups() {
	return [
		{
			id: 1,
			name: 'Root',
			note_count: 1,
			notes: [{ id: 10, title: 'Nested Note' }],
			subdirectories: [
				{
					id: 2,
					name: 'Child',
					note_count: 1,
					notes: [{ id: 11, title: 'Child Note' }],
					subdirectories: [],
				},
			],
		},
	];
}

function buildFolderTree() {
	return {
		'd-1': {
			children: {
				'f-1': {
					added_by_user_id: 1,
					file_case_id: 1,
					file_date_added: '2026-03-21T10:00:00.000Z',
					file_description: 'QA file',
					file_id: 1,
					file_is_evidence: 'n',
					file_is_ioc: 'n',
					file_original_name: 'qa.txt',
					file_parent_id: 1,
					file_password: '',
					file_sha256: 'deadbeef',
					file_size: 42,
					file_tags: 'qa',
					file_uuid: 'uuid-file',
					modification_history: {},
					type: 'file',
				},
			},
			is_root: true,
			name: 'Root',
			type: 'directory',
		},
	};
}

export async function defaultResponseFactory(request: RecordedRequest): Promise<unknown> {
	const url = new URL(request.options.url as string);
	const path = url.pathname.replace(/^\/+/, '');
	const entity = getBaseEntity();
	const listResponse = { data: [entity] };

	if (path === 'api/ping') {
		return { data: 'pong' };
	}

	if (request.options.returnFullResponse) {
		return {
			body: DEFAULT_BINARY_BUFFER,
			headers: {
				'content-disposition': 'attachment; filename="qa.bin"',
				'content-type': 'application/octet-stream',
			},
			statusCode: 200,
		};
	}

	if (path === 'case/users/list') {
		return {
			data: [
				{
					user_active: true,
					user_email: entity.user_email,
					user_id: entity.user_id,
					user_name: entity.user_name,
				},
			],
		};
	}

	if (path === 'case/assets/list' || path === 'assets/list') {
		return { data: { assets: [entity] } };
	}

	if (path === 'case/tasks/list' || path === 'case/tasks/filter' || path === 'tasks/list') {
		return { data: { tasks: [entity] } };
	}

	if (path === 'case/notes/directories/filter') {
		return { data: buildNoteGroups() };
	}

	if (path === 'case/ioc/list' || path === 'ioc/list') {
		return { data: { ioc: [entity] } };
	}

	if (path === 'case/evidences/list' || path === 'case/evidences/filter' || path === 'evidences/list') {
		return { data: { evidences: [entity] } };
	}

	if (path === 'datastore/list/tree') {
		return { data: buildFolderTree() };
	}

	if (path === 'manage/customers/list') {
		return { data: [{ customer_id: 1, customer_name: 'QA Customer' }] };
	}

	if (path === 'manage/case-classifications/list') {
		return { data: [{ id: 1, name_expanded: 'QA Classification' }] };
	}

	if (path === 'manage/case-states/list') {
		return { data: [{ state_id: 1, state_name: 'Open' }] };
	}

	if (path === 'manage/severities/list') {
		return { data: [{ severity_id: 1, severity_name: 'High' }] };
	}

	if (path === 'manage/case-templates/list') {
		return { data: [{ display_name: 'QA Template', id: 1, title_prefix: 'QA' }] };
	}

	if (path === 'manage/asset-type/list') {
		return { data: [{ asset_id: 1, asset_name: 'Server' }] };
	}

	if (path === 'manage/evidence-types/list') {
		return { data: [{ id: 1, name: 'Document' }] };
	}

	if (path === 'manage/ioc-types/list') {
		return { data: [{ type_description: 'Domain', type_id: 1, type_name: 'Domain' }] };
	}

	if (path === 'manage/users/list') {
		return { data: [entity] };
	}

	if (path === 'manage/task-status/list') {
		return { data: [{ status_id: 1, status_name: 'Open' }] };
	}

	if (path.startsWith('dim/hooks/options/')) {
		return { data: [entity] };
	}

	if (path.startsWith('dim/tasks/list/')) {
		return { data: [entity] };
	}

	if (path === 'dim/hooks/call') {
		return { data: { status: 'queued' } };
	}

	if (path === 'case/timeline/advanced-filter') {
		return {
			data: {
				timeline: [
					{
						assets: [],
						category_name: 'General',
						event_id: 1,
						event_title: 'QA Event',
						iocs: [],
					},
				],
			},
		};
	}

	if (path === 'alerts/filter') {
		return { data: { alerts: [entity], current_page: 1, last_page: 1, next_page: null, total: 1 } };
	}

	if (path === 'cases/filter' || path === 'manage/cases/filter') {
		return { data: { cases: [entity], current_page: 1, last_page: 1, next_page: null, total: 1 } };
	}

	if (path.startsWith('alerts/')) {
		return {
			data: {
				...entity,
				assets: [
					{
						asset_description: 'QA asset',
						asset_domain: 'example.org',
						asset_enrichment: {},
						asset_ip: '127.0.0.1',
						asset_name: 'Existing Asset',
						asset_tags: 'qa',
						asset_type_id: 1,
					},
				],
				iocs: [
					{
						ioc_description: 'QA IOC',
						ioc_enrichment: {},
						ioc_tags: 'qa',
						ioc_tlp_id: 3,
						ioc_type_id: 1,
						ioc_value: 'example.org',
					},
				],
			},
		};
	}

	if (path === 'case/export') {
		return { data: { exported: true, format: 'json' } };
	}

	return listResponse;
}

export function createBinaryData(overrides: Partial<IBinaryData> = {}): IBinaryData {
	return {
		data: DEFAULT_BINARY_BUFFER.toString('base64'),
		fileName: 'qa.txt',
		fileSize: DEFAULT_BINARY_BUFFER.length.toString(),
		mimeType: 'text/plain',
		...overrides,
	};
}

export function createMockExecuteContext(
	parameters: IDataObject,
	options: {
		continueOnFail?: boolean;
		inputItems?: INodeExecutionData[];
		responseFactory?: ResponseFactory;
	} = {},
) {
	const calls: RecordedRequest[] = [];
	const responseFactory = options.responseFactory || defaultResponseFactory;
	const inputItems = options.inputItems || [{ json: { seed: 'item' } }];

	const context = {
		continueOnFail: () => options.continueOnFail ?? false,
		getCredentials: async () => ({
			accessToken: 'token',
			allowUnauthorizedCerts: true,
			apiVersion: '2.0.4',
			enableDebug: false,
			host: 'iris.local',
			isHttp: false,
		}),
		getInputData: () => inputItems,
		getNode: () => ({ name: 'DFIR IRIS', type: 'dfirIris', typeVersion: 2 }),
		getNodeParameter(name: string, _itemIndex = 0, fallback?: unknown) {
			const value = getPathValue(parameters, name);
			if (value !== undefined) {
				return clone(value);
			}

			if (fallback !== undefined) {
				return clone(fallback as never);
			}

			return inferValueFromName(name);
		},
		helpers: {
			assertBinaryData: (_itemIndex: number, _binaryPropertyName: string) => createBinaryData(),
			constructExecutionMetaData: (items: INodeExecutionData[]) => items,
			getBinaryDataBuffer: async () => DEFAULT_BINARY_BUFFER,
			httpRequestWithAuthentication: async (credentialType: string, requestOptions: IDataObject) => {
				const record = {
					credentialType,
					options: clone(requestOptions),
				};
				calls.push(record);
				return await responseFactory(record);
			},
			prepareBinaryData: async (buffer: Buffer, fileName: string, mimeType?: string) => ({
				data: buffer.toString('base64'),
				fileName,
				fileSize: buffer.length.toString(),
				mimeType: mimeType || 'application/octet-stream',
			}),
			returnJsonArray: (data: IDataObject | IDataObject[]) => {
				const items = Array.isArray(data) ? data : [data];
				return items.map((json) => ({ json }));
			},
		},
		logger: {
			info: () => undefined,
		},
	};

	return { calls, context };
}

export function createMockLoadOptionsContext(
	parameters: IDataObject,
	options: { responseFactory?: ResponseFactory } = {},
) {
	const { calls, context } = createMockExecuteContext(parameters, {
		responseFactory: options.responseFactory,
	});

	return {
		calls,
		context: {
			...context,
			getNodeParameter(name: string) {
				const value = getPathValue(parameters, name);
				if (value !== undefined) {
					return clone(value);
				}

				return inferValueFromName(name);
			},
		},
	};
}
