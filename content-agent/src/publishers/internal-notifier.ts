/**
 * Going Content Agent — Notificador interno (alertas a ops por Gmail).
 *
 * NOTA: Antes este archivo se llamaba `telegram.publisher.ts` por legacy,
 * pero NUNCA usó Telegram — siempre fue Gmail. El nombre engañaba.
 *
 * El bot Telegram REAL (publicación pública del tip semanal al canal de
 * Going) vive en `./telegram.bot.ts` — ese sí toca la Bot API.
 */

import { sendNotification } from './email.notify';

/** Envía una alerta interna por Gmail HTML (audiencia: ops, no público). */
export async function sendInternalAlert(html: string): Promise<void> {
  await sendNotification(html);
}

export function alertOverdueReview(title: string, type: string, horasEspera: number): string {
  return `⚠️ <b>CONTENIDO SIN REVISAR</b>\n\n` +
    `📄 "${title}"\n` +
    `🏷 Tipo: ${type}\n` +
    `⏱ Lleva <b>${horasEspera}h</b> en borrador sin revisión\n\n` +
    `Revisar y aprobar o devolver con comentarios.`;
}

export function alertScheduledSoon(title: string, type: string, minutosRestantes: number): string {
  return `🕐 <b>PUBLICACIÓN PRÓXIMA</b>\n\n` +
    `📄 "${title}"\n` +
    `🏷 Tipo: ${type}\n` +
    `⏱ Se publica en <b>${minutosRestantes} minutos</b>\n\n` +
    `Verificar que el contenido esté aprobado.`;
}

export function alertAcademyIncomplete(courseTitle: string, lessonsTotal: number, lessonsDraft: number): string {
  return `🎓 <b>CURSO INCOMPLETO — Academia Going</b>\n\n` +
    `📚 "${courseTitle}"\n` +
    `📋 ${lessonsDraft} de ${lessonsTotal} lecciones en borrador\n\n` +
    `Completar o asignar a un redactor.`;
}

export function weeklyContentReport(stats: {
  fecha: string;
  publicados: number;
  borradores: number;
  enRevision: number;
  articulosRevista: number;
  blogPosts: number;
  noticias: number;
  leccionesAcademia: number;
}): string {
  return `📰 <b>REPORTE SEMANAL — Contenido Going</b>\n` +
    `📅 ${stats.fecha}\n\n` +
    `✅ Publicados esta semana: <b>${stats.publicados}</b>\n` +
    `📝 En borrador: ${stats.borradores}\n` +
    `👀 En revisión: ${stats.enRevision}\n\n` +
    `<b>Desglose:</b>\n` +
    `  📖 Revista: ${stats.articulosRevista}\n` +
    `  ✍️ Blog: ${stats.blogPosts}\n` +
    `  📢 Noticias: ${stats.noticias}\n` +
    `  🎓 Academia: ${stats.leccionesAcademia} lecciones\n\n` +
    `<i>Generado por Going Content Agent</i>`;
}
