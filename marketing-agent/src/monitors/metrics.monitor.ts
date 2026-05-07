import { PlatformMetrics, WeeklyReport } from '../types/marketing.types';
import { getFacebookMetrics, getInstagramMetrics } from '../publishers/meta.publisher';
import { getXMetrics } from '../publishers/twitter.publisher';
import { getTikTokMetrics } from '../publishers/tiktok.publisher';
import { getYouTubeMetrics } from '../publishers/youtube.publisher';
import { getLinkedInMetrics } from '../publishers/linkedin.publisher';
import { getThreadsMetrics } from '../publishers/threads.publisher';
import { getWhatsAppMetrics } from '../publishers/whatsapp.publisher';
import { getTelegramMetrics, sendWeeklyMarketingSummary, alertFollowerMilestone, alertViralPost } from '../publishers/telegram.publisher';
import Anthropic from '@anthropic-ai/sdk';
import { Firestore } from '@google-cloud/firestore';
import {
  Anomaly,
  ActionTaken,
  ActionProposed,
} from '@going-platform/cerebro-contracts';

// ─── RunCollector compartido (Cerebro) ───────────────────────
//
// Cada job empuja a este recolector. `runMarketingMonitor` lo retorna y
// `index.ts` lo envuelve en un AgentRunEvent que se publica al
// cerebro-service. El world model usa estas métricas para entender la
// salud de la presencia digital de Going semana a semana.

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

function recordError(c: RunCollector, jobName: string, err: unknown): void {
  console.error(`[metrics] ${jobName} failed:`, err);
  c.errors.push(jobName);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Firestore({ projectId: process.env.GCP_PROJECT });

// Modelo para generar insights del reporte semanal — output muy corto
// (3-4 líneas, ~400 tokens). Override por env. Default Sonnet 4.5;
// para reducir costo a futuro se podría bajar a Haiku 4.5.
const AI_INSIGHTS_MODEL = process.env.AI_INSIGHTS_MODEL || 'claude-sonnet-4-5';

// ── Helpers de timezone Ecuador ───────────────────────────────
function currentHourEcuador(): number {
  return parseInt(new Date().toLocaleString('en-US', {
    timeZone: 'America/Guayaquil', hour: 'numeric', hour12: false,
  }), 10);
}
function currentDayOfWeekEcuador(): number {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' })).getDay();
}
function isPrimaryRunOfHour(): boolean {
  return parseInt(new Date().toLocaleString('en-US', {
    timeZone: 'America/Guayaquil', minute: 'numeric',
  }), 10) < 30;
}

// ============================================================
// Metrics Monitor
// – Collects metrics from all platforms
// – Detects milestones and viral posts
// – Sends weekly Telegram summary
// – Generates AI insights
// ============================================================

// Follower milestones to celebrate
const FOLLOWER_MILESTONES = [100, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];

// ─── Follower state: persisted in Firestore (Cloud Run is stateless) ────────
async function loadFollowerCounts(): Promise<Record<string, number>> {
  try {
    const doc = await db.collection('marketing_agent_state').doc('follower_counts').get();
    return (doc.data() as Record<string, number>) || {};
  } catch (e) {
    console.error('[metrics] Failed to load follower counts from Firestore:', (e as Error).message);
    return {};
  }
}

async function saveFollowerCounts(counts: Record<string, number>): Promise<void> {
  try {
    await db.collection('marketing_agent_state').doc('follower_counts').set(counts, { merge: true });
  } catch (e) {
    console.error('[metrics] Failed to save follower counts to Firestore:', (e as Error).message);
  }
}

export async function collectAllMetrics(): Promise<PlatformMetrics[]> {
  const metrics: PlatformMetrics[] = [];
  const now = new Date();

  // Instagram
  try {
    const ig = await getInstagramMetrics();
    metrics.push({
      platform: 'instagram',
      fetchedAt: now,
      followers: ig.followers,
      followersGrowth: 0,
      reach: ig.reach,
      impressions: ig.impressions,
      engagement: 0,
      engagementRate: ig.impressions > 0 ? 0 : 0,
    });
    console.log(`[metrics] Instagram: ${ig.followers} followers, ${ig.reach} reach`);
  } catch (e) {
    console.error('[metrics] Instagram failed:', (e as Error).message);
  }

  // Facebook
  try {
    const fb = await getFacebookMetrics();
    metrics.push({
      platform: 'facebook',
      fetchedAt: now,
      followers: fb.followers,
      followersGrowth: 0,
      reach: fb.reach,
      impressions: fb.impressions,
      engagement: fb.engagement,
      engagementRate: fb.impressions > 0 ? (fb.engagement / fb.impressions) * 100 : 0,
    });
    console.log(`[metrics] Facebook: ${fb.followers} followers, ${fb.engagement} engaged`);
  } catch (e) {
    console.error('[metrics] Facebook failed:', (e as Error).message);
  }

  // X / Twitter
  try {
    const tw = await getXMetrics();
    metrics.push({
      platform: 'x',
      fetchedAt: now,
      followers: tw.followers,
      followersGrowth: 0,
      reach: tw.impressions,
      impressions: tw.impressions,
      engagement: tw.engagements,
      engagementRate: tw.impressions > 0 ? (tw.engagements / tw.impressions) * 100 : 0,
    });
  } catch (e) {
    console.error('[metrics] X failed:', (e as Error).message);
  }

  // TikTok
  try {
    const tt = await getTikTokMetrics();
    metrics.push({
      platform: 'tiktok',
      fetchedAt: now,
      followers: tt.followers,
      followersGrowth: 0,
      reach: tt.videoViews,
      impressions: tt.videoViews,
      engagement: tt.likes,
      engagementRate: tt.videoViews > 0 ? (tt.likes / tt.videoViews) * 100 : 0,
    });
    console.log(`[metrics] TikTok: ${tt.followers} followers`);
  } catch (e) {
    console.error('[metrics] TikTok failed:', (e as Error).message);
  }

  // YouTube
  try {
    const yt = await getYouTubeMetrics();
    const ytEngagement = yt.likes + yt.comments;
    metrics.push({
      platform: 'youtube',
      fetchedAt: now,
      followers: yt.subscribers,
      followersGrowth: 0,
      reach: yt.recentViews,
      impressions: yt.recentViews,
      engagement: ytEngagement,
      engagementRate: yt.recentViews > 0 ? (ytEngagement / yt.recentViews) * 100 : 0,
    });
    console.log(`[metrics] YouTube: ${yt.subscribers} subscribers`);
  } catch (e) {
    console.error('[metrics] YouTube failed:', (e as Error).message);
  }

  // LinkedIn
  try {
    const li = await getLinkedInMetrics();
    const liEngagement = li.likes + li.comments + li.shares;
    metrics.push({
      platform: 'linkedin',
      fetchedAt: now,
      followers: li.followers,
      followersGrowth: 0,
      reach: li.impressions,
      impressions: li.impressions,
      engagement: liEngagement,
      engagementRate: li.impressions > 0 ? (liEngagement / li.impressions) * 100 : 0,
    });
    console.log(`[metrics] LinkedIn: ${li.followers} followers`);
  } catch (e) {
    console.error('[metrics] LinkedIn failed:', (e as Error).message);
  }

  // Threads
  try {
    const th = await getThreadsMetrics();
    const thEngagement = th.likes + th.replies + th.reposts + th.quotes;
    metrics.push({
      platform: 'threads',
      fetchedAt: now,
      followers: th.followers,
      followersGrowth: 0,
      reach: th.views,
      impressions: th.views,
      engagement: thEngagement,
      engagementRate: th.views > 0 ? (thEngagement / th.views) * 100 : 0,
    });
    console.log(`[metrics] Threads: ${th.followers} followers`);
  } catch (e) {
    console.error('[metrics] Threads failed:', (e as Error).message);
  }

  // WhatsApp (métricas de mensajería — no tiene "followers")
  try {
    const wa = await getWhatsAppMetrics();
    metrics.push({
      platform: 'whatsapp',
      fetchedAt: now,
      followers: 0,            // WhatsApp no expone audience size
      followersGrowth: 0,
      reach: wa.delivered,
      impressions: wa.sent,
      engagement: wa.read,
      engagementRate: wa.delivered > 0 ? (wa.read / wa.delivered) * 100 : 0,
    });
    console.log(`[metrics] WhatsApp: ${wa.sent} enviados, ${wa.read} leídos`);
  } catch (e) {
    console.error('[metrics] WhatsApp failed:', (e as Error).message);
  }

  // Telegram Channel
  try {
    const tg = await getTelegramMetrics();
    metrics.push({
      platform: 'telegram_channel',
      fetchedAt: now,
      followers: tg.members,
      followersGrowth: 0,
      reach: tg.recentViews,
      impressions: tg.recentViews,
      engagement: 0,
      engagementRate: 0,
    });
    console.log(`[metrics] Telegram: ${tg.members} members`);
  } catch (e) {
    console.error('[metrics] Telegram failed:', (e as Error).message);
  }

  return metrics;
}

// ─── Check for milestone crossings ───────────────────────────
export async function checkFollowerMilestones(metrics: PlatformMetrics[], c?: RunCollector): Promise<void> {
  const lastKnownFollowers = await loadFollowerCounts();
  const updated: Record<string, number> = { ...lastKnownFollowers };

  for (const m of metrics) {
    const previous = lastKnownFollowers[m.platform] || 0;
    const current = m.followers;

    for (const milestone of FOLLOWER_MILESTONES) {
      if (previous < milestone && current >= milestone) {
        console.log(`[metrics] 🎉 Milestone reached: ${m.platform} → ${milestone} followers`);
        await alertFollowerMilestone(m.platform, milestone);
        if (c) {
          c.anomalies.push({
            type: 'follower_milestone',
            severity: 'info',
            message: `${m.platform} cruzó ${milestone.toLocaleString()} seguidores`,
            data: { platform: m.platform, milestone, previous, current },
          });
          c.actionsTaken.push({
            type: 'alerted_milestone',
            target: m.platform,
            result: 'ok',
            data: { milestone, count: current },
          });
        }
      }
    }

    updated[m.platform] = current;
  }

  await saveFollowerCounts(updated);
}

// ─── Check for viral posts (engagement > 2x average) ─────────
export async function checkViralPosts(metrics: PlatformMetrics[], c?: RunCollector): Promise<void> {
  for (const m of metrics) {
    if (!m.topPost) continue;

    const { topPost } = m;
    const totalEngagement = topPost.likes + topPost.comments + topPost.shares;

    // If top post has significantly high engagement
    if (totalEngagement > 500 || m.engagementRate > 10) {
      console.log(`[metrics] 🔥 Potential viral post on ${m.platform}: ${totalEngagement} engagements`);
      await alertViralPost(m.platform, topPost.caption, totalEngagement);
      if (c) {
        c.anomalies.push({
          type: 'viral_post',
          severity: 'warning',  // "warning" no porque sea malo, sino porque amerita atención del cerebro
          message: `Post viral en ${m.platform}: ${totalEngagement.toLocaleString()} engagement`,
          data: {
            platform: m.platform,
            postId: topPost.postId,
            caption: topPost.caption.slice(0, 200),
            engagement: totalEngagement,
            engagementRate: m.engagementRate,
          },
        });
        c.actionsTaken.push({
          type: 'alerted_viral_post',
          target: `${m.platform}:${topPost.postId}`,
          result: 'ok',
          data: { engagement: totalEngagement },
        });
        // Cerebro puede sugerir replicar el formato/tópico en otras plataformas.
        c.actionsProposed.push({
          type: 'replicate_viral_format',
          target: m.platform,
          reason: `Post viral con ${totalEngagement} engagement — replicar formato en otras redes`,
          urgency: 0.5,
          data: { sourcePlatform: m.platform, postId: topPost.postId },
        });
      }
    }
  }
}

// ─── Generate AI insights from metrics ───────────────────────
async function generateInsights(metrics: PlatformMetrics[]): Promise<string[]> {
  if (metrics.length === 0) return [];

  const summary = metrics
    .map((m) => `${m.platform}: ${m.followers} seguidores, ${m.reach} alcance, ${m.engagementRate.toFixed(1)}% engagement`)
    .join('\n');

  try {
    const response = await client.messages.create({
      model: AI_INSIGHTS_MODEL,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Eres analista de marketing digital para Going Ecuador (plataforma de transporte).
Analiza estas métricas de la semana y genera 3-4 insights accionables en español, cada uno en una línea:

${summary}

Formato: una idea por línea, sin bullets, sin numeración. Máximo 20 palabras por insight.`,
      }],
    });

    const text = (response.content[0] as { text: string }).text;
    return text.split('\n').filter((l) => l.trim().length > 0).slice(0, 4);
  } catch (e) {
    console.error('[metrics] Failed to generate insights:', (e as Error).message);
    return ['Revisar engagement en plataformas con menor rendimiento.'];
  }
}

// ─── Weekly Report ────────────────────────────────────────────
export async function generateAndSendWeeklyReport(c?: RunCollector): Promise<void> {
  console.log('[metrics] Generating weekly report...');

  const metrics = await collectAllMetrics();

  const totalReach = metrics.reduce((s, m) => s + m.reach, 0);
  const totalEngagement = metrics.reduce((s, m) => s + m.engagement, 0);
  const newFollowers = metrics.reduce((s, m) => s + Math.max(m.followersGrowth, 0), 0);

  const insights = await generateInsights(metrics);

  const report: WeeklyReport = {
    weekOf: new Date(),
    totalReach,
    totalEngagement,
    newFollowers,
    postsPublished: 0, // Would be tracked in Firestore
    platformBreakdown: metrics,
    insights,
  };

  await sendWeeklyMarketingSummary(report);

  // Empuja métricas al cerebro: pulso de presencia digital semanal por plataforma.
  if (c) {
    c.metrics.totalReach = totalReach;
    c.metrics.totalEngagement = totalEngagement;
    c.metrics.platformsActive = metrics.length;

    for (const m of metrics) {
      const p = m.platform;
      c.metrics[`followers_${p}`] = m.followers;
      c.metrics[`engagement_rate_${p}`] = +m.engagementRate.toFixed(2);
      c.metrics[`reach_${p}`] = m.reach;

      // Si una plataforma tiene engagement <0.5% sostenido, propuesta para review.
      // Threshold low porque algunas redes tienen reach inflado.
      if (m.followers > 100 && m.impressions > 1000 && m.engagementRate < 0.5) {
        c.actionsProposed.push({
          type: 'review_platform_content',
          target: p,
          reason: `Engagement rate ${m.engagementRate.toFixed(2)}% en ${p} con ${m.followers} seguidores — contenido no resonando`,
          urgency: 0.4,
          data: { platform: p, engagementRate: m.engagementRate, followers: m.followers },
        });
      }
    }

    c.actionsTaken.push({
      type: 'sent_weekly_report',
      target: 'telegram_ops_chat',
      result: 'ok',
      data: { totalReach, totalEngagement, platformCount: metrics.length },
    });
  }

  // Also check milestones while we have fresh data
  await checkFollowerMilestones(metrics, c);
  await checkViralPosts(metrics, c);

  console.log('[metrics] Weekly report sent ✅');
}

// ─── Main runner ──────────────────────────────────────────────
//
// Después de la calibración: el único loop útil es el reporte semanal
// con métricas de todas las plataformas. La generación de contenido
// vive en content-agent. La publicación a redes sociales requiere
// aprobación manual y todavía no es loop automático.
//
// Plataformas con secret faltante fallan silenciosamente (try/catch
// por plataforma) — el reporte sale igual con las que sí tienen token.
export interface MonitorRunResult {
  collector: RunCollector;
}

async function safeRun(c: RunCollector, name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    recordError(c, name, err);
  }
}

export async function runMarketingMonitor(): Promise<MonitorRunResult> {
  const hour      = currentHourEcuador();
  const dayOfWeek = currentDayOfWeekEcuador();
  console.log(`[marketing-monitor] Running at Ecuador hour ${hour}, day ${dayOfWeek}`);

  const c = createCollector();
  c.metrics.runHourEcuador = hour;
  c.metrics.runDayOfWeek = dayOfWeek;

  // Lunes 9am Ecuador o trigger manual: reporte semanal con métricas
  // de todas las plataformas + insights IA.
  const isWeeklySlot = dayOfWeek === 1 && hour === 9 && isPrimaryRunOfHour();
  const isForced     = process.env.FORCE_WEEKLY_REPORT === '1';

  if (isWeeklySlot || isForced) {
    if (isForced) console.log('[marketing-monitor] FORCE_WEEKLY_REPORT=1 — disparando manual');
    await safeRun(c, 'generateAndSendWeeklyReport', () => generateAndSendWeeklyReport(c));
  } else {
    console.log('[marketing-monitor] fuera de ventana semanal (lunes 9am Ecuador) — nada que hacer');
    c.metrics.outsideWeeklyWindow = 1;
  }

  console.log('[marketing-monitor] Done ✅');
  return { collector: c };
}
