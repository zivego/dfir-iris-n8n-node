import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { DfirIrisApi } from '../../credentials/DfirIrisApi.credentials';
import compatibilityManifest from '../../nodes/DfirIris/v1/compatibility/compatibility.manifest.json';
import { DfirIrisV1 } from '../../nodes/DfirIris/v1/DfirIrisV1.node';
import * as loadOptions from '../../nodes/DfirIris/v1/methods/loadOptions';
import { versionDescription } from '../../nodes/DfirIris/v1/actions/versionDescription';

const resourceModules = import.meta.glob('../../nodes/DfirIris/v1/actions/*/*.resource.ts', {
	eager: true,
}) as Record<string, { resource: Array<{ name: string; options?: Array<{ value: string }> }> }>;
const operationModules = import.meta.glob('../../nodes/DfirIris/v1/actions/**/*.operation.ts', {
	eager: true,
}) as Record<string, unknown>;

describe('schema and manifest contracts', () => {
	it('keeps credentials password masking only on string fields', () => {
		const credential = new DfirIrisApi();

		for (const property of credential.properties) {
			if (property.typeOptions?.password === true) {
				expect(property.type).toBe('string');
			}
		}
	});

	it('does not expose decorative apiVersion credential fields that runtime does not use', () => {
		const credential = new DfirIrisApi();

		expect(credential.properties.some((property) => property.name === 'apiVersion')).toBe(false);
	});

	it('exposes all load options through the node type', () => {
		const node = new DfirIrisV1({
			icon: 'file:icons/iris.svg',
			name: 'dfirIris',
		} as never);

		expect(Object.keys(node.methods.loadOptions).sort()).toEqual(Object.keys(loadOptions).sort());
	});

	it('keeps versionDescription resources aligned with resource modules', () => {
		const resourceProperty = versionDescription.properties.find((property) => property.name === 'resource');
		const versionResources = new Set(compatibilityManifest.resources.map((resource) => resource.name));
		const moduleResources = new Set(
			Object.keys(resourceModules).map((modulePath) => modulePath.split('/').slice(-2, -1)[0]),
		);

		expect(resourceProperty?.typeOptions?.loadOptionsMethod).toBe('getAvailableResources');
		expect(versionResources).toEqual(moduleResources);
	});

	it('keeps operation options aligned with exported handlers', () => {
		for (const [modulePath, resourceModule] of Object.entries(resourceModules)) {
			const resourceDirectory = modulePath.split('/').slice(-2, -1)[0];
			const resourceProperty = resourceModule.resource.find((property) => property.name === 'operation');
			const exportedOperationValues = new Set(
				compatibilityManifest.resources
					.find((resource) => resource.name === resourceDirectory)
					?.operations.map((operation) => operation.name) || [],
			);
			const siblingOperationModules = resourceDirectory === 'apiRequest'
				? ['send']
				: Object.keys(operationModules)
				.filter((operationPath) => operationPath.includes(`/actions/${resourceDirectory}/`))
				.map((operationPath) => operationPath.split('/').at(-1)!.replace('.operation.ts', ''));

			expect(resourceProperty?.typeOptions?.loadOptionsMethod).toBe('getAvailableOperations');
			expect(exportedOperationValues).toEqual(new Set(siblingOperationModules));
		}
	});

	it('adds apiMode to credentials and defaults to stable', () => {
		const credential = new DfirIrisApi();
		const apiModeProperty = credential.properties.find((property) => property.name === 'apiMode');

		expect(apiModeProperty).toMatchObject({
			default: 'stable',
			name: 'apiMode',
			type: 'options',
		});
	});

	it('keeps QA guard scripts executable', () => {
		expect(() =>
			execFileSync('node', ['scripts/check-credential-password-fields.mjs'], {
				cwd: process.cwd(),
				stdio: 'pipe',
			}),
		).not.toThrow();

		expect(() =>
			execFileSync('node', ['scripts/check-api-coverage.mjs'], {
				cwd: process.cwd(),
				stdio: 'pipe',
			}),
		).not.toThrow();
	});
});
