import type { INodeProperties } from 'n8n-workflow';

import { describe, expect, it } from 'vitest';

import {
	buildParametersFromDescription,
	createMockExecuteContext,
	summarizeRequest,
} from '../support/mockN8n';

type OperationExport = {
	description?: INodeProperties[];
	execute: (this: unknown, itemIndex: number) => Promise<unknown>;
};

type ResourceModule = Record<string, unknown> & {
	resource: INodeProperties[];
};

const resourceModules = import.meta.glob('../../nodes/DfirIris/v1/actions/*/*.resource.ts', {
	eager: true,
}) as Record<string, ResourceModule>;

function createOverrides(resourceName: string, operationName: string) {
	const overrides: Record<string, unknown> = {};

	if (resourceName === 'alert' && operationName === 'batchDelete') {
		overrides.alert_ids = '1,2';
	}

	if (resourceName === 'alert' && operationName === 'batchUpdate') {
		overrides.alert_ids = '1,2';
	}

	if (resourceName === 'comment') {
		overrides.obj_id = 1;
		overrides.obj_name = 'case';
	}

	if (resourceName === 'module' && operationName === 'callModule') {
		overrides.moduleData = 'qa_hook;QA Hook;QA Module';
		overrides.targetsString = '1,2';
		overrides.type = 'case';
	}

	if (resourceName === 'module' && operationName === 'listHooks') {
		overrides.object_type = 'case';
	}

	if (resourceName === 'timeline' && operationName === 'queryTimeline') {
		overrides.queryUI = [];
	}

	return overrides;
}

function getOperationEntries() {
	return Object.entries(resourceModules)
		.flatMap(([modulePath, resourceModule]) => {
			const resourceName = modulePath.split('/').slice(-2, -1)[0];

			return Object.entries(resourceModule)
				.filter(([exportName, exportedValue]) => {
					return (
						exportName !== 'endpoint' &&
						exportName !== 'resource' &&
						typeof exportedValue === 'object' &&
						exportedValue !== null &&
						'execute' in (exportedValue as Record<string, unknown>)
					);
				})
				.map(([operationName, operationExport]) => ({
					modulePath,
					operation: operationExport as OperationExport,
					operationName,
					resourceName,
				}));
		})
		.sort((left, right) =>
			`${left.resourceName}/${left.operationName}`.localeCompare(
				`${right.resourceName}/${right.operationName}`,
			),
		);
}

describe('typed action contracts', () => {
	for (const entry of getOperationEntries()) {
		it(`covers ${entry.resourceName}/${entry.operationName}`, async () => {
			const parameters = buildParametersFromDescription(
				entry.operation.description,
				createOverrides(entry.resourceName, entry.operationName),
			);
			const { calls, context } = createMockExecuteContext(parameters);

			const output = await entry.operation.execute.call(context as never, 0);

			expect({
				output,
				requests: calls.map(summarizeRequest),
			}).toMatchSnapshot();
		});
	}

	it('maps alert batch update context JSON into updates.alert_context', async () => {
		const alertModule = resourceModules['../../nodes/DfirIris/v1/actions/alert/Alert.resource.ts'];
		const batchUpdate = alertModule.batchUpdate as OperationExport;
		const { calls, context } = createMockExecuteContext(
			buildParametersFromDescription(batchUpdate.description, {
				__alertContextJSON: '{"source":"qa"}',
				alert_ids: '1,2',
			}),
		);

		await batchUpdate.execute.call(context as never, 0);

		expect((calls[0].options.body as Record<string, Record<string, string>>).updates.alert_context).toEqual({
			source: 'qa',
		});
	});

	it('maps moduleData into hook_name, hook_ui_name, and module_name in the correct order', async () => {
		const moduleResource = resourceModules['../../nodes/DfirIris/v1/actions/module/Module.resource.ts'];
		const callModule = moduleResource.callModule as OperationExport;
		const { calls, context } = createMockExecuteContext(
			buildParametersFromDescription(callModule.description, {
				moduleData: 'qa_hook;QA Hook;QA Module',
				targetsString: '1, 2',
				type: 'case',
			}),
		);

		await callModule.execute.call(context as never, 0);

		expect(calls[0].options.body).toEqual({
			hook_name: 'qa_hook',
			hook_ui_name: 'QA Hook',
			module_name: 'QA Module',
			targets: [ '1', '2' ],
			type: 'case',
		});
	});

	it('rejects malformed moduleData values before making a request', async () => {
		const moduleResource = resourceModules['../../nodes/DfirIris/v1/actions/module/Module.resource.ts'];
		const callModule = moduleResource.callModule as OperationExport;
		const { calls, context } = createMockExecuteContext(
			buildParametersFromDescription(callModule.description, {
				moduleData: '{}',
				targetsString: '',
				type: 'case',
			}),
		);

		await expect(callModule.execute.call(context as never, 0)).rejects.toThrow(
			/module data must use the format/i,
		);
		expect(calls).toEqual([]);
	});

	it('falls back to case/assets/filter when asset/getAll receives an empty legacy list', async () => {
		const assetResource = resourceModules['../../nodes/DfirIris/v1/actions/asset/Asset.resource.ts'];
		const getAll = assetResource.getAll as OperationExport;
		const { calls, context } = createMockExecuteContext(
			buildParametersFromDescription(getAll.description),
			{
				responseFactory: async (request) => {
					const path = summarizeRequest(request).path;

					if (path === 'case/assets/list') {
						return { data: { assets: [] } };
					}

					if (path === 'case/assets/filter') {
						return {
							data: {
								assets: [
									{
										asset_id: 42,
										asset_name: 'QA Filter Asset',
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
				},
			},
		);

		const output = await getAll.execute.call(context as never, 0);

		expect(output).toEqual([
			{
				json: {
					asset_id: 42,
					asset_name: 'QA Filter Asset',
					asset_type: {
						asset_id: 1,
						asset_name: 'Account',
					},
				},
			},
		]);
		expect(calls.map(summarizeRequest)).toEqual([
			expect.objectContaining({ path: 'case/assets/list' }),
			expect.objectContaining({ path: 'case/assets/filter' }),
		]);
	});
});
