import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const tsConfigs = Array.isArray(tseslint.configs.recommended)
  ? tseslint.configs.recommended
  : [tseslint.configs.recommended];

export default defineConfig([
  js.configs.recommended,
  globalIgnores([
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    'apps/admin/next-env.d.ts',
  ]),
  ...tsConfigs.map((config) => ({
    ...config,
    files: ['services/api/src/**/*.ts'],
  })),
  {
    files: ['services/api/src/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        process: 'readonly',
      },
    },
  },
]);
