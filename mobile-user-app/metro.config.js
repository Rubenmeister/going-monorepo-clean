const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// In EAS Build the monorepo root node_modules doesn't exist —
// restrict Metro to only look inside this app's own node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Only watch this app's directory (avoids scanning the full monorepo)
config.watchFolders = [projectRoot];

// Resolver alias de rutas (igual que en tsconfig.json)
// Usamos extraNodeModules para compatibilidad con paths como @utils/biometrics
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot, 'src'),
  '@screens': path.resolve(projectRoot, 'src/screens'),
  '@components': path.resolve(projectRoot, 'src/components'),
  '@services': path.resolve(projectRoot, 'src/services'),
  '@store': path.resolve(projectRoot, 'src/store'),
  '@navigation': path.resolve(projectRoot, 'src/navigation'),
  '@types': path.resolve(projectRoot, 'src/types'),
  '@utils': path.resolve(projectRoot, 'src/utils'),
};

module.exports = config;
