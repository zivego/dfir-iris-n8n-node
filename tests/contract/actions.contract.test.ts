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
		overrides.moduleData = '{}';
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
});
