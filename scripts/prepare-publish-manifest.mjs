import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const manifestPath = 'package.json';
const backupDir = '.publish-tmp';
const backupPath = path.join(backupDir, 'package.json.original');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

if (!existsSync(backupDir)) {
	mkdirSync(backupDir, { recursive: true });
}

writeFileSync(backupPath, `${JSON.stringify(manifest, null, 2)}\n`);

const publishManifest = {
	name: manifest.name,
	version: manifest.version,
	description: manifest.description,
	license: manifest.license,
	homepage: manifest.homepage,
	keywords: manifest.keywords,
	author: manifest.author,
	repository: manifest.repository,
	bugs: manifest.bugs,
	publishConfig: manifest.publishConfig,
	engines: manifest.engines,
	scripts: {
		postpack: 'node scripts/restore-publish-manifest.mjs',
	},
	files: manifest.files,
	n8n: manifest.n8n,
};

writeFileSync(manifestPath, `${JSON.stringify(publishManifest, null, 2)}\n`);
