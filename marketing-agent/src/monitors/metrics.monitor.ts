import { PlatformMetrics, WeeklyReport } from '../types/marketing.types';
import { getFacebookMetrics, getInstagramMetrics } from '../publishers/meta.publisher';
import { getXMetrics } from '../publishers/twitter.publisher';
import { getTikTokMetrics } from '../publishers/tiktok.publisher';
import { sendWeeklyMarketingSummary, alertFollowerMilestone, alertViralPost } from '../publishers/telegram.publisher';
import { generateContent } from '../content/generator';
import Anthropic from '@anthropic-ai/sdk';
import { Firestore } from '@google-cloud/firestore';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Firestore({ projectId: process.env.GCP_PROJECT });

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

  return metrics;
}

// ─── Check for milestone crossings ───────────────────────────
export async function checkFollowerMilestones(metrics: PlatformMetrics[]): Promise<void> {
  const lastKnownFollowers = await loadFollowerCounts();
  const updated: Record<string, number> = { ...lastKnownFollowers };

  for (const m of metrics) {
    const previous = lastKnownFollowers[m.platform] || 0;
    const current = m.followers;

    for (const milestone of FOLLOWER_MILESTONES) {
      if (previous < milestone && current >= milestone) {
        console.log(`[metrics] 🎉 Milestone reached: ${m.platform} → ${milestone} followers`);
        await alertFollowerMilestone(m.platform, milestone);
      }
    }

    updated[m.platform] = current;
  }

  await saveFollowerCounts(updated);
}

// ─── Check for viral posts (engagement > 2x average) ─────────
export async function checkViralPosts(metrics: PlatformMetrics[]): Promise<void> {
  for (const m of metrics) {
    if (!m.topPost) continue;

    const { topPost } = m;
    const totalEngagement = topPost.likes + topPost.comments + topPost.shares;

    // If top post has significantly high engagement
    if (totalEngagement > 500 || m.engagementRate > 10) {
      console.log(`[metrics] 🔥 Potential viral post on ${m.platform}: ${totalEngagement} engagements`);
      await alertViralPost(m.platform, topPost.caption, totalEngagement);
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
      model: 'claude-opus-4-6',
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
export async function generateAndSendWeeklyReport(): Promise<void> {
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

  // Also check milestones while we have fresh data
  await checkFollowerMilestones(metrics);

  console.log('[metrics] Weekly report sent ✅');
}

// ─── Generate auto-content for the day ───────────────────────
export async function generateDailyContent(): Promise<void> {
  console.log('[content] Generating daily content drafts...');

  // Generate 3 pieces of content for today
  const requests = [
    { platform: 'instagram' as const, topic: 'route_highlight' as const, contentType: 'post' as const },
    { platform: 'x' as const, topic: 'general' as const, contentType: 'post' as const },
    { platform: 'facebook' as const, topic: 'safety_tip' as const, contentType: 'post' as const },
  ];

  for (const req of requests) {
    try {
      const content = await generateContent({
        ...req,
        language: 'es',
        targetAudience: 'general',
        includeHashtags: true,
        includeEmoji: true,
        tone: 'friendly',
      });

      console.log(`[content] ✅ Draft for ${req.platform}:\n${content.caption.slice(0, 100)}...`);
      // In production: save to Firestore for review before publishing
    } catch (e) {
      console.error(`[content] Failed for ${req.platform}:`, (e as Error).message);
    }
  }
}

// ─── Main runner ──────────────────────────────────────────────
export async function runMarketingMonitor(): Promise<void> {
  const hour = new Date().getHours();
  console.log(`[marketing-monitor] Running at hour ${hour}`);

  // 8am: Generate daily content drafts
  if (hour === 8) {
    await generateDailyContent();
  }

  // Every run: collect metrics and check for milestones/viral
  const metrics = await collectAllMetrics();
  await checkFollowerMilestones(metrics);
  await checkViralPosts(metrics);

  // Monday 9am: send weekly report
  const dayOfWeek = new Date().getDay(); // 1 = Monday
  if (dayOfWeek === 1 && hour === 9) {
    await generateAndSendWeeklyReport();
  }

  console.log('[marketing-monitor] Done ✅');
}
