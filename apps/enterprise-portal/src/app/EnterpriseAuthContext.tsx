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
    // In production, this would call the API
    // Determine role based on email for demo
    let role: EnterpriseRole = 'enterprise_user';
    if (email.includes('admin')) role = 'enterprise_admin';
    if (email.includes('viewer') || email.includes('reports')) role = 'enterprise_viewer';

    const mockUser: EnterpriseUser = {
      id: `ent-${Date.now()}`,
      email,
      name: email.split('@')[0].replace('.', ' '),
      role,
      tenantId,
      tenantName: tenantId === 'demo' ? 'Demo Corp' : `Empresa ${tenantId}`,
      permissions: ROLE_PERMISSIONS[role],
    };
    
    localStorage.setItem('enterprise_user', JSON.stringify(mockUser));
    localStorage.setItem('enterprise_token', 'mock-enterprise-jwt');
    setUser(mockUser);
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
