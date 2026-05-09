/**
 * Config del mobile-agent — leído al arranque de cada Cloud Run Job.
 *
 * Sentry es el único proveedor soportado hoy. Si en el futuro queremos
 * agregar Bugsnag/Crashlytics, expandir este archivo con un selector.
 *
 * Vars opcionales (todas via env):
 *   - SENTRY_AUTH_TOKEN   — auth_token de Sentry (Settings → API → Tokens)
 *                            scopes mínimos: project:read, event:read
 *   - SENTRY_ORG          — slug de la org (ej: "going-app")
 *   - SENTRY_USER_PROJECT — slug del proyecto Sentry para mobile-user-app
 *   - SENTRY_DRIVER_PROJECT — slug del proyecto Sentry para mobile-driver-app
 *   - SENTRY_API_BASE     — default 'https://sentry.io/api/0' (override para self-hosted)
 *   - SENTRY_LOOKBACK_HOURS — ventana de análisis, default 6h (alineado con cron)
 */

export interface MobileAgentConfig {
  sentryToken:        string | null;
  sentryOrg:          string;
  sentryApiBase:      string;
  // Lista de "proyectos" Sentry a monitorear. Cada uno mapea a una app móvil
  // (user / driver). Estructura array para que sea trivial agregar uno más.
  apps: Array<{
    appId:        'mobile-user-app' | 'mobile-driver-app';
    sentrySlug:   string | null;
  }>;
  lookbackHours: number;
}

export function loadConfig(): MobileAgentConfig {
  return {
    sentryToken:    process.env.SENTRY_AUTH_TOKEN || null,
    sentryOrg:      process.env.SENTRY_ORG || 'going-app',
    sentryApiBase:  process.env.SENTRY_API_BASE || 'https://sentry.io/api/0',
    apps: [
      {
        appId:      'mobile-user-app',
        sentrySlug: process.env.SENTRY_USER_PROJECT || null,
      },
      {
        appId:      'mobile-driver-app',
        sentrySlug: process.env.SENTRY_DRIVER_PROJECT || null,
      },
    ],
    lookbackHours: parseInt(process.env.SENTRY_LOOKBACK_HOURS || '6', 10),
  };
}
