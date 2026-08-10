import { defineConfig } from 'eslint/config';
import { config } from '@silverorange-inc/eslint-config-node';

export default defineConfig([
  config,
  {
    rules: {
      'no-console': 'off',
    },
  },
]);
