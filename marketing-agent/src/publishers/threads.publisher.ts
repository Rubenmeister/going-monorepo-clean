/**
 * Going – Threads Publisher
 * Token: THREADS_ACCESS_TOKEN (Meta Threads API — usa Graph API de Instagram)
 * User ID: THREADS_USER_ID
 * Nota: Threads comparte infraestructura con Instagram Graph API.
 *       El endpoint es: https://graph.threads.net/v1.0/
 */

export interface ThreadsMetrics {
  followers:   number;
  // Últimos 30 días
  views:       number;
  likes:       number;
  replies:     number;
  reposts:     number;
  quotes:      number;
}

export async function getThreadsMetrics(): Promise<ThreadsMetrics> {
  const token  = process.env.THREADS_ACCESS_TOKEN || '';
  const userId = process.env.THREADS_USER_ID      || '';

  if (!token || !userId) {
    console.log('[threads] Sin credenciales — devolviendo métricas vacías');
    return { followers: 0, views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 };
  }

  // Followers
  const profileRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}?fields=followers_count&access_token=${token}`
  );
  const profileData = await profileRes.json() as { followers_count?: number };
  const followers = profileData.followers_count ?? 0;

  // Insights últimos 30 días
  const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const until = Math.floor(Date.now() / 1000);
  const insightsRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads_insights?metric=views,likes,replies,reposts,quotes&since=${since}&until=${until}&period=day&access_token=${token}`
  );
  const insightsData = await insightsRes.json() as {
    data?: Array<{ name: string; values: Array<{ value: number }> }>;
  };

  function sumMetric(name: string): number {
    const metric = insightsData.data?.find(m => m.name === name);
    return metric?.values?.reduce((acc, v) => acc + (v.value ?? 0), 0) ?? 0;
  }

  return {
    followers,
    views:   sumMetric('views'),
    likes:   sumMetric('likes'),
    replies: sumMetric('replies'),
    reposts: sumMetric('reposts'),
    quotes:  sumMetric('quotes'),
  };
}
