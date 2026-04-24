'use client';
export { AuthProvider, useAuth, useAuthStore } from './auth.context';
export type { AuthUser, AuthState } from './auth.context';
// Local implementation (webpack alias @going-monorepo-clean/frontend-providers
// resuelve a este mismo folder — importar desde el alias causa circularidad).
export { useMonorepoApp } from './use-monorepo-app.hook';
export { ApiError, ApiErrorCode } from './api-error';
export type { ApiErrorContext } from './api-error';
