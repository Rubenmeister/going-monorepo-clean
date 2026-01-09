'use client';

// Shared UI Components Library
// Going Ecuador - Marketplace & Enterprise

// Core Booking Components
export { SearchFromTo } from './lib/SearchFromTo';
export type { Location } from './lib/SearchFromTo';

export { ServiceSwitcher } from './lib/ServiceSwitcher';
export type { ServiceType } from './lib/ServiceSwitcher';

export { CapacityPicker } from './lib/CapacityPicker';

// Tracking Components
export { TripStatusTimeline } from './lib/TripStatusTimeline';
export type { TimelineEvent } from './lib/TripStatusTimeline';

export { TrackingMapPanel } from './lib/TrackingMapPanel';
export type { VehicleLocation, TripRoute } from './lib/TrackingMapPanel';

// Payment Components
export { PaymentStatusBadge } from './lib/PaymentStatusBadge';
export type { PaymentStatus } from './lib/PaymentStatusBadge';

// Empty States
export { 
  EmptyState,
  EmptyStateNoTrips,
  EmptyStateNoShipments,
  EmptyStateComingSoon,
} from './lib/EmptyState';

// Feature Flags
export {
  FeatureFlagProvider,
  FeatureFlagGate,
  useFeatureFlag,
  useFeatureFlags,
  useMultipleFlags,
  DEFAULT_FLAGS,
} from './lib/FeatureFlags';
export type { FeatureFlags } from './lib/FeatureFlags';

// Route Guards
export {
  FeatureRouteGuard,
  RoleGuard,
  AuthGuard,
} from './lib/RouteGuards';

// Ecuador Identity Components
export { RegionChips, PopularRoutes } from './lib/EcuadorComponents';
export type { EcuadorRegion, PopularRoute } from './lib/EcuadorComponents';

// Design System Components (Shadcn/UI)
export * from './lib/components/ui/button';
export * from './lib/components/ui/badge';
export * from './lib/components/ui/input';

// Hooks
export { useTransport } from './lib/hooks/useTransport';
export type { TransportTrip } from './lib/hooks/useTransport';


