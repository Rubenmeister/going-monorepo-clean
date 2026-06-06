/* eslint-disable */
export default {
  displayName: 'frontend-stores',
  // libs/frontend/stores → raíz son 3 niveles (no 2).
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Este lib aún no tiene specs; no fallar el job por ello.
  passWithNoTests: true,
  coverageDirectory: '../../../coverage/libs/frontend/stores',
};
