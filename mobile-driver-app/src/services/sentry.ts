/**
 * Sentry init para mobile-driver-app (conductor).
 *
 * Ver mobile-user-app/src/services/sentry.ts para el checklist completo —
 * mismo flujo, distinto proyecto Sentry y distinto DSN.
 *
 * Diferencias para driver-app:
 *   - Crear proyecto separado en Sentry: "going-driver-app"
 *   - DSN propio en EXPO_PUBLIC_SENTRY_DSN (distinto al user-app)
 *   - Release tag: going-driver-app@<version>
 *   - mobile-agent las separa con SENTRY_USER_PROJECT vs SENTRY_DRIVER_PROJECT
 */

// import * as Sentry from '@sentry/react-native';
//
// const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
// if (dsn) {
//   Sentry.init({
//     dsn,
//     release: `going-driver-app@${process.env.EXPO_PUBLIC_APP_VERSION || 'dev'}`,
//     environment: process.env.EXPO_PUBLIC_ENV || 'staging',
//     tracesSampleRate: 0.1,
//     sampleRate: 1.0,
//     sendDefaultPii: false,
//     enableAutoSessionTracking: true,
//   });
// }
//
// export default Sentry;

export default {
  captureException: (e: unknown) => console.warn('[sentry-stub] captureException:', e),
  captureMessage:   (m: string)   => console.warn('[sentry-stub] captureMessage:', m),
  setUser:          (_: unknown)   => {},
  setTag:           (_: string, __: string) => {},
};
