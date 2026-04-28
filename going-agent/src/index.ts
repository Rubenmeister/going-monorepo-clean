import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import * as fsSync from 'fs';
import { config } from './config';
import { GitTool } from './tools/git';
import { FilesystemTool } from './tools/filesystem';
import { CloudRunTool } from './tools/cloudrun';
import { MemoryStore } from './memory/context';

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
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: body,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) console.error('[going-agent] Telegram error:', data.description);
  } catch (e) {
    console.error('[going-agent] Excepción Telegram:', (e as Error).message);
  }
}

// ── Asegurar que tenemos el repo clonado en este contenedor ───────────────
// El going-agent es un autonomous code agent que necesita acceso al repo
// (vía git diff, log, write_file, commit, push). Como Cloud Run Jobs no
// montan el repo, lo clonamos al inicio de cada ejecución. Si REPO_PATH ya
// tiene un .git/, hacemos pull para traer cambios recientes.
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
  // Override config.repoPath con la ubicación real
  (config as any).repoPath = REPO_PATH;
}

ensureRepo();

const client = new Anthropic({ apiKey: config.anthropicApiKey });
const git = new GitTool();
const fs = new FilesystemTool();
const cloudrun = new CloudRunTool();
const memory = new MemoryStore();

// ── Definición de herramientas para el agente ──────────────────────────────
const tools: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Lee el contenido de un archivo del repositorio',
    input_schema: {
      type: 'object' as const,
      properties: { path: { type: 'string', description: 'Ruta relativa al repo' } },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Escribe o modifica un archivo del repositorio. Nunca modificar archivos protegidos.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' },
        content: { type: 'string', description: 'Contenido completo del archivo' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_directory',
    description: 'Lista archivos y carpetas en un directorio del repo',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Ruta relativa (ej: "api-gateway/src")' },
        depth: { type: 'number', description: 'Profundidad máxima (1-3)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_cloud_run_logs',
    description: 'Obtiene logs de errores de un servicio en Cloud Run',
    input_schema: {
      type: 'object' as const,
      properties: {
        service: { type: 'string', description: 'Nombre del servicio (ej: api-gateway)' },
      },
      required: ['service'],
    },
  },
  {
    name: 'get_failed_builds',
    description: 'Lista los builds fallidos recientes en Cloud Build',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_git_log',
    description: 'Obtiene los últimos commits del repositorio',
    input_schema: {
      type: 'object' as const,
      properties: { lines: { type: 'number' } },
      required: [],
    },
  },
  {
    name: 'commit_fix',
    description: 'Hace commit de archivos modificados en la rama agent/fixes. Solo usar después de write_file.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'Descripción del fix' },
        files: { type: 'array', items: { type: 'string' }, description: 'Archivos a incluir' },
      },
      required: ['message', 'files'],
    },
  },
];

// Cap de tamaño en resultados de tools — los reads de archivos grandes
// disparan context overflow (200k tokens) tras 5-10 iteraciones.
// 4000 chars ≈ 1000 tokens; con 15 iteraciones máx = ~15k tokens en results.
const TOOL_RESULT_MAX_CHARS = 4000;

function trimToolResult(result: string): string {
  if (result.length <= TOOL_RESULT_MAX_CHARS) return result;
  return result.slice(0, TOOL_RESULT_MAX_CHARS) + `\n\n…(truncado, ${result.length - TOOL_RESULT_MAX_CHARS} chars omitidos)`;
}

// ── Ejecutor de herramientas ────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, any>): Promise<string> {
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
        return `✅ Archivo escrito: ${input.path}`;
      case 'list_directory':
        return fs.listDir(input.path, input.depth || 1).join('\n');
      case 'get_cloud_run_logs':
        return await cloudrun.getServiceLogs(input.service);
      case 'get_failed_builds':
        return await cloudrun.getFailedBuilds();
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
        return `✅ Commit: ${commit}`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e: any) {
    return `❌ Error: ${e.message}`;
  }
}

// ── Retry con backoff para rate limits ────────────────────────────────────
async function callWithRetry(
  fn: () => Promise<Anthropic.Message>,
  maxRetries = 4,
): Promise<Anthropic.Message> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      const isRateLimit = e?.status === 429 || e?.message?.includes('rate limit');
      if (isRateLimit && attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 15000; // 15s, 30s, 60s, 120s
        console.log(`  ⏳ Rate limit — esperando ${waitMs / 1000}s (intento ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        throw e;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// ── Loop principal del agente ──────────────────────────────────────────────
async function runAgentCycle(): Promise<void> {
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

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Ejecuta un ciclo de revisión. Revisa los servicios más críticos: api-gateway, user-auth-service, frontend-webapp.
Busca errores en los logs y builds fallidos. Si encuentras algo concreto para arreglar, aplica el fix y haz commit en agent/fixes.
Reporta todo lo que encuentres.`,
    },
  ];

  // Agentic loop
  const MAX_ITERATIONS = 15;
  let iterations = 0;
  let finalReport = '';

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await callWithRetry(() =>
      client.messages.create({
        model: process.env.AGENT_MODEL || 'claude-haiku-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      })
    );

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      finalReport = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as any).text)
        .join('\n');
      break;
    }

    if (response.stop_reason === 'tool_use') {
      const toolUses = response.content.filter(b => b.type === 'tool_use');
      const results: Anthropic.ToolResultBlockParam[] = [];

      for (const tool of toolUses) {
        if (tool.type !== 'tool_use') continue;
        console.log(`  🔧 ${tool.name}(${JSON.stringify(tool.input).slice(0, 80)})`);
        const rawResult = await executeTool(tool.name, tool.input as Record<string, any>);
        const result    = trimToolResult(rawResult);
        console.log(`     → ${result.slice(0, 100)}${rawResult.length > TOOL_RESULT_MAX_CHARS ? ' [trimmed]' : ''}`);
        results.push({ type: 'tool_result', tool_use_id: tool.id, content: result });
      }

      messages.push({ role: 'user', content: results });

      // Keep message history bounded — solo los últimos 16 mensajes
      // (8 turnos asistente+tool_results) + el primer user message.
      if (messages.length > 16) {
        messages.splice(1, messages.length - 16);
      }
    }
  }

  // Si nunca hubo end_turn (el agente siguió tirando tools), forzar
  // un cierre con una request final sin tools que solo pida el reporte.
  if (!finalReport) {
    console.log(`\n⏰ Iteraciones máximas (${MAX_ITERATIONS}) alcanzadas — forzando reporte final`);

    // Para evitar context overflow, mandamos solo los ÚLTIMOS 4 mensajes
    // (assistant + tool_results más recientes) — suficiente contexto para
    // resumir lo investigado sin reventar el límite de tokens.
    const closingMessages: Anthropic.MessageParam[] = [
      messages[0], // primer user message original (instrucciones)
      ...messages.slice(-4),
      {
        role: 'user',
        content:
          'Tu tiempo de exploración terminó. Genera AHORA el reporte final del ciclo en máximo 1500 caracteres ' +
          'siguiendo el formato Markdown indicado. NO uses más herramientas. NO hagas preguntas. ' +
          'Solo el reporte basado en lo que ya investigaste.',
      },
    ];

    try {
      const closing = await callWithRetry(() =>
        client.messages.create({
          model: process.env.AGENT_MODEL || 'claude-haiku-4-5',
          max_tokens: 2000,
          system: systemPrompt,
          // Sin tools en esta llamada para que no pueda escapar
          messages: closingMessages,
        })
      );

      finalReport = closing.content
        .filter(b => b.type === 'text')
        .map(b => (b as any).text)
        .join('\n');
    } catch (e) {
      console.error('[going-agent] No se pudo generar reporte forzado:', (e as Error).message);
      finalReport = `⚠️ *Going Agent — ciclo ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}*\n\n` +
        `El agente exploró ${MAX_ITERATIONS} iteraciones sin llegar a una conclusión y la generación ` +
        `forzada del reporte falló (${(e as Error).message.slice(0, 200)}).\n\n` +
        `Revisa los logs de Cloud Run Job \`going-agent\` para ver qué se investigó.`;
    }
  }

  console.log('\n📋 Reporte del agente:\n', finalReport);

  const trimmed = finalReport.trim();
  if (trimmed.length > 50) {
    const header = `🤖 *Going Agent — ciclo ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}*\n\n`;
    await sendTelegramReport(header + trimmed);
  } else {
    console.log('[going-agent] reporte muy corto, no se envía a Telegram');
  }
}

// ── Arranque — Cloud Run Job: un ciclo y salida limpia ────────────────────
async function main() {
  console.log('🚀 Going Agent — Cloud Run Job');
  console.log(`📁 Repo: ${config.repoPath}`);
  console.log(`🕐 ${new Date().toISOString()}\n`);

  try {
    await runAgentCycle();
    console.log('\n✅ Ciclo completado. Saliendo.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error en el ciclo:', err);
    process.exit(1);
  }
}

main();
