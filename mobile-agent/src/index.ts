import { v4 as uuidv4 } from 'uuid';
import { loadConfig } from './config';
import { runMobileMonitor } from './monitors/mobile.monitor';
import {
  AgentRunEvent,
  parseCommandFromEnv,
  publishAgentRunEvent,
  runCommandMode,
} from '@going-platform/cerebro-contracts';

// ============================================================
// Going – Mobile Agent Entry Point
// Cloud Run Job — cron cada 6h (alineado con going-agent).
// Lee Sentry API y publica al cerebro-service con anomalías + acciones.
// ============================================================

// ─── Validación temprana de env vars requeridas ───────────────
//
// Solo GCP_PROJECT es estrictamente requerido (para publicar al Pub/Sub).
// Las vars de Sentry son opcionales — si no están, el agent corre en
// "modo idle": registra que no está configurado y termina exit 0. Esto
// permite tener el job deployado y schedulado mientras el operador
// aún no creó la cuenta Sentry.
const REQUIRED_VARS = ['GCP_PROJECT'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[mobile-agent] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('📱 Going Mobile Agent starting...');
  console.log(`Time: ${new Date().toISOString()}`);

  // Modo command (Orchestrator override COMMAND_JSON).
  // force_check re-corre el monitor on-demand. Útil cuando MyCortex ve
  // anomalía Sentry y quiere data fresca sin esperar al cron de 6h.
  // Sigue publicando AgentRunEvent al cerebro como un ciclo normal.
  const cmd = parseCommandFromEnv();
  if (cmd) {
    const result = await runCommandMode(cmd, {
      force_check: async () => {
        console.log('[command] force_check — re-running monitor on demand');
        const startedAt = new Date();
        const config = loadConfig();
        const runResult = await runMobileMonitor(config);
        const finishedAt = new Date();
        // Publicar al cerebro igual que el run normal (telemetría completa).
        const event: AgentRunEvent = {
          agentId:    'mobile-agent',
          runId:      uuidv4(),
          startedAt:  startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          status:     runResult.collector.errors.length > 0 ? 'partial_failure' : 'success',
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
          console.error('[mobile-agent force_check] publish failed:', e),
        );
      },
    });
    process.exit(result.ok ? 0 : 1);
  }

  const runId     = uuidv4();
  const startedAt = new Date();
  let runStatus: 'success' | 'partial_failure' | 'failure' = 'success';
  let runResult: Awaited<ReturnType<typeof runMobileMonitor>> | null = null;

  try {
    const config = loadConfig();
    runResult = await runMobileMonitor(config);

    if (runResult.collector.errors.length > 0) {
      runStatus = 'partial_failure';
      console.warn(
        `⚠️ Mobile Agent terminó con errores parciales: ${runResult.collector.errors.join(', ')}`,
      );
    } else {
      console.log('✅ Mobile Agent completed successfully');
    }
  } catch (error) {
    console.error('❌ Mobile Agent failed:', error);
    runStatus = 'failure';
  } finally {
    const finishedAt = new Date();

    if (runResult) {
      const event: AgentRunEvent = {
        agentId:    'mobile-agent',
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
        console.error('[mobile-agent] publish failed (non-fatal):', e),
      );
    }

    process.exit(runStatus === 'failure' ? 1 : 0);
  }
}

main();
