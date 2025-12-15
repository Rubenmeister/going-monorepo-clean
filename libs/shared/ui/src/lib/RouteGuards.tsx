'use client';

import React, { ReactNode } from 'react';
import { EmptyStateComingSoon } from './EmptyState';
import { useFeatureFlag, FeatureFlags } from './FeatureFlags';

interface RouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Feature Flag Route Guard
interface FeatureRouteGuardProps extends RouteGuardProps {
  flag: keyof FeatureFlags;
  featureName?: string;
}

export function FeatureRouteGuard({ 
  flag, 
  children, 
  fallback,
  featureName = 'Esta función'
}: FeatureRouteGuardProps) {
  const isEnabled = useFeatureFlag(flag);
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <EmptyStateComingSoon 
        title="Próximamente en Ecuador" 
        feature={featureName} 
      />
    </div>
  );
}

// Role-based Route Guard
type UserRole = 'customer' | 'provider' | 'driver' | 'enterprise_admin' | 'enterprise_user' | 'enterprise_viewer' | 'ops_admin' | 'super_admin';

interface RoleGuardProps extends RouteGuardProps {
  allowedRoles: UserRole[];
  userRole: UserRole | null;
  onUnauthorized?: () => void;
}

export function RoleGuard({ 
  allowedRoles, 
  userRole, 
  children, 
  fallback,
  onUnauthorized 
}: RoleGuardProps) {
  if (!userRole) {
    // Not logged in, redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
  
  const hasAccess = allowedRoles.includes(userRole);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (onUnauthorized) {
    onUnauthorized();
    return null;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md">
        <span className="text-4xl mb-4 block">🔒</span>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-500 mb-6">No tienes permisos para acceder a esta página.</p>
        <a 
          href="/" 
          className="inline-block px-6 py-2 bg-going-red text-white rounded-lg hover:bg-going-red-dark transition"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

// Auth Guard (simple login check)
interface AuthGuardProps extends RouteGuardProps {
  isAuthenticated: boolean;
  loginPath?: string;
}

export function AuthGuard({ 
  isAuthenticated, 
  children, 
  fallback,
  loginPath = '/login' 
}: AuthGuardProps) {
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = loginPath;
  }
  
  return null;
}

export default FeatureRouteGuard;
