import { Firestore } from '@google-cloud/firestore';
import { sendMessage, alertNoConductor, alertConductorInactivo, alertBajoIngreso, alertMetaAlcanzada, alertDocumentoVence, alertCalificacionBaja, reporteDiario } from '../telegram/bot';
import { getActiveDrivers, getIdleDrivers, getDriversBelowRevenueTarget, getExpiringDocuments, getLowRatingDrivers, getDailyRevenueStats, saveAlert } from '../firestore/providers.service';

const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function currentHour(): number {
  return new Date().getHours();
}

// ─── 1. Viajes sin conductor asignado ─────────────────────────
export async function checkRidesSinConductor(): Promise<void> {
  console.log('[Monitor] Verificando viajes sin conductor...');

  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min atrás
  const snap = await db.collection('rides')
    .where('status', '==', 'pending')
    .where('createdAt', '<=', cutoff)
    .get();

  for (const doc of snap.docs) {
    const ride = doc.data();
    const minutos = Math.round((Date.now() - new Date(ride.createdAt).getTime()) / 60000);
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
  }

  console.log(`[Monitor] ${snap.size} viajes sin conductor encontrados`);
}

// ─── 2. Conductores inactivos (conectados sin viajes) ─────────
export async function checkConductoresInactivos(): Promise<void> {
  console.log('[Monitor] Verificando conductores inactivos...');
  const conductores = await getIdleDrivers(2); // +2 horas idle

  for (const conductor of conductores) {
    const msg = alertConductorInactivo(
      `${conductor.personal.nombre} ${conductor.personal.apellido}`,
      conductor.vehicle?.placa || 'N/A',
      conductor.serviceHours?.hoursIdle || 0,
      conductor.location?.provincia || 'N/A'
    );
    await sendMessage(msg);

    // Dar prioridad: actualizar flag en Firestore
    await db.collection('drivers').doc(conductor.id).update({
      'priority': true,
      'prioritySetAt': new Date().toISOString(),
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
  }

  console.log(`[Monitor] ${conductores.length} conductores inactivos encontrados`);
}

// ─── 3. Control de ingresos vs meta $100 ──────────────────────
export async function checkIngresos(): Promise<void> {
  console.log('[Monitor] Verificando ingresos del día...');
  const hora = currentHour();

  // Solo revisar en horas estratégicas: 12pm y 6pm
  if (hora !== 12 && hora !== 18) return;

  const threshold = hora === 12 ? 30 : 60; // $30 al mediodía, $60 a las 6pm
  const conductoresBajos = await getDriversBelowRevenueTarget(threshold);
  const horaStr = hora === 12 ? '12:00' : '18:00';

  for (const conductor of conductoresBajos) {
    const msg = alertBajoIngreso(
      `${conductor.personal.nombre} ${conductor.personal.apellido}`,
      conductor.vehicle?.placa || 'N/A',
      conductor.revenue?.today || 0,
      horaStr
    );
    await sendMessage(msg);
  }

  // Felicitar a los que alcanzaron $100
  const conductoresActivos = await getActiveDrivers();
  for (const conductor of conductoresActivos) {
    const revenue = conductor.revenue?.today || 0;
    if (revenue >= 100 && !conductor.revenue?.lastRideAt?.includes('celebrated')) {
      const msg = alertMetaAlcanzada(
        `${conductor.personal.nombre} ${conductor.personal.apellido}`,
        revenue
      );
      await sendMessage(msg);
    }
  }

  console.log(`[Monitor] ${conductoresBajos.length} conductores bajo umbral a las ${horaStr}`);
}

// ─── 4. Documentos por vencer ─────────────────────────────────
export async function checkDocumentos(): Promise<void> {
  console.log('[Monitor] Verificando documentos por vencer...');
  const { licenses, insurance, soat } = await getExpiringDocuments(15);

  for (const conductor of licenses) {
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
  }

  for (const conductor of insurance) {
    const dias = daysUntil(conductor.insurance.expiry);
    const msg = alertDocumentoVence(
      `${conductor.personal.nombre} ${conductor.personal.apellido}`,
      'Seguro del vehículo',
      conductor.vehicle?.placa || 'N/A',
      dias,
      conductor.insurance.expiry
    );
    await sendMessage(msg);
  }

  for (const conductor of soat) {
    const dias = daysUntil(conductor.vehicle.soatExpiry);
    const msg = alertDocumentoVence(
      `${conductor.personal.nombre} ${conductor.personal.apellido}`,
      'SOAT',
      conductor.vehicle?.placa || 'N/A',
      dias,
      conductor.vehicle.soatExpiry
    );
    await sendMessage(msg);
  }

  console.log(`[Monitor] Licencias: ${licenses.length}, Seguros: ${insurance.length}, SOAT: ${soat.length}`);
}

// ─── 5. Calificaciones bajas ──────────────────────────────────
export async function checkCalificaciones(): Promise<void> {
  console.log('[Monitor] Verificando calificaciones...');
  const conductores = await getLowRatingDrivers(4.0);

  for (const conductor of conductores) {
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
  }

  console.log(`[Monitor] ${conductores.length} conductores con calificación baja`);
}

// ─── 6. Reporte diario (8pm) ──────────────────────────────────
export async function enviarReporteDiario(): Promise<void> {
  if (currentHour() !== 20) return;
  console.log('[Monitor] Generando reporte diario...');

  const stats = await getDailyRevenueStats();

  // Contar viajes del día
  const today = new Date().toISOString().split('T')[0];
  const ridesSnap = await db.collection('rides')
    .where('createdAt', '>=', `${today}T00:00:00.000Z`)
    .get();

  const completados = ridesSnap.docs.filter(d => d.data().status === 'completed').length;
  const cancelados  = ridesSnap.docs.filter(d => d.data().status === 'cancelled').length;

  const alertasSnap = await db.collection('ops_alerts')
    .where('sentAt', '>=', `${today}T00:00:00.000Z`)
    .get();

  const msg = reporteDiario({
    fecha: new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
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
