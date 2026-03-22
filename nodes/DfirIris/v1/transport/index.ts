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
import { enableDebug, IrisLog } from '../helpers/utils';

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

function normalizeEndpoint(endpoint: string): string {
	return endpoint.replace(/^\/+/, '');
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
	const baseUrl = `${credentials.isHttp ? 'http' : 'https'}://${credentials.host as string}`;
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
	let options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/${normalizeEndpoint(endpoint)}`,
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

export async function apiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: DfirIrisRequestBody,
	query?: IDataObject,
	option: IDataObject = {},
	isFormData: boolean = false,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('dfirIrisApi');

	enableDebug(credentials?.enableDebug as boolean);
	const irisLogger = new IrisLog(this.logger);
	const { baseUrl, skipSslCertificateValidation } = getConnectionSettings(credentials);

	const options = buildRequestOptions(
		method,
		baseUrl,
		endpoint,
		body,
		query || {},
		option,
		isFormData,
		skipSslCertificateValidation,
	);

	try {
		irisLogger.info('options', { options });
		return await this.helpers.httpRequestWithAuthentication.call(this, 'dfirIrisApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function getCredentialApiMode(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IWebhookFunctions,
): Promise<ApiMode> {
	const credentials = await this.getCredentials('dfirIrisApi');
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
	const credentials = await this.getCredentials('dfirIrisApi');

	enableDebug(credentials?.enableDebug as boolean);

	const { baseUrl, skipSslCertificateValidation } = getConnectionSettings(credentials);
	const headers = { 'content-type': 'application/json; charset=utf-8' };
	const irisLogger = new IrisLog(this.logger);

	query = query || {};
	let returnData: IDataObject[] = [];
	let responseData;
	let proceed = true;
	query.page = start_page;
	query.per_page = max_items > 0 && max_items < 100 ? max_items : 100;

	if (start_page > 1) {
		query.page = Math.floor((start_page * max_items) / query.per_page);
	}

	const options: IHttpRequestOptions = {
		headers: headers,
		method,
		url: `${baseUrl}/${endpoint}`,
		body,
		qs: query,
		json: true,
		skipSslCertificateValidation,
		ignoreHttpStatusErrors: true,
	};

	Object.assign(options as unknown as IDataObject, {
		rejectUnauthorized: !skipSslCertificateValidation,
	});

	irisLogger.info('req options: ', { options });
	do {
		try {
			responseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'dfirIrisApi',
				options,
			);
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}

		// for troubleshooting
		irisLogger.info('responseData', {responseData});
		// proceed = false

		irisLogger.info('current_page: ', responseData.data.current_page);
		irisLogger.info('next_page: ', responseData.data.next_page);
		irisLogger.info('last_page: ', responseData.data.last_page);
		irisLogger.info('total: ', responseData.data.total);

		returnData.push(...responseData.data[propKey]);

		irisLogger.info(`max_items: ${max_items}`);
		irisLogger.info(`returnData.length: ${returnData.length}`);

		if (max_items > 0 && returnData.length >= max_items) {
			proceed = false;
		} else if (
			!responseData.data.next_page ||
			responseData.data.next_page === 'null' ||
			responseData.data.next_page === null
		) {
			proceed = false;
		} else {
			if (options.qs && typeof options.qs === 'object') {
				options.qs.page = responseData.data.next_page;
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
	const credentials = await this.getCredentials('dfirIrisApi');

	enableDebug(credentials?.enableDebug as boolean);

	const { baseUrl, skipSslCertificateValidation } = getConnectionSettings(credentials);
	const headers = { 'content-type': 'application/json; charset=utf-8' };
	const irisLogger = new IrisLog(this.logger);
	const returnData: IDataObject[] = [];
	const perPage = maxItems > 0 && maxItems < 100 ? maxItems : 100;
	const isGetLikeRequest = method === 'GET' || method === 'HEAD';
	let currentPage = startPage;
	let lastPage = startPage;
	let total = 0;

	do {
		const options: IHttpRequestOptions = {
			headers,
			method,
			url: `${baseUrl}/${normalizeEndpoint(endpoint)}`,
			body: isGetLikeRequest ? undefined : body,
			qs: {
				...(isGetLikeRequest ? body : {}),
				...query,
				page: currentPage,
				per_page: perPage,
			},
			json: true,
			skipSslCertificateValidation,
			ignoreHttpStatusErrors: true,
		};

		Object.assign(options as unknown as IDataObject, {
			rejectUnauthorized: !skipSslCertificateValidation,
		});

		let responseData;
		try {
			responseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'dfirIrisApi',
				options,
			);
		} catch (error) {
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}

		irisLogger.info('next responseData', { responseData });
		const payload = extractNextPaginatedPayload(responseData);
		const items = Array.isArray(payload.data) ? (payload.data as IDataObject[]) : [];

		returnData.push(...items);
		total = Number(payload.total || returnData.length);
		lastPage = Number(payload.last_page || currentPage);
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
