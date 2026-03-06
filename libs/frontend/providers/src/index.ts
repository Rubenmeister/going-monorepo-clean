'use client';
// Auth Context (React Context + Provider + Hook)
export { AuthProvider, useAuth } from './lib/auth.context';
export type { AuthUser, AuthState } from './lib/auth.context';

// Hook principal de la app
export { useMonorepoApp } from './lib/use-monorepo-app.hook';

// HTTP Clients
export * from './lib/http-client';
