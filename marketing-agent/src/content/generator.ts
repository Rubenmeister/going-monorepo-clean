import Anthropic from '@anthropic-ai/sdk';
import { ContentRequest, GeneratedContent } from '../types/marketing.types';
import { getTemplate, PLATFORM_LIMITS } from './templates';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// Content Generator – uses Claude to generate platform-specific
// marketing content for Going
// ============================================================

export async function generateContent(request: ContentRequest): Promise<GeneratedContent> {
  const template = getTemplate(request.topic, request.platform);
  const context = request.contextData || {};
  const maxLen = PLATFORM_LIMITS[request.platform];

  const userPromptText = template.userPrompt(context);

  // Append platform-specific constraints
  const platformNote = getPlatformNote(request);
  const fullUserPrompt = `${userPromptText}\n\n${platformNote}`;

  console.log(`[generator] Generating ${request.contentType} for ${request.platform} — topic: ${request.topic}`);

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: template.maxTokens,
    system: template.systemPrompt,
    messages: [{ role: 'user', content: fullUserPrompt }],
  });

  const rawCaption = (response.content[0] as { text: string }).text.trim();

  // Trim to platform limit
  const caption = rawCaption.length > maxLen
    ? rawCaption.slice(0, maxLen - 3) + '...'
    : rawCaption;

  // Build hashtag list (template defaults + any extras)
  const hashtags = [...new Set(template.hashtags)];

  // Optional: append hashtags to caption if not already included
  const captionHasHashtags = caption.includes('#');
  const finalCaption = captionHasHashtags
    ? caption
    : `${caption}\n\n${hashtags.join(' ')}`;

  const imagePrompt = request.imagePrompt || buildDefaultImagePrompt(request);

  return {
    platform: request.platform,
    contentType: request.contentType,
    topic: request.topic,
    caption: finalCaption,
    hashtags,
    imagePrompt,
    status: 'draft',
    createdAt: new Date(),
  };
}

// ─── Generate content for multiple platforms at once ─────────
export async function generateMultiPlatform(
  baseRequest: Omit<ContentRequest, 'platform'>,
  platforms: ContentRequest['platform'][]
): Promise<GeneratedContent[]> {
  const results: GeneratedContent[] = [];

  for (const platform of platforms) {
    try {
      const content = await generateContent({ ...baseRequest, platform });
      results.push(content);
    } catch (err) {
      console.error(`[generator] Failed for ${platform}:`, err);
    }
  }

  return results;
}

// ─── Generate weekly newsletter / blog article ───────────────
export async function generateNewsletter(context: {
  title: string;
  highlights: string[];
  cta?: string;
}): Promise<string> {
  const prompt = `Eres el editor de comunicaciones de Going, plataforma de transporte en Ecuador.

Escribe un boletín semanal profesional y amigable con la siguiente información:
Título: ${context.title}
Highlights de la semana:
${context.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}
${context.cta ? `Llamado a la acción principal: ${context.cta}` : ''}

Formato: HTML email simple (usa <h2>, <p>, <ul>, <strong>).
Extensión: 300-500 palabras. Tono cercano y motivador.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  return (response.content[0] as { text: string }).text;
}

// ─── Generate press release ──────────────────────────────────
export async function generatePressRelease(context: {
  headline: string;
  body: string;
  quote?: string;
  contactName?: string;
  contactEmail?: string;
}): Promise<string> {
  const prompt = `Redacta un comunicado de prensa profesional para Going (plataforma de transporte Ecuador).
Titular: ${context.headline}
Información: ${context.body}
${context.quote ? `Cita del directivo: "${context.quote}"` : ''}
Contacto: ${context.contactName || 'Equipo Going'} — ${context.contactEmail || 'info@goingec.com'}

Formato estándar de comunicado de prensa. Extensión: 400-600 palabras. Estilo periodístico formal.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  return (response.content[0] as { text: string }).text;
}

// ─── Helpers ─────────────────────────────────────────────────

function getPlatformNote(req: ContentRequest): string {
  const notes: Record<string, string> = {
    instagram: 'Formato Instagram: caption atractivo, máx 150 palabras, 3-5 hashtags al final.',
    facebook: 'Formato Facebook: puede ser más largo, storytelling, con pregunta al final para generar comentarios.',
    x: 'Formato X/Twitter: máximo 280 caracteres incluyendo hashtags. Impactante y directo.',
    tiktok: 'Formato TikTok: caption corto (máx 100 palabras) + idea para el video en 1-2 líneas.',
    telegram_channel: 'Formato Telegram: claro y directo, puede incluir emojis de lista. Sin hashtags.',
    threads: 'Formato Threads: conversacional, máx 500 caracteres, puede ser el inicio de una conversación.',
    youtube: 'Descripción YouTube: primera línea es el hook, luego detalle, timestamps si aplica, CTA para suscribirse.',
    whatsapp: 'Formato WhatsApp Business: mensaje directo y personalizado, máx 3 párrafos.',
    email: 'Asunto y cuerpo de email: asunto máx 60 caracteres, cuerpo 200-400 palabras.',
    blog: 'Artículo de blog: título SEO-friendly, subtítulos, párrafos cortos, 500-800 palabras.',
  };
  return notes[req.platform] || '';
}

function buildDefaultImagePrompt(req: ContentRequest): string {
  const topicImages: Record<string, string> = {
    route_highlight: 'Scenic road in Ecuador with mountains or coast, modern SUV on highway, golden hour lighting, travel photography style',
    driver_spotlight: 'Professional driver smiling next to a clean modern SUV in Ecuador, warm and trustworthy, brand photography',
    promotion: 'Bold discount announcement graphic, modern design, Going brand colors (red and white), travel theme',
    testimonial: 'Happy passenger giving thumbs up inside a clean modern vehicle, Ecuador cityscape background',
    safety_tip: 'Safety-focused graphic, seatbelt, road, professional driver, clean modern design',
    company_milestone: 'Celebration confetti graphic with number milestone, Going brand colors, festive',
    destination_guide: `Beautiful Ecuador destination photo, travel magazine style, vibrant colors`,
    product_feature: 'Modern smartphone showing a navigation/transport app, clean UI, Ecuador map',
    behind_the_scenes: 'Team of young professionals in a modern office, working on laptops, casual and authentic',
    seasonal: 'Festive Ecuador celebration, warm family imagery with travel theme',
    general: 'Modern transport in Ecuador, professional, clean Going brand aesthetic',
  };
  return topicImages[req.topic] || topicImages.general;
}
