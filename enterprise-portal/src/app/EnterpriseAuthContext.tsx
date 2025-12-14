import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Enterprise user with tenant
export interface EnterpriseUser {
  id: string;
  email: string;
  name: string;
  role: 'enterprise_user' | 'enterprise_admin';
  tenantId: string;
  tenantName: string;
}

interface AuthContextType {
  user: EnterpriseUser | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, tenantId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    const mockUser: EnterpriseUser = {
      id: `ent-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'enterprise_admin',
      tenantId,
      tenantName: `Empresa ${tenantId}`,
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

  return (
    <AuthContext.Provider value={{
      user,
      tenantId: user?.tenantId || null,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useEnterpriseAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useEnterpriseAuth must be used within EnterpriseAuthProvider');
  }
  return context;
}
