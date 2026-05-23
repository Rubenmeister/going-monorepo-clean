import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Validación fail-fast: fallar inmediatamente si faltan vars críticas.
// (ANTHROPIC_API_KEY ya no se requiere — el agente usa Vertex AI / Gemini
// con Application Default Credentials del SA going-agent-sa.)

const GCP_PROJECT = process.env.GCP_PROJECT;
if (!GCP_PROJECT) {
  throw new Error('[Config] GCP_PROJECT es requerida. Configúrala en .env o en las variables de entorno del Cloud Run Job.');
}

export const config = {
  repoPath: process.env.REPO_PATH || path.join(__dirname, '../../'),
  gcpProject: GCP_PROJECT,
  gcpRegion: process.env.GCP_REGION || 'us-central1',
  agentBranch: 'agent/fixes',
  // Archivos y carpetas que el agente NUNCA puede tocar
  blacklist: [
    '.env',
    '.env.local',
    '.env.production',
    'pnpm-lock.yaml',
    'package.json',
    'going-agent/',
  ],
  // Ciclo de revisión en ms (default: cada 30 minutos)
  intervalMs: parseInt(process.env.AGENT_INTERVAL_MS || '1800000'),
};
