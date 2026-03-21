import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8')) as {
	version: string;
};

function read(path: string) {
	return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('release contract', () => {
	it('keeps release and lab docs aligned to the current package version', () => {
		const currentVersion = packageJson.version;
		const docsToCheck = [
			read('README.md'),
			read('docs/release-and-production.md'),
			read('docs/lab.md'),
			read('lab/.env.example'),
			read('lab/manual-stack.env.example'),
			read('lab/manual-stack.compose.yaml'),
		];

		for (const document of docsToCheck) {
			expect(document).not.toContain('2.0.2');
		}

		expect(read('README.md')).toContain(`@zivego/n8n-nodes-dfir-iris@${currentVersion}`);
		expect(read('lab/.env.example')).toContain(`zivego-n8n-nodes-dfir-iris-${currentVersion}.tgz`);
		expect(read('lab/manual-stack.env.example')).toContain(
			`zivego-n8n-nodes-dfir-iris-${currentVersion}.tgz`,
		);
		expect(read('lab/manual-stack.compose.yaml')).toContain(
			`zivego-n8n-nodes-dfir-iris-${currentVersion}.tgz`,
		);
	});

	it('documents a working release flow based on release:check and release scripts', () => {
		expect(packageJson.scripts['release:check']).toContain('pnpm publish --dry-run');
		expect(packageJson.scripts.release).toBe('pnpm run release:publish');
		expect(packageJson.scripts.prepublishOnly).toBe('pnpm run build');

		expect(read('README.md')).toContain('pnpm run release:check');
		expect(read('README.md')).toContain('pnpm run release');
		expect(read('docs/release-and-production.md')).toContain('pnpm run release:check');
		expect(read('docs/release-and-production.md')).toContain('pnpm run release');
	});
});
