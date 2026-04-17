const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Forces Kotlin 1.9.25 in the root build.gradle.
 * Required because Compose Compiler 1.5.15 (used by expo-modules-core)
 * needs Kotlin >= 1.9.25 but Expo SDK 52 defaults to 1.9.24.
 */
module.exports = function withKotlinVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /kotlinVersion\s*=\s*["']1\.9\.24["']/g,
      'kotlinVersion = "1.9.25"'
    );
    return config;
  });
};
