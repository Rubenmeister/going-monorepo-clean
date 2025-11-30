import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- DEFINICIÓN DE TIPOS LOCALES (Para no depender de librerías externas aún) ---
interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  // Agregamos un objeto de dependencias "dummy" para que el hook no falle
  dependencies: any;
}

// --- CONTEXTO ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- PROVIDER ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Simulación de dependencias (Aquí conectarás los casos de uso reales luego)
  const dependencies = {
    payment: { requestIntent: async () => console.log("Pago no implementado aún") },
    parcel: { create: async () => console.log("Parcel no implementado aún") },
    trips: { request: async () => console.log("Viaje no implementado aún") }
  };

  const login = async (email: string, pass: string) => {
    console.log("Simulando login...", email);
    setUser({ id: '1', email, fullName: 'Usuario Demo' });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, dependencies }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- HOOK EXPORTADO ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
