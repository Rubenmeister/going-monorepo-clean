import Anthropic from '@anthropic-ai/sdk';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import {
  getItemsPendingReview,
  getScheduledItems,
  getPublishedThisWeek,
  getContentByType,
  getIncompleteCourses,
  getCourseLessons,
  saveContentItem,
  saveContentAlert,
} from '../firestore/content.service';
import {
  sendInternalAlert,
  alertOverdueReview,
  alertScheduledSoon,
  alertAcademyIncomplete,
  weeklyContentReport,
} from '../publishers/internal-notifier';
import { sendTelegramTip } from '../publishers/telegram.bot';
import {
  Anomaly,
  ActionTaken,
  ActionProposed,
} from '@going-platform/cerebro-contracts';

// ─── RunCollector compartido (Cerebro) ───────────────────────
//
// Cada job empuja a este recolector. `runContentMonitor` lo retorna y
// `index.ts` lo envuelve en un AgentRunEvent que se publica al
// cerebro-service.

export interface RunCollector {
  metrics:         Record<string, number | string>;
  anomalies:       Anomaly[];
  actionsTaken:    ActionTaken[];
  actionsProposed: ActionProposed[];
  errors:          string[];
}

function createCollector(): RunCollector {
  return { metrics: {}, anomalies: [], actionsTaken: [], actionsProposed: [], errors: [] };
}

function recordError(c: RunCollector, jobName: string, err: unknown): void {
  console.error(`[content] ${jobName} failed:`, err);
  c.errors.push(jobName);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const fsdb   = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

// Modelo del tip semanal: override por env. Default Claude Sonnet 4.5 —
// el tip es contenido público que representa la marca, conviene
// pagar buena calidad de copywriting (volumen mínimo, ~52 tips/año).
import { generateEditorialProposals, saveProposalsForReview } from '../editorial/editorial.generator';

const AI_TIP_MODEL = process.env.AI_TIP_MODEL || 'claude-sonnet-4-5';

// ── Directrices de marca y CALIDAD para Killa (content-agent) ──────────────
// System prompt: define QUIÉN es Going, la voz, la audiencia, el estándar de
// calidad y lo prohibido. Es la palanca principal para que el contenido diario
// sea bueno y consistente. Respeta CLAUDE.md (español neutro de Ecuador,
// lenguaje inclusivo) y NUNCA inventa datos comerciales.
const CONTENT_SYSTEM_PROMPT = `Eres Killa, la voz de contenido de GOING — una plataforma ecuatoriana de turismo colaborativo y transporte (viajes compartidos y privados, envíos, tours y experiencias, alojamiento). Escribes para el canal público de Going.

AUDIENCIA
- Conductoras y conductores afiliados (operadores locales por ruta en Ecuador).
- Viajeras y viajeros que usan la app (pasajeros y quienes envían/reciben paquetes).

VOZ DE MARCA
- Cercana, práctica y humana. NUNCA corporativa, acartonada ni "de manual".
- Español NEUTRO de Ecuador. PROHIBIDO el voseo/rioplatense: usa "tú" (no "vos"),
  "carga/envía/revisa" (no "cargá/enviá/revisá"), "tienes/puedes" (no "tenés/podés").
- Lenguaje inclusivo siempre: "conductora o conductor", "viajeras y viajeros".
- Cero relleno, cero clichés ("en el mundo de hoy", "sin duda", "¿sabías que…?").

ESTÁNDAR DE CALIDAD (obligatorio)
1. UNA sola idea clara y ACCIONABLE por pieza — algo que la persona pueda usar hoy.
2. Específico y real de Ecuador (lugares, rutas, costumbres, clima concretos), no genérico.
3. Que suene escrito por una persona que conoce el terreno, no por una IA.
4. Aporta valor de verdad: enseña, ahorra tiempo/dinero, o hace el viaje más seguro/lindo.
5. Empieza fuerte (sin saludos ni "Hola"). Directo al valor.

PROHIBIDO
- Inventar precios, descuentos, promociones, porcentajes o estadísticas. Si no te
  doy un dato comercial exacto, NO lo menciones (no cites cifras de tarifas ni "%").
- Prometer cosas que la app no hace o exagerar.
- Emojis de más (máximo 1–2, relevantes), hashtags en cadena, mayúsculas gritonas.
- Inglés (salvo un nombre propio inevitable).

Devuelve SIEMPRE el JSON pedido, sin texto adicional.`;

// ── Timezone helpers ──────────────────────────────────────────
function currentHourEcuador(): number {
  return parseInt(new Date().toLocaleString('en-US', {
    timeZone: 'America/Guayaquil', hour: 'numeric', hour12: false,
  }), 10);
}
function currentDayOfWeekEcuador(): number {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' })).getDay();
}
function isPrimaryRunOfHour(): boolean {
  return parseInt(new Date().toLocaleString('en-US', {
    timeZone: 'America/Guayaquil', minute: 'numeric',
  }), 10) < 30;
}

// ─── 1. Borradores sin revisar (+48h) ─────────────────────────
//
// Solo dispara si el equipo está usando el CMS (escribiendo a
// content_items). Si la collection está vacía, el monitor no hace nada.

export async function checkOverdueReviews(c?: RunCollector): Promise<void> {
  console.log('[content] Verificando borradores sin revisar...');
  const items = await getItemsPendingReview(48);
  if (c) c.metrics.overdueReviewsCount = items.length;

  for (const item of items) {
    const horas = Math.round((Date.now() - new Date(item.createdAt).getTime()) / 3600000);
    if (c) {
      c.anomalies.push({
        type: 'overdue_review',
        severity: horas > 96 ? 'critical' : 'warning',
        message: `"${item.title}" lleva ${horas}h sin revisión`,
        data: { itemId: item.id, type: item.type, hoursWaiting: horas },
      });
    }
    await sendInternalAlert(alertOverdueReview(item.title, item.type, horas));
    if (c) {
      c.actionsTaken.push({
        type: 'sent_internal_alert',
        target: item.id,
        result: 'ok',
        data: { reason: 'overdue_review' },
      });
    }
    try {
      await saveContentAlert({
        type:      'overdue_review',
        severity:  'warning',
        message:   `"${item.title}" lleva ${horas}h sin revisión`,
        itemId:    item.id,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[content] save alert failed:', err);
    }
  }
  console.log(`[content] ${items.length} borradores vencidos`);
}

// ─── 2. Publicaciones programadas próximas (+1h) ──────────────
export async function checkScheduledPublications(c?: RunCollector): Promise<void> {
  console.log('[content] Verificando publicaciones próximas...');
  const items = await getScheduledItems(1);
  if (c) c.metrics.scheduledSoonCount = items.length;

  for (const item of items) {
    if (!item.scheduledAt) continue;
    const minutos = Math.round((new Date(item.scheduledAt).getTime() - Date.now()) / 60000);
    if (c) {
      c.anomalies.push({
        type: 'scheduled_soon',
        severity: 'info',
        message: `"${item.title}" se publica en ${minutos} min`,
        data: { itemId: item.id, type: item.type, minutesUntilPublish: minutos },
      });
    }
    await sendInternalAlert(alertScheduledSoon(item.title, item.type, minutos));
  }
}

// ─── 3. Cursos de Academia incompletos ────────────────────────
export async function checkAcademyContent(c?: RunCollector): Promise<void> {
  console.log('[content] Verificando cursos de la Academia...');
  const courses = await getIncompleteCourses();
  let coursesWithDrafts = 0;
  let totalDraftLessons = 0;

  for (const course of courses) {
    const lessons = await getCourseLessons(course.id);
    const drafts  = lessons.filter(l => l.status === 'draft').length;
    if (drafts > 0) {
      coursesWithDrafts++;
      totalDraftLessons += drafts;
      if (c) {
        c.anomalies.push({
          type: 'academy_incomplete',
          severity: 'warning',
          message: `Curso "${course.title}": ${drafts} lecciones en borrador`,
          data: { courseId: course.id, totalLessons: lessons.length, draftLessons: drafts },
        });
      }
      await sendInternalAlert(alertAcademyIncomplete(course.title, lessons.length, drafts));
      try {
        await saveContentAlert({
          type:      'academy_incomplete',
          severity:  'warning',
          message:   `Curso "${course.title}": ${drafts} lecciones en borrador`,
          itemId:    course.id,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[content] save academy alert failed:', err);
      }
    }
  }
  if (c) {
    c.metrics.academyIncompleteCourses = coursesWithDrafts;
    c.metrics.academyDraftLessonsTotal = totalDraftLessons;
  }
}

// ─── 4. TIP SEMANAL — el loop útil principal (Lunes 9am) ──────
//
// Cada lunes el agente genera un tip corto y lo PUBLICA al canal de
// Telegram (CONTENT_TELEGRAM_CHAT_ID o el operador). Tópicos rotan
// para no repetir; el último topic se guarda en Firestore.

const TOPIC_POOL = [
  {
    key: 'seguridad_vial',
    prompt: `Genera un tip de seguridad vial corto (200-280 caracteres) en español ecuatoriano para conductores de transporte privado en Going. Algo que les sirva esta semana. Sin saludos formales, directo. Termina con un emoji relevante.`,
  },
  {
    key: 'destino_ecuador',
    prompt: `Genera una recomendación corta (220-280 caracteres) de un destino turístico de Ecuador, no obvio, ideal para un viajero que toma un servicio Going. Menciona la provincia y un dato curioso. Termina con un emoji.`,
  },
  {
    key: 'consejo_pasajero',
    prompt: `Genera un consejo práctico (200-280 caracteres) en español ecuatoriano para pasajeros de Going (cómo aprovechar la app, ahorrar, viajar seguro, etc). Tono amigable, no corporativo. Termina con un emoji.`,
  },
  {
    key: 'dato_ecuador',
    prompt: `Genera un dato curioso o efeméride de Ecuador (200-280 caracteres), relevante para esta época del año si aplica. Algo que un conductor podría comentar con sus pasajeros. Termina con un emoji.`,
  },
  {
    key: 'manejo_economico',
    prompt: `Genera un tip de manejo económico para conductores Going (ahorro de combustible, mantenimiento preventivo, rutas eficientes), 200-280 caracteres en español ecuatoriano. Termina con un emoji.`,
  },
  {
    key: 'feature_app',
    prompt: `Genera un tip corto (200-280 caracteres) sobre cómo aprovechar mejor la app Going (sistema de pago, viajes compartidos al 35% de descuento, ratings, suscripciones, frecuencia). Tono cercano. Termina con un emoji.`,
  },
  {
    key: 'gastronomia',
    prompt: `Genera un dato breve (220-280 caracteres) sobre un plato típico ecuatoriano que un viajero debería probar, mencionando dónde encontrarlo (provincia o ciudad). Tono cercano. Termina con un emoji.`,
  },
];

async function getNextTopic(): Promise<typeof TOPIC_POOL[number]> {
  const ref = fsdb.collection('content_state').doc('weekly_tip_cursor');
  const snap = await ref.get();
  const lastIndex = snap.exists ? (snap.data()?.index ?? -1) : -1;
  const nextIndex = (lastIndex + 1) % TOPIC_POOL.length;
  await ref.set({ index: nextIndex, updatedAt: Timestamp.now() }, { merge: true });
  return TOPIC_POOL[nextIndex];
}

export async function generateWeeklyTip(c?: RunCollector): Promise<void> {
  console.log('[content] Generando tip semanal...');
  try {
    const topic = await getNextTopic();
    console.log(`[content] tópico esta semana: ${topic.key}`);
    if (c) c.metrics.weeklyTipTopic = topic.key;

    const response = await client.messages.create({
      model:      AI_TIP_MODEL,
      max_tokens: 400,
      system:     CONTENT_SYSTEM_PROMPT,
      messages: [{
        role:    'user',
        content: topic.prompt + `

Formato de respuesta (JSON):
{
  "title": "Título corto y atractivo (sin emojis), máx 60 caracteres",
  "body":  "El tip listo para Telegram (200-280 caracteres, puede llevar 1-2 emojis)"
}`,
      }],
    });

    const block = response.content?.[0];
    const text  = block && 'text' in block ? (block as { text: string }).text : '';
    if (!text) {
      console.warn('[content] respuesta vacía del modelo');
      if (c) {
        c.anomalies.push({
          type: 'weekly_tip_generation_failed',
          severity: 'warning',
          message: `Modelo ${AI_TIP_MODEL} devolvió respuesta vacía`,
          data: { topic: topic.key, model: AI_TIP_MODEL },
        });
      }
      return;
    }

    // Soportar respuestas con ```json ... ``` o JSON raw
    const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
    const data = JSON.parse(cleaned) as { title: string; body: string };

    // Componer mensaje Telegram (negrita en el título)
    const message = `💡 <b>${data.title}</b>\n\n${data.body}\n\n<i>— Going Ecuador</i>`;

    const ok = await sendTelegramTip(message);
    if (!ok) {
      console.warn('[content] Telegram no aceptó el tip');
      if (c) {
        c.anomalies.push({
          type: 'weekly_tip_publish_failed',
          severity: 'critical',
          message: `Tip generado pero Telegram lo rechazó — config CONTENT_TELEGRAM_CHAT_ID?`,
          data: { topic: topic.key, title: data.title },
        });
        c.actionsTaken.push({
          type: 'published_weekly_tip',
          target: 'telegram_channel',
          result: 'failed',
          data: { topic: topic.key, title: data.title, model: AI_TIP_MODEL },
        });
      }
      // Fallback: intentamos por email también para que ops lo vea
      await sendInternalAlert(`📰 <b>Tip semanal generado pero NO enviado a Telegram</b>\n\n${message}\n\nRevisar config CONTENT_TELEGRAM_CHAT_ID.`);
      return;
    }

    // Tip publicado — registrar acción al cerebro. Esto es el "pulso de
    // imagen de marca" que el world model querrá tracker semana a semana.
    if (c) {
      c.actionsTaken.push({
        type: 'published_weekly_tip',
        target: 'telegram_channel',
        result: 'ok',
        data: {
          topic: topic.key,
          title: data.title,
          bodyLength: data.body.length,
          model: AI_TIP_MODEL,
        },
      });
      c.metrics.weeklyTipPublished = 1;
    }

    // Persistir como published para tener registro y evitar tópicos repetidos
    try {
      await saveContentItem({
        type:        'news',
        title:       data.title,
        body:        data.body,
        summary:     data.body.slice(0, 140),
        author:      'Going Content Agent (IA)',
        status:      'published',
        lang:        'es',
        tags:        [topic.key, 'tip_semanal', 'telegram'],
        category:    topic.key,
        publishedAt: new Date().toISOString(),
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      });
      console.log(`[content] tip publicado: "${data.title}"`);
    } catch (err) {
      console.error('[content] guardar tip falló (pero ya se publicó):', err);
    }
  } catch (e) {
    console.error('[content] error generando tip semanal:', (e as Error).message);
    if (c) {
      c.errors.push('generateWeeklyTip');
      c.anomalies.push({
        type: 'weekly_tip_generation_failed',
        severity: 'warning',
        message: `Error generando tip: ${(e as Error).message}`,
        data: { model: AI_TIP_MODEL },
      });
    }
  }
}

// ─── 5. Reporte semanal interno (lunes 9am, después del tip) ──
export async function sendWeeklyContentReport(c?: RunCollector): Promise<void> {
  console.log('[content] Generando reporte semanal...');
  const published = await getPublishedThisWeek();
  const [noticias, blog, revista, lecciones] = await Promise.all([
    getContentByType('news'),
    getContentByType('blog_post'),
    getContentByType('article'),
    getContentByType('academy_lesson'),
  ]);

  const all = [...noticias, ...blog, ...revista, ...lecciones];
  const borradores = all.filter(i => i.status === 'draft').length;
  const enRevision = all.filter(i => i.status === 'review').length;

  const msg = weeklyContentReport({
    fecha: new Date().toLocaleDateString('es-EC', {
      timeZone: 'America/Guayaquil',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    publicados:        published.length,
    borradores,
    enRevision,
    articulosRevista:  published.filter(i => i.type === 'article').length,
    blogPosts:         published.filter(i => i.type === 'blog_post').length,
    noticias:          published.filter(i => i.type === 'news').length,
    leccionesAcademia: published.filter(i => i.type === 'academy_lesson').length,
  });

  await sendInternalAlert(msg);

  // Métricas al cerebro: pulso del CMS semana a semana.
  if (c) {
    c.metrics.publishedThisWeek = published.length;
    c.metrics.draftsCount = borradores;
    c.metrics.inReviewCount = enRevision;
    c.metrics.publishedArticles = published.filter(i => i.type === 'article').length;
    c.metrics.publishedBlogPosts = published.filter(i => i.type === 'blog_post').length;
    c.metrics.publishedNews = published.filter(i => i.type === 'news').length;
    c.metrics.publishedAcademyLessons = published.filter(i => i.type === 'academy_lesson').length;

    // Si el equipo tiene mucho borrador acumulado sin publicar, proponer
    // que ops/marketing programen una sesión de revisión. Heurística simple
    // pero accionable.
    if (borradores > 10) {
      c.actionsProposed.push({
        type: 'schedule_content_review_session',
        reason: `${borradores} borradores acumulados sin publicar`,
        urgency: borradores > 20 ? 0.6 : 0.3,
        data: { drafts: borradores, inReview: enRevision },
      });
    }
  }
}

// ─── Runner principal ─────────────────────────────────────────
//
// Cada job en su propio try/catch — un fallo no rompe los demás.
// El collector se devuelve para que index.ts arme el AgentRunEvent.

export interface MonitorRunResult {
  collector: RunCollector;
}

async function safeRun(c: RunCollector, name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    recordError(c, name, err);
  }
}

export async function runContentMonitor(): Promise<MonitorRunResult> {
  const hour      = currentHourEcuador();
  const dayOfWeek = currentDayOfWeekEcuador();
  console.log(`[content-agent] Corriendo a las ${hour}h Ecuador, día ${dayOfWeek}`);

  const c = createCollector();
  c.metrics.runHourEcuador = hour;
  c.metrics.runDayOfWeek = dayOfWeek;

  // Cada corrida: alertas de revisión y publicaciones próximas
  // (silenciosas si content_items está vacío)
  await safeRun(c, 'checkOverdueReviews', () => checkOverdueReviews(c));
  await safeRun(c, 'checkScheduledPublications', () => checkScheduledPublications(c));
  await safeRun(c, 'checkAcademyContent', () => checkAcademyContent(c));

  // Lunes 9am: tip semanal + reporte interno
  if (dayOfWeek === 1 && hour === 9 && isPrimaryRunOfHour()) {
    await safeRun(c, 'generateWeeklyTip', () => generateWeeklyTip(c));
    await safeRun(c, 'sendWeeklyContentReport', () => sendWeeklyContentReport(c));
  }

  // Motor editorial v2 (Noticias/Blog/Revista) — genera PROPUESTAS con fuentes
  // reales (búsqueda web) para revisión editorial en Firestore (status='review').
  // Diario a las 9am cuando el scheduler sea '0 9 * * *'. NO publica solo: espera
  // aprobación humana. (Requiere créditos en la cuenta Anthropic.)
  if (hour === 9 && isPrimaryRunOfHour()) {
    await safeRun(c, 'generateEditorialProposals', async () => {
      const proposals = await generateEditorialProposals({ noticias: 2, blog: 1, revista: 1 });
      const saved = await saveProposalsForReview(proposals);
      console.log(`[content-agent] ${saved} propuesta(s) editorial(es) guardada(s) para revisión`);
      if (c) c.metrics.editorialProposalsSaved = saved;
    });
  }

  // Triggers manuales (testing) — útil sin esperar al horario
  if (process.env.FORCE_WEEKLY_TIP === '1') {
    console.log('[content-agent] FORCE_WEEKLY_TIP=1 — disparando tip manual');
    await safeRun(c, 'forcedWeeklyTip', () => generateWeeklyTip(c));
  }
  if (process.env.FORCE_EDITORIAL === '1') {
    console.log('[content-agent] FORCE_EDITORIAL=1 — generando propuestas editoriales');
    await safeRun(c, 'forcedEditorial', async () => {
      const proposals = await generateEditorialProposals({ noticias: 2, blog: 1, revista: 1 });
      const saved = await saveProposalsForReview(proposals);
      console.log(`[content-agent] ${saved} propuesta(s) editorial(es) guardada(s)`);
    });
  }

  console.log('[content-agent] Ciclo completado ✅');
  return { collector: c };
}
