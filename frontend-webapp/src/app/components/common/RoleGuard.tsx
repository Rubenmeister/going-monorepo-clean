'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@going-monorepo-clean/frontend-providers';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  /** Ruta a la que redirigir si no tiene el rol. Por defecto '/' */
  redirectTo?: string;
}

/**
 * Protege rutas de la webapp según el rol del usuario logueado.
 * - Si no está autenticado → redirige a /auth/login
 * - Si está autenticado pero sin el rol requerido → redirige a redirectTo (default: '/')
 */
export function RoleGuard({ allowedRoles, children, redirectTo = '/' }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(`/auth/login?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const hasRole = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasRole = allowedRoles.some((role) => user.roles.includes(role));
  if (!hasRole) return null;

  return <>{children}</>;
}
