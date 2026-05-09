/**
 * Tipos de la API de Vercel — solo los campos que consume el monitor.
 * Ver https://vercel.com/docs/rest-api para el spec completo.
 */

export type DeploymentState =
  | 'BUILDING'
  | 'INITIALIZING'
  | 'QUEUED'
  | 'READY'
  | 'ERROR'
  | 'CANCELED';

export interface VercelDeployment {
  uid:          string;
  name:         string;
  url:          string;          // ej: 'frontend-webapp-abc123.vercel.app'
  state:        DeploymentState;
  readyState?:  DeploymentState; // más fresh que state en algunos endpoints
  created:      number;          // unix ms
  buildingAt?:  number;
  ready?:       number;          // unix ms cuando READY
  meta?: {
    githubCommitMessage?: string;
    githubCommitSha?:     string;
    githubCommitRef?:     string;
  };
  inspectorUrl?: string;
  source?:       string; // 'git' | 'cli' | 'api'
  target?:       'production' | 'preview' | 'development';
}

export interface DeploymentsList {
  deployments: VercelDeployment[];
  pagination?: {
    count: number;
    next:  number | null;
  };
}

export interface VercelProject {
  id:       string;
  name:     string;
  framework?: string;
}
