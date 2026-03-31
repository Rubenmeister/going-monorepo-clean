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

// Resolver alias de rutas usando resolveRequest para soporte de sub-paths (@utils/biometrics, etc.)
const aliases = {
  '@': path.resolve(projectRoot, 'src'),
  '@screens': path.resolve(projectRoot, 'src/screens'),
  '@components': path.resolve(projectRoot, 'src/components'),
  '@services': path.resolve(projectRoot, 'src/services'),
  '@store': path.resolve(projectRoot, 'src/store'),
  '@navigation': path.resolve(projectRoot, 'src/navigation'),
  '@types': path.resolve(projectRoot, 'src/types'),
  '@utils': path.resolve(projectRoot, 'src/utils'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [alias, aliasPath] of Object.entries(aliases)) {
    if (moduleName === alias || moduleName.startsWith(alias + '/')) {
      const resolvedPath = aliasPath + moduleName.slice(alias.length);
      return context.resolveRequest(context, resolvedPath, platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
