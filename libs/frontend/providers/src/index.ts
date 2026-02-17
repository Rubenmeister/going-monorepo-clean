// Auth Context (React Context + Provider + Hook)
export { AuthProvider, useAuth } from './lib/auth.context.tsx';
export type { AuthUser, AuthState } from './lib/auth.context.tsx';

// Hook principal de la app
export { useMonorepoApp } from './lib/use-monorepo-app.hook.ts';

// HTTP Clients
export * from './lib/http-client';
