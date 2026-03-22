import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodeProperties,
	INodePropertyOptions,
	IWebhookFunctions,
} from 'n8n-workflow';

import compatibilityManifest from './compatibility.manifest.json';

export type ApiMode = 'stable' | 'next';
export type OperationCompatibility =
	| 'stable-only'
	| 'next-only'
	| 'both'
	| 'both-with-adapter';

type ResourceManifest = (typeof compatibilityManifest.resources)[number];
type OperationManifest = ResourceManifest['operations'][number];
type ResourceName = ResourceManifest['name'];

type CompatibilityContext =
	| IExecuteFunctions
	| IHookFunctions
	| ILoadOptionsFunctions
	| IWebhookFunctions;

export const compatibilityDefaults = compatibilityManifest;

export function resolveApiMode(value: unknown): ApiMode {
	return value === 'next' ? 'next' : 'stable';
}

export async function getApiMode(
	this: CompatibilityContext,
	credentialType: string = 'dfirIrisApi',
): Promise<ApiMode> {
	try {
		const credentials = await this.getCredentials(credentialType);
		return resolveApiMode((credentials as IDataObject).apiMode);
	} catch {
		return resolveApiMode(compatibilityManifest.defaultApiMode);
	}
}

export function getAllResourceManifests(): ResourceManifest[] {
	return compatibilityManifest.resources as ResourceManifest[];
}

export function getResourceManifest(resourceName: string): ResourceManifest | undefined {
	return getAllResourceManifests().find((resource) => resource.name === resourceName);
}

export function getOperationManifest(
	resourceName: string,
	operationName: string,
): OperationManifest | undefined {
	return getResourceManifest(resourceName)?.operations.find(
		(operation) => operation.name === operationName,
	);
}

export function supportsApiMode(
	compatibility: OperationCompatibility,
	apiMode: ApiMode,
): boolean {
	if (compatibility === 'both' || compatibility === 'both-with-adapter') {
		return true;
	}

	if (compatibility === 'stable-only') {
		return apiMode === 'stable';
	}

	return apiMode === 'next';
}

export function isOperationSupported(
	resourceName: string,
	operationName: string,
	apiMode: ApiMode,
): boolean {
	const manifest = getOperationManifest(resourceName, operationName);
	return manifest ? supportsApiMode(manifest.compatibility as OperationCompatibility, apiMode) : false;
}

export function getAvailableResources(apiMode: ApiMode): INodePropertyOptions[] {
	return getAllResourceManifests()
		.filter((resource) =>
			resource.operations.some((operation) =>
				supportsApiMode(operation.compatibility as OperationCompatibility, apiMode),
			),
		)
		.map((resource) => ({
			name: resource.displayName,
			value: resource.name,
		}));
}

export function getAvailableOperations(
	resourceName: string,
	apiMode: ApiMode,
): INodePropertyOptions[] {
	const resource = getResourceManifest(resourceName);

	if (!resource) {
		return [];
	}

	return resource.operations
		.filter((operation) =>
			supportsApiMode(operation.compatibility as OperationCompatibility, apiMode),
		)
		.map((operation) => ({
			name: operation.displayName,
			value: operation.name,
		}));
}

export function buildResourceProperty(): INodeProperties {
	/* eslint-disable n8n-nodes-base/node-param-default-wrong-for-options, n8n-nodes-base/node-param-description-missing-from-dynamic-options, n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
	return {
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		typeOptions: {
			loadOptionsMethod: 'getAvailableResources',
		},
		options: [],
		default: 'apiRequest',
	};
	/* eslint-enable n8n-nodes-base/node-param-default-wrong-for-options, n8n-nodes-base/node-param-description-missing-from-dynamic-options, n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
}

export function buildOperationProperty(
	resourceName: ResourceName,
	defaultOperation: string,
): INodeProperties {
	/* eslint-disable n8n-nodes-base/node-param-default-wrong-for-options, n8n-nodes-base/node-param-description-missing-from-dynamic-options, n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		typeOptions: {
			loadOptionsDependsOn: ['resource'],
			loadOptionsMethod: 'getAvailableOperations',
		},
		displayOptions: {
			show: {
				resource: [resourceName],
			},
		},
		options: [],
		default: defaultOperation,
	};
	/* eslint-enable n8n-nodes-base/node-param-default-wrong-for-options, n8n-nodes-base/node-param-description-missing-from-dynamic-options, n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
}

export function getStableDocsUrl() {
	return compatibilityManifest.stableDocsUrl;
}

export function getNextDocsUrl() {
	return compatibilityManifest.nextDocsUrl;
}

export function normalizeNextPaginatedItems(data: unknown): IDataObject[] {
	if (!data || typeof data !== 'object' || !('data' in (data as IDataObject))) {
		return [];
	}

	const items = (data as IDataObject).data;
	return Array.isArray(items) ? (items as IDataObject[]) : [];
}

export function extractNextResponseData(response: unknown): IDataObject {
	if (
		response &&
		typeof response === 'object' &&
		'data' in (response as IDataObject) &&
		(response as IDataObject).data &&
		typeof (response as IDataObject).data === 'object' &&
		!Array.isArray((response as IDataObject).data)
	) {
		return (response as IDataObject).data as IDataObject;
	}

	return {};
}

export function buildNextCaseScopedEndpoint(
	caseIdentifier: number,
	resourcePath: 'assets' | 'iocs' | 'tasks',
	identifier?: number | string,
): string {
	const suffix = identifier === undefined ? '' : `/${identifier}`;
	return `api/v2/cases/${caseIdentifier}/${resourcePath}${suffix}`;
}
