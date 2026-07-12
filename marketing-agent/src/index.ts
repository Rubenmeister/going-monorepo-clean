/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Sumak — marketing-agent                                             │
 * │  "bueno · hermoso" (del concepto andino Sumak Kawsay = buen vivir)   │
 * │  Marketing. Campañas, segmentación, bonos por zona, push de          │
 * │  retención. Publica eventos a Pacha.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { v4 as uuidv4 } from 'uuid';
import { runMarketingMonitor } from './monitors/metrics.monitor';
import { driverBonusZone } from './actions/driver-bonus-zone';
import type { SocialProposalSpec } from './social/social-loop';
import {
  AgentRunEvent,
  parseCommandFromEnv,
  publishAgentRunEvent,
  runCommandMode,
} from '@going-platform/cerebro-contracts';

// ============================================================
// Going App – Marketing Agent Entry Point
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
  console.log('🚀 Going App Marketing Agent starting...');
  console.log(`Time: ${new Date().toISOString()}`);

  // Modo command (Orchestrator override COMMAND_JSON).
  // Triggereado por agent-bridge cuando una intención Cat 3 es aprobada
  // via Telegram ack en /admin/cerebro/decisions/[id].
  const cmd = parseCommandFromEnv();
  if (cmd) {
    const result = await runCommandMode(cmd, {
      driver_bonus_zone: async (c: any) => {
        const r = await driverBonusZone(c.payload);
        if (!r.ok) throw new Error(r.error || 'driver_bonus_zone failed');
      },
    });
    process.exit(result.ok ? 0 : 1);
  }

  // ─── Modos del social loop (Fase 1) ───────────────────────────
  // SOCIAL_GENERATE=1 → genera propuestas multi-plataforma (status='review').
  // SOCIAL_PUBLISH=1  → publica las aprobadas por el humano (status='approved').
  if (process.env.SOCIAL_GENERATE === '1') {
    const { generateSocialProposals } = await import('./social/social-loop');
    const r = await generateSocialProposals(parseSocialSpecs());
    console.log(`[social] generate done: ${r.created} propuesta(s) en revisión.`);
    process.exit(0);
  }
  if (process.env.SOCIAL_PUBLISH === '1') {
    const { publishApprovedPosts } = await import('./social/social-loop');
    const r = await publishApprovedPosts();
    console.log(`[social] publish done: ${r.published} publicada(s), ${r.failed} fallida(s).`);
    process.exit(r.failed > 0 && r.published === 0 ? 1 : 0);
  }

  const runId     = uuidv4();
  const startedAt = new Date();
  let runStatus: 'success' | 'partial_failure' | 'failure' = 'success';
  let runResult: Awaited<ReturnType<typeof runMarketingMonitor>> | null = null;

  try {
    runResult = await runMarketingMonitor();

    // El loop social publica lo YA aprobado por el humano en cada corrida.
    try {
      const { publishApprovedPosts } = await import('./social/social-loop');
      const sp = await publishApprovedPosts();
      if (sp.published || sp.failed) {
        console.log(`[social] auto-publish: ${sp.published} publicada(s), ${sp.failed} fallida(s).`);
      }
    } catch (e) {
      console.error('[social] auto-publish falló (non-fatal):', (e as Error).message);
    }

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

      await publishAgentRunEvent(event).catch((e: any) =>
        console.error('[marketing-agent] publish failed (non-fatal):', e),
      );
    }

    process.exit(runStatus === 'failure' ? 1 : 0);
  }
}

/**
 * Specs de generación social. Lee SOCIAL_SPECS_JSON (array de specs) o usa un
 * default seguro (destacar una ruta en los canales de solo-texto).
 */
function parseSocialSpecs(): SocialProposalSpec[] {
  const raw = process.env.SOCIAL_SPECS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as SocialProposalSpec[];
    } catch (e) {
      console.error('[social] SOCIAL_SPECS_JSON inválido, uso default:', (e as Error).message);
    }
  }
  return [
    {
      topic: 'route_highlight',
      platforms: ['telegram_channel', 'facebook', 'x'],
      // El template route_highlight lee ctx.origin/ctx.destination (no ctx.route);
      // antes salía "Quito → Guayaquil" (fallback) ignorando la ruta pedida.
      contextData: { origin: 'Quito', destination: 'Riobamba', price: 20 },
      tone: 'friendly',
    },
  ];
}

main();
