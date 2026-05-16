/**
 * Action handler: driver_bonus_zone
 *
 * Disparado por el Orchestrator cuando una intención `boost_driver_supply`
 * pasa por la aprobación Cat 3 vía Telegram. El handler recibe los args
 * que MyCortex compuso + lo que pasó por buildArgs:
 *   { zone, amount?, durationMin?, description?, ...rest }
 *
 * MVP (pre-launch):
 *   1. Genera un "campaign brief" estructurado con todos los datos.
 *   2. Lo manda al chat ops como una alerta accionable
 *      ("CAMPAÑA AUTORIZADA. Distribuir a drivers en zona X...").
 *   3. Loguea con detalles para audit. Marketing-agent NO tiene Mongo
 *      propio — el rastro queda en orchestrator_decisions.outcomeData
 *      + en los logs estructurados de Cloud Run.
 *
 * Futuro (post-launch real):
 *   - Push notification directo a drivers en zona via mobile-driver-app
 *   - Push de bonus al payment-service (entry en payouts pendientes)
 *   - Integration con Telegram bot de drivers (canal privado)
 */

interface DriverBonusPayload {
  zone?:        string;
  amount?:      number;
  durationMin?: number;
  description?: string;
  // Cualquier otro campo que MyCortex haya pasado
  [key: string]: unknown;
}

interface DriverBonusResult {
  ok:           boolean;
  campaignId?:  string;
  notifiedOps?: boolean;
  error?:       string;
}

const TELEGRAM_API = 'https://api.telegram.org';

export async function driverBonusZone(payload: DriverBonusPayload): Promise<DriverBonusResult> {
  // ── Validación mínima ──────────────────────────────────────
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'payload_invalid' };
  }
  const zone = (payload.zone as string) || '';
  if (!zone) {
    console.error('[driver_bonus_zone] payload.zone faltante');
    return { ok: false, error: 'zone_missing' };
  }

  // ── Defaults sanos cuando MyCortex no especifica ─────────
  // Estos valores son aspiracionales — el ops humano puede ajustar antes
  // de distribuir. El punto es que la intención queda registrada concreta.
  const amount      = typeof payload.amount      === 'number' ? payload.amount      : 5;
  const durationMin = typeof payload.durationMin === 'number' ? payload.durationMin : 60;
  const description = (payload.description as string) || 'boost de oferta de drivers en zona';

  const campaignId = `bonus-${zone.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

  // ── Compose alert ────────────────────────────────────────
  const messageLines = [
    '🚨 <b>CAMPAÑA AUTORIZADA — driver_bonus_zone</b>',
    '',
    `<b>Zona:</b> ${escapeHtml(zone)}`,
    `<b>Bono propuesto:</b> $${amount.toFixed(2)} USD por viaje`,
    `<b>Duración:</b> ${durationMin} min`,
    `<b>Motivo:</b> ${escapeHtml(description)}`,
    '',
    '<b>Acción requerida del ops humano:</b>',
    '1. Verificar oferta real en zona (¿realmente faltan drivers?)',
    '2. Distribuir bono via grupo de drivers (Telegram/WhatsApp)',
    '3. Monitorear ride uptake en próximos 60 min',
    '',
    `<b>Campaign ID:</b> <code>${campaignId}</code>`,
    '',
    `<i>Aprobado por Telegram ack — Cat 3 reversible solo durante ventana de distribución.</i>`,
  ];
  if (Object.keys(payload).length > 4) {
    const extra = Object.fromEntries(
      Object.entries(payload).filter(([k]) => !['zone','amount','durationMin','description'].includes(k)),
    );
    if (Object.keys(extra).length > 0) {
      messageLines.push('', `<b>Contexto extra:</b>`, `<code>${escapeHtml(JSON.stringify(extra, null, 2)).slice(0, 600)}</code>`);
    }
  }
  const message = messageLines.join('\n');

  // ── Send Telegram ────────────────────────────────────────
  const notifiedOps = await sendOpsAlert(message);

  // ── Structured log para audit (Cloud Logging lo indexa) ─
  console.log(JSON.stringify({
    severity: 'NOTICE',
    component: 'driver_bonus_zone',
    campaignId,
    zone,
    amount,
    durationMin,
    description,
    notifiedOps,
    timestamp: new Date().toISOString(),
  }));

  return {
    ok: true,
    campaignId,
    notifiedOps,
  };
}

// ─── Internals ─────────────────────────────────────────────

async function sendOpsAlert(text: string): Promise<boolean> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[driver_bonus_zone] TELEGRAM_BOT_TOKEN/CHAT_ID faltan — alerta solo en logs');
    return false;
  }
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      console.error(`[driver_bonus_zone] Telegram error: ${data.description}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[driver_bonus_zone] Telegram exception: ${(e as Error).message}`);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
