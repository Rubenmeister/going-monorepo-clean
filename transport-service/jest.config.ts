import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Lee los paths del tsconfig.base.json (aliases @going-monorepo-clean/*) y los
// convierte en moduleNameMapper para que jest resuelva los libs internos del
// monorepo igual que el build. Sin esto, specs que importan p.ej.
// '@going-monorepo-clean/domains-transport-core' fallan con "Cannot find module".
const baseTsconfig = JSON.parse(
  // strip de comentarios simples por si el tsconfig los tuviera
  readFileSync(join(__dirname, '..', 'tsconfig.base.json'), 'utf-8').replace(
    /\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm,
    '$1',
  ),
);
const paths = baseTsconfig.compilerOptions?.paths ?? {};

// uuid@13 (dependencia transitiva de los libs domains-*) se publica como ESM
// puro y jest no lo parsea ("Unexpected token 'export'"). Resolvemos una build
// CommonJS de uuid (v9, instalada en el árbol pnpm) de forma portable, sin
// hardcodear el hash de .pnpm. Si no se encuentra, dejamos que jest use la
// resolución normal (y el test fallaría con un mensaje claro).
function resolveCjsUuid(): string | null {
  const glob = join(__dirname, '..', 'node_modules', '.pnpm');
  try {
    const dirs = require('fs')
      .readdirSync(glob)
      .filter((d: string) => /^uuid@9\./.test(d));
    for (const d of dirs) {
      const candidate = join(glob, d, 'node_modules', 'uuid', 'dist', 'index.js');
      if (require('fs').existsSync(candidate)) return candidate;
    }
  } catch {
    /* noop */
  }
  return null;
}
const cjsUuid = resolveCjsUuid();

module.exports = {
  displayName: 'transport-service',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(paths, { prefix: '<rootDir>/../' }),
    // Alias 'pricing' (lib local) que algunos specs importan por nombre corto.
    '^pricing$': '<rootDir>/../libs/pricing/src/index.ts',
    // uuid → build CJS (ver resolveCjsUuid). Solo se mapea si se encontró.
    ...(cjsUuid ? { '^uuid$': cjsUuid } : {}),
  },
  coverageDirectory: '../coverage/transport-service',
};

export {};
