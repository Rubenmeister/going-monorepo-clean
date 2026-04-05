/**
 * Going Content Agent — Notificaciones por Gmail (nodemailer)
 * Reemplaza Telegram para notificaciones internas.
 *
 * Variables de entorno requeridas:
 *   GMAIL_FROM         = goingappecuador@gmail.com
 *   GMAIL_APP_PASSWORD = contraseña de app de Google
 *   NOTIFICATION_EMAIL = rubenmeister@gmail.com
 */

import * as nodemailer from 'nodemailer';

function createTransport() {
  const user = process.env.GMAIL_FROM || 'goingappecuador@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    console.warn('[email-notify] GMAIL_APP_PASSWORD no configurado — notificaciones omitidas');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/** Convierte el HTML básico de Telegram a texto plano legible */
function htmlToText(html: string): string {
  return html
    .replace(/<b>(.*?)<\/b>/g, '$1')
    .replace(/<code>(.*?)<\/code>/g, '[$1]')
    .replace(/<\/?(i|em|u|s|a[^>]*)>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Envía una notificación interna al correo de operaciones */
export async function sendNotification(html: string): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const from    = process.env.GMAIL_FROM    || 'goingappecuador@gmail.com';
  const to      = process.env.NOTIFICATION_EMAIL || 'rubenmeister@gmail.com';
  const subject = extractSubject(html);

  try {
    await transport.sendMail({
      from: `Going Content Agent <${from}>`,
      to,
      subject,
      text: htmlToText(html),
      html: wrapHtml(html),
    });
    console.log(`[email-notify] ✅ Notificación enviada: ${subject}`);
  } catch (err) {
    console.error('[email-notify] Error enviando email:', (err as Error).message);
  }
}

/** Extrae el primer texto en negrita como asunto del correo */
function extractSubject(html: string): string {
  const match = /<b>(.*?)<\/b>/.exec(html);
  return match ? `Going Content — ${match[1].replace(/<[^>]+>/g, '')}` : 'Going Content Agent — Notificación';
}

/** Envuelve el mensaje en un email HTML simple con branding Going */
function wrapHtml(body: string): string {
  const formatted = body
    .replace(/\n/g, '<br>')
    .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
    .replace(/<code>(.*?)<\/code>/g, '<code style="background:#f0f0f0;padding:2px 4px;border-radius:3px">$1</code>');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:#ff4c41;padding:16px 24px">
      <h2 style="color:#fff;margin:0;font-size:18px">📰 Going Content Agent</h2>
    </div>
    <div style="padding:24px;color:#333;line-height:1.6">${formatted}</div>
    <div style="background:#f5f5f5;padding:12px 24px;font-size:12px;color:#999;text-align:center">
      Going Ecuador — Agente de Contenido automático
    </div>
  </div>
</body>
</html>`;
}
