// ──────────────────────────────────────────────────────────────────────────────
// Going Managed Agents — Runner
// Inicia una sesión del agente y hace streaming de la respuesta
//
// Uso:
//   tsx src/runner.ts content      → content agent
//   tsx src/runner.ts financial    → financial agent
//   tsx src/runner.ts marketing    → marketing agent
//   tsx src/runner.ts ops          → ops agent
// ──────────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { ALL_AGENTS, AgentDefinition } from './agents/definitions';

// ── Cargar env vars ───────────────────────────────────────────────────────────
const REQUIRED = [
  'ANTHROPIC_API_KEY',
  'MANAGED_AGENTS_ENVIRONMENT_ID',
  'MANAGED_AGENT_CONTENT_ID',
  'MANAGED_AGENT_FINANCIAL_ID',
  'MANAGED_AGENT_MARKETING_ID',
  'MANAGED_AGENT_OPS_ID',
];

const missing = REQUIRED.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ Faltan env vars: ${missing.join(', ')}`);
  console.error('   Ejecuta primero: tsx src/setup.ts');
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Mapa de agentes ────────────────────────────────────────────────────────────
const AGENT_ID_MAP: Record<string, string> = {
  content: process.env.MANAGED_AGENT_CONTENT_ID!,
  financial: process.env.MANAGED_AGENT_FINANCIAL_ID!,
  marketing: process.env.MANAGED_AGENT_MARKETING_ID!,
  ops: process.env.MANAGED_AGENT_OPS_ID!,
  code: process.env.MANAGED_AGENT_CODE_ID!,
};

// ── Tarea para cada agente ─────────────────────────────────────────────────────
function buildTask(agentKey: string): string {
  const now = new Date().toLocaleString('es-EC', {
    timeZone: 'America/Guayaquil',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const tasks: Record<string, string> = {
    content: `Ejecuta el ciclo de monitoreo de contenido.
Fecha y hora actual en Ecuador: ${now}.
Realiza todos los chequeos correspondientes a esta hora del día.
Variables de entorno disponibles: GCP_PROJECT, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.`,

    financial: `Ejecuta el ciclo de monitoreo financiero.
Fecha y hora actual en Ecuador: ${now}.
Verifica pagos pendientes, calcula métricas del día y genera las facturas pendientes.
Variables de entorno disponibles: GCP_PROJECT, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, DATIL_API_KEY, GOING_RUC.`,

    marketing: `Ejecuta el ciclo de marketing.
Fecha y hora actual en Ecuador: ${now}.
Genera y publica contenido apropiado para este momento del día.
Variables de entorno disponibles: GCP_PROJECT, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.`,

    ops: `Ejecuta el ciclo de monitoreo de operaciones.
Fecha y hora actual en Ecuador: ${now}.
Verifica el estado de todos los servicios y proveedores. Alerta solo si hay cambios de estado.
Variables de entorno disponibles: GCP_PROJECT, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.`,

    code: `Ejecuta un ciclo de revisión de código del monorepo Going.
Fecha y hora actual en Ecuador: ${now}.
Revisa los logs de Cloud Run, detecta errores y aplica correcciones en rama agent/fixes.
Variables de entorno disponibles: GCP_PROJECT, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.`,
  };

  return tasks[agentKey] ?? `Ejecuta tu ciclo normal. Hora: ${now}`;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function run(agentKey: string) {
  const def = ALL_AGENTS[agentKey as keyof typeof ALL_AGENTS] as AgentDefinition;
  if (!def) {
    console.error(`❌ Agente desconocido: "${agentKey}". Opciones: ${Object.keys(ALL_AGENTS).join(', ')}`);
    process.exit(1);
  }

  const agentId = AGENT_ID_MAP[agentKey];
  const environmentId = process.env.MANAGED_AGENTS_ENVIRONMENT_ID!;
  const startTime = Date.now();

  console.log(`🤖 [${def.name}] Iniciando sesión...`);
  console.log(`   Agent ID: ${agentId}`);
  console.log(`   Environment: ${environmentId}\n`);

  // ── Crear sesión ──────────────────────────────────────────────────────────
  const session = await (client.beta as any).sessions.create({
    agent: agentId,
    environment_id: environmentId,
    title: `${def.name} — ${new Date().toISOString()}`,
  });

  console.log(`   Session ID: ${session.id}\n`);
  console.log('─'.repeat(60));

  // ── Abrir stream ──────────────────────────────────────────────────────────
  const stream = await (client.beta as any).sessions.events.stream(session.id);

  // ── Enviar tarea ──────────────────────────────────────────────────────────
  await (client.beta as any).sessions.events.send(session.id, {
    events: [
      {
        type: 'user.message',
        content: [{ type: 'text', text: buildTask(agentKey) }],
      },
    ],
  });

  // ── Procesar eventos en streaming ─────────────────────────────────────────
  let toolCount = 0;
  for await (const event of stream) {
    switch (event.type) {
      case 'agent.message':
        for (const block of event.content ?? []) {
          if (block.text) process.stdout.write(block.text);
        }
        break;

      case 'agent.tool_use':
        toolCount++;
        console.log(`\n⚙️  [tool] ${event.name}`);
        break;

      case 'session.status_idle':
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n' + '─'.repeat(60));
        console.log(`✅ [${def.name}] Completado`);
        console.log(`   Tiempo: ${elapsed}s | Tools usados: ${toolCount}`);
        console.log(`   Costo aprox: $${((Date.now() - startTime) / 3600000 * 0.08).toFixed(4)} (session-hour)`);
        break;

      case 'session.status_error':
        console.error(`\n❌ Error en sesión: ${JSON.stringify(event)}`);
        process.exit(1);
    }
  }
}

// ── Entry point ────────────────────────────────────────────────────────────────
const agentKey = process.argv[2];
if (!agentKey) {
  console.error('Uso: tsx src/runner.ts <content|financial|marketing|ops>');
  process.exit(1);
}

run(agentKey).catch((err) => {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
});
