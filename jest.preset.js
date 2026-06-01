const nxPreset = require('@nx/jest/preset').default;
const fs = require('fs');
const path = require('path');

/**
 * uuid@13 (dependencia transitiva muy común en los servicios/libs) se publica
 * como ESM puro. Jest no lo parsea ("Unexpected token 'export'"), porque por
 * defecto no transforma node_modules. En vez de parchear cada jest.config,
 * mapeamos uuid a una build CommonJS (uuid@9, instalada en el árbol pnpm) de
 * forma portable, una sola vez, en el preset compartido.
 */
function resolveCjsUuid() {
  const pnpmDir = path.join(__dirname, 'node_modules', '.pnpm');
  try {
    const dirs = fs
      .readdirSync(pnpmDir)
      .filter((d) => /^uuid@9\./.test(d))
      .sort();
    for (const d of dirs) {
      const candidate = path.join(pnpmDir, d, 'node_modules', 'uuid', 'dist', 'index.js');
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch {
    /* noop */
  }
  return null;
}

const cjsUuid = resolveCjsUuid();

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    ...(nxPreset.moduleNameMapper || {}),
    ...(cjsUuid ? { '^uuid$': cjsUuid } : {}),
  },
};
