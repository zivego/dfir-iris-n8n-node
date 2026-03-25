import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
	encoding: 'utf8',
});

if (result.status !== 0) {
	process.stderr.write(result.stderr || result.stdout);
	process.exit(result.status ?? 1);
}

const parsed = JSON.parse(result.stdout.trim());
const packInfo = Array.isArray(parsed) ? parsed[0] : parsed;
const files = Array.isArray(packInfo.files) ? packInfo.files.map((entry) => entry.path) : [];

const requiredFiles = [
	'package.json',
	'README.md',
	'LICENSE.md',
	'dist/package.json',
	'dist/credentials/DfirIrisApi.credentials.js',
	'dist/nodes/DfirIris/DfirIris.node.js',
];

const forbiddenPatterns = [
	/^lab\//,
	/^tests?\//,
	/^artifacts\//,
	/^node_modules\//,
	/\.map$/,
	/\.d\.ts$/,
	/tsconfig\.tsbuildinfo$/,
];

for (const file of requiredFiles) {
	if (!files.includes(file)) {
		throw new Error(`Package is missing required file: ${file}`);
	}
}

for (const file of files) {
	for (const pattern of forbiddenPatterns) {
		if (pattern.test(file)) {
			throw new Error(`Package contains forbidden file: ${file}`);
		}
	}
}

const distManifest = JSON.parse(readFileSync('dist/package.json', 'utf8'));
const forbiddenManifestFields = ['scripts', 'devDependencies', 'dependencies', 'optionalDependencies', 'packageManager', 'pnpm'];

for (const field of forbiddenManifestFields) {
	if (field in distManifest) {
		throw new Error(`dist/package.json should not contain ${field}`);
	}
}

console.log(`Package contents validated (${files.length} files).`);
