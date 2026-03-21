import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const matrixPath = path.join(repoRoot, 'docs', 'api-v2.0.4-coverage.json');
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

const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const nodeTypeSource = fs.readFileSync(nodeTypePath, 'utf8');
const versionDescriptionSource = fs.readFileSync(versionDescriptionPath, 'utf8');

if (matrix.apiVersion !== '2.0.4') {
	throw new Error(`Expected API coverage matrix for v2.0.4, got ${matrix.apiVersion}`);
}

if (!Array.isArray(matrix.endpoints) || matrix.endpoints.length === 0) {
	throw new Error('Coverage matrix must contain at least one endpoint entry');
}

const allowedStatuses = new Set(['typed', 'raw-only']);
const seen = new Set();

let typedCount = 0;
let rawOnlyCount = 0;

for (const endpoint of matrix.endpoints) {
	const { method, path: endpointPath, status, resource, operation } = endpoint;

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
		throw new Error(`Duplicate coverage entry detected: ${key}`);
	}
	seen.add(key);

	if (status === 'typed') {
		typedCount += 1;

		if (!resource || !operation) {
			throw new Error(`Typed coverage entry must specify resource and operation: ${key}`);
		}

		if (!versionDescriptionSource.includes(`value: '${resource}'`)) {
			throw new Error(`Typed coverage resource "${resource}" is not present in versionDescription.ts`);
		}

		if (!nodeTypeSource.includes(`'${operation}'`)) {
			throw new Error(`Typed coverage operation "${operation}" is not present in node.type.ts`);
		}
	} else {
		rawOnlyCount += 1;
	}
}

console.log(
	`API coverage matrix OK: ${matrix.endpoints.length} endpoints (${typedCount} typed, ${rawOnlyCount} raw-only)`,
);
