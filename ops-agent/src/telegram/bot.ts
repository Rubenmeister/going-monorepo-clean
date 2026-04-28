/**
 * Going Ops Agent — Telegram Bot
 * Token: configurar en GCP Secret Manager como TELEGRAM_BOT_TOKEN
 * Chat ID: el grupo "Going Operaciones" — configurar como TELEGRAM_CHAT_ID
 */

if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
  throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required');
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export async function sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) console.error('[Telegram] Error:', data.description);
    return data.ok;
  } catch (err) {
    console.error('[Telegram] Fallo al enviar mensaje:', err);
    return false;
  }
}

// ─── Mensajes formateados ──────────────────────────────────────

export function alertNoConductor(rideId: string, minutos: number, origen: string, destino: string): string {
  return `🚨 <b>VIAJE SIN CONDUCTOR</b>\n\n` +
    `⏱ Lleva <b>${minutos} minutos</b> sin asignación\n` +
    `📍 ${origen} → ${destino}\n` +
    `🆔 Viaje: <code>${rideId}</code>\n\n` +
    `Acción requerida: asignar conductor manualmente.`;
}

export function alertConductorInactivo(nombre: string, placa: string, horas: number, provincia: string): string {
  const lineaConductor = placa && placa !== '—' ? `👤 ${nombre} | 🚗 ${placa}` : `👤 ${nombre}`;
  const lineaUbicacion = provincia && provincia !== '—' ? `\n📍 ${provincia}` : '';
  return `⚠️ <b>CONDUCTOR INACTIVO</b>\n\n` +
    `${lineaConductor}${lineaUbicacion}\n` +
    `⏱ Lleva <b>${horas.toFixed(1)} horas</b> sin completar viajes\n\n` +
    `Considera enviarle un incentivo o revisar su estado.`;
}

export function alertBajoIngreso(nombre: string, placa: string, ingresoHoy: number, hora: string): string {
  const lineaConductor = placa && placa !== '—' ? `👤 ${nombre} | 🚗 ${placa}` : `👤 ${nombre}`;
  return `💰 <b>INGRESO BAJO</b>\n\n` +
    `${lineaConductor}\n` +
    `💵 Ingreso hoy: <b>$${ingresoHoy.toFixed(2)}</b> (meta diaria: $70)\n` +
    `🕐 Hora: ${hora}\n\n` +
    `Considera enviarle notificación de incentivo.`;
}

export function alertMetaAlcanzada(nombre: string, ingresoHoy: number): string {
  return `🎉 <b>META DEL DÍA ALCANZADA</b>\n\n` +
    `👤 ${nombre}\n` +
    `💵 <b>$${ingresoHoy.toFixed(2)}</b> ✅\n\n` +
    `¡Felicitaciones al conductor por superar la meta de $70!`;
}

export function alertDocumentoVence(nombre: string, tipo: string, placa: string, diasRestantes: number, fechaVencimiento: string): string {
  const emoji = diasRestantes <= 7 ? '🚨' : '⚠️';
  return `${emoji} <b>DOCUMENTO POR VENCER</b>\n\n` +
    `👤 ${nombre} | 🚗 ${placa}\n` +
    `📄 ${tipo}\n` +
    `📅 Vence: <b>${fechaVencimiento}</b> (en ${diasRestantes} días)\n\n` +
    `Solicitar renovación inmediata.`;
}

export function alertCalificacionBaja(nombre: string, placa: string, rating: number, totalReviews: number): string {
  return `⭐ <b>CALIFICACIÓN BAJA</b>\n\n` +
    `👤 ${nombre} | 🚗 ${placa}\n` +
    `⭐ Rating: <b>${rating.toFixed(1)}/5.0</b> (${totalReviews} reseñas)\n\n` +
    `Revisar reseñas recientes y contactar al conductor.`;
}

export function reporteDiario(stats: {
  fecha: string;
  viajesCompletados: number;
  viajesCancelados: number;
  conductoresActivos: number;
  conductoresEnMeta: number;
  ingresoTotal: number;
  topConductor: string;
  topIngreso: number;
  alertasDelDia: number;
}): string {
  return `📊 <b>REPORTE DIARIO GOING</b>\n` +
    `📅 ${stats.fecha}\n\n` +
    `🚗 <b>Viajes</b>\n` +
    `  ✅ Completados: ${stats.viajesCompletados}\n` +
    `  ❌ Cancelados: ${stats.viajesCancelados}\n\n` +
    `👥 <b>Conductores</b>\n` +
    `  🟢 Activos hoy: ${stats.conductoresActivos}\n` +
    `  🎯 En meta ($70): ${stats.conductoresEnMeta}\n\n` +
    `💰 <b>Ingresos</b>\n` +
    `  Total Going: $${stats.ingresoTotal.toFixed(2)}\n` +
    `  🏆 Top conductor: ${stats.topConductor} ($${stats.topIngreso.toFixed(2)})\n\n` +
    `🔔 Alertas del día: ${stats.alertasDelDia}\n\n` +
    `<i>Generado automáticamente por Going Ops Agent</i>`;
}
