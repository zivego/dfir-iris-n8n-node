import { describe, expect, it } from 'vitest';

import { execute } from '../../nodes/DfirIris/v1/actions/apiRequest/ApiRequest.resource';
import { createMockExecuteContext, summarizeRequest } from '../support/mockN8n';

describe('API Request resource', () => {
	it('sends JSON requests and unwraps response data by default', async () => {
		const { calls, context } = createMockExecuteContext({
			options: { isRaw: false },
			requestBody: '{"qa":true}',
			requestHeaders: '{"x-trace-id":"trace-1"}',
			requestMethod: 'POST',
			requestPath: '/api/ping',
			requestQuery: '{"page":2}',
		});

		const output = await execute.call(context as never, 0);

		expect({
			output,
			requests: calls.map(summarizeRequest),
		}).toMatchSnapshot();
	});

	it('rejects invalid JSON input before sending the request', async () => {
		const { calls, context } = createMockExecuteContext({
			requestHeaders: '{invalid}',
		});

		await expect(execute.call(context as never, 0)).rejects.toThrow(/Headers must be valid JSON/);
		expect(calls).toHaveLength(0);
	});

	it('uploads binary data as multipart form-data', async () => {
		const { calls, context } = createMockExecuteContext({
			binaryFieldName: 'file_content',
			binaryPropertyName: 'data',
			multipartFields: '{"cid":1,"file_description":"QA file"}',
			requestMethod: 'POST',
			requestPath: 'datastore/file/add/1',
			sendBinary: true,
		});

		await execute.call(context as never, 0);

		expect(calls).toHaveLength(1);
		const formEntries = summarizeRequest(calls[0]).body as Array<{ key: string }>;
		expect(formEntries.some((entry) => entry.key === 'file_original_name')).toBe(true);
		expect(summarizeRequest(calls[0])).toMatchSnapshot();
	});

	it('downloads binary responses into a binary field', async () => {
		const { calls, context } = createMockExecuteContext({
			downloadResponse: true,
			outputBinaryField: 'downloaded',
			requestMethod: 'GET',
			requestPath: 'case/export',
		});

		const output = await execute.call(context as never, 0);

		expect({
			output,
			requests: calls.map(summarizeRequest),
		}).toMatchSnapshot();
	});
});
