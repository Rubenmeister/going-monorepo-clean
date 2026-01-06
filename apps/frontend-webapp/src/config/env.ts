/**
 * Environment configuration for frontend-webapp
 * Provides type-safe access to environment variables
 */

// Vite environment type

interface EnvConfig {
  apiUrl: string;
  wsUrl: string;
  appEnv: 'development' | 'staging' | 'production';
  enableAnalytics: boolean;
  enableSentry: boolean;
  sentryDsn?: string;
}

function getEnv(): Record<string, string | undefined> {
  // During tests, import.meta.env is not available
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return (process.env as unknown) as Record<string, string | undefined>;
  }

  try {
    // Using eval to hide import.meta from Jest's non-ESM parser
    const env = eval('import.meta.env');
    return env || {};
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
