/**
 * Social loop (Fase 1) — generar → revisar → publicar.
 *
 * Mismo patrón que el content-agent (Killa): el agente GENERA propuestas y las
 * deja en Firestore `social_posts` con status='review'. Un humano las aprueba
 * desde el panel admin (Comunicación › Redes) → status='approved'. En la
 * siguiente corrida, `publishApprovedPosts()` dispara los publishers REALES
 * (que ya existían) y sella status='published' o 'failed'.
 *
 * NO publica nada sin aprobación humana. NO usa infra nueva (Firestore ya está).
 */
import { Firestore } from '@google-cloud/firestore';
import { generateMultiPlatform } from '../content/generator';
import { publishToFacebook, publishToInstagram } from '../publishers/meta.publisher';
import { publishToX } from '../publishers/twitter.publisher';
import { publishToTikTok } from '../publishers/tiktok.publisher';
import { publishToTelegramChannel } from '../publishers/telegram.publisher';
import {
  ContentRequest,
  GeneratedContent,
  Platform,
  PublishedPost,
} from '../types/marketing.types';

const db = new Firestore({ projectId: process.env.GCP_PROJECT });
const COLLECTION = 'social_posts';

/** Plataformas que publican solo con texto/enlace (sin media generada). */
const TEXT_PUBLISHABLE: Platform[] = ['telegram_channel', 'facebook', 'x'];

export interface SocialProposalSpec {
  topic: ContentRequest['topic'];
  contentType?: ContentRequest['contentType'];
  platforms: Platform[];
  contextData?: Record<string, string | number>;
  targetAudience?: ContentRequest['targetAudience'];
  tone?: ContentRequest['tone'];
}

/**
 * 1) GENERAR: crea propuestas multi-plataforma y las guarda en revisión.
 * Devuelve cuántas creó (una por plataforma por spec).
 */
export async function generateSocialProposals(
  specs: SocialProposalSpec[],
): Promise<{ created: number; ids: string[] }> {
  const ids: string[] = [];
  for (const spec of specs) {
    const base: Omit<ContentRequest, 'platform'> = {
      topic: spec.topic,
      contentType: spec.contentType ?? 'post',
      language: 'es',
      targetAudience: spec.targetAudience ?? 'general',
      contextData: spec.contextData,
      includeHashtags: true,
      includeEmoji: true,
      tone: spec.tone ?? 'friendly',
    };
    let generated: GeneratedContent[] = [];
    try {
      generated = await generateMultiPlatform(base, spec.platforms);
    } catch (e) {
      console.error(`[social] generación falló (topic=${spec.topic}):`, (e as Error).message);
      continue;
    }
    for (const g of generated) {
      const doc = {
        status: 'review' as const,
        platform: g.platform,
        contentType: g.contentType,
        topic: g.topic,
        caption: g.caption,
        hashtags: g.hashtags ?? [],
        imagePrompt: g.imagePrompt ?? null,
        contextData: spec.contextData ?? null,
        // Instagram/TikTok requieren media; se marca para que el panel avise.
        needsMedia: !TEXT_PUBLISHABLE.includes(g.platform),
        mediaUrl: null,
        createdAt: new Date().toISOString(),
      };
      const ref = await db.collection(COLLECTION).add(doc);
      ids.push(ref.id);
    }
  }
  console.log(`[social] ${ids.length} propuesta(s) creada(s) en revisión.`);
  return { created: ids.length, ids };
}

/**
 * 2) PUBLICAR: toma los aprobados (status='approved') y dispara el publisher
 * real de cada plataforma. Sella 'published' (con postId/url) o 'failed'.
 */
export async function publishApprovedPosts(
  limit = 25,
): Promise<{ published: number; failed: number; results: any[] }> {
  const snap = await db
    .collection(COLLECTION)
    .where('status', '==', 'approved')
    .limit(Math.min(Math.max(limit, 1), 100))
    .get();

  const results: any[] = [];
  let published = 0;
  let failed = 0;

  for (const d of snap.docs) {
    const data = d.data() as any;
    const content = toGeneratedContent(data);
    try {
      const post = await dispatch(content, data);
      await d.ref.update({
        status: 'published',
        postId: post.postId ?? null,
        postUrl: post.url ?? null,
        publishedAt: new Date().toISOString(),
        error: null,
      });
      published++;
      results.push({ id: d.id, platform: data.platform, ok: true, postId: post.postId });
      console.log(`[social] publicado ${data.platform} id=${d.id} postId=${post.postId}`);
    } catch (e) {
      const msg = (e as Error).message;
      await d.ref.update({ status: 'failed', error: msg, failedAt: new Date().toISOString() });
      failed++;
      results.push({ id: d.id, platform: data.platform, ok: false, error: msg });
      console.error(`[social] FALLÓ ${data.platform} id=${d.id}: ${msg}`);
    }
  }

  if (snap.size === 0) console.log('[social] no hay posts aprobados por publicar.');
  return { published, failed, results };
}

function toGeneratedContent(data: any): GeneratedContent {
  return {
    platform: data.platform,
    contentType: data.contentType,
    topic: data.topic,
    caption: data.caption,
    hashtags: data.hashtags ?? [],
    imagePrompt: data.imagePrompt ?? undefined,
    status: 'scheduled',
    createdAt: new Date(),
  };
}

async function dispatch(content: GeneratedContent, data: any): Promise<PublishedPost> {
  switch (content.platform) {
    case 'telegram_channel':
      return publishToTelegramChannel(content);
    case 'facebook':
      return publishToFacebook(content);
    case 'x':
      return publishToX(content);
    case 'instagram':
      if (!data.mediaUrl) throw new Error('Instagram requiere mediaUrl (imagen); aún no disponible');
      return publishToInstagram(content, data.mediaUrl);
    case 'tiktok':
      if (!data.mediaUrl) throw new Error('TikTok requiere mediaUrl (video); aún no disponible');
      return publishToTikTok(content, data.mediaUrl);
    default:
      throw new Error(`Plataforma no soportada para publicación automática: ${content.platform}`);
  }
}
