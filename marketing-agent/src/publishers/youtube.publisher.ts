/**
 * Going – YouTube Publisher
 * Token: YOUTUBE_API_KEY (Google Data API v3)
 * Channel ID: YOUTUBE_CHANNEL_ID
 */

export interface YouTubeMetrics {
  subscribers:  number;
  totalViews:   number;
  videoCount:   number;
  // Últimos 28 días (YouTube Analytics API)
  recentViews:  number;
  watchTimeMin: number;
  likes:        number;
  comments:     number;
}

export async function getYouTubeMetrics(): Promise<YouTubeMetrics> {
  const apiKey    = process.env.YOUTUBE_API_KEY    || '';
  const channelId = process.env.YOUTUBE_CHANNEL_ID || '';

  if (!apiKey || !channelId) {
    console.log('[youtube] Sin credenciales — devolviendo métricas vacías');
    return { subscribers: 0, totalViews: 0, videoCount: 0, recentViews: 0, watchTimeMin: 0, likes: 0, comments: 0 };
  }

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
  );
  const data = await res.json() as {
    items?: Array<{ statistics: { subscriberCount: string; viewCount: string; videoCount: string } }>;
  };

  const stats = data.items?.[0]?.statistics;
  return {
    subscribers:  parseInt(stats?.subscriberCount || '0', 10),
    totalViews:   parseInt(stats?.viewCount       || '0', 10),
    videoCount:   parseInt(stats?.videoCount      || '0', 10),
    recentViews:  0,  // requiere YouTube Analytics API (OAuth)
    watchTimeMin: 0,
    likes:        0,
    comments:     0,
  };
}
