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
  sendMessage,
  alertOverdueReview,
  alertScheduledSoon,
  alertAcademyIncomplete,
  weeklyContentReport,
} from '../publishers/telegram.publisher';
import { sendTelegramTip } from '../publishers/telegram.bot';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const fsdb   = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

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

export async function checkOverdueReviews(): Promise<void> {
  console.log('[content] Verificando borradores sin revisar...');
  const items = await getItemsPendingReview(48);
  for (const item of items) {
    const horas = Math.round((Date.now() - new Date(item.createdAt).getTime()) / 3600000);
    await sendMessage(alertOverdueReview(item.title, item.type, horas));
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
export async function checkScheduledPublications(): Promise<void> {
  console.log('[content] Verificando publicaciones próximas...');
  const items = await getScheduledItems(1);
  for (const item of items) {
    if (!item.scheduledAt) continue;
    const minutos = Math.round((new Date(item.scheduledAt).getTime() - Date.now()) / 60000);
    await sendMessage(alertScheduledSoon(item.title, item.type, minutos));
  }
}

// ─── 3. Cursos de Academia incompletos ────────────────────────
export async function checkAcademyContent(): Promise<void> {
  console.log('[content] Verificando cursos de la Academia...');
  const courses = await getIncompleteCourses();
  for (const course of courses) {
    const lessons = await getCourseLessons(course.id);
    const drafts  = lessons.filter(l => l.status === 'draft').length;
    if (drafts > 0) {
      await sendMessage(alertAcademyIncomplete(course.title, lessons.length, drafts));
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

export async function generateWeeklyTip(): Promise<void> {
  console.log('[content] Generando tip semanal...');
  try {
    const topic = await getNextTopic();
    console.log(`[content] tópico esta semana: ${topic.key}`);

    const response = await client.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 400,
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
      // Fallback: intentamos por email también para que ops lo vea
      await sendMessage(`📰 <b>Tip semanal generado pero NO enviado a Telegram</b>\n\n${message}\n\nRevisar config CONTENT_TELEGRAM_CHAT_ID.`);
      return;
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
  }
}

// ─── 5. Reporte semanal interno (lunes 9am, después del tip) ──
export async function sendWeeklyContentReport(): Promise<void> {
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

  await sendMessage(msg);
}

// ─── Runner principal ─────────────────────────────────────────
export async function runContentMonitor(): Promise<void> {
  const hour      = currentHourEcuador();
  const dayOfWeek = currentDayOfWeekEcuador();
  console.log(`[content-agent] Corriendo a las ${hour}h Ecuador, día ${dayOfWeek}`);

  // Cada corrida: alertas de revisión y publicaciones próximas
  // (silenciosas si content_items está vacío)
  await checkOverdueReviews();
  await checkScheduledPublications();
  await checkAcademyContent();

  // Lunes 9am: tip semanal + reporte interno
  if (dayOfWeek === 1 && hour === 9 && isPrimaryRunOfHour()) {
    await generateWeeklyTip();
    await sendWeeklyContentReport();
  }

  // Triggers manuales (testing)
  if (process.env.FORCE_WEEKLY_TIP === '1') {
    console.log('[content-agent] FORCE_WEEKLY_TIP=1 — disparando tip manual');
    await generateWeeklyTip();
  }

  console.log('[content-agent] Ciclo completado ✅');
}
