import { Firestore, Timestamp } from '@google-cloud/firestore';
import { sendMessage, alertNoConductor, alertConductorInactivo, alertBajoIngreso, alertMetaAlcanzada, alertDocumentoVence, alertCalificacionBaja, reporteDiario } from '../telegram/bot';
import { getActiveDrivers, getIdleDrivers, getDriversBelowRevenueTarget, getExpiringDocuments, getLowRatingDrivers, getDailyRevenueStats, saveAlert } from '../firestore/providers.service';

const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

/** Días hasta una fecha (en zona horaria Ecuador) */
function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  // Hora actual en Ecuador (America/Guayaquil, UTC-5 costa / UTC-6 Galápagos — usamos Guayaquil)
  const nowEcuador = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
  return Math.ceil((target.getTime() - nowEcuador.getTime()) / (1000 * 60 * 60 * 24));
}

/** Hora actual en Ecuador (0-23) */
function currentHour(): number {
  const hourStr = new Date().toLocaleString('en-US', {
    timeZone: 'America/Guayaquil',
    hour: 'numeric',
    hour12: false,
  });
  return parseInt(hourStr, 10);
}

/** Timestamp de inicio del día actual en Ecuador */
function todayStartTimestamp(): Timestamp {
  const ecuadorDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }); // "YYYY-MM-DD"
  return Timestamp.fromDate(new Date(`${ecuadorDate}T00:00:00-05:00`));
}

// ─── 1. Viajes sin conductor asignado ─────────────────────────
export async function checkRidesSinConductor(): Promise<void> {
  console.log('[Monitor] Verificando viajes sin conductor...');
  try {
    // FIX: usar Firestore Timestamp, no ISO string
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000));
    const snap = await db.collection('rides')
      .where('status', '==', 'pending')
      .where('createdAt', '<=', cutoff)
      .get();

    for (const doc of snap.docs) {
      try {
        const ride = doc.data();
        const createdAt = ride.createdAt instanceof Timestamp
          ? ride.createdAt.toDate()
          : new Date(ride.createdAt);
        const minutos = Math.round((Date.now() - createdAt.getTime()) / 60000);
        const msg = alertNoConductor(
          doc.id,
          minutos,
          ride.origin?.address || 'Origen desconocido',
          ride.destination?.address || 'Destino desconocido'
        );
        await sendMessage(msg);
        await saveAlert({
          type: 'no_driver_assigned',
          severity: 'critical',
          providerId: '',
          providerName: 'Sistema',
          message: `Viaje ${doc.id} sin conductor por ${minutos} minutos`,
          data: { rideId: doc.id, minutos },
          sentAt: new Date().toISOString(),
          sentToTelegram: true,
        });
      } catch (err) {
        console.error(`[Monitor] Error procesando viaje ${doc.id}:`, err);
      }
    }
    console.log(`[Monitor] ${snap.size} viajes sin conductor encontrados`);
  } catch (err) {
    console.error('[Monitor] Error en checkRidesSinConductor:', err);
  }
}

// ─── 2. Conductores inactivos (conectados sin viajes) ─────────
export async function checkConductoresInactivos(): Promise<void> {
  console.log('[Monitor] Verificando conductores inactivos...');
  try {
    const conductores = await getIdleDrivers(2); // +2 horas idle

    for (const conductor of conductores) {
      try {
        const msg = alertConductorInactivo(
          `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          conductor.vehicle?.placa || 'N/A',
          conductor.serviceHours?.hoursIdle || 0,
          conductor.location?.provincia || 'N/A'
        );
        await sendMessage(msg);

        // Dar prioridad en Firestore
        await db.collection('drivers').doc(conductor.id).update({
          priority: true,
          prioritySetAt: Timestamp.now(),
        });

        await saveAlert({
          type: 'driver_idle',
          severity: 'warning',
          providerId: conductor.id,
          providerName: `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          message: `Conductor ${conductor.vehicle?.placa} lleva ${conductor.serviceHours?.hoursIdle}h sin viajes`,
          data: { horasIdle: conductor.serviceHours?.hoursIdle },
          sentAt: new Date().toISOString(),
          sentToTelegram: true,
        });
      } catch (err) {
        console.error(`[Monitor] Error procesando conductor inactivo ${conductor.id}:`, err);
      }
    }
    console.log(`[Monitor] ${conductores.length} conductores inactivos encontrados`);
  } catch (err) {
    console.error('[Monitor] Error en checkConductoresInactivos:', err);
  }
}

// ─── 3. Control de ingresos vs meta $100 ──────────────────────
export async function checkIngresos(): Promise<void> {
  console.log('[Monitor] Verificando ingresos del día...');
  try {
    const hora = currentHour();

    // Solo revisar en horas estratégicas: 12pm y 6pm (Ecuador)
    if (hora !== 12 && hora !== 18) return;

    const threshold = hora === 12 ? 30 : 60; // $30 al mediodía, $60 a las 6pm
    const horaStr = hora === 12 ? '12:00' : '18:00';

    const conductoresBajos = await getDriversBelowRevenueTarget(threshold);
    for (const conductor of conductoresBajos) {
      try {
        const msg = alertBajoIngreso(
          `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          conductor.vehicle?.placa || 'N/A',
          conductor.revenue?.today || 0,
          horaStr
        );
        await sendMessage(msg);
      } catch (err) {
        console.error(`[Monitor] Error alertando ingreso bajo ${conductor.id}:`, err);
      }
    }

    // Felicitar a los que alcanzaron $100
    // FIX: usar campo booleano goalCelebratedToday en lugar de .includes() sobre un Date
    const conductoresActivos = await getActiveDrivers();
    for (const conductor of conductoresActivos) {
      try {
        const revenue = conductor.revenue?.today || 0;
        const yaCelebrado = conductor.revenue?.goalCelebratedToday === true;
        if (revenue >= 100 && !yaCelebrado) {
          const msg = alertMetaAlcanzada(
            `${conductor.personal.nombre} ${conductor.personal.apellido}`,
            revenue
          );
          await sendMessage(msg);
          // Marcar como celebrado para no repetir la alerta hoy
          await db.collection('drivers').doc(conductor.id).update({
            'revenue.goalCelebratedToday': true,
          });
        }
      } catch (err) {
        console.error(`[Monitor] Error celebrando meta de conductor ${conductor.id}:`, err);
      }
    }

    console.log(`[Monitor] ${conductoresBajos.length} conductores bajo umbral a las ${horaStr}`);
  } catch (err) {
    console.error('[Monitor] Error en checkIngresos:', err);
  }
}

// ─── 4. Documentos por vencer ─────────────────────────────────
export async function checkDocumentos(): Promise<void> {
  console.log('[Monitor] Verificando documentos por vencer...');
  try {
    const { licenses, insurance, soat } = await getExpiringDocuments(15);

    for (const conductor of licenses) {
      try {
        const dias = daysUntil(conductor.license.expiry);
        const msg = alertDocumentoVence(
          `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          `Licencia tipo ${conductor.license.tipo}`,
          conductor.vehicle?.placa || 'N/A',
          dias,
          conductor.license.expiry
        );
        await sendMessage(msg);
        await saveAlert({
          type: 'license_expiring',
          severity: dias <= 7 ? 'critical' : 'warning',
          providerId: conductor.id,
          providerName: `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          message: `Licencia vence en ${dias} días`,
          data: { dias, expiry: conductor.license.expiry },
          sentAt: new Date().toISOString(),
          sentToTelegram: true,
        });
      } catch (err) {
        console.error(`[Monitor] Error procesando licencia de conductor ${conductor.id}:`, err);
      }
    }

    for (const conductor of insurance) {
      try {
        const dias = daysUntil(conductor.insurance.expiry);
        const msg = alertDocumentoVence(
          `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          'Seguro del vehículo',
          conductor.vehicle?.placa || 'N/A',
          dias,
          conductor.insurance.expiry
        );
        await sendMessage(msg);
      } catch (err) {
        console.error(`[Monitor] Error procesando seguro de conductor ${conductor.id}:`, err);
      }
    }

    for (const conductor of soat) {
      try {
        const dias = daysUntil(conductor.vehicle.soatExpiry);
        const msg = alertDocumentoVence(
          `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          'SOAT',
          conductor.vehicle?.placa || 'N/A',
          dias,
          conductor.vehicle.soatExpiry
        );
        await sendMessage(msg);
      } catch (err) {
        console.error(`[Monitor] Error procesando SOAT de conductor ${conductor.id}:`, err);
      }
    }

    console.log(`[Monitor] Licencias: ${licenses.length}, Seguros: ${insurance.length}, SOAT: ${soat.length}`);
  } catch (err) {
    console.error('[Monitor] Error en checkDocumentos:', err);
  }
}

// ─── 5. Calificaciones bajas ──────────────────────────────────
export async function checkCalificaciones(): Promise<void> {
  console.log('[Monitor] Verificando calificaciones...');
  try {
    const conductores = await getLowRatingDrivers(4.0);

    for (const conductor of conductores) {
      try {
        const msg = alertCalificacionBaja(
          `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          conductor.vehicle?.placa || 'N/A',
          conductor.rating?.average || 0,
          conductor.rating?.count || 0
        );
        await sendMessage(msg);
        await saveAlert({
          type: 'low_rating',
          severity: 'warning',
          providerId: conductor.id,
          providerName: `${conductor.personal.nombre} ${conductor.personal.apellido}`,
          message: `Rating ${conductor.rating?.average?.toFixed(1)} — por debajo de 4.0`,
          data: { rating: conductor.rating?.average, count: conductor.rating?.count },
          sentAt: new Date().toISOString(),
          sentToTelegram: true,
        });
      } catch (err) {
        console.error(`[Monitor] Error procesando calificación de conductor ${conductor.id}:`, err);
      }
    }
    console.log(`[Monitor] ${conductores.length} conductores con calificación baja`);
  } catch (err) {
    console.error('[Monitor] Error en checkCalificaciones:', err);
  }
}

// ─── 6. Reporte diario (8pm Ecuador) ──────────────────────────
export async function enviarReporteDiario(): Promise<void> {
  if (currentHour() !== 20) return;
  console.log('[Monitor] Generando reporte diario...');
  try {
    const stats = await getDailyRevenueStats();

    // FIX: usar Firestore Timestamp para queries de fecha, no strings ISO
    const todayStart = todayStartTimestamp();

    const ridesSnap = await db.collection('rides')
      .where('createdAt', '>=', todayStart)
      .get();

    const completados = ridesSnap.docs.filter(d => d.data().status === 'completed').length;
    const cancelados  = ridesSnap.docs.filter(d => d.data().status === 'cancelled').length;

    const alertasSnap = await db.collection('ops_alerts')
      .where('sentAt', '>=', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' }) + 'T00:00:00-05:00')
      .get();

    const msg = reporteDiario({
      fecha: new Date().toLocaleDateString('es-EC', {
        timeZone: 'America/Guayaquil',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      viajesCompletados: completados,
      viajesCancelados: cancelados,
      conductoresActivos: (await getActiveDrivers()).length,
      conductoresEnMeta: stats.driversAtTarget,
      ingresoTotal: stats.totalRevenue * 0.15, // 15% comisión Going
      topConductor: stats.topDriver?.name || 'N/A',
      topIngreso: stats.topDriver?.revenue || 0,
      alertasDelDia: alertasSnap.size,
    });

    await sendMessage(msg);
    console.log('[Monitor] Reporte diario enviado');
  } catch (err) {
    console.error('[Monitor] Error en enviarReporteDiario:', err);
  }
}

// ─── CICLO COMPLETO ───────────────────────────────────────────
export async function runAllMonitors(): Promise<void> {
  console.log('[OpsAgent] Iniciando ciclo de monitoreo —', new Date().toISOString());

  await checkRidesSinConductor();
  await checkConductoresInactivos();
  await checkIngresos();
  await checkDocumentos();
  await checkCalificaciones();
  await enviarReporteDiario();

  console.log('[OpsAgent] Ciclo completado —', new Date().toISOString());
}
