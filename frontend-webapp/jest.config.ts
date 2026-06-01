// Config de jest para frontend-webapp.
//
// Histórico: antes envolvía la config con `next/jest` (createJestConfig) y
// heredaba el `transform` del preset de Nx. Esa combinación dejaba que los
// `.tsx` cayeran en babel-jest sin el preset de JSX → los specs en TSX
// fallaban con "experimental syntax 'jsx' isn't currently enabled".
//
// Solución: transform explícito con @swc/jest (entiende TS/TSX/JSX de forma
// nativa, sin depender de Babel ni del wrapper de Next) y mock de CSS para que
// `import './global.css'` no rompa el render de componentes.

module.exports = {
  displayName: 'frontend-webapp',
  preset: '../jest.preset.js',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      '@swc/jest',
      {
        // El `.swcrc` del proyecto (usado por el BUILD) excluye los specs
        // ("exclude": [".*\\.spec.tsx?$", ...]). @swc/jest lo hereda y entonces
        // "ignora" el propio archivo de test. swcrc:false evita leer ese
        // archivo y usa SOLO esta config inline.
        swcrc: false,
        jsc: {
          parser: { syntax: 'typescript', tsx: true, decorators: true },
          transform: { react: { runtime: 'automatic' } },
          // Target explícito: si se deja inferir desde tsconfig (es2023),
          // versiones de @swc/core que no lo conocen fallan con
          // "unknown variant `es2023`". es2022 es ampliamente soportado.
          target: 'es2022',
        },
      },
    ],
  },
  moduleNameMapper: {
    // CSS/estilos → objeto vacío (identity-obj-proxy) para no romper imports.
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
  },
  coverageDirectory: '../coverage/frontend-webapp',
};
