import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jquery,
      },
    },
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'error',
      curly: ['error', 'all'],
      'max-len': ['error', { code: 120 }],
    },
  },
  prettierConfig,
];
