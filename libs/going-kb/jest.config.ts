module.exports = {
  displayName: 'going-kb',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Aún sin specs; no fallar el job por ello.
  passWithNoTests: true,
  coverageDirectory: '../../coverage/libs/going-kb',
};

export {};
