import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function parsePackJson(output) {
	const lines = output.trim().split('\n');

	for (let index = lines.length - 1; index >= 0; index -= 1) {
		const candidate = lines.slice(index).join('\n').trim();
		if (!candidate.startsWith('[') && !candidate.startsWith('{')) {
			continue;
		}

		try {
			return JSON.parse(candidate);
		} catch {
			continue;
		}
	}

	throw new Error('Unable to parse npm pack JSON output');
}

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'dfir-iris-pack-'));
const result = spawnSync('npm', ['pack', '--json', '--pack-destination', tempDir], {
	encoding: 'utf8',
});

if (result.status !== 0) {
	process.stderr.write(result.stderr || result.stdout);
	rmSync(tempDir, { recursive: true, force: true });
	process.exit(result.status ?? 1);
}

const parsed = parsePackJson(result.stdout);
const packInfo = Array.isArray(parsed) ? parsed[0] : parsed;
const files = Array.isArray(packInfo.files) ? packInfo.files.map((entry) => entry.path) : [];
const tarballName = typeof packInfo.filename === 'string' ? packInfo.filename : null;

if (!tarballName) {
	rmSync(tempDir, { recursive: true, force: true });
	throw new Error('npm pack did not return a filename');
}

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
		rmSync(tempDir, { recursive: true, force: true });
		throw new Error(`Package is missing required file: ${file}`);
	}
}

for (const file of files) {
	for (const pattern of forbiddenPatterns) {
		if (pattern.test(file)) {
			rmSync(tempDir, { recursive: true, force: true });
			throw new Error(`Package contains forbidden file: ${file}`);
		}
	}
}

const unpackDir = path.join(tempDir, 'unpacked');
mkdirSync(unpackDir, { recursive: true });
const extractResult = spawnSync('tar', ['-xzf', path.join(tempDir, tarballName), '-C', unpackDir], {
	encoding: 'utf8',
});

if (extractResult.status !== 0) {
	process.stderr.write(extractResult.stderr || extractResult.stdout);
	rmSync(tempDir, { recursive: true, force: true });
	process.exit(extractResult.status ?? 1);
}

const rootManifest = JSON.parse(readFileSync(path.join(unpackDir, 'package', 'package.json'), 'utf8'));
const distManifest = JSON.parse(readFileSync(path.join(unpackDir, 'package', 'dist', 'package.json'), 'utf8'));
const forbiddenRootManifestFields = ['devDependencies', 'dependencies', 'optionalDependencies', 'packageManager', 'pnpm'];
const forbiddenDistManifestFields = ['scripts', 'devDependencies', 'dependencies', 'optionalDependencies', 'packageManager', 'pnpm'];

for (const field of forbiddenRootManifestFields) {
	if (field in rootManifest) {
		rmSync(tempDir, { recursive: true, force: true });
		throw new Error(`packaged package.json should not contain ${field}`);
	}
}

if ('scripts' in rootManifest) {
	const allowedScripts = { postpack: 'node scripts/restore-publish-manifest.mjs' };
	if (JSON.stringify(rootManifest.scripts) !== JSON.stringify(allowedScripts)) {
		rmSync(tempDir, { recursive: true, force: true });
		throw new Error('packaged package.json contains unexpected scripts');
	}
}

for (const field of forbiddenDistManifestFields) {
	if (field in distManifest) {
		rmSync(tempDir, { recursive: true, force: true });
		throw new Error(`dist/package.json should not contain ${field}`);
	}
}

rmSync(tempDir, { recursive: true, force: true });

console.log(`Package contents validated (${files.length} files).`);
