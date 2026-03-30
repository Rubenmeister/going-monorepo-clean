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

module.exports = config;
