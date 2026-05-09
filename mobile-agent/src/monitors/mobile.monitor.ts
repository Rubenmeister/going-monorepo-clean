import {
  Anomaly,
  ActionTaken,
  ActionProposed,
} from '@going-platform/cerebro-contracts';
import { MobileAgentConfig } from '../config';
import { SentryClient } from '../sentry/sentry.client';
import { SentryIssue, SentryProjectStats } from '../sentry/types';

/**
 * RunCollector compartido — mismo shape que ops-agent / financial-agent.
 * Acumulamos métricas, anomalías y acciones; el index.ts arma el
 * AgentRunEvent al final del run y publica al cerebro.
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
 * Flujo:
 *   1. Para cada app móvil registrada (user / driver):
 *      - skip si no tiene SENTRY_*_PROJECT seteado
 *      - traer top issues + stats hourly
 *      - detectar anomalías (spikes, fatales, regresiones)
 *      - acumular métricas (totalIssues, fatalCount, crashFreeRate aprox)
 *   2. Devolver collector — el caller publica al cerebro.
 *
 * Si SENTRY_AUTH_TOKEN no está, el agente NO falla — registra una anomaly
 * "config_missing" y sale exit 0. Esto es para que podamos tener el job
 * deployado y schedulado AUNQUE el operator no haya configurado Sentry
 * todavía. El día que se configura, los runs siguientes lo recogen.
 */
export async function runMobileMonitor(
  config: MobileAgentConfig,
): Promise<{ collector: RunCollector }> {
  const c = createCollector();

  if (!config.sentryToken) {
    console.warn('[mobile-agent] SENTRY_AUTH_TOKEN no configurado — agente en modo idle');
    c.anomalies.push({
      type:     'config_missing',
      severity: 'info',
      message:  'SENTRY_AUTH_TOKEN no configurado. Setup pendiente de configurar Sentry en mobile-user-app + mobile-driver-app.',
    });
    c.metrics.appsConfigured = 0;
    c.metrics.appsExpected   = config.apps.length;
    return { collector: c };
  }

  const client = new SentryClient(config.sentryToken, config.sentryOrg, config.sentryApiBase);
  const statsPeriod = `${config.lookbackHours}h`;

  let appsAnalyzed     = 0;
  let totalIssues      = 0;
  let totalFatalIssues = 0;
  let totalUnhandled   = 0;
  let totalAffectedUsers = 0;
  let totalEvents      = 0;

  for (const app of config.apps) {
    if (!app.sentrySlug) {
      console.warn(`[mobile-agent] ${app.appId}: sin SENTRY_*_PROJECT — skip`);
      c.anomalies.push({
        type:     'app_not_configured',
        severity: 'info',
        message:  `${app.appId} no tiene proyecto Sentry vinculado`,
        data:     { appId: app.appId },
      });
      continue;
    }

    try {
      console.log(`[mobile-agent] analizando ${app.appId} (sentry: ${app.sentrySlug})...`);
      const [issues, stats] = await Promise.all([
        client.listTopIssues({ project: app.sentrySlug, statsPeriod, limit: 25 }),
        client.getEventCounts({ project: app.sentrySlug, statsPeriod }),
      ]);

      const appMetrics = analyzeAppData(app.appId, issues, stats, c);
      appsAnalyzed       += 1;
      totalIssues        += appMetrics.issuesCount;
      totalFatalIssues   += appMetrics.fatalCount;
      totalUnhandled     += appMetrics.unhandledCount;
      totalAffectedUsers += appMetrics.affectedUsers;
      totalEvents        += appMetrics.eventCount;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[mobile-agent] error analizando ${app.appId}: ${err}`);
      c.errors.push(`${app.appId}: ${err.slice(0, 200)}`);
    }
  }

  c.metrics.appsAnalyzed      = appsAnalyzed;
  c.metrics.totalIssues       = totalIssues;
  c.metrics.totalFatalIssues  = totalFatalIssues;
  c.metrics.totalUnhandled    = totalUnhandled;
  c.metrics.totalAffectedUsers = totalAffectedUsers;
  c.metrics.totalEvents       = totalEvents;
  c.metrics.lookbackHours     = config.lookbackHours;

  return { collector: c };
}

/**
 * Procesa la data de UNA app y agrega anomalías + acciones al collector.
 * Devuelve métricas agregadas para que el caller las sume al total cross-app.
 */
function analyzeAppData(
  appId: string,
  issues: SentryIssue[],
  stats: SentryProjectStats,
  c:     RunCollector,
): {
  issuesCount:    number;
  fatalCount:     number;
  unhandledCount: number;
  affectedUsers:  number;
  eventCount:     number;
} {
  // ── Métricas básicas ─────────────────────────────────────
  const fatalIssues     = issues.filter(i => i.level === 'fatal');
  const unhandledIssues = issues.filter(i => i.isUnhandled);

  const totalEventCount = issues.reduce((sum, i) => sum + parseInt(i.count, 10), 0);
  const affectedUsers   = issues.reduce((sum, i) => sum + (i.userCount || 0), 0);

  // ── Detección de spike: el último bucket horario vs promedio anterior.
  // Sentry devuelve buckets ordenados por timestamp asc.
  const buckets = stats.data || [];
  if (buckets.length >= 3) {
    const lastBucket   = buckets[buckets.length - 1];
    const lastValue    = (lastBucket as any)[1] as number;
    const previousAvg  = avg(buckets.slice(0, -1).map(b => (b as any)[1] as number));
    if (previousAvg > 0 && lastValue > previousAvg * 2) {
      c.anomalies.push({
        type:     'mobile_event_spike',
        severity: lastValue > previousAvg * 5 ? 'critical' : 'warning',
        message:  `${appId}: spike de eventos — último hora=${lastValue}, promedio previo=${previousAvg.toFixed(1)}`,
        data: {
          appId,
          lastHourEvents: lastValue,
          previousAvg:    Number(previousAvg.toFixed(2)),
          ratio:          Number((lastValue / previousAvg).toFixed(2)),
        },
      });
      c.actionsProposed.push({
        type:    'investigate_top_error',
        urgency: 0.85,
        target:  appId,
        reason:  `Spike ${(lastValue / previousAvg).toFixed(1)}× en eventos — necesita triage`,
        data:    { topIssue: issues[0]?.shortId },
      });
    }
  }

  // ── Crashes (fatal level) — siempre worth flagging ──────
  for (const issue of fatalIssues.slice(0, 5)) {
    c.anomalies.push({
      type:     'mobile_fatal_crash',
      severity: 'critical',
      message:  `${appId}: ${issue.title} (×${issue.count}, ${issue.userCount} users)`,
      data: {
        appId,
        sentryId:    issue.shortId,
        title:       issue.title,
        count:       parseInt(issue.count, 10),
        userCount:   issue.userCount,
        firstSeen:   issue.firstSeen,
        lastSeen:    issue.lastSeen,
        permalink:   issue.permalink,
        release:     issue.firstRelease?.version,
      },
    });
  }

  // ── Issues con muchos users afectados — propone investigation ──
  for (const issue of issues.slice(0, 3)) {
    if (issue.userCount >= 10) {
      c.actionsProposed.push({
        type:    'investigate_top_error',
        urgency: Math.min(0.9, 0.4 + issue.userCount / 100),
        target:  appId,
        reason:  `${issue.userCount} users afectados por "${issue.title.slice(0, 80)}"`,
        data: {
          appId,
          sentryId: issue.shortId,
          permalink: issue.permalink,
        },
      });
    }
  }

  // ── Detección de regresión por release ─────────────────
  const issuesByRelease = new Map<string, number>();
  for (const i of issues) {
    if (i.firstRelease?.version) {
      issuesByRelease.set(
        i.firstRelease.version,
        (issuesByRelease.get(i.firstRelease.version) || 0) + 1,
      );
    }
  }
  // El release con más NEW issues — si es muy reciente, sospechamos regresión.
  let topRelease: { version: string; newIssues: number } | null = null;
  for (const [version, count] of issuesByRelease.entries()) {
    if (!topRelease || count > topRelease.newIssues) {
      topRelease = { version, newIssues: count };
    }
  }
  if (topRelease && topRelease.newIssues >= 3) {
    c.anomalies.push({
      type:     'mobile_release_regression',
      severity: topRelease.newIssues >= 5 ? 'critical' : 'warning',
      message:  `${appId}: release ${topRelease.version} con ${topRelease.newIssues} issues nuevos`,
      data: {
        appId,
        release:     topRelease.version,
        newIssues:   topRelease.newIssues,
      },
    });
    if (topRelease.newIssues >= 5) {
      c.actionsProposed.push({
        type:    'pin_release_rollback',
        urgency: 0.75,
        target:  appId,
        reason:  `Release ${topRelease.version} introdujo ${topRelease.newIssues} issues — considerar rollback`,
        data: { appId, version: topRelease.version },
      });
    }
  }

  const eventCount = totalBucketEvents(stats);

  console.log(
    `[mobile-agent] ${appId}: ${issues.length} issues activos, ${fatalIssues.length} fatales, ${affectedUsers} usuarios, ${eventCount} eventos en ${stats.data.length} buckets`,
  );

  return {
    issuesCount:    issues.length,
    fatalCount:     fatalIssues.length,
    unhandledCount: unhandledIssues.length,
    affectedUsers,
    eventCount,
  };
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function totalBucketEvents(s: SentryProjectStats): number {
  return (s.data || []).reduce((sum, b) => sum + ((b as any)[1] as number), 0);
}
