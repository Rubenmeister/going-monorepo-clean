import { GeneratedContent, PublishedPost } from '../types/marketing.types';

// ============================================================
// Meta Publisher – Instagram + Facebook Graph API
// Required secrets: META_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID
// ============================================================

const GRAPH_API = 'https://graph.facebook.com/v19.0';

async function graphRequest(path: string, method: 'GET' | 'POST', params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN not configured');

  const url = new URL(`${GRAPH_API}${path}`);
  if (method === 'GET') {
    url.searchParams.set('access_token', token);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Meta API GET error: ${res.status} ${await res.text()}`);
    return res.json();
  } else {
    const body = new URLSearchParams({ access_token: token, ...params });
    const res = await fetch(url.toString(), { method: 'POST', body });
    if (!res.ok) throw new Error(`Meta API POST error: ${res.status} ${await res.text()}`);
    return res.json();
  }
}

// ─── Facebook Page ────────────────────────────────────────────
export async function publishToFacebook(content: GeneratedContent): Promise<PublishedPost> {
  const pageId = process.env.META_PAGE_ID;
  if (!pageId) throw new Error('META_PAGE_ID not configured');

  console.log(`[meta] Publishing to Facebook page ${pageId}`);

  const result = await graphRequest(`/${pageId}/feed`, 'POST', {
    message: content.caption,
  }) as { id?: string };

  const postId = result.id || '';
  console.log(`[meta] Facebook post created: ${postId}`);

  return {
    platform: 'facebook',
    postId,
    url: `https://facebook.com/${postId.replace('_', '/posts/')}`,
    publishedAt: new Date(),
    content,
  };
}

// ─── Instagram (requires image URL) ──────────────────────────
export async function publishToInstagram(content: GeneratedContent, imageUrl: string): Promise<PublishedPost> {
  const igUserId = process.env.META_IG_USER_ID;
  if (!igUserId) throw new Error('META_IG_USER_ID not configured');

  console.log(`[meta] Publishing to Instagram account ${igUserId}`);

  // Step 1: Create media container
  const container = await graphRequest(`/${igUserId}/media`, 'POST', {
    image_url: imageUrl,
    caption: content.caption,
  }) as { id?: string };

  const containerId = container.id || '';

  // Step 2: Publish the container
  const published = await graphRequest(`/${igUserId}/media_publish`, 'POST', {
    creation_id: containerId,
  }) as { id?: string };

  const postId = published.id || '';
  console.log(`[meta] Instagram post created: ${postId}`);

  return {
    platform: 'instagram',
    postId,
    url: `https://instagram.com/p/${postId}`,
    publishedAt: new Date(),
    content,
  };
}

// ─── Instagram Story ──────────────────────────────────────────
export async function publishInstagramStory(content: GeneratedContent, imageUrl: string): Promise<PublishedPost> {
  const igUserId = process.env.META_IG_USER_ID;
  if (!igUserId) throw new Error('META_IG_USER_ID not configured');

  const container = await graphRequest(`/${igUserId}/media`, 'POST', {
    image_url: imageUrl,
    media_type: 'IMAGE',
    is_story: 'true',
  }) as { id?: string };

  const containerId = container.id || '';
  const published = await graphRequest(`/${igUserId}/media_publish`, 'POST', {
    creation_id: containerId,
  }) as { id?: string };

  return {
    platform: 'instagram',
    postId: published.id || '',
    publishedAt: new Date(),
    content,
  };
}

// ─── Get Facebook Page Metrics ────────────────────────────────
export async function getFacebookMetrics(): Promise<{
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
}> {
  const pageId = process.env.META_PAGE_ID;
  if (!pageId) throw new Error('META_PAGE_ID not configured');

  const data = await graphRequest(`/${pageId}/insights`, 'GET', {
    metric: 'page_fans,page_impressions,page_reach,page_engaged_users',
    period: 'week',
  }) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };

  const metrics: Record<string, number> = {};
  (data.data || []).forEach((item) => {
    const latest = item.values?.[item.values.length - 1];
    metrics[item.name] = latest?.value || 0;
  });

  return {
    followers: metrics['page_fans'] || 0,
    reach: metrics['page_reach'] || 0,
    impressions: metrics['page_impressions'] || 0,
    engagement: metrics['page_engaged_users'] || 0,
  };
}

// ─── Get Instagram Metrics ────────────────────────────────────
export async function getInstagramMetrics(): Promise<{
  followers: number;
  reach: number;
  impressions: number;
}> {
  const igUserId = process.env.META_IG_USER_ID;
  if (!igUserId) throw new Error('META_IG_USER_ID not configured');

  const data = await graphRequest(`/${igUserId}/insights`, 'GET', {
    metric: 'follower_count,reach,impressions',
    period: 'week',
    since: String(Math.floor(Date.now() / 1000) - 7 * 86400),
    until: String(Math.floor(Date.now() / 1000)),
  }) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };

  const metrics: Record<string, number> = {};
  (data.data || []).forEach((item) => {
    const latest = item.values?.[item.values.length - 1];
    metrics[item.name] = latest?.value || 0;
  });

  return {
    followers: metrics['follower_count'] || 0,
    reach: metrics['reach'] || 0,
    impressions: metrics['impressions'] || 0,
  };
}
