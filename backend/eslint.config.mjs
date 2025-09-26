import js from '@eslint/js';
import pluginTs from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';
import globals from 'globals';

const tsconfigRootDir = new URL('.', import.meta.url).pathname;

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2020,
    },
    plugins: {
      '@typescript-eslint': pluginTs,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginTs.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'no-constant-condition': 'off',
    },
  },
];
