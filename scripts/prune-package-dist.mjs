import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const pathsToRemove = [
	path.join(repoRoot, 'dist', 'coverage'),
	path.join(repoRoot, 'dist', 'lab'),
	path.join(repoRoot, 'dist', 'tsconfig.tsbuildinfo'),
];

for (const targetPath of pathsToRemove) {
	fs.rmSync(targetPath, { recursive: true, force: true });
}
