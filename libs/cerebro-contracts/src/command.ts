/**
 * Helper para que los Cloud Run Jobs (cron agents) puedan recibir comandos
 * del Orchestrator via env var override `COMMAND_JSON`.
 *
 * El agent-bridge-service triggea jobs con:
 *   gcloud run jobs run <job> --update-env-vars=COMMAND_JSON='{"decisionId":...,"action":...,"payload":...}'
 *
 * El job, al arrancar, llama `parseCommandFromEnv()`. Si recibe un comando,
 * ejecuta el handler correspondiente en lugar del ciclo cron normal.
 */

export interface AgentCommand {
  decisionId: string;
  action:     string;
  payload:    Record<string, unknown>;
}

/**
 * Lee `process.env.COMMAND_JSON` y lo parsea. Devuelve null si no está
 * presente (ejecución cron normal) o si el JSON es inválido.
 */
export function parseCommandFromEnv(): AgentCommand | null {
  const raw = process.env.COMMAND_JSON;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.decisionId === 'string' &&
      typeof parsed.action === 'string'
    ) {
      return {
        decisionId: parsed.decisionId,
        action:     parsed.action,
        payload:    typeof parsed.payload === 'object' && parsed.payload !== null ? parsed.payload : {},
      };
    }
    console.warn('[cerebro-command] COMMAND_JSON inválido (faltan campos) — ignorando');
    return null;
  } catch (e) {
    console.warn(`[cerebro-command] COMMAND_JSON no parseable: ${(e as Error).message}`);
    return null;
  }
}

export type CommandHandler = (cmd: AgentCommand) => Promise<void>;

/**
 * Helper para que cada agent maneje el modo comando con un dispatcher de
 * handlers por action name.
 *
 * Uso típico en index.ts del agent:
 *
 *   const cmd = parseCommandFromEnv();
 *   if (cmd) {
 *     await runCommandMode(cmd, {
 *       force_check: async (c) => { await runAllMonitors(); },
 *       custom_alert: async (c) => { await sendAlert(c.payload.message); },
 *     });
 *     process.exit(0);
 *   }
 *   // sino → flujo normal del cron
 */
export async function runCommandMode(
  cmd: AgentCommand,
  handlers: Record<string, CommandHandler>,
): Promise<{ ok: boolean; error?: string }> {
  console.log(`[command-mode] decision=${cmd.decisionId.slice(0, 8)} action=${cmd.action}`);

  const handler = handlers[cmd.action];
  if (!handler) {
    // Acción desconocida — log y exit clean. El orchestrator marca como
    // 'executed' pero el operador puede ver en logs que el handler faltaba.
    console.warn(
      `[command-mode] no handler para action="${cmd.action}". ` +
      `Handlers disponibles: [${Object.keys(handlers).join(', ')}]. ` +
      `Exit 0 (no-op).`,
    );
    return { ok: true, error: `no_handler: ${cmd.action}` };
  }

  try {
    await handler(cmd);
    console.log(`[command-mode] action ${cmd.action} OK`);
    return { ok: true };
  } catch (e) {
    const err = (e as Error).message;
    console.error(`[command-mode] action ${cmd.action} threw: ${err}`);
    return { ok: false, error: err };
  }
}
