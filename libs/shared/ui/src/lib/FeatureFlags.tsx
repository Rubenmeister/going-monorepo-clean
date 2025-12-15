'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Feature Flag Types
export interface FeatureFlags {
  // P0 - Launch
  RIDES_ENABLED: boolean;
  SHARED_RIDES_ENABLED: boolean;
  SHIPMENTS_ENABLED: boolean;
  
  // P1 - Coming Soon
  TOURS_ENABLED: boolean;
  EXPERIENCES_ENABLED: boolean;
  HOSTS_ENABLED: boolean;
  STAYS_ENABLED: boolean;
  
  // Provider Features
  PROVIDER_TOURS_ENABLED: boolean;
  PROVIDER_EXPERIENCES_ENABLED: boolean;
  PROVIDER_STAYS_ENABLED: boolean;
  
  // Enterprise Features
  ENTERPRISE_APPROVALS_ENABLED: boolean;
  ENTERPRISE_TOURS_ENABLED: boolean;
  ENTERPRISE_STAYS_ENABLED: boolean;
}

// Default flags for launch
export const DEFAULT_FLAGS: FeatureFlags = {
  // P0 - Active at launch
  RIDES_ENABLED: true,
  SHARED_RIDES_ENABLED: true,
  SHIPMENTS_ENABLED: true,
  
  // P1 - Coming soon (OFF at launch)
  TOURS_ENABLED: false,
  EXPERIENCES_ENABLED: false,
  HOSTS_ENABLED: false,
  STAYS_ENABLED: false,
  
  // Provider (OFF at launch)
  PROVIDER_TOURS_ENABLED: false,
  PROVIDER_EXPERIENCES_ENABLED: false,
  PROVIDER_STAYS_ENABLED: false,
  
  // Enterprise (OFF at launch)
  ENTERPRISE_APPROVALS_ENABLED: false,
  ENTERPRISE_TOURS_ENABLED: false,
  ENTERPRISE_STAYS_ENABLED: false,
};

// Context
interface FeatureFlagContextValue {
  flags: FeatureFlags;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

// Provider
interface FeatureFlagProviderProps {
  children: ReactNode;
  overrides?: Partial<FeatureFlags>;
}

export function FeatureFlagProvider({ children, overrides = {} }: FeatureFlagProviderProps) {
  const [flags, setFlags] = React.useState<FeatureFlags>({
    ...DEFAULT_FLAGS,
    ...overrides,
  });

  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return flags[flag] ?? false;
  };

  const setFlag = (flag: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => ({ ...prev, [flag]: value }));
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, setFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// Hook
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    // Return default if not in provider
    return DEFAULT_FLAGS[flag] ?? false;
  }
  return context.isEnabled(flag);
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

// Gate Component
interface FeatureFlagGateProps {
  flag: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureFlagGate({ flag, children, fallback = null }: FeatureFlagGateProps) {
  const isEnabled = useFeatureFlag(flag);
  
  if (isEnabled) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

// Utility for checking multiple flags
export function useMultipleFlags(flags: (keyof FeatureFlags)[]): Record<keyof FeatureFlags, boolean> {
  const context = useContext(FeatureFlagContext);
  const result: Partial<Record<keyof FeatureFlags, boolean>> = {};
  
  flags.forEach(flag => {
    result[flag] = context?.isEnabled(flag) ?? DEFAULT_FLAGS[flag] ?? false;
  });
  
  return result as Record<keyof FeatureFlags, boolean>;
}

export default FeatureFlagProvider;
