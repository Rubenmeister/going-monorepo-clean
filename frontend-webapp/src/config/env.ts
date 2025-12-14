/**
 * Environment configuration for frontend-webapp
 * Provides type-safe access to environment variables
 */

// Vite environment type
declare const import_meta_env: Record<string, string | undefined>;

interface EnvConfig {
  apiUrl: string;
  wsUrl: string;
  appEnv: 'development' | 'staging' | 'production';
  enableAnalytics: boolean;
  enableSentry: boolean;
  sentryDsn?: string;
}

function getEnv(): Record<string, string | undefined> {
  // Access Vite's import.meta.env
  try {
    // @ts-ignore - Vite injects this at build time
    return import.meta.env || {};
  } catch {
    return {};
  }
}

const envVars = getEnv();

function getEnvVar(key: string, defaultValue = ''): string {
  return envVars[key] ?? defaultValue;
}

function getBoolEnv(key: string, defaultValue = false): boolean {
  const value = envVars[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

export const env: EnvConfig = {
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:3000'),
  wsUrl: getEnvVar('VITE_WS_URL', 'ws://localhost:3000'),
  appEnv: (getEnvVar('VITE_APP_ENV', 'development') as EnvConfig['appEnv']),
  enableAnalytics: getBoolEnv('VITE_ENABLE_ANALYTICS'),
  enableSentry: getBoolEnv('VITE_ENABLE_SENTRY'),
  sentryDsn: envVars['VITE_SENTRY_DSN'],
};

// Validate on startup in development
if (env.appEnv === 'development') {
  console.log('[Config] Environment loaded:', {
    apiUrl: env.apiUrl,
    appEnv: env.appEnv,
  });
}

export default env;
