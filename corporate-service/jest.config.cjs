/* eslint-disable */
// Config para correr specs con jest directo (ts-jest), evitando el wrapper de
// nx test. Uso: npx jest --config corporate-service/jest.config.cjs
module.exports = {
  displayName: 'corporate-service',
  testEnvironment: 'node',
  rootDir: 'src',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
};
