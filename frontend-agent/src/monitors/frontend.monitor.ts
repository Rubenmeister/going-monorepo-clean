import {
  Anomaly,
  ActionTaken,
  ActionProposed,
} from '@going-platform/cerebro-contracts';
import { FrontendAgentConfig } from '../config';
import { VercelClient } from '../vercel/vercel.client';
import { VercelDeployment } from '../vercel/types';

/**
 * RunCollector — mismo shape que ops/financial/marketing/mobile-agent.
 */
export interface RunCollector {
  metrics:         Record<string, number | string>;
  anomalies:       Anomaly[];
  actionsTaken:    ActionTaken[];
  actionsProposed: ActionProposed[];
  errors:          string[];
}

function createCollector(): RunCollector {
  return { metrics: {}, anomalies: [], actionsTaken: [], actionsProposed: [], errors: [] };
}

/**
 * Punto de entrada del monitor. Llamado desde index.ts.
 *
 * Para cada proyecto de Vercel:
 *   1. Trae deploys recientes (lookback ventana)
 *   2. Detecta deploys en ERROR / canceled / pendientes mucho tiempo
 *   3. Compara producción vs preview — la urgencia es mayor en producción
 *   4. Métricas agregadas para el snapshot del Cerebro
 *
 * Si VERCEL_TOKEN no está, agent corre en modo idle (config_missing).
 */
/**
 * Uptime real de la cara pública (app.goingec.com, goingec.com). El header del
 * agente lo prometía pero NO existía — solo se miraban estados de deploy en
 * Vercel. Es un GET público con timeout: NO requiere token, por eso corre SIEMPRE
 * (aún en modo idle sin VERCEL_TOKEN). Override por env UPTIME_URLS (coma-sep).
 */
export async function checkUptime(c: RunCollector): Promise<void> {
  const urls = (process.env.UPTIME_URLS || 'https://app.goingec.com,https://goingec.com')
    .split(',').map(u => u.trim()).filter(Boolean);
  let down = 0;
  for (const url of urls) {
    const key = (() => { try { return new URL(url).hostname.replace(/\./g, '_'); } catch { return 'url'; } })();
    const started = Date.now();
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15_000) });
      const latencyMs = Date.now() - started;
      c.metrics[`uptime_${key}_ms`] = latencyMs;
      c.metrics[`uptime_${key}_status`] = res.status;
      if (!res.ok) {
        down++;
        c.anomalies.push({ type: 'frontend_uptime_down', severity: 'critical', message: `${url} respondió HTTP ${res.status}`, data: { url, status: res.status, latencyMs } });
      } else if (latencyMs > 5000) {
        c.anomalies.push({ type: 'frontend_uptime_slow', severity: 'warning', message: `${url} respondió lento (${latencyMs}ms)`, data: { url, latencyMs } });
      }
    } catch (e) {
      down++;
      c.anomalies.push({ type: 'frontend_uptime_down', severity: 'critical', message: `${url} no responde: ${(e as Error).message.slice(0, 120)}`, data: { url } });
    }
  }
  c.metrics.uptimeUrlsChecked = urls.length;
  c.metrics.uptimeUrlsDown = down;
  if (down > 0) {
    // Deja constancia de que hubo seguimiento (antes actionsTaken iba siempre vacío).
    c.actionsTaken.push({ type: 'alert_published', target: 'frontend_uptime', result: 'ok', data: { down } });
  }
  console.log(`[frontend-agent] uptime: ${urls.length} URLs, ${down} caídas`);
}

export async function runFrontendMonitor(
  config: FrontendAgentConfig,
): Promise<{ collector: RunCollector }> {
  const c = createCollector();

  // Uptime público PRIMERO — no depende de VERCEL_TOKEN, debe correr siempre.
  await checkUptime(c);

  if (!config.vercelToken) {
    console.warn('[frontend-agent] VERCEL_TOKEN no configurado — agent en modo idle');
    c.anomalies.push({
      type:     'config_missing',
      severity: 'info',
      message:  'VERCEL_TOKEN no configurado. Setup pendiente — ver frontend-agent/README.md',
    });
    c.metrics.projectsConfigured = 0;
    c.metrics.projectsExpected   = config.projects.length;
    return { collector: c };
  }

  const client = new VercelClient(config.vercelToken, config.vercelTeamId, config.vercelApiBase);
  const sinceMs = Date.now() - config.lookbackHours * 3600 * 1000;

  let projectsAnalyzed = 0;
  let totalDeploys     = 0;
  let totalProdDeploys = 0;
  let totalErrorDeploys = 0;
  let totalReadyDeploys = 0;

  for (const project of config.projects) {
    try {
      console.log(`[frontend-agent] analizando ${project.appId} (vercel: ${project.vercelName})...`);
      const deploys = await client.listDeployments({
        projectName: project.vercelName,
        sinceMs,
        limit:       30,
      });

      const stats = analyzeProjectDeploys(project.appId, deploys, c);
      projectsAnalyzed   += 1;
      totalDeploys       += stats.totalDeploys;
      totalProdDeploys   += stats.prodDeploys;
      totalErrorDeploys  += stats.errorDeploys;
      totalReadyDeploys  += stats.readyDeploys;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[frontend-agent] error analizando ${project.appId}: ${err}`);
      c.errors.push(`${project.appId}: ${err.slice(0, 200)}`);
    }
  }

  c.metrics.projectsAnalyzed = projectsAnalyzed;
  c.metrics.totalDeploys     = totalDeploys;
  c.metrics.prodDeploys      = totalProdDeploys;
  c.metrics.errorDeploys     = totalErrorDeploys;
  c.metrics.readyDeploys     = totalReadyDeploys;
  c.metrics.lookbackHours    = config.lookbackHours;

  return { collector: c };
}

/**
 * Procesa la lista de deploys de UN proyecto y agrega anomalías.
 *
 * Reglas:
 *  - Deploy de producción en ERROR → critical, propose investigate
 *  - Deploy en BUILDING > 10min → warning (probable hung build)
 *  - >50% de deploys en ERROR en la ventana → critical (problema sistémico)
 *  - Latest production deploy ERROR + previous READY → propose rollback
 */
function analyzeProjectDeploys(
  appId:  string,
  deploys: VercelDeployment[],
  c:      RunCollector,
): {
  totalDeploys:  number;
  prodDeploys:   number;
  errorDeploys:  number;
  readyDeploys:  number;
} {
  const total       = deploys.length;
  const prodDeploys = deploys.filter(d => d.target === 'production');
  const errorDeploys = deploys.filter(d => effectiveState(d) === 'ERROR');
  const readyDeploys = deploys.filter(d => effectiveState(d) === 'READY');

  // ── 1. Deploy de producción en ERROR ──────────────────
  for (const d of prodDeploys) {
    if (effectiveState(d) === 'ERROR') {
      c.anomalies.push({
        type:     'vercel_prod_deploy_failed',
        severity: 'critical',
        message:  `${appId}: deploy a producción falló — ${d.meta?.githubCommitMessage?.slice(0, 80) || d.uid}`,
        data: {
          appId,
          uid:        d.uid,
          url:        d.url,
          inspector:  d.inspectorUrl,
          ref:        d.meta?.githubCommitRef,
          sha:        d.meta?.githubCommitSha,
          createdAt:  new Date(d.created).toISOString(),
        },
      });
      c.actionsProposed.push({
        type:    'investigate_failed_deploy',
        urgency: 0.9,
        target:  appId,
        reason:  `Deploy producción falló — ${d.meta?.githubCommitRef || d.uid}`,
        data:    { appId, inspector: d.inspectorUrl },
      });
    }
  }

  // ── 2. Deploys colgados en BUILDING ─────────────────────
  const TEN_MIN_MS = 10 * 60 * 1000;
  const now = Date.now();
  for (const d of deploys) {
    if ((d.state === 'BUILDING' || d.state === 'INITIALIZING' || d.state === 'QUEUED')
        && (now - d.created) > TEN_MIN_MS) {
      c.anomalies.push({
        type:     'vercel_deploy_hung',
        severity: 'warning',
        message:  `${appId}: deploy ${d.uid.slice(0, 8)} colgado en ${d.state} hace ${Math.round((now - d.created) / 60000)}min`,
        data: {
          appId,
          uid:    d.uid,
          state:  d.state,
          ageMin: Math.round((now - d.created) / 60000),
        },
      });
    }
  }

  // ── 3. Tasa de error sistémica ──────────────────────────
  if (total >= 5) {
    const errorRate = errorDeploys.length / total;
    if (errorRate > 0.5) {
      c.anomalies.push({
        type:     'vercel_high_error_rate',
        severity: 'critical',
        message:  `${appId}: ${errorDeploys.length}/${total} deploys fallaron en la ventana (${(errorRate * 100).toFixed(0)}%)`,
        data: {
          appId,
          errorRate: Number(errorRate.toFixed(2)),
          total,
          errorCount: errorDeploys.length,
        },
      });
    }
  }

  // ── 4. Producción rota → propose rollback ──────────────
  // Si el último deploy a producción está en ERROR pero hay uno previo READY,
  // proponemos rollback. Cat 2 (reversible — solo cambia el alias).
  const sortedProd = [...prodDeploys].sort((a, b) => b.created - a.created);
  if (
    sortedProd.length >= 2 &&
    effectiveState(sortedProd[0]) === 'ERROR' &&
    effectiveState(sortedProd[1]) === 'READY'
  ) {
    c.actionsProposed.push({
      type:    'redeploy_previous_version',
      urgency: 0.8,
      target:  appId,
      reason:  `Último deploy producción en ERROR — el previo (${sortedProd[1].uid.slice(0, 8)}) está READY`,
      data: {
        appId,
        failedUid:   sortedProd[0].uid,
        previousUid: sortedProd[1].uid,
      },
    });
  }

  console.log(
    `[frontend-agent] ${appId}: ${total} deploys (${prodDeploys.length} prod, ${errorDeploys.length} error, ${readyDeploys.length} ready)`,
  );

  return {
    totalDeploys:  total,
    prodDeploys:   prodDeploys.length,
    errorDeploys:  errorDeploys.length,
    readyDeploys:  readyDeploys.length,
  };
}

/** Vercel devuelve state vs readyState — el último es el "true" final cuando existe. */
function effectiveState(d: VercelDeployment): string {
  return d.readyState || d.state;
}
