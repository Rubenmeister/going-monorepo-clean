import { GeneratedContent, PublishedPost } from '../types/marketing.types';

// ============================================================
// TikTok Publisher – TikTok for Business Content Posting API
// Required secret: TIKTOK_ACCESS_TOKEN
// Note: TikTok requires video upload (not just text/image)
// This publisher handles caption + video URL from cloud storage
// ============================================================

export async function publishToTikTok(
  content: GeneratedContent,
  videoUrl: string
): Promise<PublishedPost> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) {
    throw new Error('TIKTOK_ACCESS_TOKEN not configured');
  }

  console.log('[tiktok] Initiating video upload...');

  // Step 1: Initialize upload
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: content.caption.slice(0, 150),
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl,
      },
    }),
  });

  if (!initRes.ok) {
    throw new Error(`TikTok init error: ${initRes.status} ${await initRes.text()}`);
  }

  const initData = await initRes.json() as { data?: { publish_id?: string } };
  const publishId = initData.data?.publish_id || '';

  console.log(`[tiktok] Video publish initiated: ${publishId}`);

  return {
    platform: 'tiktok',
    postId: publishId,
    publishedAt: new Date(),
    content,
  };
}

// TikTok metrics via Business API
export async function getTikTokMetrics(): Promise<{
  followers: number;
  videoViews: number;
  likes: number;
}> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) {
    console.log('[tiktok] No access token configured');
    return { followers: 0, videoViews: 0, likes: 0 };
  }

  try {
    const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return { followers: 0, videoViews: 0, likes: 0 };

    const data = await res.json() as { data?: { user?: { follower_count?: number; likes_count?: number } } };
    return {
      followers: data.data?.user?.follower_count || 0,
      videoViews: 0, // Requires analytics endpoint
      likes: data.data?.user?.likes_count || 0,
    };
  } catch {
    return { followers: 0, videoViews: 0, likes: 0 };
  }
}
