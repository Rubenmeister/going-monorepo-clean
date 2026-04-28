import { runAllMonitors } from './monitors/operations.monitor';
import { closeMongoClient, getRidesDb } from './mongodb/connection';

// ── Validación temprana de variables de entorno ───────────────────────────
const REQUIRED_VARS = [
  'GCP_PROJECT',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'MONGO_URL',
];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ [ops-agent] Faltan variables de entorno: ${missing.join(', ')}`);
  process.exit(1);
}

async function smokeTestMongoDB(): Promise<void> {
  console.log('🔍 [smoke] verificando conexión MongoDB...');
  const db = await getRidesDb();
  const sample = await db.collection('rides')
    .find({}, { projection: { _id: 1, status: 1 } })
    .limit(3)
    .toArray();
  console.log(`✅ [smoke] MongoDB OK — ${sample.length} rides recientes en sample`);
}

async function main() {
  console.log('🚀 Going Ops Agent iniciando...');
  try {
    await smokeTestMongoDB();
    await runAllMonitors();
    console.log('✅ Going Ops Agent completado exitosamente');
  } catch (err) {
    console.error('❌ Error en Going Ops Agent:', err);
    await closeMongoClient().catch(() => {});
    process.exit(1);
  }
  await closeMongoClient().catch(() => {});
  process.exit(0);
}

main();
