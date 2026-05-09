/**
 * Tipos de la API REST de Sentry — solo los campos que consume el monitor.
 * Sentry expone muchos más, pero mantenemos esto chico para no acoplarnos
 * de más al schema de su API. Si necesitamos algo nuevo, agregar acá.
 *
 * Docs: https://docs.sentry.io/api/
 */

export interface SentryIssue {
  id:            string;
  shortId:       string;       // ej: "MOBILE-USER-1A2B"
  title:         string;
  level:         'debug' | 'info' | 'warning' | 'error' | 'fatal';
  status:        'unresolved' | 'resolved' | 'ignored';
  count:         string;       // Sentry returns count as string
  userCount:     number;
  firstSeen:     string;       // ISO8601
  lastSeen:      string;
  permalink:     string;
  isUnhandled:   boolean;      // crash vs caught error
  metadata?: {
    type?:     string;
    value?:    string;
    function?: string;
  };
  // Release que asocia el issue (para detectar regresiones por versión).
  // Sentry lo devuelve solo si el SDK envía release info.
  firstRelease?: {
    version: string;
  };
}

export interface SentryStatsPoint {
  // [unix_timestamp_seconds, count]
  0: number;
  1: number;
}

export interface SentryProjectStats {
  // statsPeriod=24h&resolution=1h da un array de buckets horarios.
  data: SentryStatsPoint[];
}

export interface SentryRelease {
  version:     string;
  shortVersion: string;
  dateCreated: string;
  // sessionsCrashed / sessionsHealthy solo aparecen si el SDK envía session events
  newGroups?:  number;        // issues nuevos en este release
}
