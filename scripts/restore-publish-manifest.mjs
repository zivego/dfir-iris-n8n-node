import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const manifestPath = 'package.json';
const backupDir = '.publish-tmp';
const backupPath = path.join(backupDir, 'package.json.original');

if (!existsSync(backupPath)) {
	throw new Error('Missing publish manifest backup. Refusing to leave package.json in a sanitized publish state.');
}

const originalManifest = readFileSync(backupPath, 'utf8');
writeFileSync(manifestPath, originalManifest);
rmSync(backupDir, { recursive: true, force: true });
