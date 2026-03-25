import { runFinancialMonitor } from './monitors/financial.monitor';

// ============================================================
// Going – Financial Agent Entry Point
// Cloud Run Job (Cloud Scheduler: every 30 min)
// ============================================================

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
