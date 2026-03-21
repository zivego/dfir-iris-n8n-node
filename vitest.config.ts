import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		clearMocks: true,
		include: ['tests/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['credentials/**/*.ts', 'nodes/**/*.ts', 'scripts/**/*.mjs'],
			exclude: ['dist/**', 'lab/**', 'tests/**'],
		},
	},
});
