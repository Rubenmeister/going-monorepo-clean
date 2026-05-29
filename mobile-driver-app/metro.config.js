const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

// NOTA: antes usabamos getSentryExpoConfig de @sentry/react-native/metro
// pero Sentry fue removido del bundle por bug de doble registro nativo.
// getDefaultConfig de Expo da el mismo metro config base. Re-introducir
// getSentryExpoConfig cuando reintegremos Sentry post-launch.

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

module.exports = config;