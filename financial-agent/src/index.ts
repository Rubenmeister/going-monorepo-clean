import { runFinancialMonitor } from './monitors/financial.monitor';

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
];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[financial-agent] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('💰 Going Financial Agent starting...');
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    await runFinancialMonitor();
    console.log('✅ Financial Agent completed successfully');
  } catch (error) {
    console.error('❌ Financial Agent failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
