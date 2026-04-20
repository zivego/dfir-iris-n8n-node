import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IHttpRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { resolveApiMode, type ApiMode } from '../compatibility';
import { IrisLog } from '../helpers/utils';

const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/;
const MAX_SAFE_PAGES = 1000;

type DfirIrisRequestBody =
	| IDataObject
	| IDataObject[]
	| FormData
	| string
	| number
	| boolean
	| Buffer
	| ArrayBuffer
	| Uint8Array
	| Blob
	| undefined;

function isPlainObject(value: unknown): value is IDataObject {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		!(value instanceof FormData) &&
		!(value instanceof Buffer) &&
		!(value instanceof ArrayBuffer) &&
		!(value instanceof Uint8Array) &&
		!(value instanceof Blob)
	);
}

function hasRequestBody(body: DfirIrisRequestBody, isFormData: boolean): boolean {
	if (body === undefined) {
		return false;
	}

	if (body === null) {
		return true;
	}

	if (isFormData) {
		return true;
	}

	if (typeof body === 'string') {
		return body.length > 0;
	}

	if (
		typeof body === 'number' ||
		typeof body === 'boolean' ||
		body instanceof Buffer ||
		body instanceof ArrayBuffer ||
		body instanceof Uint8Array ||
		body instanceof Blob
	) {
		return true;
	}

	if (Array.isArray(body)) {
		return body.length > 0;
	}

	if (isPlainObject(body)) {
		return Object.keys(body).length > 0;
	}

	return true;
}

function getValidationError(message: string, description: string): JsonObject {
	return {
		message,
		description,
	};
}

export function sanitizeRelativeEndpoint(endpoint: unknown): string {
	if (typeof endpoint !== 'string') {
		throw getValidationError(
			'Invalid API path',
			'The request path must be a non-empty relative path string.',
		);
	}

	const trimmedEndpoint = endpoint.trim();
	if (!trimmedEndpoint) {
		throw getValidationError(
			'Invalid API path',
			'The request path must be a non-empty relative path string.',
		);
	}

	if (
		trimmedEndpoint.startsWith('//') ||
		/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmedEndpoint) ||
		trimmedEndpoint.includes('\\') ||
		trimmedEndpoint.includes('?') ||
		trimmedEndpoint.includes('#') ||
		CONTROL_CHAR_REGEX.test(trimmedEndpoint)
	) {
		throw getValidationError(
			'Invalid API path',
			'Only relative DFIR IRIS paths are allowed. Do not enter full URLs, query strings, fragments, or control characters.',
		);
	}

	const normalizedEndpoint = trimmedEndpoint.replace(/^\/+/, '');
	if (!normalizedEndpoint) {
		throw getValidationError(
			'Invalid API path',
			'The request path must not resolve to an empty value.',
		);
	}

	if (normalizedEndpoint.split('/').some((segment) => segment === '.' || segment === '..')) {
		throw getValidationError(
			'Invalid API path',
			'Only relative DFIR IRIS paths are allowed. Dot path segments are not permitted.',
		);
	}

	return normalizedEndpoint;
}

function sanitizeHost(host: unknown): string {
	if (typeof host !== 'string') {
		throw getValidationError(
			'Invalid Host',
			'Host must be a hostname or IP address, optionally followed by a port.',
		);
	}

	const trimmedHost = host.trim();
	if (!trimmedHost) {
		throw getValidationError(
			'Invalid Host',
			'Host must be a hostname or IP address, optionally followed by a port.',
		);
	}

	if (
		trimmedHost.includes('/') ||
		trimmedHost.includes('?') ||
		trimmedHost.includes('#') ||
		trimmedHost.includes('@') ||
		trimmedHost.includes('\\') ||
		/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmedHost) ||
		/\s/.test(trimmedHost) ||
		CONTROL_CHAR_REGEX.test(trimmedHost)
	) {
		throw getValidationError(
			'Invalid Host',
			'Host must contain only the hostname or IP address. Do not include a scheme, path, query string, credentials, or control characters.',
		);
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(`https://${trimmedHost}`);
	} catch {
		throw getValidationError(
			'Invalid Host',
			'Host must be a valid hostname or IP address, optionally followed by a port.',
		);
	}

	if (
		parsedUrl.username ||
		parsedUrl.password ||
		parsedUrl.pathname !== '/' ||
		parsedUrl.search ||
		parsedUrl.hash ||
		!parsedUrl.host
	) {
		throw getValidationError(
			'Invalid Host',
			'Host must contain only the hostname or IP address. Do not include a scheme, path, query string, or credentials.',
		);
	}

	return parsedUrl.host;
}

function getDebugLogger(
	logger: IHookFunctions['logger'] | IExecuteFunctions['logger'] | ILoadOptionsFunctions['logger'] | IWebhookFunctions['logger'],
	credentials: IDataObject,
): IrisLog {
	return new IrisLog(logger, Boolean(credentials?.enableDebug));
}

function summarizeQueryKeys(query?: IDataObject): string[] {
	if (!query || typeof query !== 'object') {
		return [];
	}

	return Object.keys(query).sort();
}

function buildSafeRequestLogMeta(
	method: IHttpRequestMethods,
	endpoint: string,
	query: IDataObject | undefined,
	body: DfirIrisRequestBody,
	isFormData: boolean,
	options: IDataObject = {},
) {
	return {
		method,
		path: endpoint,
		queryKeys: summarizeQueryKeys(query),
		hasBody: hasRequestBody(body, isFormData),
		sendBinary: isFormData,
		returnFullResponse: Boolean(options.returnFullResponse),
		json: options.json !== false,
	};
}

function buildSafeErrorLogMeta(error: unknown): IDataObject {
	if (!error || typeof error !== 'object') {
		return {};
	}

	const errorObject = error as IDataObject;
	return {
		message: errorObject.message,
		statusCode: errorObject.statusCode,
		code: errorObject.code,
	};
}

function extractNextPaginatedPayload(responseData: unknown): IDataObject {
	if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData)) {
		return {};
	}

	const rootPayload = responseData as IDataObject;

	if (Array.isArray(rootPayload.data)) {
		return rootPayload;
	}

	if (
		'data' in rootPayload &&
		rootPayload.data &&
		typeof rootPayload.data === 'object' &&
		!Array.isArray(rootPayload.data)
	) {
		return rootPayload.data as IDataObject;
	}

	return {};
}

function getConnectionSettings(credentials: IDataObject) {
	const normalizedHost = sanitizeHost(credentials.host);
	const baseUrl = `${credentials.isHttp ? 'http' : 'https'}://${normalizedHost}`;
	const skipSslCertificateValidation = credentials.isHttp
		? true
		: Boolean(credentials.allowUnauthorizedCerts);

	return {
		apiMode: resolveApiMode(credentials.apiMode),
		baseUrl,
		skipSslCertificateValidation,
	};
}

function buildRequestOptions(
	method: IHttpRequestMethods,
	baseUrl: string,
	endpoint: string,
	body: DfirIrisRequestBody,
	query: IDataObject = {},
	option: IDataObject = {},
	isFormData: boolean = false,
	skipSslCertificateValidation: boolean,
): IHttpRequestOptions {
	const normalizedEndpoint = sanitizeRelativeEndpoint(endpoint);
	let options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/${normalizedEndpoint}`,
		qs: query,
		body: body as never,
		returnFullResponse: false,
		json: true,
		headers: { 'content-type': 'application/json' },
		skipSslCertificateValidation,
		ignoreHttpStatusErrors: false,
	} satisfies IHttpRequestOptions;

	if (isFormData) {
		options.json = false;
		delete options.headers;
	}

	if (Object.keys(option).length > 0) {
		options = Object.assign({}, options, option);
	}

	if (!hasRequestBody(body, isFormData)) {
		delete options.body;
	}

	if (!query || Object.keys(query).length === 0) {
		delete options.qs;
	}

	if (isFormData) {
		delete options.headers;
	}

	Object.assign(options as unknown as IDataObject, {
		rejectUnauthorized: !skipSslCertificateValidation,
	});

	return options;
}

function getUnexpectedPaginationError(message: string): JsonObject {
	return {
		message,
		description: 'The DFIR IRIS API returned an unexpected pagination payload.',
	};
}

export async function apiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: DfirIrisRequestBody,
	query?: IDataObject,
	option: IDataObject = {},
	isFormData: boolean = false,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('zivegoDfirIrisApi');
	const irisLogger = getDebugLogger(this.logger, credentials);
	let normalizedEndpoint: string;
	let baseUrl: string;
	let skipSslCertificateValidation: boolean;
	try {
		normalizedEndpoint = sanitizeRelativeEndpoint(endpoint);
		({ baseUrl, skipSslCertificateValidation } = getConnectionSettings(credentials));
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}

	const options = buildRequestOptions(
		method,
		baseUrl,
		normalizedEndpoint,
		body,
		query || {},
		option,
		isFormData,
		skipSslCertificateValidation,
	);

	try {
		irisLogger.info(
			'dfir-iris request',
			buildSafeRequestLogMeta(method, normalizedEndpoint, query || {}, body, isFormData, option),
		);
		return await this.helpers.httpRequestWithAuthentication.call(this, 'zivegoDfirIrisApi', options);
	} catch (error) {
		irisLogger.info('dfir-iris request failed', buildSafeErrorLogMeta(error));
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function getCredentialApiMode(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
): Promise<ApiMode> {
	const credentials = await this.getCredentials('zivegoDfirIrisApi');
	return resolveApiMode(credentials?.apiMode);
}

export async function apiRequestAll(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject,
	max_items: number = 0,
	start_page: number = 1,
	propKey: string,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('zivegoDfirIrisApi');
	const irisLogger = getDebugLogger(this.logger, credentials);
	let normalizedEndpoint: string;
	let baseUrl: string;
	let skipSslCertificateValidation: boolean;
	try {
		normalizedEndpoint = sanitizeRelativeEndpoint(endpoint);
		({ baseUrl, skipSslCertificateValidation } = getConnectionSettings(credentials));
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
	const headers = { 'content-type': 'application/json; charset=utf-8' };

	query = query || {};
	let returnData: IDataObject[] = [];
	let responseData;
	let proceed = true;
	let pageIterations = 0;
	query.page = start_page;
	query.per_page = max_items > 0 && max_items < 100 ? max_items : 100;

	const options: IHttpRequestOptions = {
		headers: headers,
		method,
		url: `${baseUrl}/${normalizedEndpoint}`,
		body,
		qs: query,
		json: true,
		skipSslCertificateValidation,
		ignoreHttpStatusErrors: false,
	};

	Object.assign(options as unknown as IDataObject, {
		rejectUnauthorized: !skipSslCertificateValidation,
	});

	irisLogger.info('dfir-iris paginated request', {
		method,
		path: normalizedEndpoint,
		startPage: start_page,
		perPage: query.per_page,
		hasBody: hasRequestBody(body, false),
	});
	do {
		pageIterations += 1;
		if (pageIterations > MAX_SAFE_PAGES) {
			throw new NodeApiError(
				this.getNode(),
				getUnexpectedPaginationError(
					`Pagination exceeded the safety ceiling of ${MAX_SAFE_PAGES} pages.`,
				),
			);
		}

		try {
			responseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'zivegoDfirIrisApi',
				options,
			);
		} catch (error) {
			irisLogger.info('dfir-iris paginated request failed', buildSafeErrorLogMeta(error));
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}

		if (
			!responseData ||
			typeof responseData !== 'object' ||
			!responseData.data ||
			typeof responseData.data !== 'object' ||
			!Array.isArray(responseData.data[propKey])
		) {
			throw new NodeApiError(
				this.getNode(),
				getUnexpectedPaginationError(`Missing paginated array payload at data.${propKey}.`),
			);
		}

		const currentPage = Number(responseData.data.current_page ?? options.qs?.page ?? start_page);
		const nextPage =
			responseData.data.next_page === 'null' || responseData.data.next_page === null
				? null
				: Number(responseData.data.next_page);
		const lastPage = Number(responseData.data.last_page ?? currentPage);
		const total = Number(responseData.data.total ?? returnData.length);

		irisLogger.info('dfir-iris paginated response', {
			path: normalizedEndpoint,
			currentPage,
			nextPage,
			lastPage,
			total,
			itemCount: responseData.data[propKey].length,
		});

		returnData.push(...responseData.data[propKey]);

		if (max_items > 0 && returnData.length >= max_items) {
			proceed = false;
		} else if (!nextPage) {
			proceed = false;
		} else {
			if (!Number.isFinite(currentPage) || currentPage < 1) {
				throw new NodeApiError(
					this.getNode(),
					getUnexpectedPaginationError('Current page is missing or invalid.'),
				);
			}

			if (!Number.isFinite(nextPage) || nextPage <= currentPage || nextPage > lastPage + 1) {
				throw new NodeApiError(
					this.getNode(),
					getUnexpectedPaginationError('Next page is missing, invalid, or not advancing.'),
				);
			}

			if (options.qs && typeof options.qs === 'object') {
				options.qs.page = nextPage;
			}
		}
	} while (proceed);

	if (max_items > 0) returnData = returnData.slice(0, max_items);

	responseData.data[propKey] = returnData;
	return responseData;
}

export async function apiRequestAllNext(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
	maxItems: number = 0,
	startPage: number = 1,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('zivegoDfirIrisApi');
	const irisLogger = getDebugLogger(this.logger, credentials);
	let normalizedEndpoint: string;
	let baseUrl: string;
	let skipSslCertificateValidation: boolean;
	try {
		normalizedEndpoint = sanitizeRelativeEndpoint(endpoint);
		({ baseUrl, skipSslCertificateValidation } = getConnectionSettings(credentials));
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
	const headers = { 'content-type': 'application/json; charset=utf-8' };
	const returnData: IDataObject[] = [];
	const perPage = maxItems > 0 && maxItems < 100 ? maxItems : 100;
	const isGetLikeRequest = method === 'GET' || method === 'HEAD';
	let currentPage = startPage;
	let lastPage = startPage;
	let total = 0;
	let pageIterations = 0;

	do {
		pageIterations += 1;
		if (pageIterations > MAX_SAFE_PAGES) {
			throw new NodeApiError(
				this.getNode(),
				getUnexpectedPaginationError(
					`Pagination exceeded the safety ceiling of ${MAX_SAFE_PAGES} pages.`,
				),
			);
		}

		const options: IHttpRequestOptions = {
			headers,
			method,
			url: `${baseUrl}/${normalizedEndpoint}`,
			body: isGetLikeRequest ? undefined : body,
			qs: {
				...(isGetLikeRequest ? body : {}),
				...query,
				page: currentPage,
				per_page: perPage,
			},
			json: true,
			skipSslCertificateValidation,
			ignoreHttpStatusErrors: false,
		};

		Object.assign(options as unknown as IDataObject, {
			rejectUnauthorized: !skipSslCertificateValidation,
		});

		let responseData;
		try {
			responseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'zivegoDfirIrisApi',
				options,
			);
		} catch (error) {
			irisLogger.info('dfir-iris next paginated request failed', buildSafeErrorLogMeta(error));
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}

		const payload = extractNextPaginatedPayload(responseData);
		if (!Array.isArray(payload.data)) {
			throw new NodeApiError(
				this.getNode(),
				getUnexpectedPaginationError('Missing paginated array payload at data.'),
			);
		}
		const items = payload.data as IDataObject[];

		returnData.push(...items);
		total = Number(payload.total || returnData.length);
		lastPage = Number(payload.last_page || currentPage);

		if (!Number.isFinite(lastPage) || lastPage < currentPage) {
			throw new NodeApiError(
				this.getNode(),
				getUnexpectedPaginationError('Last page is missing or invalid.'),
			);
		}

		irisLogger.info('dfir-iris next paginated response', {
			path: normalizedEndpoint,
			currentPage,
			lastPage,
			total,
			itemCount: items.length,
		});

		currentPage += 1;

		if (maxItems > 0 && returnData.length >= maxItems) {
			break;
		}
	} while (currentPage <= lastPage);

	return {
		data: {
			current_page: startPage,
			data: maxItems > 0 ? returnData.slice(0, maxItems) : returnData,
			last_page: lastPage,
			total,
		},
	};
}
