// ============================================================
// GOING – Marketing Agent Types
// ============================================================

export type Platform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'x'
  | 'telegram_channel'
  | 'whatsapp'
  | 'threads'
  | 'youtube'
  | 'email'
  | 'blog';

export type ContentType =
  | 'post'          // standard image + caption
  | 'story'         // ephemeral vertical content
  | 'reel'          // short video
  | 'video'         // long-form video
  | 'newsletter'    // email / blog article
  | 'press_release' // for newspapers / media
  | 'thread';       // X/Threads multi-part

export type ContentTopic =
  | 'route_highlight'        // Promote a specific route
  | 'driver_spotlight'       // Feature a top driver
  | 'promotion'              // Discount or special offer
  | 'testimonial'            // Customer review highlight
  | 'safety_tip'             // Trust/safety content
  | 'company_milestone'      // Celebration / achievement
  | 'destination_guide'      // Travel content for a destination
  | 'behind_the_scenes'      // Team / culture content
  | 'product_feature'        // App feature announcement
  | 'community'              // Local community involvement
  | 'seasonal'               // Holiday / seasonal campaign
  | 'general';               // Free-form

// ─── Content Request ─────────────────────────────────────────
export interface ContentRequest {
  topic: ContentTopic;
  platform: Platform;
  contentType: ContentType;
  language?: 'es' | 'en';
  targetAudience?: 'passenger' | 'driver' | 'general';
  contextData?: Record<string, string | number>; // e.g. { route: 'Quito→Guayaquil', price: 25 }
  includeHashtags?: boolean;
  includeEmoji?: boolean;
  tone?: 'professional' | 'friendly' | 'exciting' | 'informative';
  imagePrompt?: string; // DALL-E prompt if image generation requested
}

// ─── Generated Content ───────────────────────────────────────
export interface GeneratedContent {
  platform: Platform;
  contentType: ContentType;
  topic: ContentTopic;
  caption: string;
  hashtags: string[];
  imagePrompt?: string;
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedAt?: Date;
  postId?: string;          // ID returned by the platform API
  createdAt: Date;
}

// ─── Published Post ──────────────────────────────────────────
export interface PublishedPost {
  platform: Platform;
  postId: string;
  url?: string;
  publishedAt: Date;
  content: GeneratedContent;
}

// ─── Platform Metrics ────────────────────────────────────────
export interface PlatformMetrics {
  platform: Platform;
  fetchedAt: Date;
  followers: number;
  followersGrowth: number;    // vs. previous period
  reach: number;
  impressions: number;
  engagement: number;         // likes + comments + shares
  engagementRate: number;     // engagement / impressions * 100
  topPost?: {
    postId: string;
    caption: string;
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface WeeklyReport {
  weekOf: Date;
  totalReach: number;
  totalEngagement: number;
  newFollowers: number;
  postsPublished: number;
  platformBreakdown: PlatformMetrics[];
  topPerformingPost?: PublishedPost;
  insights: string[];         // AI-generated insights
}

// ─── Email Campaign ──────────────────────────────────────────
export interface EmailCampaign {
  subject: string;
  previewText: string;
  bodyHtml: string;
  recipients: 'all' | 'passengers' | 'drivers' | 'newsletter';
  scheduledAt?: Date;
  sentAt?: Date;
  opens?: number;
  clicks?: number;
}

// ─── Marketing Alert ─────────────────────────────────────────
export type AlertType =
  | 'viral_post'              // post getting unusually high engagement
  | 'follower_milestone'      // 100, 500, 1000, 5000 followers
  | 'negative_comment'        // negative sentiment detected
  | 'weekly_summary'          // regular weekly report
  | 'content_scheduled'       // content published OK
  | 'publish_failed';         // publication error

export interface MarketingAlert {
  type: AlertType;
  platform?: Platform;
  message: string;
  data?: Record<string, string | number>;
  createdAt: Date;
}

// ─── Secrets Expected in GCP Secret Manager ──────────────────
// ─── Going Social Media Handles ──────────────────────────────
// instagram:  @goingappecuador   → instagram.com/goingappecuador
// facebook:   goingappecuador    → facebook.com/goingappecuador
// tiktok:     @goingappecuador   → tiktok.com/@goingappecuador
// x:          @GoingAppecuador   → x.com/GoingAppecuador
// youtube:    @Goingappecuador   → youtube.com/@Goingappecuador
// linkedin:   going-app          → linkedin.com/company/going-app
// telegram:   @goingappecuador   → t.me/goingappecuador
// threads:    @goingappecuador   → threads.com/@goingappecuador
// whatsapp:   +1 213 838 3591    → api.whatsapp.com/send/?phone=12138383591
//
// ─── Secrets Expected in GCP Secret Manager ──────────────────
// META_ACCESS_TOKEN         - Facebook/Instagram Graph API token
// META_PAGE_ID              - Facebook Page ID (goingappecuador)
// META_IG_USER_ID           - Instagram Business Account ID
// TWITTER_API_KEY           - X/Twitter API key (@GoingAppecuador)
// TWITTER_API_SECRET        - X/Twitter API secret
// TWITTER_ACCESS_TOKEN      - X/Twitter access token
// TWITTER_ACCESS_SECRET     - X/Twitter access token secret
// TIKTOK_ACCESS_TOKEN       - TikTok for Business token (@goingappecuador)
// YOUTUBE_API_KEY           - YouTube Data API v3 (@Goingappecuador)
// SENDGRID_API_KEY          - Email campaigns via SendGrid
// TELEGRAM_BOT_TOKEN        - Already in Secret Manager
// TELEGRAM_CHANNEL_ID       - @goingappecuador (canal público Telegram)
// ANTHROPIC_API_KEY         - Already in Secret Manager
