/* eslint-disable */
// Config para correr specs con jest directo (ts-jest), evitando el wrapper de
// nx test que inyecta babel y rompe la sintaxis TypeScript (mismo patrón que
// libs/pricing/jest.config.cjs). Uso: npx jest --config transport-service/jest.config.cjs
module.exports = {
  displayName: 'transport-service',
  testEnvironment: 'node',
  rootDir: 'src',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^pricing$': '<rootDir>/../../libs/pricing/src/index.ts',
  },
};
