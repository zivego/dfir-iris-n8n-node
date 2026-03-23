import { existsSync, readFileSync } from 'node:fs';

const checks = [
	{
		file: 'dist/credentials/DfirIrisApi.credentials.js',
		required: ['zivegoDfirIrisApi', 'DFIR IRIS API (Zivego)'],
	},
	{
		file: 'dist/nodes/DfirIris/DfirIris.node.js',
		required: ['zivegoDfirIris', 'DFIR IRIS (Zivego)'],
	},
	{
		file: 'dist/nodes/DfirIris/v1/actions/versionDescription.js',
		required: ['zivegoDfirIris', 'zivegoDfirIrisApi', 'DFIR IRIS (Zivego)'],
	},
];

const forbidden = ['name: \'dfirIris\'', 'name: "dfirIris"', 'name: \'dfirIrisApi\'', 'name: "dfirIrisApi"'];

for (const check of checks) {
	const { file, required } = check;
	if (!existsSync(file)) {
		throw new Error(`Missing built file: ${file}`);
	}

	const content = readFileSync(file, 'utf8');

	for (const token of required) {
		if (!content.includes(token)) {
			throw new Error(`Expected "${token}" in ${file}`);
		}
	}

	for (const token of forbidden) {
		if (content.includes(token)) {
			throw new Error(`Found legacy runtime identifier in ${file}: ${token}`);
		}
	}
}

console.log('Runtime identifiers validated.');
