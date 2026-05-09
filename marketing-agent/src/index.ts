import { v4 as uuidv4 } from 'uuid';
import { runMarketingMonitor } from './monitors/metrics.monitor';
import {
  AgentRunEvent,
  parseCommandFromEnv,
  publishAgentRunEvent,
  runCommandMode,
} from '@going-platform/cerebro-contracts';

// ============================================================
// Going – Marketing Agent Entry Point
// Runs as Cloud Run Job (triggered by Cloud Scheduler: lunes 9am Ecuador)
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

  // Modo command (Orchestrator override COMMAND_JSON).
  const cmd = parseCommandFromEnv();
  if (cmd) {
    await runCommandMode(cmd, {
      // driver_bonus_zone: async (c) => { await sendDriverBonusToZone(c.payload.zone); },
    });
    process.exit(0);
  }

  const runId     = uuidv4();
  const startedAt = new Date();
  let runStatus: 'success' | 'partial_failure' | 'failure' = 'success';
  let runResult: Awaited<ReturnType<typeof runMarketingMonitor>> | null = null;

  try {
    runResult = await runMarketingMonitor();

    if (runResult.collector.errors.length > 0) {
      runStatus = 'partial_failure';
      console.warn(`⚠️ Marketing Agent terminó con errores parciales: ${runResult.collector.errors.join(', ')}`);
    } else {
      console.log('✅ Marketing Agent completed successfully');
    }
  } catch (error) {
    console.error('❌ Marketing Agent failed:', error);
    runStatus = 'failure';
  } finally {
    const finishedAt = new Date();

    if (runResult) {
      const event: AgentRunEvent = {
        agentId:    'marketing-agent',
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
        console.error('[marketing-agent] publish failed (non-fatal):', e),
      );
    }

    process.exit(runStatus === 'failure' ? 1 : 0);
  }
}

main();
