/**
 * Going – LinkedIn Publisher
 * Token: LINKEDIN_ACCESS_TOKEN (LinkedIn API v2)
 * Organization ID: LINKEDIN_ORG_ID
 */

export interface LinkedInMetrics {
  followers:       number;
  // Últimos 30 días
  impressions:     number;
  clicks:          number;
  likes:           number;
  comments:        number;
  shares:          number;
  engagementRate:  number; // porcentaje
}

export async function getLinkedInMetrics(): Promise<LinkedInMetrics> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN || '';
  const orgId = process.env.LINKEDIN_ORG_ID       || '';

  if (!token || !orgId) {
    console.log('[linkedin] Sin credenciales — devolviendo métricas vacías');
    return { followers: 0, impressions: 0, clicks: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0 };
  }

  // Follower count
  const followersRes = await fetch(
    `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const followersData = await followersRes.json() as {
    elements?: Array<{ followerCountsByAssociationType?: Array<{ followerCounts: { organicFollowerCount: number } }> }>;
  };

  const followers = followersData.elements?.[0]
    ?.followerCountsByAssociationType?.[0]
    ?.followerCounts?.organicFollowerCount ?? 0;

  // Últimos 30 días — share statistics
  const end   = Date.now();
  const start = end - 30 * 24 * 60 * 60 * 1000;
  const statsRes = await fetch(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=${start}&timeIntervals.timeRange.end=${end}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const statsData = await statsRes.json() as {
    elements?: Array<{
      totalShareStatistics: {
        impressionCount:   number;
        clickCount:        number;
        likeCount:         number;
        commentCount:      number;
        shareCount:        number;
        engagement:        number;
      };
    }>;
  };

  const s = statsData.elements?.[0]?.totalShareStatistics;
  return {
    followers,
    impressions:    s?.impressionCount   ?? 0,
    clicks:         s?.clickCount        ?? 0,
    likes:          s?.likeCount         ?? 0,
    comments:       s?.commentCount      ?? 0,
    shares:         s?.shareCount        ?? 0,
    engagementRate: s?.engagement        ?? 0,
  };
}
