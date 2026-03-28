import { runAllMonitors } from './monitors/operations.monitor';

// ── Validación temprana de variables de entorno ───────────────────────────
const REQUIRED_VARS = ['GCP_PROJECT', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ [ops-agent] Faltan variables de entorno: ${missing.join(', ')}`);
  process.exit(1);
}

async function main() {
  console.log('🚀 Going Ops Agent iniciando...');
  try {
    await runAllMonitors();
    console.log('✅ Going Ops Agent completado exitosamente');
  } catch (err) {
    console.error('❌ Error en Going Ops Agent:', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
