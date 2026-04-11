// ──────────────────────────────────────────────────────────────────────────────
// Going Managed Agents — Setup (ejecutar UNA VEZ)
// Crea los agentes y el environment en Anthropic, guarda los IDs en .env
// ──────────────────────────────────────────────────────────────────────────────
// Uso: tsx src/setup.ts
// ──────────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { ALL_AGENTS } from './agents/definitions';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function setup() {
  console.log('🚀 Going Managed Agents — Setup\n');

  // ── 1. Crear environment (contenedor cloud con red sin restricciones) ─────
  console.log('📦 Creando environment...');
  const environment = await (client.beta as any).environments.create({
    name: 'going-agents-env',
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' }, // necesita acceder a Firestore, Telegram, etc.
    },
  });
  console.log(`   ✅ Environment ID: ${environment.id}`);

  // ── 2. Crear cada agente ──────────────────────────────────────────────────
  const agentIds: Record<string, string> = {};

  for (const [key, def] of Object.entries(ALL_AGENTS)) {
    console.log(`\n🤖 Creando agente: ${def.name}...`);
    const agent = await (client.beta as any).agents.create({
      name: def.name,
      model: def.model,
      system: def.system,
      tools: [
        { type: 'agent_toolset_20260401' }, // bash, file ops, web search/fetch
      ],
    });
    agentIds[key] = agent.id;
    console.log(`   ✅ Agent ID: ${agent.id} (v${agent.version})`);
  }

  // ── 3. Guardar IDs en .env.managed-agents ────────────────────────────────
  const envPath = '.env.managed-agents';
  const lines = [
    '# Going Managed Agents — IDs generados por setup.ts',
    '# NO editar manualmente — regenerar con: tsx src/setup.ts',
    '',
    `MANAGED_AGENTS_ENVIRONMENT_ID=${environment.id}`,
    '',
    ...Object.entries(agentIds).map(
      ([key, id]) => `MANAGED_AGENT_${key.toUpperCase()}_ID=${id}`
    ),
  ];

  writeFileSync(envPath, lines.join('\n') + '\n');
  console.log(`\n✅ IDs guardados en ${envPath}`);

  // ── 4. Resumen ────────────────────────────────────────────────────────────
  console.log('\n📋 Resumen:');
  console.log(`   Environment: ${environment.id}`);
  for (const [key, id] of Object.entries(agentIds)) {
    console.log(`   ${key}: ${id}`);
  }

  console.log('\n🎯 Próximo paso:');
  console.log('   Actualizar Cloud Scheduler para llamar:');
  console.log('   tsx src/runner.ts content   # cada 30min');
  console.log('   tsx src/runner.ts financial # cada 30min');
  console.log('   tsx src/runner.ts ops       # cada hora');
  console.log('   tsx src/runner.ts marketing # 9am y 6pm');
}

setup().catch((err) => {
  console.error('❌ Setup falló:', err.message);
  process.exit(1);
});
