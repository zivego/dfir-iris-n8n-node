import { describe, expect, it } from 'vitest';

import { fetchJson, getRequiredEnv, N8nRestClient } from './support/liveHarness';

const runRegressionE2E = process.env.RUN_N8N_REGRESSION_E2E === '1';
const describeRegression = runRegressionE2E ? describe : describe.skip;

type InstanceTarget = {
	baseUrl: string;
	label: string;
};

function getTargets(): InstanceTarget[] {
	return [
		{
			baseUrl: getRequiredEnv('N8N_LATEST_BASE_URL'),
			label: 'latest',
		},
		{
			baseUrl: getRequiredEnv('N8N_BASELINE_BASE_URL'),
			label: 'baseline',
		},
	];
}

const regressionTargets = runRegressionE2E ? getTargets() : [];

async function waitUntilReady(baseUrl: string) {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		try {
			const response = await fetchJson(baseUrl, '/healthz', {
				basicAuthPassword: getRequiredEnv('N8N_BASIC_AUTH_PASSWORD'),
				basicAuthUser: getRequiredEnv('N8N_BASIC_AUTH_USER'),
			});

			if (response.response.status === 200 && response.text.includes('ok')) {
				return;
			}
		} catch {
			// service is still starting
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	throw new Error(`Timed out waiting for n8n at ${baseUrl}`);
}

function createClient(baseUrl: string) {
	return new N8nRestClient(
		baseUrl,
		getRequiredEnv('N8N_BASIC_AUTH_USER'),
		getRequiredEnv('N8N_BASIC_AUTH_PASSWORD'),
		process.env.N8N_OWNER_EMAIL || 'owner@example.com',
		process.env.N8N_OWNER_PASSWORD || 'OwnerPass123!',
		process.env.N8N_OWNER_FIRST_NAME || 'QA',
		process.env.N8N_OWNER_LAST_NAME || 'Owner',
	);
}

describeRegression('dual n8n regression lab', () => {
	for (const target of regressionTargets) {
		it(
			`keeps ${target.label} reachable behind basic auth`,
			async () => {
			await waitUntilReady(target.baseUrl);

			const response = await fetchJson(target.baseUrl, '/healthz', {
				basicAuthPassword: getRequiredEnv('N8N_BASIC_AUTH_PASSWORD'),
				basicAuthUser: getRequiredEnv('N8N_BASIC_AUTH_USER'),
			});

			expect(response.response.status).toBe(200);
			expect(response.text).toContain('ok');
			},
			70000,
		);

		it(
			`returns credential types for ${target.label} without crashing`,
			async () => {
			await waitUntilReady(target.baseUrl);
			const client = createClient(target.baseUrl);
			await client.ensureOwnerSession();

			const response = await client.request('/types/credentials.json');

			expect(response.response.status).toBe(200);
			expect(response.text).toContain('dfirIrisApi');
			},
			70000,
		);

		it(
			`returns node types for ${target.label} with the forked node identifier`,
			async () => {
			await waitUntilReady(target.baseUrl);
			const client = createClient(target.baseUrl);
			await client.ensureOwnerSession();

			const response = await client.request('/types/nodes.json');

			expect(response.response.status).toBe(200);
			expect(response.text).toContain('dfirIris');
			},
			70000,
		);
	}
});
