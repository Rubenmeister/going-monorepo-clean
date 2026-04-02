/**
 * Going – WhatsApp Publisher (via Twilio)
 * Usa las credenciales de Twilio ya existentes en Secret Manager:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 * Número WhatsApp Business: whatsapp:+12138383591
 *
 * La API de Twilio no expone métricas de "seguidores" para WhatsApp —
 * reportamos conteo de mensajes de los últimos 30 días.
 */

export interface WhatsAppMetrics {
  sent:      number;
  delivered: number;
  read:      number;
  received:  number;
}

export async function getWhatsAppMetrics(): Promise<WhatsAppMetrics> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken  = process.env.TWILIO_AUTH_TOKEN  || '';

  if (!accountSid || !authToken) {
    console.log('[whatsapp] Sin credenciales Twilio — devolviendo métricas vacías');
    return { sent: 0, delivered: 0, read: 0, received: 0 };
  }

  const waNumber = 'whatsapp:+12138383591';
  const since    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]; // YYYY-MM-DD

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const headers = { Authorization: `Basic ${credentials}` };

  // Mensajes enviados (outbound) en los últimos 30 días
  const sentRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json` +
    `?From=${encodeURIComponent(waNumber)}&DateSent>=${since}&PageSize=1000`,
    { headers }
  );
  const sentData = await sentRes.json() as {
    messages?: Array<{ status?: string }>;
    total?: number;
  };

  // Mensajes recibidos (inbound) en los últimos 30 días
  const recvRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json` +
    `?To=${encodeURIComponent(waNumber)}&DateSent>=${since}&PageSize=1000`,
    { headers }
  );
  const recvData = await recvRes.json() as {
    messages?: Array<{ status?: string }>;
    total?: number;
  };

  const sentMsgs = sentData.messages ?? [];
  const sent      = sentMsgs.length;
  const delivered = sentMsgs.filter(m => m.status === 'delivered' || m.status === 'read').length;
  const read      = sentMsgs.filter(m => m.status === 'read').length;
  const received  = (recvData.messages ?? []).length;

  return { sent, delivered, read, received };
}
