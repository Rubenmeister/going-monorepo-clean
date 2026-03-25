import { GeneratedContent, PublishedPost } from '../types/marketing.types';

// ============================================================
// X / Twitter Publisher – API v2
// Required secrets: TWITTER_API_KEY, TWITTER_API_SECRET,
//                   TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
// ============================================================

// Twitter API v2 uses OAuth 1.0a for user-context requests
// We use a simple HMAC-SHA1 implementation
import crypto from 'crypto';

function oauthSign(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  tokenSecret: string,
  token: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: token,
    oauth_version: '1.0',
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramStr = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');

  const base = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramStr)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(base).digest('base64');

  oauthParams['oauth_signature'] = signature;

  const header = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');

  return header;
}

export async function publishToX(content: GeneratedContent): Promise<PublishedPost> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error('Twitter API credentials not configured');
  }

  // Trim to 280 chars
  let text = content.caption;
  if (text.length > 280) {
    text = text.slice(0, 277) + '...';
  }

  const url = 'https://api.twitter.com/2/tweets';
  const body = JSON.stringify({ text });

  const authHeader = oauthSign('POST', url, {}, apiKey, apiSecret, accessSecret, accessToken);

  console.log(`[twitter] Posting tweet (${text.length} chars)`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Twitter API error: ${res.status} ${await res.text()}`);
  }

  const result = await res.json() as { data?: { id?: string } };
  const postId = result.data?.id || '';

  console.log(`[twitter] Tweet created: ${postId}`);

  return {
    platform: 'x',
    postId,
    url: `https://x.com/GoingAppecuador/status/${postId}`,
    publishedAt: new Date(),
    content,
  };
}

export async function getXMetrics(): Promise<{
  followers: number;
  impressions: number;
  engagements: number;
}> {
  // Twitter v2 metrics require OAuth 2.0 Bearer token + elevated access
  // Returns placeholder until API access is confirmed
  console.log('[twitter] Metrics: API elevated access required');
  return { followers: 0, impressions: 0, engagements: 0 };
}
