import { describe, expect, it } from 'vitest';

import {
	apiRequest,
	apiRequestAll,
	apiRequestAllNext,
	getCredentialApiMode,
} from '../../nodes/DfirIris/v1/transport';
import { createMockExecuteContext, summarizeRequest } from '../support/mockN8n';

describe('transport layer', () => {
	it('builds authenticated JSON requests and strips empty bodies', async () => {
		const { calls, context } = createMockExecuteContext({});

		await apiRequest.call(context as never, 'GET', '/api/ping', {}, {});

		expect(calls).toHaveLength(1);
		expect(summarizeRequest(calls[0])).toEqual({
			body: undefined,
			credentialType: 'dfirIrisApi',
			headers: {
				'content-type': 'application/json',
			},
			json: true,
			method: 'GET',
			path: 'api/ping',
			qs: {},
			rejectUnauthorized: false,
			returnFullResponse: false,
			skipSslCertificateValidation: true,
		});
	});

	it('supports form-data uploads without forcing JSON headers', async () => {
		const form = new FormData();
		form.append('file_content', new Blob([Buffer.from('qa')], { type: 'text/plain' }), 'qa.txt');
		form.append('file_description', 'QA file');
		const { calls, context } = createMockExecuteContext({});

		await apiRequest.call(context as never, 'POST', 'datastore/file/add/1', form, { cid: 1 }, {}, true);

		expect(summarizeRequest(calls[0])).toEqual({
			body: [
				{
					fileName: 'qa.txt',
					key: 'file_content',
					size: 2,
					type: 'binary',
				},
				{
					key: 'file_description',
					type: 'string',
					value: 'QA file',
				},
			],
			credentialType: 'dfirIrisApi',
			headers: {},
			json: false,
			method: 'POST',
			path: 'datastore/file/add/1',
			qs: { cid: 1 },
			rejectUnauthorized: false,
			returnFullResponse: false,
			skipSslCertificateValidation: true,
		});
	});

	it('paginates apiRequestAll responses and truncates to max_items', async () => {
		const { calls, context } = createMockExecuteContext(
			{},
			{
				responseFactory: async (request) => {
					const page = Number(((request.options.qs || {}) as Record<string, number>).page || 1);

					return {
						data: {
							current_page: page,
							items: [
								{ id: page * 10 + 1 },
								{ id: page * 10 + 2 },
							],
							last_page: 2,
							next_page: page < 2 ? page + 1 : null,
							total: 4,
						},
					};
				},
			},
		);

		const response = await apiRequestAll.call(
			context as never,
			'GET',
			'qa/items',
			{},
			{},
			3,
			1,
			'items',
		);

		expect(calls).toHaveLength(2);
		expect((response.data as Record<string, unknown[]>).items).toEqual([
			{ id: 11 },
			{ id: 12 },
			{ id: 21 },
		]);
	});

	it('wraps HTTP errors as node API errors', async () => {
		const { context } = createMockExecuteContext(
			{},
			{
				responseFactory: async () => {
					throw { message: 'Boom' };
				},
			},
		);

		await expect(apiRequest.call(context as never, 'GET', 'api/ping', {})).rejects.toThrow(/Boom/);
	});

	it('resolves api mode from credentials', async () => {
		const { context } = createMockExecuteContext(
			{},
			{
				credentials: { apiMode: 'next' },
			},
		);

		await expect(getCredentialApiMode.call(context as never)).resolves.toBe('next');
	});

	it('paginates apiRequestAllNext responses and unwraps response_api_paginated data', async () => {
		const { calls, context } = createMockExecuteContext(
			{},
			{
				responseFactory: async (request) => {
					const page = Number(((request.options.qs || {}) as Record<string, number>).page || 1);

					return {
						data: {
							current_page: page,
							data: [
								{ id: page * 10 + 1 },
								{ id: page * 10 + 2 },
							],
							last_page: 2,
							total: 4,
						},
					};
				},
			},
		);

		const response = await apiRequestAllNext.call(
			context as never,
			'GET',
			'api/v2/cases/1/assets',
			{},
			{},
			3,
			1,
		);

		expect(calls).toHaveLength(2);
		expect((response.data as Record<string, unknown[]>).data).toEqual([
			{ id: 11 },
			{ id: 12 },
			{ id: 21 },
		]);
	});
});
