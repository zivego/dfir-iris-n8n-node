import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const nodeTypePath = path.join(
	repoRoot,
	'nodes',
	'DfirIris',
	'v1',
	'actions',
	'node.type.ts',
);
const versionDescriptionPath = path.join(
	repoRoot,
	'nodes',
	'DfirIris',
	'v1',
	'actions',
	'versionDescription.ts',
);
const compatibilityManifestPath = path.join(
	repoRoot,
	'nodes',
	'DfirIris',
	'v1',
	'compatibility',
	'compatibility.manifest.json',
);

const nodeTypeSource = fs.readFileSync(nodeTypePath, 'utf8');
const compatibilityManifest = JSON.parse(fs.readFileSync(compatibilityManifestPath, 'utf8'));
const manifestResources = new Set(compatibilityManifest.resources.map((resource) => resource.name));
const manifestOperationMap = new Map(
	compatibilityManifest.resources.flatMap((resource) =>
		resource.operations.map((operation) => [
			`${resource.name}.${operation.name}`,
			operation.compatibility,
		]),
	),
);
const matrices = [
	{
		apiVersion: '2.0.4',
		filePath: path.join(repoRoot, 'docs', 'api-v2.0.4-coverage.json'),
	},
	{
		apiVersion: '2.1.x',
		filePath: path.join(repoRoot, 'docs', 'api-v2.1.x-coverage.json'),
	},
];
const versionDescriptionSource = fs.readFileSync(versionDescriptionPath, 'utf8');

const allowedStatuses = new Set(['typed', 'raw-only']);

function getCompatibilityRules(apiVersion) {
	return apiVersion === '2.0.4'
		? new Set(['stable-only', 'both', 'both-with-adapter'])
		: new Set(['next-only', 'both', 'both-with-adapter']);
}

for (const { apiVersion: expectedApiVersion, filePath } of matrices) {
	const matrix = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	if (matrix.apiVersion !== expectedApiVersion) {
		throw new Error(`Expected API coverage matrix for ${expectedApiVersion}, got ${matrix.apiVersion}`);
	}

	if (!Array.isArray(matrix.endpoints) || matrix.endpoints.length === 0) {
		throw new Error(`Coverage matrix ${path.basename(filePath)} must contain at least one endpoint entry`);
	}

	const seen = new Set();
	let typedCount = 0;
	let rawOnlyCount = 0;
	const allowedCompatibilities = getCompatibilityRules(expectedApiVersion);

	for (const endpoint of matrix.endpoints) {
		const {
			method,
			path: endpointPath,
			status,
			resource,
			operation,
			operations,
		} = endpoint;

		if (!method || !endpointPath || !status) {
			throw new Error(`Coverage entry is missing required fields: ${JSON.stringify(endpoint)}`);
		}

		if (endpointPath.startsWith('/')) {
			throw new Error(`Coverage entry path must not start with "/": ${method} ${endpointPath}`);
		}

		if (!allowedStatuses.has(status)) {
			throw new Error(
				`Coverage entry ${method} ${endpointPath} has unsupported status "${status}". ` +
					'Only "typed" and "raw-only" are allowed in release builds.',
			);
		}

		const key = `${method} ${endpointPath}`;
		if (seen.has(key)) {
			throw new Error(`Duplicate coverage entry detected in ${path.basename(filePath)}: ${key}`);
		}
		seen.add(key);

		if (status === 'typed') {
			typedCount += 1;

			const operationNames = Array.isArray(operations)
				? operations
				: operation
					? [operation]
					: [];

			if (!resource || operationNames.length === 0) {
				throw new Error(`Typed coverage entry must specify resource and operation(s): ${key}`);
			}

			if (!manifestResources.has(resource)) {
				throw new Error(`Typed coverage resource "${resource}" is not present in compatibility manifest`);
			}

			for (const operationName of operationNames) {
				if (!nodeTypeSource.includes(`'${operationName}'`)) {
					throw new Error(`Typed coverage operation "${operationName}" is not present in node.type.ts`);
				}

				const compatibility = manifestOperationMap.get(`${resource}.${operationName}`);
				if (!compatibility) {
					throw new Error(`Typed coverage operation "${resource}.${operationName}" is missing from compatibility manifest`);
				}

				if (!allowedCompatibilities.has(compatibility)) {
					throw new Error(
						`Typed coverage entry ${resource}.${operationName} is incompatible with API ${expectedApiVersion}: ${compatibility}`,
					);
				}
			}
		} else {
			rawOnlyCount += 1;
		}
	}

	if (!versionDescriptionSource.includes('buildResourceProperty()')) {
		throw new Error('versionDescription.ts must keep the dynamic resource loadOptions contract');
	}

	console.log(
		`API coverage matrix OK (${path.basename(filePath)}): ${matrix.endpoints.length} endpoints (${typedCount} typed, ${rawOnlyCount} raw-only)`,
	);
}
