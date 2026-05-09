/**
 * Sentry init para mobile-user-app (passenger).
 *
 * NO está activo hasta que se cumpla este checklist:
 *   1. Crear proyecto en Sentry (sentry.io) tipo "react-native" para "going-user-app"
 *   2. Copiar el DSN a .env / EAS secret como EXPO_PUBLIC_SENTRY_DSN
 *   3. `npx expo install @sentry/react-native`
 *   4. Ejecutar `npx sentry-wizard -i reactNative` (configura native code automáticamente)
 *   5. Importar este archivo desde App.tsx ANTES de cualquier otro código:
 *        import './src/services/sentry';
 *   6. Build EAS con sentry-cli upload de sourcemaps en eas.json post-build
 *
 * El mobile-agent (Cloud Run Job) lee la API de Sentry cada 6h y publica
 * crashes/regresiones al cerebro-service. No requiere config en este archivo.
 *
 * Si EXPO_PUBLIC_SENTRY_DSN no está, init() es un no-op — las apps siguen
 * corriendo sin Sentry. Patrón seguro para builds de dev/preview.
 */

// Comentado hasta que esté instalado el SDK. Para activar:
// 1. npm install @sentry/react-native
// 2. Descomentar el bloque de abajo + remover el placeholder

// import * as Sentry from '@sentry/react-native';
//
// const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
// if (dsn) {
//   Sentry.init({
//     dsn,
//     // Releases las identifica EAS automáticamente con app.version + buildNumber
//     release: `going-user-app@${process.env.EXPO_PUBLIC_APP_VERSION || 'dev'}`,
//     // Environment para separar staging vs production en el dashboard
//     environment: process.env.EXPO_PUBLIC_ENV || 'staging',
//     // Sample rate de TRACES (performance) — 0.1 = 10% para empezar
//     tracesSampleRate: 0.1,
//     // Sample rate de ERRORES — 1.0 = 100% (queremos todos)
//     sampleRate: 1.0,
//     // No enviar PII por defecto (numeros de teléfono en logs, etc.)
//     sendDefaultPii: false,
//     // Auto-capture de unhandled promise rejections + JS errors
//     enableAutoSessionTracking: true,
//   });
// }
//
// export default Sentry;

// Placeholder no-op para que App.tsx pueda importar este archivo sin
// errores antes de instalar el SDK. Borrar cuando esté instalado.
export default {
  captureException: (e: unknown) => console.warn('[sentry-stub] captureException:', e),
  captureMessage:   (m: string)   => console.warn('[sentry-stub] captureMessage:', m),
  setUser:          (_: unknown)   => {},
  setTag:           (_: string, __: string) => {},
};
