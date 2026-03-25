import { existsSync, lstatSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const removablePattern = /\.map$|\.d\.ts$|tsconfig\.tsbuildinfo$/;
const distPackageJsonPath = path.join(distDir, 'package.json');

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

if (existsSync(distPackageJsonPath)) {
	const manifest = JSON.parse(readFileSync(distPackageJsonPath, 'utf8'));
	const runtimeManifest = {
		name: manifest.name,
		version: manifest.version,
		description: manifest.description,
		license: manifest.license,
		homepage: manifest.homepage,
		keywords: manifest.keywords,
		author: manifest.author,
		repository: manifest.repository,
		bugs: manifest.bugs,
		engines: manifest.engines,
		n8n: manifest.n8n,
	};

	writeFileSync(distPackageJsonPath, `${JSON.stringify(runtimeManifest, null, 2)}\n`);
}
