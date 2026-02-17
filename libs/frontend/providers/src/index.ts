export * from './lib/auth-context.provider';
export * from './lib/use-monorepo-app.hook';

// Simple AuthProvider wrapper component
import type React from 'react';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return children;
};