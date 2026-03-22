import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

import {
	buildParametersFromDescription,
	createBinaryData,
	createMockExecuteContext,
} from '../../support/mockN8n';

type JsonBody = IDataObject | IDataObject[] | string | number | boolean | null;

type LiveFetchOptions = {
	basicAuthPassword?: string;
	basicAuthUser?: string;
	body?: JsonBody;
	cookies?: CookieJar;
	headers?: Record<string, string>;
	method?: string;
};

type OperationExport = {
	description?: unknown[];
	execute: (this: unknown, itemIndex: number) => Promise<unknown>;
};

type LiveCredentials = {
	accessToken: string;
	allowUnauthorizedCerts: boolean;
	apiMode?: 'stable' | 'next';
	enableDebug: boolean;
	host: string;
	isHttp: boolean;
};

export class CookieJar {
	private readonly cookies = new Map<string, string>();

	absorb(response: Response) {
		const headerValue = response.headers.get('set-cookie');
		if (!headerValue) {
			return;
		}

		for (const entry of headerValue.split(/,(?=[^;]+=[^;]+)/)) {
			const cookie = entry.split(';', 1)[0].trim();
			const [name, value] = cookie.split('=');

			if (name && value !== undefined) {
				this.cookies.set(name, value);
			}
		}
	}

	header() {
		return Array.from(this.cookies.entries())
			.map(([name, value]) => `${name}=${value}`)
			.join('; ');
	}
}

export function getRequiredEnv(name: string) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export function parseJsonResponse(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return { raw: text };
	}
}

function appendQueryString(baseUrl: string, query: unknown) {
	const url = new URL(baseUrl);

	if (!query || typeof query !== 'object') {
		return url.toString();
	}

	for (const [key, rawValue] of Object.entries(query as IDataObject)) {
		if (rawValue === undefined || rawValue === null || rawValue === '') {
			continue;
		}

		if (Array.isArray(rawValue)) {
			for (const value of rawValue) {
				url.searchParams.append(key, String(value));
			}
			continue;
		}

		url.searchParams.set(key, String(rawValue));
	}

	return url.toString();
}

export async function fetchJson(
	baseUrl: string,
	path: string,
	options: LiveFetchOptions = {},
): Promise<{ body: unknown; response: Response; text: string }> {
	const headers = new Headers(options.headers || {});

	if (options.basicAuthUser && options.basicAuthPassword) {
		headers.set(
			'Authorization',
			`Basic ${Buffer.from(`${options.basicAuthUser}:${options.basicAuthPassword}`).toString('base64')}`,
		);
	}

	if (options.cookies) {
		const cookieHeader = options.cookies.header();
		if (cookieHeader) {
			headers.set('Cookie', cookieHeader);
		}
	}

	let body: BodyInit | undefined;
	if (options.body !== undefined) {
		headers.set('Content-Type', 'application/json');
		body = JSON.stringify(options.body);
	}

	const response = await fetch(`${baseUrl}${path}`, {
		body,
		headers,
		method: options.method || 'GET',
	});
	options.cookies?.absorb(response);

	const text = await response.text();
	return {
		body: parseJsonResponse(text),
		response,
		text,
	};
}

export class N8nRestClient {
	private readonly cookieJar = new CookieJar();

	constructor(
		private readonly baseUrl: string,
		private readonly basicAuthUser: string,
		private readonly basicAuthPassword: string,
		private readonly ownerEmail: string,
		private readonly ownerPassword: string,
		private readonly ownerFirstName: string,
		private readonly ownerLastName: string,
	) {}

	async request(path: string, options: LiveFetchOptions = {}) {
		return await fetchJson(this.baseUrl, path, {
			...options,
			basicAuthPassword: this.basicAuthPassword,
			basicAuthUser: this.basicAuthUser,
			cookies: this.cookieJar,
		});
	}

	async ensureOwnerSession() {
		const setupResponse = await this.request('/rest/owner/setup', {
			body: {
				email: this.ownerEmail,
				firstName: this.ownerFirstName,
				lastName: this.ownerLastName,
				password: this.ownerPassword,
			},
			method: 'POST',
		});

		if (setupResponse.response.ok) {
			return setupResponse.body;
		}

		const loginResponse = await this.request('/rest/login', {
			body: {
				emailOrLdapLoginId: this.ownerEmail,
				password: this.ownerPassword,
			},
			method: 'POST',
		});

		if (!loginResponse.response.ok) {
			throw new Error(
				`Unable to establish n8n owner session: ${loginResponse.response.status} ${loginResponse.text}`,
			);
		}

		return loginResponse.body;
	}

	async createCredential(name: string, data: IDataObject) {
		return await this.request('/rest/credentials', {
			body: {
				data,
				name,
				type: 'dfirIrisApi',
			},
			method: 'POST',
		});
	}

	async getCredential(id: string | number) {
		return await this.request(`/rest/credentials/${id}?includeData=true`);
	}

	async updateCredential(id: string | number, name: string, data: IDataObject) {
		return await this.request(`/rest/credentials/${id}`, {
			body: {
				data,
				name,
				type: 'dfirIrisApi',
			},
			method: 'PATCH',
		});
	}

	async testCredential(credentials: IDataObject) {
		const payload =
			credentials && typeof credentials === 'object' && 'data' in credentials
				? (credentials.data as IDataObject)
				: credentials;

		return await this.request('/rest/credentials/test', {
			body: {
				credentials: payload,
			},
			method: 'POST',
		});
	}

	async deleteCredential(id: string | number) {
		return await this.request(`/rest/credentials/${id}`, {
			method: 'DELETE',
		});
	}
}

export function createLiveExecuteContext(
	parameters: IDataObject,
	options: {
		credentials?: Partial<LiveCredentials>;
		inputItems?: INodeExecutionData[];
	} = {},
) {
	const defaultToken = process.env.DFIR_IRIS_TOKEN || process.env.DFIR_IRIS_NEXT_TOKEN;
	const defaultHost = process.env.DFIR_IRIS_HOST || process.env.DFIR_IRIS_NEXT_HOST;
	const defaultCredentials: LiveCredentials = {
		accessToken: defaultToken || getRequiredEnv('DFIR_IRIS_TOKEN'),
		allowUnauthorizedCerts: true,
		apiMode: process.env.DFIR_IRIS_API_MODE === 'next' ? 'next' : 'stable',
		enableDebug: false,
		host: defaultHost || getRequiredEnv('DFIR_IRIS_HOST'),
		isHttp:
			process.env.DFIR_IRIS_IS_HTTP === '1' ||
			(process.env.DFIR_IRIS_IS_HTTP === undefined && process.env.DFIR_IRIS_NEXT_IS_HTTP === '1'),
	};
	const credentials = {
		...defaultCredentials,
		...options.credentials,
	};
	const { calls, context } = createMockExecuteContext(parameters, {
		inputItems: options.inputItems,
		responseFactory: async (request) => {
			const requestOptions = request.options;
			const headers = new Headers((requestOptions.headers as Record<string, string>) || {});
			headers.set('Authorization', `Bearer ${credentials.accessToken}`);

			let body = requestOptions.body as BodyInit | null | undefined;
			if (
				body !== undefined &&
				body !== null &&
				!(body instanceof FormData) &&
				!(body instanceof Blob) &&
				!(body instanceof ArrayBuffer) &&
				!(body instanceof Uint8Array) &&
				!Buffer.isBuffer(body) &&
				typeof body === 'object'
			) {
				body = JSON.stringify(body);
			}

			if (requestOptions.body instanceof FormData) {
				headers.delete('content-type');
			}

			const restoreTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
			const shouldSkipTlsValidation =
				requestOptions.rejectUnauthorized === false &&
				typeof requestOptions.url === 'string' &&
				requestOptions.url.startsWith('https://');

			if (shouldSkipTlsValidation) {
				process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
			}

			let response: Response;
			try {
				response = await fetch(
					appendQueryString(requestOptions.url as string, requestOptions.qs),
					{
						body,
						headers,
						method: requestOptions.method as string,
					},
				);
			} finally {
				if (shouldSkipTlsValidation) {
					if (restoreTlsSetting === undefined) {
						delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
					} else {
						process.env.NODE_TLS_REJECT_UNAUTHORIZED = restoreTlsSetting;
					}
				}
			}

			if (requestOptions.returnFullResponse) {
				return {
					body: await response.arrayBuffer(),
					headers: Object.fromEntries(response.headers.entries()),
					statusCode: response.status,
				};
			}

			const contentType = response.headers.get('content-type') || '';
			const payload = (() => {
				if (contentType.includes('application/json')) {
					return response.text().then((text) => (text ? parseJsonResponse(text) : {}));
				}

				return response.text().then((text) => ({ data: text } as IDataObject));
			})();
			const resolvedPayload = await payload;

			if (!response.ok) {
				throw resolvedPayload;
			}

			return resolvedPayload;
		},
	});

	context.getCredentials = async () => credentials;

	return { calls, context };
}

export function buildLiveParameters(
	operation: OperationExport,
	overrides: IDataObject = {},
): IDataObject {
	return buildParametersFromDescription(
		(operation.description || []) as never[],
		overrides,
	);
}

export function createBinaryInputItem(fileName = 'qa.txt', content = 'qa binary payload') {
	return [
		{
			binary: {
				data: createBinaryData({
					data: Buffer.from(content).toString('base64'),
					fileName,
					fileSize: Buffer.byteLength(content).toString(),
					mimeType: 'text/plain',
				}),
			},
			json: {},
		},
	] as INodeExecutionData[];
}

export function extractId(value: unknown, candidates: string[]): number | string | undefined {
	if (!value || typeof value !== 'object') {
		return undefined;
	}

	const object = value as Record<string, unknown>;

	for (const candidate of candidates) {
		if (candidate in object && (typeof object[candidate] === 'number' || typeof object[candidate] === 'string')) {
			return object[candidate] as number | string;
		}
	}

	if ('data' in object) {
		return extractId(object.data, candidates);
	}

	return undefined;
}
