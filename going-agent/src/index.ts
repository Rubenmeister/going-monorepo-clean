import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';
import { GitTool } from './tools/git';
import { FilesystemTool } from './tools/filesystem';
import { CloudRunTool } from './tools/cloudrun';
import { MemoryStore } from './memory/context';

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

// ── Ejecutor de herramientas ────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  try {
    switch (name) {
      case 'read_file':
        return fs.readFile(input.path);
      case 'write_file':
        fs.writeFile(input.path, input.content);
        return `✅ Archivo escrito: ${input.path}`;
      case 'list_directory':
        return fs.listDir(input.path, input.depth || 1).join('\n');
      case 'get_cloud_run_logs':
        return cloudrun.getServiceLogs(input.service);
      case 'get_failed_builds':
        return cloudrun.getFailedBuilds();
      case 'get_git_log':
        return git.getRecentLog(input.lines || 10);
      case 'commit_fix': {
        const branch = await git.getCurrentBranch();
        if (branch !== config.agentBranch) {
          await git.createAgentBranch();
        }
        const commit = await git.commitAndPush(input.message, input.files);
        memory.recordFix(input.message, commit);
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

  memory.recordRun();

  const systemPrompt = `Eres el agente autónomo de código de Going, una plataforma de transporte y turismo en Ecuador.

Tu función es mantener el monorepo en buen estado. En cada ciclo debes:
1. Revisar logs de Cloud Run en busca de errores nuevos
2. Revisar builds fallidos
3. Si encuentras un problema, leer el código relevante y proponer/aplicar el fix
4. Hacer commit del fix en la rama "${config.agentBranch}" (NUNCA en main)
5. Reportar qué hiciste

Reglas estrictas:
- NUNCA modificar archivos en: ${config.blacklist.join(', ')}
- NUNCA hacer commit directo a main
- NUNCA borrar archivos
- Si no estás seguro de un fix, solo reporta el problema sin modificar código
- Siempre explicar qué encontraste y qué hiciste

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
  let iterations = 0;
  while (iterations < 10) {
    iterations++;

    const response = await callWithRetry(() =>
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      })
    );

    // Agregar respuesta del asistente
    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      // El agente terminó — mostrar reporte final
      const text = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as any).text)
        .join('\n');
      console.log('\n📋 Reporte del agente:\n', text);
      break;
    }

    if (response.stop_reason === 'tool_use') {
      const toolUses = response.content.filter(b => b.type === 'tool_use');
      const results: Anthropic.ToolResultBlockParam[] = [];

      for (const tool of toolUses) {
        if (tool.type !== 'tool_use') continue;
        console.log(`  🔧 ${tool.name}(${JSON.stringify(tool.input).slice(0, 80)})`);
        const result = await executeTool(tool.name, tool.input as Record<string, any>);
        console.log(`     → ${result.slice(0, 100)}`);
        results.push({ type: 'tool_result', tool_use_id: tool.id, content: result });
      }

      messages.push({ role: 'user', content: results });
    }
  }
}

// ── Arranque ───────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Going Agent iniciando...');
  console.log(`📁 Repo: ${config.repoPath}`);
  console.log(`⏱  Intervalo: ${config.intervalMs / 60000} minutos\n`);

  // Primer ciclo inmediato
  await runAgentCycle().catch(console.error);

  // Loop continuo
  setInterval(() => {
    runAgentCycle().catch(console.error);
  }, config.intervalMs);
}

main().catch(console.error);
