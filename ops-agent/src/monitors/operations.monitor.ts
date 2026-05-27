/**
 * Going – Ops Agent monitor
 *
 * Migrado a MongoDB Atlas (datos reales de transport-service y
 * user-auth-service). Las funcionalidades cubiertas son las que tienen
 * data real soportada por el schema actual:
 *
 *   ✅ Viajes pendientes sin conductor (>2 min)
 *   ✅ Conductores inactivos (>2h sin viaje completado)
 *   ✅ Revenue diario por conductor + meta $70
 *   ✅ Reporte diario 9pm Ecuador
 *
 * Funcionalidades aspiracionales (esperan extensión de schema):
 *   ⏸ Vencimiento licencia/seguro/SOAT — no hay campos en users
 *   ⏸ Calificaciones bajas — no hay collection de ratings aún
 *   ⏸ Documentos de academia — no hay collection
 *
 * Se reactivan agregando los campos correspondientes a `going-users.users`
 * o creando collections separadas (ratings, documents, academy).
 *
 * Cada monitor además de su efecto colateral (Telegram + Firestore log)
 * empuja métricas / anomalías / acciones a un `RunCollector` que el
 * runner principal usa para construir el AgentRunEvent que se publica al
 * cerebro-service al final del run.
 */
import { Firestore, Timestamp } from '@google-cloud/firestore';
import {
  Anomaly,
  ActionTaken,
  ActionProposed,
} from '@going-platform/cerebro-contracts';
import {
  sendMessage,
  alertNoConductor,
  alertConductorInactivo,
  alertBajoIngreso,
  alertMetaAlcanzada,
  reporteDiario,
} from '../telegram/bot';
import {
  mongoGetPendingRidesNoDriver,
  mongoGetCompletedRidesToday,
  mongoGetDriverLastActivity,
  mongoGetTodayRidesStats,
  mongoGetWeeklyStats,
  mongoGetNewDriverSignups7d,
} from '../mongodb/rides.repository';
import {
  mongoGetAllDrivers,
  mongoGetDriversByIds,
} from '../mongodb/drivers.repository';

const fsdb = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

// ─── Recolector compartido entre los 4 monitores ──────────────
//
// Cada checkXxx empuja a este collector. `runAllMonitors` lo retorna y el
// index.ts lo envuelve con el envelope del AgentRunEvent.

export interface RunCollector {
  metrics:         Record<string, number | string>;
  anomalies:       Anomaly[];
  actionsTaken:    ActionTaken[];
  actionsProposed: ActionProposed[];
  errors:          string[];   // monitor names que tiraron excepción
}

function createCollector(): RunCollector {
  return {
    metrics:         {},
    anomalies:       [],
    actionsTaken:    [],
    actionsProposed: [],
    errors:          [],
  };
}

// ─── Helpers de tiempo (Ecuador) ──────────────────────────────

function currentHourEcuador(): number {
  const h = new Date().toLocaleString('en-US', {
    timeZone: 'America/Guayaquil', hour: 'numeric', hour12: false,
  });
  return parseInt(h, 10);
}

function currentMinuteEcuador(): number {
  const m = new Date().toLocaleString('en-US', {
    timeZone: 'America/Guayaquil', minute: 'numeric',
  });
  return parseInt(m, 10);
}

/** Dispara una alerta una sola vez por hora (en runs cada 15 min). */
function isPrimaryRunOfHour(): boolean {
  return currentMinuteEcuador() < 15;
}

// ─── Anti-spam de alertas ─────────────────────────────────────
//
// Para evitar mandar la misma alerta 4 veces por hora (cron */15),
// guardamos el último envío por (type, key) en Firestore. Si ya
// alertamos hace menos de SUPPRESS_MIN minutos, skip.

const SUPPRESS_MIN: Record<string, number> = {
  no_driver_assigned: 10,    // re-alertar cada 10 min si sigue pendiente
  driver_idle:        180,   // re-alertar cada 3h
  below_revenue:      360,   // re-alertar a las 6h (12 y 18 son los hooks)
  daily_target:       720,   // celebrar 1x al día
};

async function shouldSuppress(type: string, key: string): Promise<boolean> {
  const minutes = SUPPRESS_MIN[type] || 60;
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const docId  = `${type}__${key}`;
  const ref    = fsdb.collection('ops_alert_state').doc(docId);
  const snap   = await ref.get();
  if (snap.exists) {
    const last = snap.data()?.lastSentAt as Timestamp | undefined;
    if (last && last.toDate() > cutoff) return true;
  }
  await ref.set({ lastSentAt: Timestamp.now(), type, key }, { merge: true });
  return false;
}

async function logAlert(payload: {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  providerId?: string;
  providerName?: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await fsdb.collection('ops_alerts').add({
    ...payload,
    sentAt: Timestamp.now(),
    sentToTelegram: true,
  });
}

// ─── 1. Viajes sin conductor asignado (cutoff 2 min) ──────────

export async function checkRidesSinConductor(c: RunCollector): Promise<void> {
  console.log('[ops] Verificando viajes sin conductor...');
  try {
    const rides = await mongoGetPendingRidesNoDriver(2);
    c.metrics.pendingRidesNoDriver = rides.length;

    let alerted = 0;
    for (const ride of rides) {
      // Toda ride pendiente >2min va al evento como anomaly, sin
      // depender de la suppression (el cerebro decide qué hacer).
      c.anomalies.push({
        type:     'no_driver_assigned',
        severity: ride.ageMinutes >= 5 ? 'critical' : 'warning',
        message:  `Ride ${ride.id.slice(-6)} sin conductor por ${ride.ageMinutes} min`,
        data: {
          rideId:     ride.id,
          ageMinutes: ride.ageMinutes,
          pickup:     ride.pickupAddr,
          dropoff:    ride.dropoffAddr,
        },
      });

      if (await shouldSuppress('no_driver_assigned', ride.id)) {
        c.actionsTaken.push({
          type:   'sent_telegram_alert',
          target: ride.id,
          result: 'suppressed',
        });
        continue;
      }

      const msg = alertNoConductor(ride.id, ride.ageMinutes, ride.pickupAddr, ride.dropoffAddr);
      const sent = await sendMessage(msg);
      await logAlert({
        type:     'no_driver_assigned',
        severity: 'critical',
        message:  `Viaje ${ride.id.slice(-6)} sin conductor por ${ride.ageMinutes} min`,
        data:     { rideId: ride.id, ageMinutes: ride.ageMinutes },
      });
      c.actionsTaken.push({
        type:   'sent_telegram_alert',
        target: ride.id,
        result: sent ? 'ok' : 'failed',
        data:   { reason: 'no_driver_assigned' },
      });
      alerted++;
    }
    console.log(`[ops] ${rides.length} viajes sin conductor (${alerted} alertados, resto suprimidos)`);
  } catch (err) {
    console.error('[ops] Error en checkRidesSinConductor:', err);
    c.errors.push('checkRidesSinConductor');
  }
}

// ─── 2. Conductores inactivos (>2h sin viaje completado) ──────

export async function checkConductoresInactivos(c: RunCollector): Promise<void> {
  console.log('[ops] Verificando conductores inactivos...');
  try {
    const drivers = await mongoGetAllDrivers();
    c.metrics.activeDrivers = drivers.length;

    if (drivers.length === 0) {
      console.log('[ops] no hay conductores activos en el sistema todavía');
      return;
    }

    const cutoff = Date.now() - 2 * 3600 * 1000;
    let alerted = 0;
    let idleCount = 0;

    for (const driver of drivers) {
      const last = await mongoGetDriverLastActivity(driver.id);
      const isIdle = !last || last.getTime() < cutoff;
      if (!isIdle) continue;
      idleCount++;

      const horasIdle = last
        ? (Date.now() - last.getTime()) / 3600000
        : 999;

      c.anomalies.push({
        type:     'driver_idle',
        severity: horasIdle > 6 ? 'critical' : 'warning',
        message:  `${driver.fullName} lleva ${horasIdle.toFixed(1)}h sin viajes`,
        data: {
          driverId:      driver.id,
          driverName:    driver.fullName,
          hoursIdle:     horasIdle,
          lastCompleted: last?.toISOString() || null,
        },
      });

      if (await shouldSuppress('driver_idle', driver.id)) {
        c.actionsTaken.push({
          type:   'sent_telegram_alert',
          target: driver.id,
          result: 'suppressed',
        });
        continue;
      }

      const msg = alertConductorInactivo(driver.fullName, '—', horasIdle, '—');
      const sent = await sendMessage(msg);
      await logAlert({
        type:         'driver_idle',
        severity:     'warning',
        providerId:   driver.id,
        providerName: driver.fullName,
        message:      `${driver.fullName} lleva ${horasIdle.toFixed(1)}h sin viajes`,
        data:         { hoursIdle: horasIdle, lastCompleted: last?.toISOString() || null },
      });
      c.actionsTaken.push({
        type:   'sent_telegram_alert',
        target: driver.id,
        result: sent ? 'ok' : 'failed',
        data:   { reason: 'driver_idle' },
      });
      alerted++;
    }

    c.metrics.idleDrivers = idleCount;
    console.log(`[ops] ${drivers.length} conductores activos, ${alerted} idle alertados`);
  } catch (err) {
    console.error('[ops] Error en checkConductoresInactivos:', err);
    c.errors.push('checkConductoresInactivos');
  }
}

// ─── 3. Revenue diario por conductor (12pm y 6pm Ecuador) ─────

export async function checkIngresos(c: RunCollector): Promise<void> {
  const hour = currentHourEcuador();
  if (hour !== 12 && hour !== 18) return;
  if (!isPrimaryRunOfHour()) return;

  console.log(`[ops] Verificando revenue por conductor a las ${hour}:00...`);
  try {
    const threshold = hour === 12 ? 35 : 60;
    const horaStr   = hour === 12 ? '12:00' : '18:00';

    const completed = await mongoGetCompletedRidesToday();

    const revenueByDriver = new Map<string, { revenue: number; rides: number }>();
    for (const ride of completed) {
      const cur = revenueByDriver.get(ride.driverId) || { revenue: 0, rides: 0 };
      cur.revenue += ride.fareTotal;
      cur.rides   += 1;
      revenueByDriver.set(ride.driverId, cur);
    }

    if (revenueByDriver.size === 0) {
      console.log('[ops] no hay revenue hoy todavía');
      return;
    }

    const driverIds = Array.from(revenueByDriver.keys());
    const drivers   = await mongoGetDriversByIds(driverIds);

    let alertasBajos      = 0;
    let alertasCelebradas = 0;
    let driversBelow       = 0;

    for (const [driverId, stats] of revenueByDriver) {
      const driver = drivers.get(driverId);
      const name   = driver?.fullName || `Conductor #${driverId.slice(-6)}`;

      // Bajo umbral
      if (stats.revenue < threshold) {
        driversBelow++;
        c.anomalies.push({
          type:     'below_revenue',
          severity: 'warning',
          message:  `${name} lleva $${stats.revenue.toFixed(2)} a las ${horaStr} (umbral $${threshold})`,
          data: { driverId, driverName: name, revenue: stats.revenue, threshold, hour },
        });
        if (!(await shouldSuppress('below_revenue', driverId))) {
          const sent = await sendMessage(alertBajoIngreso(name, '—', stats.revenue, horaStr));
          c.actionsTaken.push({
            type:   'sent_telegram_alert',
            target: driverId,
            result: sent ? 'ok' : 'failed',
            data:   { reason: 'below_revenue', revenue: stats.revenue },
          });
          alertasBajos++;
        }
      }

      // Meta diaria $70 alcanzada (solo al final 18:00)
      if (hour === 18 && stats.revenue >= 70) {
        if (!(await shouldSuppress('daily_target', driverId))) {
          const sent = await sendMessage(alertMetaAlcanzada(name, stats.revenue));
          c.actionsTaken.push({
            type:   'sent_telegram_alert',
            target: driverId,
            result: sent ? 'ok' : 'failed',
            data:   { reason: 'daily_target', revenue: stats.revenue },
          });
          alertasCelebradas++;
        }
      }
    }

    c.metrics[`revenueCheck_${hour}h_belowThreshold`] = driversBelow;
    c.metrics[`revenueCheck_${hour}h_alerted`] = alertasBajos;
    if (hour === 18) c.metrics.dailyTargetCelebrated = alertasCelebradas;

    console.log(`[ops] revenue check: ${alertasBajos} bajos, ${alertasCelebradas} celebrados`);
  } catch (err) {
    console.error('[ops] Error en checkIngresos:', err);
    c.errors.push('checkIngresos');
  }
}

// ─── 4. Reporte diario (9pm Ecuador) ──────────────────────────

export async function enviarReporteDiario(c: RunCollector): Promise<void> {
  if (currentHourEcuador() !== 21) return;
  if (!isPrimaryRunOfHour()) return;

  console.log('[ops] Generando reporte diario...');
  try {
    const COMMISSION = parseFloat(process.env.GOING_COMMISSION_RATE || '0.20');

    const [stats, completed, drivers] = await Promise.all([
      mongoGetTodayRidesStats(),
      mongoGetCompletedRidesToday(),
      mongoGetAllDrivers(),
    ]);

    const revenueByDriver = new Map<string, { revenue: number; rides: number }>();
    for (const ride of completed) {
      const cur = revenueByDriver.get(ride.driverId) || { revenue: 0, rides: 0 };
      cur.revenue += ride.fareTotal;
      cur.rides   += 1;
      revenueByDriver.set(ride.driverId, cur);
    }
    const driverIds = Array.from(revenueByDriver.keys());
    const drvMap    = await mongoGetDriversByIds(driverIds);

    let topDriverName = 'N/A';
    let topDriverRevenue = 0;
    let conductoresEnMeta = 0;
    for (const [driverId, st] of revenueByDriver) {
      if (st.revenue >= 70) conductoresEnMeta++;
      if (st.revenue > topDriverRevenue) {
        topDriverRevenue = st.revenue;
        topDriverName    = drvMap.get(driverId)?.fullName || `Conductor #${driverId.slice(-6)}`;
      }
    }

    const todayStartEc = (() => {
      const ec = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
      ec.setHours(0, 0, 0, 0);
      return new Date(ec.getTime() + 5 * 3600 * 1000);
    })();
    const alertsSnap = await fsdb.collection('ops_alerts')
      .where('sentAt', '>=', Timestamp.fromDate(todayStartEc))
      .get();

    const msg = reporteDiario({
      fecha: new Date().toLocaleDateString('es-EC', {
        timeZone: 'America/Guayaquil',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }),
      viajesCompletados: stats.completed,
      viajesCancelados:  stats.cancelled,
      conductoresActivos: drivers.length,
      conductoresEnMeta,
      ingresoTotal:      stats.totalRevenue * COMMISSION,
      topConductor:      topDriverName,
      topIngreso:        topDriverRevenue,
      alertasDelDia:     alertsSnap.size,
    });

    const sent = await sendMessage(msg);
    c.actionsTaken.push({
      type:   'sent_daily_report',
      result: sent ? 'ok' : 'failed',
      data: {
        viajesCompletados:  stats.completed,
        viajesCancelados:   stats.cancelled,
        conductoresEnMeta,
        ingresoTotal:       stats.totalRevenue * COMMISSION,
        alertasDelDia:      alertsSnap.size,
      },
    });

    // Métricas del día completas — el cerebro las usa para construir el world model.
    c.metrics.dailyRidesCompleted  = stats.completed;
    c.metrics.dailyRidesCancelled  = stats.cancelled;
    c.metrics.dailyTotalRevenue    = stats.totalRevenue;
    c.metrics.dailyGoingRevenue    = +(stats.totalRevenue * COMMISSION).toFixed(2);
    c.metrics.dailyDriversInGoal   = conductoresEnMeta;
    c.metrics.dailyAlertsTotal     = alertsSnap.size;

    console.log('[ops] reporte diario enviado');
  } catch (err) {
    console.error('[ops] Error en enviarReporteDiario:', err);
    c.errors.push('enviarReporteDiario');
  }
}

// ─── Runner principal ─────────────────────────────────────────

export interface MonitorRunResult {
  collector: RunCollector;
}

export async function runAllMonitors(): Promise<MonitorRunResult> {
  console.log(`[ops] Ciclo de monitoreo —`,
    new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }));

  const collector = createCollector();

  await checkExternalEndpoints(collector);     // health api.goingec.com + Mapbox
  await checkRidesSinConductor(collector);     // cada run
  await checkConductoresInactivos(collector);  // cada run (suprimido por hora)
  await checkIngresos(collector);              // solo 12pm y 18pm
  await enviarReporteDiario(collector);        // solo 21pm

  // Strategic KPIs (Item 5 — el cerebro los proyecta al snapshot business)
  await collectStrategicKpis(collector);

  console.log('[ops] Ciclo completado');
  return { collector };
}

/**
 * Health checks de endpoints externos críticos. Reemplaza el chequeo
 * antiguo vía UptimeRobot (que requería API key + Secret Manager + IAM)
 * por GETs directos sin credenciales.
 *
 * Targets:
 *   - api.goingec.com/health        → backend Going (Cloud Run)
 *   - status.mapbox.com (Statuspage) → proveedor de mapas/geocoding
 *
 * Best-effort: si alguno falla (timeout, 5xx, DNS), se registra como
 * anomalía pero NO se interrumpe el resto del ciclo de monitoreo.
 *
 * Métricas que se publican al cerebro:
 *   - uptime.goingApi.up         (1 | 0)
 *   - uptime.goingApi.latencyMs  (ms del round-trip)
 *   - uptime.mapbox.status       ("none" | "minor" | "major" | "critical")
 */
async function checkExternalEndpoints(c: RunCollector): Promise<void> {
  // ── Going backend ────────────────────────────────────────────────
  const goingUrl = 'https://api.goingec.com/health';
  try {
    const t0 = Date.now();
    const res = await fetch(goingUrl, {
      method: 'GET',
      // Cloud Run cold-start puede tardar — pero /health debería ser caliente
      // siempre. 8s es generoso pero finito.
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - t0;
    c.metrics['uptime.goingApi.latencyMs'] = latencyMs;

    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as { status?: string };
      const isOk = body.status === 'ok';
      c.metrics['uptime.goingApi.up'] = isOk ? 1 : 0;
      if (!isOk) {
        c.anomalies.push({
          severity: 'warning',
          type:     'external_health_degraded',
          message:  `api.goingec.com/health responde 200 pero payload inesperado: ${JSON.stringify(body).slice(0, 100)}`,
          data:     { url: goingUrl, body, latencyMs },
        });
      } else {
        console.log(`[ops/health] api.goingec.com OK (${latencyMs}ms)`);
      }
    } else {
      c.metrics['uptime.goingApi.up'] = 0;
      c.anomalies.push({
        severity: 'critical',
        type:     'external_health_down',
        message:  `api.goingec.com/health respondió ${res.status} ${res.statusText}`,
        data:     { url: goingUrl, status: res.status, latencyMs },
      });
    }
  } catch (e) {
    const err = (e as Error).message;
    c.metrics['uptime.goingApi.up'] = 0;
    c.anomalies.push({
      severity: 'critical',
      type:     'external_health_unreachable',
      message:  `api.goingec.com/health unreachable: ${err.slice(0, 150)}`,
      data:     { url: goingUrl, error: err },
    });
    c.errors.push(`health_going: ${err.slice(0, 200)}`);
  }

  // ── Mapbox (proveedor crítico para mapas/geocoding) ──────────────
  const mapboxUrl = 'https://status.mapbox.com/api/v2/status.json';
  try {
    const res = await fetch(mapboxUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const body = (await res.json()) as {
        status?: { indicator?: string; description?: string };
      };
      const indicator = body.status?.indicator ?? 'unknown';
      c.metrics['uptime.mapbox.status'] = indicator;

      // "none" = All Systems Operational. Cualquier otra cosa requiere visibilidad.
      if (indicator !== 'none') {
        c.anomalies.push({
          severity: indicator === 'critical' || indicator === 'major' ? 'critical' : 'warning',
          type:     'external_provider_degraded',
          message:  `Mapbox status: ${indicator} — ${body.status?.description ?? ''}`,
          data:     { url: mapboxUrl, indicator, description: body.status?.description },
        });
      } else {
        console.log(`[ops/health] Mapbox All Systems Operational`);
      }
    } else {
      c.anomalies.push({
        severity: 'warning',
        type:     'external_health_unknown',
        message:  `Mapbox status endpoint respondió ${res.status} (puede ser transitorio)`,
        data:     { url: mapboxUrl, status: res.status },
      });
    }
  } catch (e) {
    const err = (e as Error).message;
    // Mapbox status no es crítico — si su STATUS page se cae, la API real
    // puede seguir funcionando. Solo warning.
    c.anomalies.push({
      severity: 'warning',
      type:     'external_health_unreachable',
      message:  `Mapbox status unreachable: ${err.slice(0, 150)}`,
      data:     { url: mapboxUrl, error: err },
    });
    c.errors.push(`health_mapbox: ${err.slice(0, 200)}`);
  }
}

/**
 * Strategic KPIs 7d — calculados cada ciclo (cron 15min) pero la data
 * underlying se mueve poco a poco. Cheap query (2 aggregations + 1 count).
 *
 * Best-effort: si Mongo falla aquí, log y seguir — los KPIs tácticos
 * (pendingRides etc.) ya están cargados en metrics antes.
 */
async function collectStrategicKpis(c: RunCollector): Promise<void> {
  try {
    const [weekly, newDriverSignups] = await Promise.all([
      mongoGetWeeklyStats(),
      mongoGetNewDriverSignups7d(),
    ]);
    c.metrics.ridesCompleted7d      = weekly.ridesCompleted7d;
    c.metrics.ridesCancelled7d      = weekly.ridesCancelled7d;
    c.metrics.totalRevenue7d        = weekly.totalRevenue7d;
    c.metrics.avgRideValueUsd       = weekly.avgRideValueUsd;
    c.metrics.activeDrivers7d       = weekly.uniqueActiveDrivers7d;
    c.metrics.rideCompletionRate    = weekly.rideCompletionRate;
    c.metrics.newDriverSignups7d    = newDriverSignups;
    console.log(
      `[ops/kpis] 7d: ${weekly.ridesCompleted7d} rides ($${weekly.totalRevenue7d}), ` +
      `${weekly.uniqueActiveDrivers7d} active drivers, ${newDriverSignups} new signups, ` +
      `completion ${(weekly.rideCompletionRate * 100).toFixed(0)}%`,
    );
  } catch (e) {
    const err = (e as Error).message;
    console.warn('[ops/kpis] strategic KPIs failed (non-fatal):', err);
    c.errors.push(`strategic_kpis: ${err.slice(0, 200)}`);
  }
}
