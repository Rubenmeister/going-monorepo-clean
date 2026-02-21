/* eslint-disable */
export default {
  displayName: 'shared-ui',
  preset: '../../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': [
      'babel-jest',
      { presets: ['@nx/react/babel'] },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
