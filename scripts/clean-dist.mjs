import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';

const target = 'dist';

if (!existsSync(target)) {
	process.exit(0);
}

function removeRecursively(path) {
	const stat = lstatSync(path);

	if (stat.isDirectory()) {
		for (const entry of readdirSync(path)) {
			removeRecursively(`${path}/${entry}`);
		}
		rmdirSync(path);
		return;
	}

	unlinkSync(path);
}

try {
	removeRecursively(target);
} catch (error) {
	if (error && typeof error === 'object' && 'code' in error && error.code === 'EACCES') {
		console.error(
			[
				'Cannot remove "dist" because it is not writable.',
				'This usually happens after a Docker build created root-owned artifacts.',
				'Fix it with one of these options:',
				'  1. sudo chown -R "$(id -u):$(id -g)" dist artifacts node_modules',
				'  2. npm run build:container',
			].join('\n'),
		);
		process.exit(1);
	}

	throw error;
}
