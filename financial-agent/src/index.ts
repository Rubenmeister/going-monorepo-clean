import {
  runFinancialMonitor,
  processWeeklyPayouts,
  runBankReconciliation,
} from './monitors/financial.monitor';
import { closeMongoClient, getRidesDb } from './mongodb/connection';
import { seedTestRide, cleanupTestRides, showTestRideStatus, cancelTestInvoice } from './test/seed-test-ride';

// ============================================================
// Going – Financial Agent Entry Point
// Cloud Run Job (Cloud Scheduler: every 30 min)
// ============================================================

// ─── Validación temprana de env vars requeridas ───────────────
//
// AI (Vertex AI) usa Application Default Credentials del SA — no API key.
// Telegram quedó deprecado: las alertas salen por Gmail HTML.
const REQUIRED_VARS = [
  'GCP_PROJECT',
  'GMAIL_APP_PASSWORD', // password de app para nodemailer (alertas)
  'DATIL_API_KEY',
  'DATIL_ENV',
  'GOING_RUC',
  'MONGO_URL',          // rides/transactions/users desde MongoDB Atlas
];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[financial-agent] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

async function smokeTestMongoDB(): Promise<void> {
  console.log('🔍 [smoke] verificando conexión MongoDB...');
  const db = await getRidesDb();
  const sample = await db.collection('rides')
    .find({}, { projection: { _id: 1, status: 1, completedAt: 1 } })
    .sort({ completedAt: -1 })
    .limit(5)
    .toArray();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayCount = await db.collection('rides').countDocuments({
    status: 'completed',
    completedAt: { $gte: todayStart },
  });
  console.log(`✅ [smoke] MongoDB OK — ${sample.length} rides recientes en sample, ${todayCount} completados hoy`);
}

async function main(): Promise<void> {
  console.log('💰 Going Financial Agent starting...');
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // Día 1: smoke test de la conexión MongoDB antes del monitor
    await smokeTestMongoDB();

    // Modo de prueba E2E (Día 2/3): inserta un ride, deja que el loop
    // lo facture, verifica el resultado, limpia. Si DATIL_ENV=2 (prod),
    // anula también la factura emitida para no contaminar el SRI.
    let seededRideId: string | null = null;
    if (process.env.TEST_SEED === '1') {
      const env = process.env.DATIL_ENV === '2' ? 'PRODUCCIÓN SRI' : 'SANDBOX';
      console.log(`🧪 [test-mode] TEST_SEED=1 — corriendo prueba E2E (${env})`);
      const seeded = await seedTestRide();
      seededRideId = seeded._id;
    }

    // Triggers manuales (Días 4 y 5) — útiles para validar sin esperar
    // a lunes 9am o el run diario de 8am. Activan los flujos AL FINAL
    // del run normal para que la corrida quede completa.
    if (process.env.FORCE_WEEKLY_PAYOUTS === '1') {
      console.log('🧪 [test-mode] FORCE_WEEKLY_PAYOUTS=1 — disparando payouts semanales');
    }
    if (process.env.FORCE_RECONCILIATION === '1') {
      console.log('🧪 [test-mode] FORCE_RECONCILIATION=1 — disparando conciliación');
    }

    await runFinancialMonitor();

    if (process.env.FORCE_WEEKLY_PAYOUTS === '1') {
      await processWeeklyPayouts();
    }
    if (process.env.FORCE_RECONCILIATION === '1') {
      await runBankReconciliation();
    }

    if (seededRideId) {
      const issuedInvoiceId = await showTestRideStatus(seededRideId);
      // En producción: anular la factura emitida para no contaminar SRI
      if (issuedInvoiceId && process.env.DATIL_ENV === '2') {
        await cancelTestInvoice(issuedInvoiceId);
      }
      const deleted = await cleanupTestRides();
      console.log(`🧹 [test-mode] limpieza: ${deleted} ride(s) eliminados`);
    }

    console.log('✅ Financial Agent completed successfully');
  } catch (error) {
    console.error('❌ Financial Agent failed:', error);
    if (process.env.TEST_SEED === '1') {
      // Intentar limpiar incluso si hubo error
      await cleanupTestRides().catch(() => {});
    }
    await closeMongoClient().catch(() => {});
    process.exit(1);
  }

  await closeMongoClient().catch(() => {});
  process.exit(0);
}

main();
