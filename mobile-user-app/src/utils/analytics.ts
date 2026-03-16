/**
 * Going Analytics – User App
 * Wrapper tipado sobre @react-native-firebase/analytics.
 * Si la librería no está instalada (dev / CI), todos los calls
 * son no-ops silenciosos — nunca rompe la app.
 *
 * Instalación (cuando tengas google-services.json):
 *   npx expo install @react-native-firebase/app @react-native-firebase/analytics
 */

type Analytics = typeof import('@react-native-firebase/analytics').default;
let _analytics: ReturnType<Analytics> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: analytics } = require('@react-native-firebase/analytics');
  _analytics = analytics();
} catch {
  // librería no instalada — modo silencioso
}

const track = (event: string, params?: Record<string, unknown>) => {
  if (!_analytics) return;
  _analytics.logEvent(event, params as any).catch(() => {});
};

// ─── Sesión ───────────────────────────────────────────────────────────────────

export const analyticsLogin = (method: 'email' | 'biometric' | 'google') =>
  _analytics?.logLogin({ method }).catch(() => {});

export const analyticsSignUp = (method: 'email' | 'google') =>
  _analytics?.logSignUp({ method }).catch(() => {});

export const analyticsLogout = () => track('user_logout');

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const analyticsOnboardingStart  = () => track('onboarding_start');
export const analyticsOnboardingFinish = () => track('onboarding_finish');
export const analyticsOnboardingSkip   = (slide: number) =>
  track('onboarding_skip', { slide });

// ─── Solicitud de viaje ───────────────────────────────────────────────────────

export const analyticsRideRequest = (params: {
  origin_city: string;
  destination_city: string;
  vehicle_type: string;
  estimated_price: number;
}) => track('ride_request', params);

export const analyticsRideConfirmed = (params: {
  ride_id: string;
  vehicle_type: string;
  price: number;
  city: string;
}) => {
  _analytics?.logPurchase({
    currency: 'USD',
    value: params.price,
    transaction_id: params.ride_id,
    items: [{ item_id: params.vehicle_type, item_name: `Viaje ${params.vehicle_type}` }],
  }).catch(() => {});
  track('ride_confirmed', params);
};

export const analyticsRideCancelled = (params: {
  ride_id: string;
  reason?: string;
  stage: 'searching' | 'assigned' | 'in_progress';
}) => track('ride_cancelled', params);

export const analyticsRideCompleted = (params: {
  ride_id: string;
  duration_minutes: number;
  price: number;
  rating?: number;
}) => track('ride_completed', params);

// ─── Tracking en viaje ────────────────────────────────────────────────────────

export const analyticsShareTracking = (ride_id: string) =>
  track('share_tracking', { ride_id });

// ─── Búsqueda y destinos ──────────────────────────────────────────────────────

export const analyticsDestinationSearch = (query: string) =>
  track('destination_search', { query: query.substring(0, 40) }); // no PII larga

export const analyticsSavedAddressUsed = (type: 'home' | 'work' | 'favorite') =>
  track('saved_address_used', { type });

export const analyticsFeaturedRouteSelected = (route_name: string) =>
  track('featured_route_selected', { route_name });

// ─── Pagos / Wallet ───────────────────────────────────────────────────────────

export const analyticsWalletRecharge = (amount: number, method: string) =>
  track('wallet_recharge', { amount, method });

export const analyticsPromoCodeApplied = (code: string, success: boolean) =>
  track('promo_code_applied', { code, success });

// ─── Pantallas ────────────────────────────────────────────────────────────────

export const analyticsScreen = (screen_name: string) =>
  _analytics?.logScreenView({ screen_name, screen_class: screen_name }).catch(() => {});
