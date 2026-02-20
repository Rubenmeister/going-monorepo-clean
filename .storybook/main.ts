import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../libs/shared/ui/src/stories/Introduction.mdx',
    '../libs/shared/ui/src/stories/**/*.mdx',
    '../libs/shared/ui/src/stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // Path alias for shared-ui
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@going-monorepo-clean/shared-ui': path.resolve(
        __dirname,
        '../libs/shared/ui/src/index.ts'
      ),
    };
    return config;
  },
};

export default config;
