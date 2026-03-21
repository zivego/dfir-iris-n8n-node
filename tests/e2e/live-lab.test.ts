import { describe, expect, it } from 'vitest';

import { execute as apiRequestExecute } from '../../nodes/DfirIris/v1/actions/apiRequest/ApiRequest.resource';
import { createMockExecuteContext } from '../support/mockN8n';

const runLiveE2E = process.env.RUN_LIVE_E2E === '1';
const describeLive = runLiveE2E ? describe : describe.skip;

async function fetchJson(url: string, init: RequestInit = {}) {
	const response = await fetch(url, init);
	const text = await response.text();

	return {
		body: text,
		ok: response.ok,
		status: response.status,
	};
}

describeLive('live lab smoke tests', () => {
	it('keeps the live n8n instance reachable behind basic auth', async () => {
		const n8nBaseUrl = process.env.N8N_BASE_URL!;
		const auth = Buffer.from(
			`${process.env.N8N_BASIC_AUTH_USER}:${process.env.N8N_BASIC_AUTH_PASSWORD}`,
		).toString('base64');

		const response = await fetchJson(`${n8nBaseUrl}/healthz`, {
			headers: {
				Authorization: `Basic ${auth}`,
			},
		});

		expect(response.status).toBe(200);
		expect(response.ok).toBe(true);
	});

	it('can call DFIR IRIS /api/ping through the API Request resource', async () => {
		const { context } = createMockExecuteContext(
			{
				options: { isRaw: true },
				requestMethod: 'GET',
				requestPath: 'api/ping',
			},
			{
				responseFactory: async (request) => {
					const endpoint = request.options.url as string;
					const response = await fetch(endpoint, {
						headers: {
							Authorization: `Bearer ${process.env.DFIR_IRIS_TOKEN}`,
						},
						method: request.options.method as string,
					});

					return await response.json();
				},
			},
		);

		context.getCredentials = async () => ({
			accessToken: process.env.DFIR_IRIS_TOKEN!,
			allowUnauthorizedCerts: true,
			apiVersion: '2.0.4',
			enableDebug: false,
			host: process.env.DFIR_IRIS_HOST!,
			isHttp: process.env.DFIR_IRIS_IS_HTTP === '1',
		});

		const output = await apiRequestExecute.call(context as never, 0);

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
});
