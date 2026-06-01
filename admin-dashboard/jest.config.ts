// Config de jest para admin-dashboard.
//
// Mismo patrón que frontend-webapp: transform explícito con @swc/jest. El
// transform anterior (`@nx/react/plugins/jest` con regex negativa) no estaba
// disponible y dejaba los .tsx sin transformar. @swc/jest entiende TS/TSX/JSX
// de forma nativa; swcrc:false evita heredar el .swcrc del build (que excluye
// specs) y target es2022 evita "unknown variant es2023" en @swc/core.

module.exports = {
  displayName: 'admin-dashboard',
  preset: '../jest.preset.js',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      '@swc/jest',
      {
        swcrc: false,
        jsc: {
          parser: { syntax: 'typescript', tsx: true, decorators: true },
          transform: { react: { runtime: 'automatic' } },
          target: 'es2022',
        },
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
  },
  coverageDirectory: '../coverage/admin-dashboard',
};
