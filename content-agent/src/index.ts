import { v4 as uuidv4 } from 'uuid';
import { runContentMonitor } from './monitors/content.monitor';
import {
  AgentRunEvent,
  parseCommandFromEnv,
  publishAgentRunEvent,
  runCommandMode,
} from '@going-platform/cerebro-contracts';

// ── Validación de env vars ────────────────────────────────────
//
// El agente publica al canal Telegram público de Going (TELEGRAM_BOT_TOKEN
// + chat). Si CONTENT_TELEGRAM_CHAT_ID no está, cae a TELEGRAM_CHAT_ID.
const REQUIRED_VARS = ['ANTHROPIC_API_KEY', 'GCP_PROJECT', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`[content-agent] Faltan variables de entorno: ${missing.join(', ')}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('📰 Going Content Agent iniciando...');

  // Modo command (Orchestrator override COMMAND_JSON).
  const cmd = parseCommandFromEnv();
  if (cmd) {
    await runCommandMode(cmd, {
      // force_weekly_tip: async () => { await generateWeeklyTip(); },
    });
    process.exit(0);
  }

  const runId     = uuidv4();
  const startedAt = new Date();
  let runStatus: 'success' | 'partial_failure' | 'failure' = 'success';
  let runResult: Awaited<ReturnType<typeof runContentMonitor>> | null = null;

  try {
    runResult = await runContentMonitor();

    if (runResult.collector.errors.length > 0) {
      runStatus = 'partial_failure';
      console.warn(`⚠️ Content Agent terminó con errores parciales: ${runResult.collector.errors.join(', ')}`);
    } else {
      console.log('✅ Going Content Agent completado');
    }
  } catch (err) {
    console.error('❌ Error fatal en Content Agent:', err);
    runStatus = 'failure';
  } finally {
    const finishedAt = new Date();

    if (runResult) {
      const event: AgentRunEvent = {
        agentId:    'content-agent',
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
        console.error('[content-agent] publish failed (non-fatal):', e),
      );
    }

    process.exit(runStatus === 'failure' ? 1 : 0);
  }
}

main();
