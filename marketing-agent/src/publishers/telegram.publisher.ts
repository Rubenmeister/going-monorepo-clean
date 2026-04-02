import { GeneratedContent, PublishedPost, WeeklyReport } from '../types/marketing.types';

// ============================================================
// Telegram Channel Publisher
// Required secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID
// TELEGRAM_CHANNEL_ID = @goingappecuador (canal público Going)
// ============================================================

const TELEGRAM_API = 'https://api.telegram.org';

async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<{ ok: boolean; result?: { message_id?: number } }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[telegram-channel] No token configured, skipping');
    return { ok: false };
  }

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });

  const data = await res.json() as { ok: boolean; result?: { message_id?: number } };
  if (!data.ok) {
    throw new Error(`Telegram error: ${JSON.stringify(data)}`);
  }
  return data;
}

// ─── Publish post to Telegram channel ────────────────────────
export async function publishToTelegramChannel(content: GeneratedContent): Promise<PublishedPost> {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!channelId) throw new Error('TELEGRAM_CHANNEL_ID not configured');

  // Format for Telegram: HTML
  const text = content.caption
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  console.log(`[telegram-channel] Publishing to ${channelId}`);
  const result = await sendTelegramMessage(channelId, text, 'HTML');
  const msgId = result.result?.message_id?.toString() || '';

  return {
    platform: 'telegram_channel',
    postId: msgId,
    publishedAt: new Date(),
    content,
  };
}

// ─── Send weekly marketing summary to ops chat ───────────────
export async function sendWeeklyMarketingSummary(report: WeeklyReport): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID; // ops chat
  if (!chatId) {
    console.log('[telegram-channel] No ops chat configured');
    return;
  }

  const lines = [
    `📊 <b>Reporte Semanal de Marketing</b>`,
    `Semana del ${report.weekOf.toLocaleDateString('es-EC')}`,
    ``,
    `📣 <b>Alcance total:</b> ${report.totalReach.toLocaleString()}`,
    `❤️ <b>Engagement:</b> ${report.totalEngagement.toLocaleString()}`,
    `👥 <b>Nuevos seguidores:</b> +${report.newFollowers}`,
    `📝 <b>Posts publicados:</b> ${report.postsPublished}`,
    ``,
    `<b>Por plataforma:</b>`,
    ...report.platformBreakdown.map(
      (p) => `  • ${platformEmoji(p.platform)} ${p.platform}: ${p.followers} seguidores | engagement ${p.engagementRate.toFixed(1)}%`
    ),
  ];

  if (report.topPerformingPost) {
    lines.push(``, `🏆 <b>Post estrella:</b> ${report.topPerformingPost.platform} — ${report.topPerformingPost.content.caption.slice(0, 60)}...`);
  }

  if (report.insights.length > 0) {
    lines.push(``, `💡 <b>Insights:</b>`);
    report.insights.forEach((i) => lines.push(`  • ${i}`));
  }

  await sendTelegramMessage(chatId, lines.join('\n'), 'HTML');
  console.log('[telegram-channel] Weekly marketing summary sent');
}

// ─── Alert: viral post ────────────────────────────────────────
export async function alertViralPost(platform: string, caption: string, engagement: number): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const text = [
    `🔥 <b>¡Post viral en ${platform}!</b>`,
    `Engagement: ${engagement.toLocaleString()}`,
    `"${caption.slice(0, 100)}..."`,
  ].join('\n');

  await sendTelegramMessage(chatId, text, 'HTML');
}

// ─── Alert: milestone ─────────────────────────────────────────
export async function alertFollowerMilestone(platform: string, count: number): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const text = [
    `🎉 <b>¡Nuevo hito en ${platform}!</b>`,
    `Ya somos <b>${count.toLocaleString()} seguidores</b> 🚀`,
    `¡Gracias a la comunidad Going!`,
  ].join('\n');

  await sendTelegramMessage(chatId, text, 'HTML');
}

// ─── Channel metrics ──────────────────────────────────────────
export interface TelegramMetrics {
  members:     number;  // suscriptores del canal Going
  recentViews: number;  // vistas recientes (requiere Telegram Stats API)
  postCount:   number;  // posts en últimos 30 días (requiere Stats API)
}

export async function getTelegramMetrics(): Promise<TelegramMetrics> {
  const token     = process.env.TELEGRAM_BOT_TOKEN  || '';
  const channelId = process.env.TELEGRAM_CHANNEL_ID || '';

  if (!token || !channelId) {
    console.log('[telegram] Sin credenciales de canal — devolviendo métricas vacías');
    return { members: 0, recentViews: 0, postCount: 0 };
  }

  const res = await fetch(
    `${TELEGRAM_API}/bot${token}/getChat?chat_id=${channelId}`
  );
  const data = await res.json() as {
    ok:      boolean;
    result?: { member_count?: number };
  };

  if (!data.ok) {
    console.warn('[telegram] getChat falló — verifica que el bot sea admin del canal');
    return { members: 0, recentViews: 0, postCount: 0 };
  }

  return {
    members:     data.result?.member_count ?? 0,
    recentViews: 0,  // requiere Telegram Stats API (canales >500 miembros)
    postCount:   0,
  };
}

function platformEmoji(platform: string): string {
  const map: Record<string, string> = {
    instagram: '📸',
    facebook: '👥',
    x: '🐦',
    tiktok: '🎵',
    telegram_channel: '✈️',
    youtube: '▶️',
    threads: '🧵',
    whatsapp: '💬',
  };
  return map[platform] || '📱';
}
