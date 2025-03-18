import globals from 'globals';
import pluginJs from '@eslint/js';
import configPrettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

const willFullyUpdate = ['**/byfo-components/**', '**/byfo-themes/**', '**/tp-app/**'];

/** @type {import('eslint').Linter.Config[]} */
const config = [
  { ignores: ['**/dist/**/*', '**/node_modules/**/*', '**/functions/**/*', ...willFullyUpdate] },
  { files: ['**/*.{js,mjs,cjs}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  configPrettier,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['**/*.node.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
];

export default config;
