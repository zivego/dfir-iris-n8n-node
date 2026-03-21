import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { INodeProperties } from 'n8n-workflow';

import { describe, expect, it } from 'vitest';

type OperationExport = {
	description?: INodeProperties[];
};

type ResourceModule = Record<string, unknown>;

const resourceModules = import.meta.glob('../../nodes/DfirIris/v1/actions/*/*.resource.ts', {
	eager: true,
}) as Record<string, ResourceModule>;

const knownGlobalRoots = new Set(['additionalFields', 'cid', 'options']);

function collectPropertyNames(properties: INodeProperties[]): Set<string> {
	const names = new Set<string>();

	for (const property of properties) {
		if (property.name) {
			names.add(property.name);
		}

		if (property.options && Array.isArray(property.options)) {
			for (const option of property.options) {
				if (typeof option === 'object' && option !== null && 'name' in option) {
					names.add(option.name as string);
				}
			}
		}
	}

	return names;
}

describe('source parameter contracts', () => {
	for (const [modulePath, resourceModule] of Object.entries(resourceModules).sort(([left], [right]) =>
		left.localeCompare(right),
	)) {
		const resourceName = modulePath.split('/').slice(-2, -1)[0];

		for (const [operationName, operationExport] of Object.entries(resourceModule)
			.filter(([exportName, exportedValue]) => {
				return (
					exportName !== 'endpoint' &&
					exportName !== 'resource' &&
					typeof exportedValue === 'object' &&
					exportedValue !== null &&
					'description' in (exportedValue as Record<string, unknown>)
				);
			})
			.sort(([left], [right]) => left.localeCompare(right))) {
			it(`keeps getNodeParameter roots aligned for ${resourceName}/${operationName}`, () => {
				const operationPath = resolve(
					process.cwd(),
					'nodes/DfirIris/v1/actions',
					resourceName,
					`${operationName}.operation.ts`,
				);
				const source = readFileSync(operationPath, 'utf8');
				const matches = Array.from(source.matchAll(/getNodeParameter\('([^']+)'/g)).map((match) => match[1]);
				const describedNames = collectPropertyNames(
					((operationExport as OperationExport).description || []) as INodeProperties[],
				);
				const invalidRoots = matches.filter((name) => {
					const root = name.split('.')[0];
					return !describedNames.has(root) && !knownGlobalRoots.has(root);
				});

				expect(invalidRoots).toEqual([]);
			});
		}
	}
});
