// Evita doble registro nativo de @sentry/react-native:
// el plugin Expo (@sentry/react-native/expo registrado en app.json) ya lo
// linkea como Expo module, y React Native autolinking lo intentaba registrar
// otra vez como módulo RN nativo, lo que rompía el gradle build en
// :sentry_react-native:packageReleaseResources con conflict de output dir.
//
// Esto sólo es necesario en mobile-user-app porque tiene `android/` commiteado.
// mobile-driver-app no tiene android/, EAS regenera fresh con expo prebuild y
// no sufre el conflicto.
module.exports = {
  dependencies: {
    '@sentry/react-native': {
      platforms: {
        android: null,
      },
    },
  },
};
