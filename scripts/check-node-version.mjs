const requiredMajor = 20;

const [majorString] = process.versions.node.split('.');
const major = Number.parseInt(majorString, 10);

if (!Number.isInteger(major) || major < requiredMajor) {
	console.error(
		[
			`Unsupported Node.js version: ${process.versions.node}`,
			'This project requires Node.js 20 or newer for local build and release tasks.',
			'Use one of these options:',
			'  1. Upgrade your local Node.js runtime to 20+',
			'  2. Run npm run build:container',
			'  3. Run npm run pack:container',
		].join('\n'),
	);
	process.exit(1);
}

