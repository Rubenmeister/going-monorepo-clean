import { runFinancialMonitor } from './monitors/financial.monitor';
import { closeMongoClient, getRidesDb } from './mongodb/connection';

// ============================================================
// Going – Financial Agent Entry Point
// Cloud Run Job (Cloud Scheduler: every 30 min)
// ============================================================

// ─── Validación temprana de env vars requeridas ───────────────
const REQUIRED_VARS = [
  'ANTHROPIC_API_KEY',
  'GCP_PROJECT',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'DATIL_API_KEY',
  'DATIL_ENV',
  'GOING_RUC',
  'MONGO_URL', // requerido para leer rides/transactions/users desde MongoDB Atlas
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
    await runFinancialMonitor();
    console.log('✅ Financial Agent completed successfully');
  } catch (error) {
    console.error('❌ Financial Agent failed:', error);
    await closeMongoClient().catch(() => {});
    process.exit(1);
  }

  await closeMongoClient().catch(() => {});
  process.exit(0);
}

main();
