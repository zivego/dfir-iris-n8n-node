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
		const stat = lstatSync(fullPath);

		if (stat.isDirectory()) {
			walk(fullPath);
			continue;
		}

		if (removablePattern.test(fullPath)) {
			unlinkSync(fullPath);
		}
	}
}

walk(distDir);
