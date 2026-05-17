/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Inti — financial-agent                                              │
 * │  "sol — fuente de valor y luz en la cosmovisión andina"              │
 * │  Finanzas. Datafast, reconciliación bancaria, reportes contables,    │
 * │  payouts semanales a conductores. Publica eventos a Pacha.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { v4 as uuidv4 } from 'uuid';
import {
  runFinancialMonitor,
  processWeeklyPayouts,
  runBankReconciliation,
} from './monitors/financial.monitor';
import { closeMongoClient, getRidesDb } from './mongodb/connection';
import { seedTestRide, cleanupTestRides, showTestRideStatus, cancelTestInvoice } from './test/seed-test-ride';
import {
  AgentRunEvent,
  parseCommandFromEnv,
  publishAgentRunEvent,
  runCommandMode,
} from '@going-platform/cerebro-contracts';

// ============================================================
// Going – Financial Agent Entry Point
// Cloud Run Job (Cloud Scheduler: 0 8,9,12,20 * * * Ecuador time)
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

  // Modo command (Orchestrator override COMMAND_JSON).
  const cmd = parseCommandFromEnv();
  if (cmd) {
    await runCommandMode(cmd, {
      // Handlers concretos se agregan cuando aparezcan reglas:
      // force_invoice_retry: async () => { await runInvoicingLoop(); },
      // force_weekly_payouts: async () => { await processWeeklyPayouts(); },
    });
    await closeMongoClient().catch(() => {});
    process.exit(0);
  }

  const runId     = uuidv4();
  const startedAt = new Date();
  let runStatus: 'success' | 'partial_failure' | 'failure' = 'success';
  let runResult: Awaited<ReturnType<typeof runFinancialMonitor>> | null = null;
  let seededRideId: string | null = null;

  try {
    // Día 1: smoke test de la conexión MongoDB antes del monitor
    await smokeTestMongoDB();

    // Modo de prueba E2E: inserta un ride, deja que el loop lo facture,
    // verifica el resultado, limpia. Si DATIL_ENV=2 (prod) anula también
    // la factura emitida para no contaminar el SRI.
    if (process.env.TEST_SEED === '1') {
      const env = process.env.DATIL_ENV === '2' ? 'PRODUCCIÓN SRI' : 'SANDBOX';
      console.log(`🧪 [test-mode] TEST_SEED=1 — corriendo prueba E2E (${env})`);
      const seeded = await seedTestRide();
      seededRideId = seeded._id;
    }

    if (process.env.FORCE_WEEKLY_PAYOUTS === '1') {
      console.log('🧪 [test-mode] FORCE_WEEKLY_PAYOUTS=1 — disparando payouts semanales');
    }
    if (process.env.FORCE_RECONCILIATION === '1') {
      console.log('🧪 [test-mode] FORCE_RECONCILIATION=1 — disparando conciliación');
    }

    runResult = await runFinancialMonitor();

    if (process.env.FORCE_WEEKLY_PAYOUTS === '1') {
      await processWeeklyPayouts();
    }
    if (process.env.FORCE_RECONCILIATION === '1') {
      await runBankReconciliation();
    }

    if (seededRideId) {
      const issuedInvoiceId = await showTestRideStatus(seededRideId);
      if (issuedInvoiceId && process.env.DATIL_ENV === '2') {
        await cancelTestInvoice(issuedInvoiceId);
      }
      const deleted = await cleanupTestRides();
      console.log(`🧹 [test-mode] limpieza: ${deleted} ride(s) eliminados`);
    }

    if (runResult.collector.errors.length > 0) {
      runStatus = 'partial_failure';
      console.warn(`⚠️ Financial Agent completó con errores parciales: ${runResult.collector.errors.join(', ')}`);
    } else {
      console.log('✅ Financial Agent completed successfully');
    }
  } catch (error) {
    console.error('❌ Financial Agent failed:', error);
    runStatus = 'failure';
    if (process.env.TEST_SEED === '1') {
      await cleanupTestRides().catch(() => {});
    }
  } finally {
    const finishedAt = new Date();

    // Publicamos el evento al cerebro incluso si runStatus = 'failure'
    // — telemetría más útil que silencio total.
    if (runResult) {
      const event: AgentRunEvent = {
        agentId:    'financial-agent',
        runId,
        startedAt:  startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        status:     runStatus,
        metrics:        runResult.collector.metrics,
        anomalies:      runResult.collector.anomalies,
        actionsTaken:   runResult.collector.actionsTaken,
        actionsProposed: runResult.collector.actionsProposed,
        meta: {
          gitSha: process.env.GIT_SHA,
          runEnv: (process.env.NODE_ENV === 'production' ? 'production' : 'staging'),
        },
      };

      await publishAgentRunEvent(event).catch(e =>
        console.error('[financial-agent] publish failed (non-fatal):', e),
      );
    }

    await closeMongoClient().catch(() => {});

    process.exit(runStatus === 'failure' ? 1 : 0);
  }
}

main();
