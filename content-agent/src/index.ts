import { runContentMonitor } from './monitors/content.monitor';

// ── Validación de env vars ────────────────────────────────────
const REQUIRED_VARS = ['ANTHROPIC_API_KEY', 'GCP_PROJECT', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[content-agent] Faltan variables de entorno: ${missing.join(', ')}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('📰 Going Content Agent iniciando...');
  try {
    await runContentMonitor();
    console.log('✅ Going Content Agent completado');
  } catch (err) {
    console.error('❌ Error en Content Agent:', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
