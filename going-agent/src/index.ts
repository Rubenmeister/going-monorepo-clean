/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Sacha — going-agent                                                 │
 * │  "selva · naturaleza — el todo del que somos parte"                  │
 * │  Agente del producto core. Rides, transport, growth, métricas de la  │
 * │  plataforma. Publica eventos a Pacha.                                │
 * │                                                                      │
 * │  Migrado a Vertex AI / Gemini (2026-05-23):                          │
 * │   - Eliminada dependencia de @anthropic-ai/sdk y ANTHROPIC_API_KEY.  │
 * │   - Usa @google-cloud/vertexai con ADC del SA going-agent-sa.        │
 * │   - Modelo default: gemini-2.5-flash (mismo patrón que financial).   │
 * │   - Tool-use mapeado: Anthropic.Tool → FunctionDeclaration,          │
 * │     tool_use → functionCall, tool_result → functionResponse,         │
 * │     role 'assistant' → 'model'.                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { VertexAI } from '@google-cloud/vertexai';
import { execSync } from 'child_process';
import * as fsSync from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { GitTool } from './tools/git';
import { FilesystemTool } from './tools/filesystem';
import { CloudRunTool } from './tools/cloudrun';
import { MemoryStore } from './memory/context';
import {
  AgentRunEvent,
  Anomaly,
  ActionTaken,
  ActionProposed,
  parseCommandFromEnv,
  publishAgentRunEvent,
  runCommandMode,
} from '@going-platform/cerebro-contracts';
import { fetchPlatformPulse, derivePulseSignals } from './platform-pulse';

// ─── RunCollector compartido (Cerebro) ───────────────────────
//
// Acumula durante el ciclo del agente para publicar al cerebro al final.

interface RunCollector {
  metrics:         Record<string, number | string>;
  anomalies:       Anomaly[];
  actionsTaken:    ActionTaken[];
  actionsProposed: ActionProposed[];
  errors:          string[];
}

function createCollector(): RunCollector {
  return { metrics: {}, anomalies: [], actionsTaken: [], actionsProposed: [], errors: [] };
}

// ── Notificación al canal Telegram (para que el reporte se vea) ────────────
async function sendTelegramReport(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[going-agent] sin TELEGRAM_BOT_TOKEN/CHAT_ID — reporte solo a logs');
    return;
  }
  // Telegram tope: 4096 chars. Cortamos con margen.
  const body = text.length > 3800 ? text.slice(0, 3800) + '\n\n…(truncado)' : text;
  const send = async (useMarkdown: boolean) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: body,
        ...(useMarkdown ? { parse_mode: 'Markdown' } : {}),
        disable_web_page_preview: true,
      }),
    });
    return (await res.json()) as { ok: boolean; description?: string };
  };
  try {
    const data = await send(true);
    if (!data.ok) {
      // Markdown roto por algún carácter dinámico (·, %, _, *…). Reintento en
      // texto plano para no perder el reporte — mejor sin formato que sin aviso.
      console.warn('[going-agent] Telegram Markdown falló, reintento texto plano:', data.description);
      const plain = await send(false);
      if (!plain.ok) console.error('[going-agent] Telegram error (plano):', plain.description);
    }
  } catch (e) {
    console.error('[going-agent] Excepción Telegram:', (e as Error).message);
  }
}

// ── Asegurar que tenemos el repo clonado en este contenedor ───────────────
function ensureRepo() {
  const REPO_PATH = process.env.REPO_PATH || '/tmp/going-repo';
  const GIT_TOKEN = process.env.GIT_TOKEN;
  const REPO_URL  = process.env.REPO_URL || 'github.com/Rubenmeister/going-monorepo-clean.git';

  if (!GIT_TOKEN) {
    throw new Error('GIT_TOKEN no configurado — going-agent necesita el secret para clonar el repo');
  }

  if (fsSync.existsSync(`${REPO_PATH}/.git`)) {
    console.log(`[going-agent] repo existe en ${REPO_PATH}, pulling latest...`);
    execSync(`git -C ${REPO_PATH} pull --quiet --rebase`, { stdio: 'inherit' });
  } else {
    console.log(`[going-agent] clonando repo a ${REPO_PATH}...`);
    const url = `https://x-access-token:${GIT_TOKEN}@${REPO_URL}`;
    execSync(`git clone --depth=50 ${url} ${REPO_PATH}`, { stdio: 'pipe' });
  }
  (config as any).repoPath = REPO_PATH;
}

ensureRepo();

// ── Vertex AI client (ADC del SA del Cloud Run Job) ────────────────────────
const vertexAI = new VertexAI({
  project:  config.gcpProject,
  location: config.gcpRegion,
});

const git = new GitTool();
const fs = new FilesystemTool();
const cloudrun = new CloudRunTool();
const memory = new MemoryStore();

// ── Definición de herramientas (FunctionDeclarations de Gemini) ───────────
//
// La forma del schema viene del estándar OpenAPI 3 que Gemini interpreta.
// Usamos string literals para el type (`'OBJECT'`, `'STRING'`, etc.) — el
// SDK los acepta sin necesidad de importar el enum SchemaType.
const tools: any[] = [{
  functionDeclarations: [
    {
      name: 'read_file',
      description: 'Lee el contenido de un archivo del repositorio',
      parameters: {
        type: 'OBJECT',
        properties: { path: { type: 'STRING', description: 'Ruta relativa al repo' } },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Escribe o modifica un archivo del repositorio. Nunca modificar archivos protegidos.',
      parameters: {
        type: 'OBJECT',
        properties: {
          path:    { type: 'STRING' },
          content: { type: 'STRING', description: 'Contenido completo del archivo' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'list_directory',
      description: 'Lista archivos y carpetas en un directorio del repo',
      parameters: {
        type: 'OBJECT',
        properties: {
          path:  { type: 'STRING', description: 'Ruta relativa (ej: "api-gateway/src")' },
          depth: { type: 'NUMBER', description: 'Profundidad máxima (1-3)' },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_cloud_run_logs',
      description: 'Obtiene logs de errores de un servicio en Cloud Run',
      parameters: {
        type: 'OBJECT',
        properties: { service: { type: 'STRING', description: 'Nombre del servicio (ej: api-gateway)' } },
        required: ['service'],
      },
    },
    {
      name: 'get_failed_builds',
      description: 'Lista los builds fallidos recientes en Cloud Build',
      parameters: { type: 'OBJECT', properties: {}, required: [] },
    },
    {
      name: 'get_git_log',
      description: 'Obtiene los últimos commits del repositorio',
      parameters: {
        type: 'OBJECT',
        properties: { lines: { type: 'NUMBER' } },
        required: [],
      },
    },
    {
      name: 'commit_fix',
      description: 'Hace commit de archivos modificados en la rama agent/fixes. Solo usar después de write_file.',
      parameters: {
        type: 'OBJECT',
        properties: {
          message: { type: 'STRING', description: 'Descripción del fix' },
          files:   { type: 'ARRAY', items: { type: 'STRING' }, description: 'Archivos a incluir' },
        },
        required: ['message', 'files'],
      },
    },
  ],
}];

// Cap de tamaño en resultados de tools — los reads de archivos grandes
// disparan context overflow tras varias iteraciones.
const TOOL_RESULT_MAX_CHARS = 4000;

function trimToolResult(result: string): string {
  if (result.length <= TOOL_RESULT_MAX_CHARS) return result;
  return result.slice(0, TOOL_RESULT_MAX_CHARS) + `\n\n…(truncado, ${result.length - TOOL_RESULT_MAX_CHARS} chars omitidos)`;
}

// ── Ejecutor de herramientas (sin cambios respecto a la versión Anthropic) ─
async function executeTool(
  name: string,
  input: Record<string, any>,
  c?: RunCollector,
): Promise<string> {
  try {
    switch (name) {
      case 'read_file': {
        if (!input.path || typeof input.path !== 'string') {
          return `❌ Error: Missing required field: path`;
        }
        return fs.readFile(input.path);
      }
      case 'write_file':
        fs.writeFile(input.path, input.content);
        if (c) {
          c.actionsTaken.push({
            type: 'write_file',
            target: input.path,
            result: 'ok',
          });
        }
        return `✅ Archivo escrito: ${input.path}`;
      case 'list_directory':
        return fs.listDir(input.path, input.depth || 1).join('\n');
      case 'get_cloud_run_logs': {
        const result = await cloudrun.getServiceLogs(input.service);
        if (c && result && !result.startsWith('✅') && !result.startsWith('❌ Error leyendo')) {
          c.anomalies.push({
            type: 'cloud_run_errors_found',
            severity: 'warning',
            message: `Errores en logs de ${input.service}`,
            data: { service: input.service, sample: result.slice(0, 500) },
          });
        }
        return result;
      }
      case 'get_failed_builds': {
        const result = await cloudrun.getFailedBuilds();
        if (c && result && !result.startsWith('✅') && !result.startsWith('❌ Error')) {
          c.anomalies.push({
            type: 'failed_builds_found',
            severity: 'warning',
            message: 'Builds fallidos en Cloud Build',
            data: { sample: result.slice(0, 500) },
          });
        }
        return result;
      }
      case 'get_git_log':
        return git.getRecentLog(input.lines || 10);
      case 'commit_fix': {
        if (!input.message || typeof input.message !== 'string') {
          return `❌ Error: Missing required field: message`;
        }
        if (!input.files || !Array.isArray(input.files)) {
          return `❌ Error: Missing required field: files`;
        }
        const branch = await git.getCurrentBranch();
        if (branch !== config.agentBranch) {
          await git.createAgentBranch();
        }
        const commit = await git.commitAndPush(input.message, input.files);
        await memory.recordFix(input.message, commit);
        if (c) {
          c.actionsTaken.push({
            type: 'commit_fix',
            target: config.agentBranch,
            result: 'ok',
            data: { sha: commit, message: input.message, files: input.files },
          });
        }
        return `✅ Commit: ${commit}`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e: any) {
    if (c) {
      c.actionsTaken.push({
        type: name,
        target: input?.path || input?.service || input?.message,
        result: 'failed',
        data: { error: e.message },
      });
    }
    return `❌ Error: ${e.message}`;
  }
}

// ── Retry con backoff para rate limits / quota exhausted ──────────────────
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      const msg = String(e?.message || '');
      const isRetryable =
        e?.code === 429 ||
        e?.status === 429 ||
        msg.includes('429') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE');
      if (isRetryable && attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 15000; // 15s, 30s, 60s, 120s
        console.log(`  ⏳ Vertex quota/rate — esperando ${waitMs / 1000}s (intento ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        throw e;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// ── Loop principal del agente ──────────────────────────────────────────────
async function runAgentCycle(c: RunCollector): Promise<{ finalReport: string }> {
  console.log(`\n🤖 Going Agent — ${new Date().toLocaleString()}`);
  console.log(`📊 ${memory.summary()}\n`);

  await memory.load();
  await memory.recordRun();

  const systemPrompt = `Eres el agente autónomo de código de Going, una plataforma de transporte y turismo en Ecuador.

Tu función es mantener el monorepo en buen estado. En cada ciclo debes:
1. Revisar logs de Cloud Run en busca de errores nuevos
2. Revisar builds fallidos
3. Si encuentras un problema, leer el código relevante y proponer/aplicar el fix
4. Hacer commit del fix en la rama "${config.agentBranch}" (NUNCA en main)
5. Reportar concisamente qué encontraste y qué hiciste

Reglas estrictas:
- NUNCA modificar archivos en: ${config.blacklist.join(', ')}
- NUNCA hacer commit directo a main
- NUNCA borrar archivos
- Si no estás seguro de un fix, solo reporta el problema sin modificar código
- NUNCA termines con preguntas al usuario tipo "¿Quieres que profundice en X?"
  — el reporte va a un canal Telegram automático, nadie va a responder.
- Sé conciso: el reporte final debe caber en 1500 caracteres (Telegram).
  Usa Markdown: títulos con \`*Título*\`, listas con \`-\`, código con \`\\\`comando\\\`\`.
  Empieza con un emoji de status: ✅ todo OK, ⚠️ problemas detectados, 🚨 crítico.

El stack es: NestJS 11 + Fastify 5 (api-gateway), NestJS + Express (servicios), Next.js 14 (frontend), MongoDB Atlas, Cloud Run, Cloud Build.`;

  const modelName = process.env.AGENT_MODEL || 'gemini-2.5-flash';

  const model = vertexAI.getGenerativeModel({
    model: modelName,
    systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] } as any,
    tools,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
  });

  // Historia de la conversación (manejada manualmente para tener control sobre el pruning).
  const contents: any[] = [
    {
      role: 'user',
      parts: [{
        text: `Ejecuta un ciclo de revisión. Revisa los servicios más críticos: api-gateway, user-auth-service, frontend-webapp.
Busca errores en los logs y builds fallidos. Si encuentras algo concreto para arreglar, aplica el fix y haz commit en agent/fixes.
Reporta todo lo que encuentres.`,
      }],
    },
  ];

  const MAX_ITERATIONS = 15;
  let iterations = 0;
  let toolCallsCount = 0;
  let finalReport = '';

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const result: any = await callWithRetry(() => model.generateContent({ contents }));
    const candidate = result.response.candidates?.[0];
    if (!candidate?.content) {
      console.warn('[going-agent] Vertex no devolvió content — corto el loop');
      break;
    }

    const parts: any[] = candidate.content.parts || [];

    // Agregar turno del modelo a la historia.
    contents.push({ role: 'model', parts });

    // Buscar function calls en el response.
    const fnCalls = parts.filter((p: any) => p.functionCall);

    if (fnCalls.length === 0) {
      // Sin function calls → texto final del agente.
      finalReport = parts
        .filter((p: any) => typeof p.text === 'string')
        .map((p: any) => p.text)
        .join('\n');
      break;
    }

    // Ejecutar cada function call y armar el turno de functionResponses.
    const fnResponses: any[] = [];
    for (const part of fnCalls) {
      const fc = part.functionCall;
      const args = (fc.args || {}) as Record<string, any>;
      console.log(`  🔧 ${fc.name}(${JSON.stringify(args).slice(0, 80)})`);
      const rawResult = await executeTool(fc.name, args, c);
      const trimmed   = trimToolResult(rawResult);
      console.log(`     → ${trimmed.slice(0, 100)}${rawResult.length > TOOL_RESULT_MAX_CHARS ? ' [trimmed]' : ''}`);
      fnResponses.push({
        functionResponse: {
          name: fc.name,
          response: { content: trimmed },
        },
      });
      toolCallsCount++;
    }

    // Gemini espera el turno con functionResponses como role 'user'.
    contents.push({ role: 'user', parts: fnResponses });

    // Mantener historia acotada. Removemos en pares (model + user) para no
    // dejar functionResponses huérfanos sin su functionCall.
    while (contents.length > 17) {
      contents.splice(1, 2);
    }
  }

  // Si nunca generó texto final, forzar cierre con un turno SIN tools.
  if (!finalReport) {
    console.log(`\n⏰ Iteraciones máximas (${MAX_ITERATIONS}) alcanzadas — forzando reporte final`);

    const closingModel = vertexAI.getGenerativeModel({
      model: modelName,
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] } as any,
      generationConfig: { maxOutputTokens: 2000, temperature: 0.4 },
      // sin tools — para que no pueda escapar pidiendo más function calls.
    });

    const closingContents = [
      ...contents,
      {
        role: 'user',
        parts: [{
          text:
            'Tu tiempo de exploración terminó. Genera AHORA el reporte final del ciclo en máximo 1500 caracteres ' +
            'siguiendo el formato Markdown indicado. NO uses más herramientas. NO hagas preguntas. ' +
            'Solo el reporte basado en lo que ya investigaste.',
        }],
      },
    ];

    try {
      const closing: any = await callWithRetry(() => closingModel.generateContent({ contents: closingContents }));
      const candidate = closing.response.candidates?.[0];
      finalReport = candidate?.content?.parts
        ?.filter((p: any) => typeof p.text === 'string')
        ?.map((p: any) => p.text)
        ?.join('\n') || '';
    } catch (e) {
      console.error('[going-agent] No se pudo generar reporte forzado:', (e as Error).message);
      finalReport = `⚠️ *Going Agent — ciclo ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}*\n\n` +
        `El agente exploró ${MAX_ITERATIONS} iteraciones sin llegar a una conclusión y la generación ` +
        `forzada del reporte falló (${(e as Error).message.slice(0, 200)}).\n\n` +
        `Revisa los logs de Cloud Run Job \`going-agent\` para ver qué se investigó.`;
    }
  }

  console.log('\n📋 Reporte del agente:\n', finalReport);

  // Métricas finales del ciclo al collector.
  c.metrics.iterations = iterations;
  c.metrics.toolCallsCount = toolCallsCount;
  c.metrics.maxIterationsReached = iterations >= MAX_ITERATIONS ? 1 : 0;

  const trimmed = finalReport.trim();
  if (trimmed.length > 50) {
    const header = `🤖 *Going Agent — ciclo ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}*\n\n`;
    await sendTelegramReport(header + trimmed);
    c.actionsTaken.push({
      type: 'sent_telegram_report',
      target: 'ops_chat',
      result: 'ok',
      data: { reportLength: trimmed.length, iterations, toolCalls: toolCallsCount },
    });
  } else {
    console.log('[going-agent] reporte muy corto, no se envía a Telegram');
  }

  return { finalReport };
}

// ── Pulso del producto (dimensión de NEGOCIO, sin LLM) ─────────────────────
//
// Consulta KPIs reales a transport-service y deriva anomalías + propuestas
// determinísticas al Cerebro. Corre SIEMPRE (independiente del ciclo de código
// con Gemini); si transport-service no responde, es un no-op silencioso.
async function runPlatformPulse(c: RunCollector): Promise<void> {
  const pulse = await fetchPlatformPulse();
  if (!pulse) return;

  const { anomalies, actionsProposed, metrics, summary } = derivePulseSignals(pulse);
  Object.assign(c.metrics, metrics);
  c.anomalies.push(...anomalies);
  c.actionsProposed.push(...actionsProposed);

  console.log(`\n📈 ${summary.replace(/\*/g, '')}`);
  if (anomalies.length > 0) {
    // Solo mandamos el pulso a Telegram cuando hay algo que mirar (anti-ruido).
    await sendTelegramReport(
      `${summary}\n\n_Sacha · pulso del producto ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}_`,
    );
    c.actionsTaken.push({
      type: 'sent_pulse_alert',
      target: 'ops_chat',
      result: 'ok',
      data: { anomalies: anomalies.length, proposed: actionsProposed.length },
    });
  }
}

// ── Arranque — Cloud Run Job: un ciclo y salida limpia ────────────────────
async function main() {
  console.log('🚀 Going Agent — Cloud Run Job');
  console.log(`📁 Repo: ${config.repoPath}`);
  console.log(`🕐 ${new Date().toISOString()}\n`);

  // Modo command (Orchestrator override COMMAND_JSON). Wayra puede dirigir a
  // Sacha con acciones concretas; cada handler corre y sale.
  const cmd = parseCommandFromEnv();
  if (cmd) {
    await runCommandMode(cmd, {
      // Solo el pulso de negocio (rápido, sin Gemini).
      platform_pulse: async () => { await runPlatformPulse(createCollector()); },
      // Revisión de logs/builds dirigida (ciclo completo con Gemini).
      force_review_logs: async () => { await runAgentCycle(createCollector()); },
      review_logs:       async () => { await runAgentCycle(createCollector()); },
    });
    process.exit(0);
  }

  const runId     = uuidv4();
  const startedAt = new Date();
  const collector = createCollector();
  let runStatus: 'success' | 'partial_failure' | 'failure' = 'success';
  let cycleOk = false;

  try {
    // Dimensión de NEGOCIO primero (rápida, sin LLM). Un fallo aquí no debe
    // tumbar el ciclo de mantenimiento de código.
    await runPlatformPulse(collector).catch((e) =>
      console.error('[going-agent] pulso falló (non-fatal):', (e as Error).message),
    );
    await runAgentCycle(collector);
    cycleOk = true;
    if (collector.errors.length > 0) {
      runStatus = 'partial_failure';
    }
    console.log('\n✅ Ciclo completado.');
  } catch (err) {
    console.error('\n❌ Error en el ciclo:', err);
    runStatus = 'failure';
    collector.errors.push((err as Error).message?.slice(0, 200) || 'unknown');
  }

  const finishedAt = new Date();

  // Publish al cerebro — antes de exit, con guardia non-fatal.
  const event: AgentRunEvent = {
    agentId:    'going-agent',
    runId,
    startedAt:  startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    status:     runStatus,
    metrics:        collector.metrics,
    anomalies:      collector.anomalies,
    actionsTaken:   collector.actionsTaken,
    actionsProposed: collector.actionsProposed,
    meta: {
      gitSha: process.env.GIT_SHA,
      runEnv: (process.env.NODE_ENV === 'production' ? 'production' : 'staging'),
    },
  };

  await publishAgentRunEvent(event).catch(e =>
    console.error('[going-agent] publish failed (non-fatal):', e),
  );

  process.exit(cycleOk ? 0 : 1);
}

main();
