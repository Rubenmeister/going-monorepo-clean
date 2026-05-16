/**
 * Config del frontend-agent.
 *
 * Vercel es el único proveedor soportado hoy. Si en el futuro queremos
 * agregar Cloudflare Pages / Netlify / etc., expandir este archivo.
 *
 * Vars opcionales (todas via env):
 *   - VERCEL_TOKEN     — Personal Access Token (vercel.com/account/tokens)
 *                         scope mínimo: read access
 *   - VERCEL_TEAM_ID   — slug o ID del team (si la cuenta es team)
 *   - VERCEL_PROJECTS  — comma-list de project NAMES (NO IDs)
 *                         default: 'frontend-webapp,admin-dashboard,corporate-portal'
 *   - VERCEL_API_BASE  — default 'https://api.vercel.com'
 *   - VERCEL_LOOKBACK_HOURS — ventana de análisis, default 6h
 */

export interface FrontendAgentConfig {
  vercelToken:     string | null;
  vercelTeamId:    string | null;
  vercelApiBase:   string;
  // Proyectos a monitorear. Cada nombre tiene un mapping informativo a
  // un appId que el cerebro reconoce (consistencia con dashboards).
  projects: Array<{
    appId:        'frontend-webapp' | 'admin-dashboard' | 'corporate-portal';
    vercelName:   string;
  }>;
  lookbackHours: number;
}

export function loadConfig(): FrontendAgentConfig {
  const projectList = (
    process.env.VERCEL_PROJECTS || 'frontend-webapp,admin-dashboard,corporate-portal'
  )
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Mapeo apps internas → vercelName (el operador puede tener
  // nombres distintos en Vercel; respetamos el order del env var).
  // Si no calza, fallback a usar el mismo nombre para appId.
  const appIdOrder = ['frontend-webapp', 'admin-dashboard', 'corporate-portal'] as const;

  return {
    vercelToken:    process.env.VERCEL_TOKEN || null,
    vercelTeamId:   process.env.VERCEL_TEAM_ID || null,
    vercelApiBase:  process.env.VERCEL_API_BASE || 'https://api.vercel.com',
    projects: projectList.map((name, i) => ({
      appId:      (appIdOrder[i] || (name as any)) as
                  'frontend-webapp' | 'admin-dashboard' | 'corporate-portal',
      vercelName: name,
    })),
    lookbackHours: parseInt(process.env.VERCEL_LOOKBACK_HOURS || '6', 10),
  };
}
