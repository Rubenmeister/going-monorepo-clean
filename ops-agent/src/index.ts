/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Rumi — ops-agent                                                    │
 * │  "piedra" (de Rumiñahui, guerrero defensor de Quito)                 │
 * │  Defensor de la operación. Monitorea producción, detecta anomalías,  │
 * │  alerta incidentes. Publica eventos a Pacha (cerebro) vía Pub/Sub.   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { v4 as uuidv4 } from 'uuid';
import { runAllMonitors } from './monitors/operations.monitor';
import { closeMongoClient, getRidesDb } from './mongodb/connection';
import {
  AgentRunEvent,
  parseCommandFromEnv,
  publishAgentRunEvent,
  runCommandMode,
} from '@going-platform/cerebro-contracts';

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

  // Modo command (Orchestrator triggea con env var override COMMAND_JSON).
  // Si está presente, ejecutamos solo la acción específica y salimos —
  // sin correr el ciclo de monitoreo normal.
  const cmd = parseCommandFromEnv();
  if (cmd) {
    await runCommandMode(cmd, {
      // Ejemplo handler para cuando se agreguen reglas concretas:
      // force_check_no_drivers: async () => { await checkRidesSinConductor(...); },
    });
    await closeMongoClient().catch(() => {});
    process.exit(0);
  }

  const runId     = uuidv4();
  const startedAt = new Date();
  let runStatus: 'success' | 'partial_failure' | 'failure' = 'success';
  let runResult: Awaited<ReturnType<typeof runAllMonitors>> | null = null;

  try {
    await smokeTestMongoDB();
    runResult = await runAllMonitors();

    if (runResult.collector.errors.length > 0) {
      runStatus = 'partial_failure';
      console.warn(
        `⚠️ Going Ops Agent terminó con errores parciales: ${runResult.collector.errors.join(', ')}`,
      );
    } else {
      console.log('✅ Going Ops Agent completado exitosamente');
    }
  } catch (err) {
    console.error('❌ Error fatal en Going Ops Agent:', err);
    runStatus = 'failure';
  } finally {
    const finishedAt = new Date();

    // Publicamos el evento incluso si runStatus = 'failure' — el cerebro
    // necesita saber que el agente corrió y falló (telemetría más útil
    // que el silencio total).
    if (runResult) {
      const event: AgentRunEvent = {
        agentId:    'ops-agent',
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
        console.error('[ops-agent] publish failed (non-fatal):', e),
      );
    }

    await closeMongoClient().catch(() => {});

    process.exit(runStatus === 'failure' ? 1 : 0);
  }
}

main();
