const config = {
  displayName: 'frontend-webapp',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  coverageDirectory: '../../coverage/apps/frontend-webapp',
  testEnvironment: 'jsdom',
};

module.exports = config;
