import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const credentialsDir = path.resolve('credentials');

function walk(dir) {
	const entries = readdirSync(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walk(fullPath));
			continue;
		}

		if (entry.isFile() && fullPath.endsWith('.ts')) {
			files.push(fullPath);
		}
	}

	return files;
}

function getProperty(objectLiteral, name) {
	for (const property of objectLiteral.properties) {
		if (!ts.isPropertyAssignment(property)) continue;

		const propertyName = ts.isIdentifier(property.name)
			? property.name.text
			: ts.isStringLiteral(property.name)
				? property.name.text
				: null;

		if (propertyName === name) {
			return property.initializer;
		}
	}

	return undefined;
}

function getStringLiteral(objectLiteral, name) {
	const value = getProperty(objectLiteral, name);
	return value && ts.isStringLiteral(value) ? value.text : undefined;
}

function hasPasswordFlag(objectLiteral) {
	const typeOptions = getProperty(objectLiteral, 'typeOptions');
	if (!typeOptions || !ts.isObjectLiteralExpression(typeOptions)) {
		return false;
	}

	const password = getProperty(typeOptions, 'password');
	return password?.kind === ts.SyntaxKind.TrueKeyword;
}

const errors = [];

for (const file of walk(credentialsDir)) {
	const sourceText = readFileSync(file, 'utf8');
	const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);

	function visit(node) {
		if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === 'properties') {
			const initializer = node.initializer;
			if (ts.isArrayLiteralExpression(initializer)) {
				for (const element of initializer.elements) {
					if (!ts.isObjectLiteralExpression(element)) continue;

					if (!hasPasswordFlag(element)) continue;

					const type = getStringLiteral(element, 'type');
					if (type === 'string') continue;

					const name = getStringLiteral(element, 'name') ?? '<unknown>';
					const position = sourceFile.getLineAndCharacterOfPosition(element.getStart(sourceFile));
					errors.push(
						`${path.relative(process.cwd(), file)}:${position.line + 1}:${position.character + 1} ` +
							`field "${name}" uses typeOptions.password but has type "${type ?? '<non-literal>'}"`,
					);
				}
			}
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
}

if (errors.length > 0) {
	console.error('Credential schema validation failed:');
	for (const error of errors) {
		console.error(`- ${error}`);
	}
	process.exit(1);
}

console.log('Credential schema validation passed.');
