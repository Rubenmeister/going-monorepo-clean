import { runAllMonitors } from './monitors/operations.monitor';

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
