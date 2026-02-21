/**
 * GOING PLATFORM - UNIFIED DESIGN TOKENS
 *
 * Single source of truth for all design decisions across the platform
 * Used by: frontend-webapp, admin-dashboard, corporate-portal, mobile-apps
 */

export * from '../colors';
export * from '../typography';
export * from '../spacing';
export * from '../shadows';

// Design System Metadata
export const DESIGN_SYSTEM = {
  version: '1.0.0',
  name: 'Going Platform Design System',
  namespace: '@going-monorepo-clean/design-system',
  updatedAt: new Date().toISOString(),
} as const;
