const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Forces Kotlin 1.9.25 in the root build.gradle.
 * Required because Compose Compiler 1.5.15 (used by expo-modules-core)
 * needs Kotlin >= 1.9.25 but Expo SDK 52 / RN 0.76 defaults to 1.9.24.
 *
 * In RN 0.76 the kotlin-gradle-plugin classpath entry has NO version
 * (it comes from the React Native BOM at 1.9.24), so patching ext.kotlinVersion
 * alone has no effect. We override the classpath entry directly.
 */
module.exports = function withKotlinVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // 1. Update ext.kotlinVersion (belt-and-suspenders)
    contents = contents.replace(
      /kotlinVersion\s*=\s*["']1\.9\.24["']/g,
      'kotlinVersion = "1.9.25"'
    );

    // 2. If the classpath entry has NO version (BOM-managed), add 1.9.25 explicitly
    contents = contents.replace(
      /classpath\(["']org\.jetbrains\.kotlin:kotlin-gradle-plugin["']\)/g,
      'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")'
    );

    // 3. If the classpath entry already has ANY version, replace with 1.9.25
    contents = contents.replace(
      /classpath\(["']org\.jetbrains\.kotlin:kotlin-gradle-plugin:\d+\.\d+\.\d+["']\)/g,
      'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")'
    );

    config.modResults.contents = contents;
    return config;
  });
};
