import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { Role, hasRole } from '@going/shared/permissions';

interface RequireRoleProps {
  children: React.ReactNode;
  roles: Role[];
  fallbackPath?: string;
}

/**
 * Route guard that requires user to have one of the specified roles.
 * Renders children if authorized, redirects to fallbackPath otherwise.
 */
export function RequireRole({ 
  children, 
  roles, 
  fallbackPath = '/unauthorized' 
}: RequireRoleProps) {
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

  // Check if user has required role
  const userWithRole = user ? { ...user, role: user.role as Role } : null;
  
  if (!hasRole(userWithRole, roles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

export default RequireRole;
