/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Kuntur — frontend-agent                                             │
 * │  "cóndor — el que vuela alto y se ve desde lejos"                    │
 * │  Frontend. Vercel deploys, web vitals, monitor de uptime de la cara  │
 * │  pública (app.goingec.com, goingec.com). Publica eventos a Pacha.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { v4 as uuidv4 } from 'uuid';
import { loadConfig } from './config';
import { runFrontendMonitor } from './monitors/frontend.monitor';
import {
  AgentRunEvent,
  parseCommandFromEnv,
  publishAgentRunEvent,
  runCommandMode,
} from '@going-platform/cerebro-contracts';

// ============================================================
// Going – Frontend Agent Entry Point
// Cloud Run Job — cron cada 6h (alineado con mobile-agent / going-agent).
// Lee Vercel API y publica al cerebro-service con anomalías de deploys.
// ============================================================

// Solo GCP_PROJECT es estrictamente requerido. Las vars de Vercel son
// opcionales — sin ellas el agent corre en "modo idle" (config_missing).
const REQUIRED_VARS = ['GCP_PROJECT'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[frontend-agent] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('🌐 Going Frontend Agent starting...');
  console.log(`Time: ${new Date().toISOString()}`);

  // Modo command (Orchestrator override COMMAND_JSON).
  // force_check re-corre el monitor on-demand. Útil cuando MyCortex sospecha
  // que un deploy Vercel falló y quiere data fresca sin esperar al cron de 6h.
  const cmd = parseCommandFromEnv();
  if (cmd) {
    const result = await runCommandMode(cmd, {
      force_check: async () => {
        console.log('[command] force_check — re-running monitor on demand');
        const startedAt = new Date();
        const config = loadConfig();
        const runResult = await runFrontendMonitor(config);
        const finishedAt = new Date();
        const event: AgentRunEvent = {
          agentId:    'frontend-agent',
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
          console.error('[frontend-agent force_check] publish failed:', e),
        );
      },
    });
    process.exit(result.ok ? 0 : 1);
  }

  const runId     = uuidv4();
  const startedAt = new Date();
  let runStatus: 'success' | 'partial_failure' | 'failure' = 'success';
  let runResult: Awaited<ReturnType<typeof runFrontendMonitor>> | null = null;

  try {
    const config = loadConfig();
    runResult = await runFrontendMonitor(config);

    if (runResult.collector.errors.length > 0) {
      runStatus = 'partial_failure';
      console.warn(
        `⚠️ Frontend Agent terminó con errores parciales: ${runResult.collector.errors.join(', ')}`,
      );
    } else {
      console.log('✅ Frontend Agent completed successfully');
    }
  } catch (error) {
    console.error('❌ Frontend Agent failed:', error);
    runStatus = 'failure';
  } finally {
    const finishedAt = new Date();

    if (runResult) {
      const event: AgentRunEvent = {
        agentId:    'frontend-agent',
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
        console.error('[frontend-agent] publish failed (non-fatal):', e),
      );
    }

    process.exit(runStatus === 'failure' ? 1 : 0);
  }
}

main();
