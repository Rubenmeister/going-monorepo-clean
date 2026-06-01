module.exports = {
  displayName: 'notifications-service',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Los tests de test/ son e2e/integration: requieren un servidor Socket.IO
  // real escuchando en localhost:3002, así que NO corren en el job unitario
  // (se ejecutan aparte con la infraestructura levantada).
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/'],
  coverageDirectory: '../coverage/notifications-service',
};
