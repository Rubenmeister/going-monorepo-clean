const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Resolver alias de rutas (igual que en tsconfig.json)
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@store': path.resolve(__dirname, 'src/store'),
  '@navigation': path.resolve(__dirname, 'src/navigation'),
  '@types': path.resolve(__dirname, 'src/types'),
};

module.exports = config;
