import { existsSync, lstatSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const removablePattern = /\.map$|\.d\.ts$|tsconfig\.tsbuildinfo$/;

function walk(dir) {
	if (!existsSync(dir)) {
		return;
	}

	for (const entry of readdirSync(dir)) {
		const fullPath = path.join(dir, entry);
		let stat;
		try {
			stat = lstatSync(fullPath);
		} catch (error) {
			if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
				continue;
			}

			throw error;
		}

		if (stat.isDirectory()) {
			walk(fullPath);
			continue;
		}

		if (removablePattern.test(fullPath)) {
			try {
				unlinkSync(fullPath);
			} catch (error) {
				if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
					continue;
				}

				throw error;
			}
		}
	}
}

walk(distDir);
