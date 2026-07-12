/**
 * platform-pulse — el "ojo de negocio" de Sacha (going-agent).
 *
 * Sacha se define como "agente del producto core (rides, growth, métricas)" pero
 * históricamente solo revisaba logs/builds (mantenimiento de código). Este módulo
 * cierra esa brecha: lee KPIs reales del producto desde transport-service (que ya
 * tiene Atlas + VPC) vía el endpoint S2S GET /internal/platform-pulse, y deriva
 * DETERMINÍSTICAMENTE (sin LLM, sin fabricar nada) anomalías y propuestas para el
 * Cerebro (Pacha). Así el Cerebro recibe señales accionables reales:
 * `boost_driver_supply`, `assign_scheduled_driver`, `reconcile_failed_payments`.
 */
import { Anomaly, ActionProposed } from '@going-platform/cerebro-contracts';

export interface PlatformPulse {
  windowHours: number;
  generatedAt: string;
  ridesRequested: number;
  ridesCompleted: number;
  ridesCancelled: number;
  ridesNoShow: number;
  ridesNoDriver: number;
  ridesStuckNoDriver: number;
  completionRate: number;
  paymentCaptureFailed: number;
  orphanSearches: number;
  scheduledUpcoming24h: number;
  scheduledUnassigned24h: number;
  openTripsUpcoming24h: number;
  activeDrivers: number;
}

/** Consulta el pulso a transport-service. Devuelve null si no está configurado o falla. */
export async function fetchPlatformPulse(): Promise<PlatformPulse | null> {
  const base  = process.env.TRANSPORT_INTERNAL_URL;
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (!base || !token) {
    console.warn('[going-agent][pulse] sin TRANSPORT_INTERNAL_URL/INTERNAL_SERVICE_TOKEN — pulso omitido');
    return null;
  }
  try {
    const url = `${base.replace(/\/$/, '')}/internal/platform-pulse`;
    const res = await fetch(url, { headers: { 'x-internal-token': token } });
    if (!res.ok) {
      console.error(`[going-agent][pulse] HTTP ${res.status} desde transport-service`);
      return null;
    }
    return (await res.json()) as PlatformPulse;
  } catch (e) {
    console.error('[going-agent][pulse] excepción:', (e as Error).message);
    return null;
  }
}

export interface PulseSignals {
  anomalies: Anomaly[];
  actionsProposed: ActionProposed[];
  metrics: Record<string, number>;
  summary: string;
}

/**
 * Deriva anomalías + propuestas a partir de umbrales fijos. Todo determinístico:
 * el Cerebro nunca recibe una señal inventada por el LLM.
 */
export function derivePulseSignals(p: PlatformPulse): PulseSignals {
  const anomalies: Anomaly[] = [];
  const actionsProposed: ActionProposed[] = [];
  const noDriverTotal = p.ridesNoDriver + p.ridesStuckNoDriver;
  const pct = Math.round(p.completionRate * 100);

  // 1. Sin oferta: cero conductoras o conductores activos.
  if (p.activeDrivers === 0) {
    anomalies.push({ type: 'no_active_drivers', severity: 'critical', message: 'Cero conductoras o conductores activos en la plataforma' });
    actionsProposed.push({ type: 'boost_driver_supply', reason: 'No hay oferta activa: ninguna conductora o conductor disponible', urgency: 0.9 });
  }

  // 2. Demanda no atendida: viajes sin conductor.
  if (noDriverTotal >= 3) {
    anomalies.push({ type: 'rides_without_driver', severity: 'critical', message: `${noDriverTotal} viajes sin conductor en las últimas 6h`, data: { stuck: p.ridesStuckNoDriver, noDriver: p.ridesNoDriver } });
    actionsProposed.push({ type: 'boost_driver_supply', reason: `${noDriverTotal} viajes quedaron sin conductora o conductor; falta oferta`, urgency: 0.85 });
  }

  // 3. Baja tasa de completación con demanda relevante.
  if (p.ridesRequested >= 5 && p.completionRate < 0.6) {
    anomalies.push({ type: 'low_completion_rate', severity: 'warning', message: `Tasa de completación ${pct}% (${p.ridesCompleted}/${p.ridesRequested})`, data: { completionRate: p.completionRate } });
  }

  // 4. Fallos de captura de cobro digital (reconciliación).
  if (p.paymentCaptureFailed >= 3) {
    anomalies.push({ type: 'payment_capture_failures', severity: 'warning', message: `${p.paymentCaptureFailed} capturas de cobro fallidas en 6h`, data: { count: p.paymentCaptureFailed } });
    actionsProposed.push({ type: 'reconcile_failed_payments', reason: `${p.paymentCaptureFailed} cobros no capturados; requieren reconciliación`, urgency: 0.6 });
  }

  // 5. Búsquedas huérfanas (salud del motor de asignación).
  if (p.orphanSearches >= 1) {
    anomalies.push({ type: 'orphan_searches', severity: 'warning', message: `${p.orphanSearches} búsquedas huérfanas (lease vencido) — posible pod caído`, data: { count: p.orphanSearches } });
  }

  // 6. Programados próximos sin conductor confirmado.
  if (p.scheduledUnassigned24h >= 1) {
    anomalies.push({ type: 'scheduled_unassigned', severity: p.scheduledUnassigned24h >= 3 ? 'critical' : 'warning', message: `${p.scheduledUnassigned24h} viajes programados en 24h sin conductor confirmado`, data: { count: p.scheduledUnassigned24h, upcoming: p.scheduledUpcoming24h } });
    actionsProposed.push({ type: 'assign_scheduled_driver', reason: `${p.scheduledUnassigned24h} viajes programados necesitan conductora o conductor antes de su salida`, urgency: 0.7 });
  }

  const metrics: Record<string, number> = {
    pulse_ridesRequested: p.ridesRequested,
    pulse_ridesCompleted: p.ridesCompleted,
    pulse_ridesCancelled: p.ridesCancelled,
    pulse_ridesNoShow: p.ridesNoShow,
    pulse_ridesNoDriver: noDriverTotal,
    pulse_completionRate: p.completionRate,
    pulse_paymentCaptureFailed: p.paymentCaptureFailed,
    pulse_orphanSearches: p.orphanSearches,
    pulse_scheduledUpcoming24h: p.scheduledUpcoming24h,
    pulse_scheduledUnassigned24h: p.scheduledUnassigned24h,
    pulse_activeDrivers: p.activeDrivers,
  };

  const emoji = anomalies.some((a) => a.severity === 'critical') ? '🚨' : anomalies.length ? '⚠️' : '✅';
  const summary =
    `${emoji} *Pulso del producto (6h)*\n` +
    `- Viajes: ${p.ridesRequested} pedidos · ${p.ridesCompleted} completados (${pct}%)\n` +
    `- Sin conductor: ${noDriverTotal} · Cancelados: ${p.ridesCancelled} · No-show: ${p.ridesNoShow}\n` +
    `- Programados 24h: ${p.scheduledUpcoming24h} (${p.scheduledUnassigned24h} sin conductor)\n` +
    `- Oferta activa: ${p.activeDrivers} · Cobros fallidos: ${p.paymentCaptureFailed} · Búsq. huérfanas: ${p.orphanSearches}`;

  return { anomalies, actionsProposed, metrics, summary };
}
