import { describe, expect, it } from 'vitest';

import * as loadOptions from '../../nodes/DfirIris/v1/methods/loadOptions';
import { createMockLoadOptionsContext, summarizeRequest } from '../support/mockN8n';

const loadOptionEntries = Object.entries(loadOptions).sort(([left], [right]) => left.localeCompare(right));

describe('load options contracts', () => {
	for (const [name, fn] of loadOptionEntries) {
		it(`covers ${name}`, async () => {
			const { calls, context } = createMockLoadOptionsContext({
				cid: 1,
				type: 'case',
			});

			const output = await fn.call(context as never);

			expect({
				output,
				requests: calls.map(summarizeRequest),
			}).toMatchSnapshot();
		});
	}
});
