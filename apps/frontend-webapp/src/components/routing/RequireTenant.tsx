import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { hasTenantAccess } from '@going/shared/permissions';

interface RequireTenantProps {
  children: React.ReactNode;
  tenantId: string;
  fallbackPath?: string;
}

/**
 * Route guard that requires user to have access to a specific tenant.
 * For enterprise multi-tenant access control.
 */
export function RequireTenant({ 
  children, 
  tenantId, 
  fallbackPath = '/unauthorized' 
}: RequireTenantProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has access to this tenant
  const userWithTenant = user ? { 
    ...user, 
    role: user.role as any,
    tenantId: (user as any).tenantId 
  } : null;
  
  if (!hasTenantAccess(userWithTenant, tenantId)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

export default RequireTenant;
