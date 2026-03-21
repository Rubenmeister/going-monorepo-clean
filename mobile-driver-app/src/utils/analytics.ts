/**
 * Going Analytics – Driver App
 * Wrapper tipado sobre @react-native-firebase/analytics.
 * Silent fallback si la librería no está instalada.
 *
 * Instalación:
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

export const analyticsDriverLogin  = (method: 'email' | 'biometric') =>
  _analytics?.logLogin({ method }).catch(() => {});

export const analyticsDriverLogout = () => track('driver_logout');

// ─── Disponibilidad ───────────────────────────────────────────────────────────

export const analyticsDriverOnline  = () => track('driver_went_online');
export const analyticsDriverOffline = (session_minutes: number) =>
  track('driver_went_offline', { session_minutes });

// ─── Viajes ───────────────────────────────────────────────────────────────────

export const analyticsTripAccepted = (params: {
  trip_id: string;
  origin_city: string;
  destination_city: string;
  estimated_earnings: number;
}) => track('trip_accepted', params);

export const analyticsTripRejected = (params: {
  trip_id: string;
  reason?: string;
}) => track('trip_rejected', params);

export const analyticsTripCompleted = (params: {
  trip_id: string;
  duration_minutes: number;
  earnings: number;
  rating?: number;
}) => track('trip_completed', params);

export const analyticsTripCancelled = (params: {
  trip_id: string;
  stage: 'accepted' | 'en_route' | 'in_progress';
}) => track('trip_cancelled', params);

// ─── Documentos ───────────────────────────────────────────────────────────────

export const analyticsDocAlertViewed = (doc_label: string, days_left: number) =>
  track('doc_alert_viewed', { doc_label, days_left });

export const analyticsDocRenewed = (doc_label: string) =>
  track('doc_renewed', { doc_label });

// ─── Academia ─────────────────────────────────────────────────────────────────

export const analyticsAcademiaModuleStarted  = (module_title: string) =>
  track('academia_module_started', { module_title });

export const analyticsAcademiaModuleFinished = (module_title: string) =>
  track('academia_module_finished', { module_title });

// ─── Ganancias ────────────────────────────────────────────────────────────────

export const analyticsEarningsReportExported = (format: 'pdf' | 'csv') =>
  track('earnings_report_exported', { format });

// ─── Pantallas ────────────────────────────────────────────────────────────────

export const analyticsScreen = (screen_name: string) =>
  _analytics?.logScreenView({ screen_name, screen_class: screen_name }).catch(() => {});
