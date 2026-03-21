/**
 * Project-level react-native.config.js
 *
 * Explicitly overrides the autolinking config for the `expo` package.
 *
 * Root cause: expo's own react-native.config.js fails silently when evaluated
 * via require-from-string in the EAS build environment (expo-modules-autolinking
 * 2.0.8). When that happens, loadConfigAsync returns null, the library config
 * spreads as undefined, and the autolinking falls back to detecting the Android
 * namespace from expo's build.gradle ("expo.core") — generating a non-existent
 * `import expo.core.ExpoModulesPackage` instead of `expo.modules.ExpoModulesPackage`.
 *
 * This override ensures the correct class path is always used regardless of
 * whether expo's own config file evaluates correctly.
 */
module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: {
          packageImportPath: 'import expo.modules.ExpoModulesPackage;',
          packageInstance: 'new ExpoModulesPackage()',
        },
      },
    },
  },
};
