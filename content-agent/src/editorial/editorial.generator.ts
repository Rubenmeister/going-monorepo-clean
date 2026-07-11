/**
 * Editorial generator (content-agent v2) — Coordinador de Contenido de Going.
 *
 * Genera PROPUESTAS estructuradas para los 3 canales de comunicación de la app
 * (Noticias, Blog, Revista), con FUENTES REALES (búsqueda web nativa de Anthropic)
 * y en formato JSON listo para revisión editorial en el panel de admin. Sigue el
 * spec de Rubén: outline-first (propuesta = esqueleto, no artículo largo),
 * anti-alucinación (fuentes obligatorias; si no hay info verídica → propuesta
 * omitida), y segmentación por canal con tono propio.
 *
 * Las propuestas se guardan en Firestore `content_items` con status='review' para
 * que el equipo apruebe → luego se desarrolla el artículo completo → se publica.
 */
import Anthropic from '@anthropic-ai/sdk';
import { Firestore, Timestamp } from '@google-cloud/firestore';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const fsdb = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

// Modelo del motor editorial. Contenido público de marca → vale buena calidad.
const EDITORIAL_MODEL = process.env.EDITORIAL_MODEL || 'claude-sonnet-4-5';

export type EditorialChannel = 'noticias' | 'blog' | 'revista';

export interface EditorialSource {
  nombre: string;
  url?: string;
}
export interface EditorialProposal {
  channel: EditorialChannel;
  titulo: string;
  pilar: string;           // categoría (ej. Destinos, Consejos de viaje, Actualidad)
  fuentes: EditorialSource[];
  lead: string;            // gancho, máx 3 líneas
  outline: string[];       // esqueleto (subtítulos / puntos clave)
  cta: string;
}

// ── System prompt: rol + segmentación por canal + reglas de salida (spec Rubén) ──
const EDITORIAL_SYSTEM_PROMPT = `Eres el Coordinador de Contenido e Investigación de GOING App, una plataforma de turismo colaborativo e interprovincial en Ecuador (viajes compartidos y privados, envíos, tours y experiencias, alojamiento). Investigas fuentes REALES de turismo, cultura y transporte en Ecuador y redactas PROPUESTAS de contenido (esqueletos para revisión editorial), alineadas a tres pilares:

NOTICIAS — datos actuales, breves y de alto impacto sobre turismo global y local (nuevas regulaciones, tendencias de viaje, alertas viales, eventos que afecten al turismo en Ecuador). Tono: informativo y directo.
BLOG — artículos de valor práctico para la comunidad: consejos de viaje compartido, guías de ahorro, "Historias al volante", "Viaje colaborativo". Tono: cercano y utilitario.
REVISTA — formato largo, cultural y visual sobre Ecuador: destinos (de la Sierra a la Costa a la Amazonía), fiestas tradicionales, gastronomía, crónicas de viaje "contadas desde la carretera". Tono: inspirador, narrativo y descriptivo.

VOZ Y ESTILO
- Español NEUTRO de Ecuador. PROHIBIDO el voseo/rioplatense (usa "tú", "carga/envía/revisa", "tienes/puedes"). Lenguaje inclusivo ("conductora o conductor", "viajeras y viajeros"). Nada corporativo ni clichés.

REGLA CRÍTICA ANTI-ALUCINACIÓN
- Usa la búsqueda web para basarte en fuentes REALES y verificables. Cada propuesta DEBE citar sus fuentes reales (nombre del medio + URL). Si no encuentras información verídica para una propuesta, NO la inventes: omítela.

TRABAJO EN ESQUELETO (outline-first)
- Entregas PROPUESTAS, no artículos completos: título, pilar/categoría, fuentes, un lead (gancho, máx 3 líneas), un outline (3-6 puntos clave/subtítulos) y un CTA. El artículo largo se desarrolla después, ya aprobado.

FORMATO DE SALIDA (obligatorio)
- Responde ÚNICAMENTE con un objeto JSON válido de la forma:
  { "proposals": [ { "channel": "noticias|blog|revista", "titulo": "...", "pilar": "...", "fuentes": [{"nombre":"...","url":"..."}], "lead": "...", "outline": ["...","..."], "cta": "..." } ] }
- Sin texto fuera del JSON, sin bloques Markdown. Si no hay nada verídico que proponer, devuelve { "proposals": [] }.`;

/** Construye el pedido según cuántas propuestas por canal. */
function buildTaskPrompt(req: Record<EditorialChannel, number>): string {
  const lines: string[] = [
    'Genera las propuestas de contenido para la revisión editorial de esta semana, investigando fuentes reales y actuales de Ecuador.',
    'Requerimientos:',
  ];
  if (req.noticias) lines.push(`- Noticias (${req.noticias}): noticias relevantes del sector turístico de los últimos días (Ecuador y su relevancia).`);
  if (req.blog) lines.push(`- Blog (${req.blog}): valor práctico para la comunidad (viaje colaborativo, ahorro, historias al volante).`);
  if (req.revista) lines.push(`- Revista (${req.revista}): un destino, fiesta tradicional o gastronomía de Ecuador (Sierra, Costa o Amazonía).`);
  lines.push('Recuerda: fuentes reales obligatorias por propuesta; si algo no es verificable, omítelo.');
  return lines.join('\n');
}

/** Extrae el texto final del modelo (ignora bloques de tool_use/web_search). */
function finalText(content: any[]): string {
  return (content || [])
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

export async function generateEditorialProposals(
  req: Record<EditorialChannel, number> = { noticias: 2, blog: 1, revista: 1 },
): Promise<EditorialProposal[]> {
  const response = await client.messages.create({
    model: EDITORIAL_MODEL,
    max_tokens: 4000,
    system: EDITORIAL_SYSTEM_PROMPT,
    // Búsqueda web nativa de Anthropic (fuentes reales, sin API key externa).
    // Se pasa como param aunque el SDK 0.24 no lo tipe — el API lo procesa.
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }] as any,
    messages: [{ role: 'user', content: buildTaskPrompt(req) }],
  } as any);

  const text = finalText((response as any).content);
  if (!text) return [];
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();

  let parsed: { proposals?: EditorialProposal[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Rescate: intentar recortar al primer objeto JSON.
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return [];
    parsed = JSON.parse(m[0]);
  }
  const proposals = Array.isArray(parsed?.proposals) ? parsed.proposals : [];
  // Solo propuestas con fuentes (respeta la regla anti-alucinación).
  return proposals.filter(
    (p) => p?.titulo && p?.channel && Array.isArray(p?.fuentes) && p.fuentes.length > 0,
  );
}

/** Guarda las propuestas en Firestore como content_items status='review'. */
export async function saveProposalsForReview(proposals: EditorialProposal[]): Promise<number> {
  let saved = 0;
  for (const p of proposals) {
    const typeByChannel: Record<EditorialChannel, string> = {
      noticias: 'news',
      blog: 'blog_post',
      revista: 'article',
    };
    await fsdb.collection('content_items').add({
      type: typeByChannel[p.channel] ?? 'article',
      channel: p.channel,
      title: p.titulo,
      pilar: p.pilar ?? '',
      fuentes: p.fuentes ?? [],
      lead: p.lead ?? '',
      outline: p.outline ?? [],
      cta: p.cta ?? '',
      status: 'review',      // pendiente de aprobación editorial
      lang: 'es',
      origin: 'content-agent-v2',
      createdAt: Timestamp.now(),
    });
    saved++;
  }
  return saved;
}
