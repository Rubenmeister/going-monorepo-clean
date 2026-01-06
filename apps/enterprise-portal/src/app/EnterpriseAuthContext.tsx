import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Enterprise roles
export type EnterpriseRole = 'enterprise_admin' | 'enterprise_user' | 'enterprise_viewer';

// Enterprise user with tenant
export interface EnterpriseUser {
  id: string;
  email: string;
  name: string;
  role: EnterpriseRole;
  tenantId: string;
  tenantName: string;
  permissions: string[];
}

// Role permissions mapping
const ROLE_PERMISSIONS: Record<EnterpriseRole, string[]> = {
  enterprise_admin: [
    'view_dashboard', 'request_ride', 'request_shipment', 
    'view_trips', 'view_shipments', 'view_billing', 'view_reports',
    'manage_users', 'manage_cost_centers', 'manage_policies', 'export_data'
  ],
  enterprise_user: [
    'view_dashboard', 'request_ride', 'request_shipment',
    'view_own_trips', 'view_own_shipments'
  ],
  enterprise_viewer: [
    'view_dashboard', 'view_trips', 'view_shipments', 
    'view_billing', 'view_reports', 'export_data'
  ],
};

interface EnterpriseAuthContextType {
  user: EnterpriseUser | null;
  tenantId: string | null;
  tenantName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, tenantId: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<EnterpriseAuthContextType | undefined>(undefined);

export function EnterpriseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EnterpriseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('enterprise_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, tenantId: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, tenantId }), // tenantId passed to backend if supported
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      // In a real scenario, the backend should return the tenant info and permissions
      // For now, we adapt the real user to the EnterpriseUser type needed by the frontend
      const enterpriseUser: EnterpriseUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: (data.user.role as EnterpriseRole) || 'enterprise_user',
        tenantId: tenantId,
        tenantName: tenantId === 'demo' ? 'Demo Corp' : `Empresa ${tenantId}`,
        permissions: ROLE_PERMISSIONS[data.user.role as EnterpriseRole] || ROLE_PERMISSIONS['enterprise_user'],
      };
      
      localStorage.setItem('enterprise_user', JSON.stringify(enterpriseUser));
      localStorage.setItem('enterprise_token', data.accessToken);
      setUser(enterpriseUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('enterprise_user');
    localStorage.removeItem('enterprise_token');
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      tenantId: user?.tenantId || null,
      tenantName: user?.tenantName || null,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasPermission,
      isAdmin: user?.role === 'enterprise_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useEnterpriseAuth(): EnterpriseAuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useEnterpriseAuth must be used within EnterpriseAuthProvider');
  }
  return context;
}

// Role guard hook
export function useEnterpriseRole(requiredRoles: EnterpriseRole[]): boolean {
  const { user } = useEnterpriseAuth();
  return user ? requiredRoles.includes(user.role) : false;
}
