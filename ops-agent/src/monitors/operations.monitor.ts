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
 */
import { Firestore, Timestamp } from '@google-cloud/firestore';
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
} from '../mongodb/rides.repository';
import {
  mongoGetAllDrivers,
  mongoGetDriversByIds,
  DriverBasic,
} from '../mongodb/drivers.repository';

const fsdb = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

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

export async function checkRidesSinConductor(): Promise<void> {
  console.log('[ops] Verificando viajes sin conductor...');
  try {
    const rides = await mongoGetPendingRidesNoDriver(2);
    let alerted = 0;
    for (const ride of rides) {
      if (await shouldSuppress('no_driver_assigned', ride.id)) continue;
      const msg = alertNoConductor(ride.id, ride.ageMinutes, ride.pickupAddr, ride.dropoffAddr);
      await sendMessage(msg);
      await logAlert({
        type:     'no_driver_assigned',
        severity: 'critical',
        message:  `Viaje ${ride.id.slice(-6)} sin conductor por ${ride.ageMinutes} min`,
        data:     { rideId: ride.id, ageMinutes: ride.ageMinutes },
      });
      alerted++;
    }
    console.log(`[ops] ${rides.length} viajes sin conductor (${alerted} alertados, resto suprimidos)`);
  } catch (err) {
    console.error('[ops] Error en checkRidesSinConductor:', err);
  }
}

// ─── 2. Conductores inactivos (>2h sin viaje completado) ──────

export async function checkConductoresInactivos(): Promise<void> {
  console.log('[ops] Verificando conductores inactivos...');
  try {
    const drivers = await mongoGetAllDrivers();
    if (drivers.length === 0) {
      console.log('[ops] no hay conductores activos en el sistema todavía');
      return;
    }

    const cutoff = Date.now() - 2 * 3600 * 1000;
    let alerted = 0;

    for (const driver of drivers) {
      const last = await mongoGetDriverLastActivity(driver.id);

      // Si nunca completó viaje, o el último fue antes del cutoff:
      const isIdle = !last || last.getTime() < cutoff;
      if (!isIdle) continue;

      if (await shouldSuppress('driver_idle', driver.id)) continue;

      const horasIdle = last
        ? (Date.now() - last.getTime()) / 3600000
        : 999;
      const msg = alertConductorInactivo(driver.fullName, '—', horasIdle, '—');
      await sendMessage(msg);
      await logAlert({
        type:         'driver_idle',
        severity:     'warning',
        providerId:   driver.id,
        providerName: driver.fullName,
        message:      `${driver.fullName} lleva ${horasIdle.toFixed(1)}h sin viajes`,
        data:         { hoursIdle: horasIdle, lastCompleted: last?.toISOString() || null },
      });
      alerted++;
    }
    console.log(`[ops] ${drivers.length} conductores activos, ${alerted} idle alertados`);
  } catch (err) {
    console.error('[ops] Error en checkConductoresInactivos:', err);
  }
}

// ─── 3. Revenue diario por conductor (12pm y 6pm Ecuador) ─────

export async function checkIngresos(): Promise<void> {
  const hour = currentHourEcuador();
  if (hour !== 12 && hour !== 18) return;
  if (!isPrimaryRunOfHour()) return;

  console.log(`[ops] Verificando revenue por conductor a las ${hour}:00...`);
  try {
    // Meta proporcional: $35 a las 12, $60 a las 18 (final $70 al día)
    const threshold = hour === 12 ? 35 : 60;
    const horaStr   = hour === 12 ? '12:00' : '18:00';

    const completed = await mongoGetCompletedRidesToday();

    // Agregar revenue por conductor
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

    // Lookup de nombres en bulk
    const driverIds = Array.from(revenueByDriver.keys());
    const drivers   = await mongoGetDriversByIds(driverIds);

    let alertasBajos      = 0;
    let alertasCelebradas = 0;

    for (const [driverId, stats] of revenueByDriver) {
      const driver = drivers.get(driverId);
      const name   = driver?.fullName || `Conductor #${driverId.slice(-6)}`;

      // Bajo umbral
      if (stats.revenue < threshold) {
        if (!(await shouldSuppress('below_revenue', driverId))) {
          await sendMessage(alertBajoIngreso(name, '—', stats.revenue, horaStr));
          alertasBajos++;
        }
      }

      // Meta diaria $70 alcanzada (solo al final 18:00)
      if (hour === 18 && stats.revenue >= 70) {
        if (!(await shouldSuppress('daily_target', driverId))) {
          await sendMessage(alertMetaAlcanzada(name, stats.revenue));
          alertasCelebradas++;
        }
      }
    }

    console.log(`[ops] revenue check: ${alertasBajos} bajos, ${alertasCelebradas} celebrados`);
  } catch (err) {
    console.error('[ops] Error en checkIngresos:', err);
  }
}

// ─── 4. Reporte diario (9pm Ecuador) ──────────────────────────

export async function enviarReporteDiario(): Promise<void> {
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

    // Top conductor del día
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

    // Alertas del día
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

    await sendMessage(msg);
    console.log('[ops] reporte diario enviado');
  } catch (err) {
    console.error('[ops] Error en enviarReporteDiario:', err);
  }
}

// ─── Runner principal ─────────────────────────────────────────

export async function runAllMonitors(): Promise<void> {
  console.log(`[ops] Ciclo de monitoreo —`,
    new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }));

  await checkRidesSinConductor();   // cada run
  await checkConductoresInactivos(); // cada run (suprimido por hora)
  await checkIngresos();             // solo 12pm y 18pm
  await enviarReporteDiario();       // solo 21pm

  console.log('[ops] Ciclo completado');
}
