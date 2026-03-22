import { describe, expect, it } from 'vitest';

import { router } from '../../nodes/DfirIris/v1/actions/router';
import { createMockExecuteContext } from '../support/mockN8n';

describe('router integration', () => {
	it('dispatches API Request operations through the resource router', async () => {
		const { context } = createMockExecuteContext({
			operation: 'send',
			requestPath: 'api/ping',
			resource: 'apiRequest',
		});

		const result = await router.call(context as never);

		expect(result).toEqual([[{ json: 'pong' }]]);
	});

	it('returns JSON errors when continueOnFail is enabled', async () => {
		const { context } = createMockExecuteContext(
			{
				operation: 'send',
				requestHeaders: '{invalid}',
				resource: 'apiRequest',
			},
			{
				continueOnFail: true,
			},
		);

		const result = await router.call(context as never);

		expect(result).toEqual([[{ json: { error: expect.stringMatching(/Headers must be valid JSON/) } }]]);
	});

	it('stores download errors on the input item for datastore downloads', async () => {
		const { context } = createMockExecuteContext(
			{
				binaryName: 'data',
				file_id: 1,
				operation: 'downloadFile',
				resource: 'datastoreFile',
			},
			{
				continueOnFail: true,
				responseFactory: async () => {
					throw { message: 'download failed' };
				},
			},
		);

		const result = await router.call(context as never);

		expect(result).toEqual([[{ json: { error: 'download failed' } }]]);
	});

	it('rejects stable-only operations when next api mode is selected', async () => {
		const { context } = createMockExecuteContext(
			{
				operation: 'filterAlerts',
				resource: 'alert',
			},
			{
				credentials: { apiMode: 'next' },
			},
		);

		await expect(router.call(context as never)).rejects.toThrow(/not available for api mode "next"/i);
	});
});
