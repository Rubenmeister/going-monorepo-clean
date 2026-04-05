import Anthropic from '@anthropic-ai/sdk';
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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

// ─── 1. Revisar borradores sin revisar (+48h) ─────────────────
export async function checkOverdueReviews(): Promise<void> {
  console.log('[content] Verificando borradores sin revisar...');
  const items = await getItemsPendingReview(48);
  for (const item of items) {
    const horas = Math.round((Date.now() - new Date(item.createdAt).getTime()) / 3600000);
    await sendMessage(alertOverdueReview(item.title, item.type, horas));
    await saveContentAlert({ type: 'overdue_review', severity: 'warning', message: `"${item.title}" lleva ${horas}h sin revisión`, itemId: item.id, createdAt: new Date().toISOString() });
  }
  console.log(`[content] ${items.length} borradores vencidos`);
}

// ─── 2. Alertar publicaciones programadas próximas (+1h) ──────
export async function checkScheduledPublications(): Promise<void> {
  console.log('[content] Verificando publicaciones próximas...');
  const items = await getScheduledItems(1);
  for (const item of items) {
    if (!item.scheduledAt) continue;
    const minutos = Math.round((new Date(item.scheduledAt).getTime() - Date.now()) / 60000);
    await sendMessage(alertScheduledSoon(item.title, item.type, minutos));
  }
}

// ─── 3. Verificar cursos incompletos de la Academia ───────────
export async function checkAcademyContent(): Promise<void> {
  console.log('[content] Verificando cursos de la Academia...');
  const courses = await getIncompleteCourses();
  for (const course of courses) {
    const lessons = await getCourseLessons(course.id);
    const drafts  = lessons.filter(l => l.status === 'draft').length;
    if (drafts > 0) {
      await sendMessage(alertAcademyIncomplete(course.title, lessons.length, drafts));
      await saveContentAlert({ type: 'academy_incomplete', severity: 'warning', message: `Curso "${course.title}": ${drafts} lecciones en borrador`, itemId: course.id, createdAt: new Date().toISOString() });
    }
  }
}

// ─── 4. Generar borrador de artículo con IA (8am diario) ──────
export async function generateDailyContentDraft(): Promise<void> {
  console.log('[content] Generando borrador diario con IA...');

  // Detectar qué tipo de contenido tiene menos borradores disponibles
  const [noticias, blog, revista] = await Promise.all([
    getContentByType('news'),
    getContentByType('blog_post'),
    getContentByType('article'),
  ]);

  const counts = [
    { type: 'news'      as const, label: 'Noticia',         count: noticias.length },
    { type: 'blog_post' as const, label: 'Post de Blog',    count: blog.length     },
    { type: 'article'   as const, label: 'Artículo Revista', count: revista.length  },
  ];

  // Prioriza el tipo con menos contenido en cola
  const target = counts.sort((a, b) => a.count - b.count)[0];

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Eres editor de contenido de Going Ecuador (plataforma de transporte y turismo).
Genera un borrador de ${target.label} en español sobre un tema relevante para conductores, viajeros o turismo en Ecuador.
Formato de respuesta (JSON):
{
  "title": "...",
  "summary": "... (2-3 oraciones)",
  "body": "... (400-600 palabras)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "..."
}`,
      }],
    });

    const text = (response.content[0] as { text: string }).text;
    const data = JSON.parse(text) as { title: string; summary: string; body: string; tags: string[]; category: string };

    const id = await saveContentItem({
      type:      target.type,
      title:     data.title,
      body:      data.body,
      summary:   data.summary,
      author:    'Going Content Agent (IA)',
      status:    'draft',
      lang:      'es',
      tags:      data.tags,
      category:  data.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await sendMessage(
      `✍️ <b>Nuevo borrador generado</b>\n\n` +
      `📄 "${data.title}"\n` +
      `🏷 Tipo: ${target.label}\n` +
      `🆔 ID: <code>${id}</code>\n\n` +
      `Revisar y aprobar antes de publicar.`
    );
    console.log(`[content] Borrador generado: "${data.title}" (${target.type})`);
  } catch (e) {
    console.error('[content] Error generando borrador IA:', (e as Error).message);
  }
}

// ─── 5. Reporte semanal (lunes 9am) ───────────────────────────
export async function sendWeeklyContentReport(): Promise<void> {
  console.log('[content] Generando reporte semanal...');

  const published = await getPublishedThisWeek();
  const [noticias, blog, revista, lecciones] = await Promise.all([
    getContentByType('news'),
    getContentByType('blog_post'),
    getContentByType('article'),
    getContentByType('academy_lesson'),
  ]);

  const borradores = [...noticias, ...blog, ...revista, ...lecciones].filter(i => i.status === 'draft').length;
  const enRevision = [...noticias, ...blog, ...revista, ...lecciones].filter(i => i.status === 'review').length;

  const msg = weeklyContentReport({
    fecha: new Date().toLocaleDateString('es-EC', {
      timeZone: 'America/Guayaquil', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    publicados:       published.length,
    borradores,
    enRevision,
    articulosRevista: published.filter(i => i.type === 'article').length,
    blogPosts:        published.filter(i => i.type === 'blog_post').length,
    noticias:         published.filter(i => i.type === 'news').length,
    leccionesAcademia: published.filter(i => i.type === 'academy_lesson').length,
  });

  await sendMessage(msg);
}

// ─── Runner principal ─────────────────────────────────────────
export async function runContentMonitor(): Promise<void> {
  const hour      = currentHourEcuador();
  const dayOfWeek = currentDayOfWeekEcuador();
  console.log(`[content-agent] Corriendo a las ${hour}h Ecuador`);

  // Cada corrida: alertas de revisión y publicaciones próximas
  await checkOverdueReviews();
  await checkScheduledPublications();
  await checkAcademyContent();

  // 8am diario: generar borrador con IA
  if (hour === 8 && isPrimaryRunOfHour()) {
    await generateDailyContentDraft();
  }

  // Lunes 9am: reporte semanal
  if (dayOfWeek === 1 && hour === 9 && isPrimaryRunOfHour()) {
    await sendWeeklyContentReport();
  }

  console.log('[content-agent] Ciclo completado ✅');
}
