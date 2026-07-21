/**
 * Configuración de pruebas de pricing-service.
 *
 * Este servicio NO tenía ninguna: su objetivo `test` solo llevaba
 * `passWithNoTests: true`, así que en CI pasaba en verde sin ejecutar nada — y
 * es el servicio que decide cuánto paga cada cliente. Sin esto, un archivo
 * `.spec.ts` ni siquiera se transpila (Babel lo lee como JavaScript plano y
 * revienta en la primera anotación de tipo).
 *
 * Mismo patrón que payment-service, para que no haya dos formas de correr
 * pruebas en el mismo monorepo.
 */
module.exports = {
  displayName: 'pricing-service',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/pricing-service',
};
