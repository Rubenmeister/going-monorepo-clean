/**
 * Going Content Agent — Telegram bot real (vs el email "telegram-style"
 * que usamos para alertas internas operativas).
 *
 * Este canal es el destino del TIP SEMANAL: contenido público que se
 * publica al canal/grupo definido en CONTENT_TELEGRAM_CHAT_ID. Si no
 * está configurado, cae al chat de operaciones (TELEGRAM_CHAT_ID).
 */
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CONTENT_CHAT   = process.env.CONTENT_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

const BASE_URL = TELEGRAM_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_TOKEN}` : null;

export async function sendTelegramTip(text: string): Promise<boolean> {
  if (!BASE_URL || !CONTENT_CHAT) {
    console.warn('[telegram-bot] sin TELEGRAM_BOT_TOKEN o chat_id — tip no enviado');
    return false;
  }
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONTENT_CHAT,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) {
      console.error('[telegram-bot] error Telegram:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[telegram-bot] excepción:', (err as Error).message);
    return false;
  }
}
