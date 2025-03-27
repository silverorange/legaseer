import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  eslintConfigPrettier,
  {
    rules: {
      'constructor-super': 'error',
      curly: 'error',
      'dot-notation': 'error',
      'guard-for-in': 'error',
      'new-parens': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-cond-assign': 'error',
      'no-debugger': 'error',
      'no-empty': 'error',
      'no-empty-function': 'error',
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-unsafe-finally': 'error',
      'no-unused-labels': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'prefer-const': 'error',
      radix: 'error',
      'use-isnan': 'error',
      'no-shadow': 'error',
      'no-unused-expressions': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['function', 'memberLike'],
          format: ['camelCase'],
        },
        {
          selector: ['property', 'variable'],
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        {
          // Allow any format in object literals (like this one)
          selector: ['objectLiteralProperty'],
          format: null,
        },
        {
          selector: ['parameter'],
          format: ['camelCase'],
          filter: {
            regex: '^_+$',
            match: false,
          },
        },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
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
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          overrides: {
            constructors: 'no-public',
          },
        },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/unified-signatures': 'error',
    },
  },
);
