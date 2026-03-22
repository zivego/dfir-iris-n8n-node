import { describe, expect, it } from 'vitest';

import * as loadOptions from '../../nodes/DfirIris/v1/methods/loadOptions';
import {
	createMockLoadOptionsContext,
	summarizeRequest,
	type RecordedRequest,
} from '../support/mockN8n';

const loadOptionEntries = Object.entries(loadOptions).sort(([left], [right]) => left.localeCompare(right));

describe('load options contracts', () => {
	for (const [name, fn] of loadOptionEntries) {
		it(`covers ${name}`, async () => {
			const { calls, context } = createMockLoadOptionsContext({
				cid: 1,
				resource: 'case',
				type: 'case',
			});

			const output = await fn.call(context as never);

			expect({
				output,
				requests: calls.map(summarizeRequest),
			}).toMatchSnapshot();
		});
	}

	it('falls back to case/assets/filter when case/assets/list is empty', async () => {
		const responseFactory = async (request: RecordedRequest) => {
			const path = summarizeRequest(request).path;

			if (path === 'case/assets/list') {
				return { data: { assets: [] } };
			}

			if (path === 'case/assets/filter') {
				return {
					data: {
						assets: [
							{
								asset_id: 7,
								asset_name: 'QA Fallback Asset',
								asset_type: {
									asset_id: 1,
									asset_name: 'Account',
								},
							},
						],
					},
				};
			}

			throw new Error(`Unexpected path in test response factory: ${path}`);
		};

		const { calls, context } = createMockLoadOptionsContext(
			{
				cid: 1,
			},
			{ responseFactory },
		);

		const output = await loadOptions.getAssets.call(context as never);

		expect(output).toEqual([
			{
				name: 'QA Fallback Asset | Account',
				value: 7,
			},
		]);
		expect(calls.map(summarizeRequest)).toEqual([
			expect.objectContaining({ path: 'case/assets/list' }),
			expect.objectContaining({ path: 'case/assets/filter' }),
		]);
	});

	it('returns stable resource options by default', async () => {
		const { context } = createMockLoadOptionsContext({});

		const output = await loadOptions.getAvailableResources.call(context as never);

		expect(output.some((entry) => entry.value === 'alert')).toBe(true);
		expect(output.some((entry) => entry.value === 'task')).toBe(true);
	});

	it('filters operation options by next api mode', async () => {
		const { context } = createMockLoadOptionsContext(
			{
				resource: 'case',
			},
			{
				credentials: { apiMode: 'next' },
			},
		);

		const output = await loadOptions.getAvailableOperations.call(context as never);

		expect(output.map((entry) => entry.value)).toEqual([
			'create',
			'countCases',
			'deleteCase',
			'filterCases',
			'getSummary',
			'update',
			'updateSummary',
		]);
	});
});
