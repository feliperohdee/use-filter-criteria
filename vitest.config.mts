import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			exclude: ['dist', 'eslint.config.mjs', 'vitest.config.mts', '**/*.spec.ts']
		}
	}
});
