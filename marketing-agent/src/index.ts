import { runMarketingMonitor } from './monitors/metrics.monitor';

// ============================================================
// Going – Marketing Agent Entry Point
// Runs as Cloud Run Job (triggered by Cloud Scheduler)
// ============================================================

// ─── Validación temprana de env vars requeridas ───────────────
const REQUIRED_VARS = ['ANTHROPIC_API_KEY', 'GCP_PROJECT'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[marketing-agent] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('🚀 Going Marketing Agent starting...');
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    await runMarketingMonitor();
    console.log('✅ Marketing Agent completed successfully');
  } catch (error) {
    console.error('❌ Marketing Agent failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
