module.exports = {
  displayName: 'shared-observability',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    // isolatedModules: no requiere un tsconfig del proyecto (este lib no tiene
    // tsconfig.spec.json y aún no tiene specs).
    '^.+\\.[tj]s$': ['ts-jest', { isolatedModules: true }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Aún sin specs; no fallar el job por ello.
  passWithNoTests: true,
  coverageDirectory: '../../../coverage/libs/shared/observability',
};
