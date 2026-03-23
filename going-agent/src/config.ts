import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  repoPath: process.env.REPO_PATH || path.join(__dirname, '../../'),
  gcpProject: process.env.GCP_PROJECT || 'going-5d1ae',
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
