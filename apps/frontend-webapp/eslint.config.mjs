import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: ['.next/**/*', '.next/**', 'dev-dist/**/*', 'out/**/*', 'node_modules/**/*'],
  },
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
];

