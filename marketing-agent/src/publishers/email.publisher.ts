import { EmailCampaign } from '../types/marketing.types';

// ============================================================
// Email Publisher – SendGrid API
// Required secret: SENDGRID_API_KEY
// From: marketing@goingec.com
// ============================================================

const SENDGRID_API = 'https://api.sendgrid.com/v3';

// Audience segments (Firestore / SendGrid list IDs — configure when ready)
const AUDIENCE_LISTS: Record<string, string> = {
  all: process.env.SENDGRID_LIST_ALL || '',
  passengers: process.env.SENDGRID_LIST_PASSENGERS || '',
  drivers: process.env.SENDGRID_LIST_DRIVERS || '',
  newsletter: process.env.SENDGRID_LIST_NEWSLETTER || '',
};

export async function sendEmailCampaign(campaign: EmailCampaign): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.log('[email] SENDGRID_API_KEY not configured, skipping');
    return;
  }

  const listId = AUDIENCE_LISTS[campaign.recipients];
  if (!listId) {
    console.error(`[email] No list ID configured for audience: ${campaign.recipients}`);
    return;
  }

  // Step 1: Create the campaign
  const createRes = await fetch(`${SENDGRID_API}/marketing/singlesends`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Going – ${campaign.subject} – ${new Date().toISOString().slice(0, 10)}`,
      send_to: { list_ids: [listId] },
      email_config: {
        subject: campaign.subject,
        html_content: buildEmailHtml(campaign),
        sender_id: 1, // Configure your sender ID in SendGrid
        suppression_group_id: 1, // Unsubscribe group
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`SendGrid create campaign error: ${createRes.status} ${await createRes.text()}`);
  }

  const created = await createRes.json() as { id?: string };
  const campaignId = created.id;
  console.log(`[email] Campaign created: ${campaignId}`);

  // Step 2: Schedule or send now
  if (campaign.scheduledAt) {
    await fetch(`${SENDGRID_API}/marketing/singlesends/${campaignId}/schedule`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ send_at: campaign.scheduledAt.toISOString() }),
    });
    console.log(`[email] Campaign scheduled for ${campaign.scheduledAt.toISOString()}`);
  } else {
    await fetch(`${SENDGRID_API}/marketing/singlesends/${campaignId}/schedule`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ send_at: 'now' }),
    });
    console.log('[email] Campaign sent immediately');
  }
}

// ─── Transactional email (single recipient) ───────────────────
export async function sendTransactionalEmail(to: string, subject: string, htmlBody: string): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.log('[email] SENDGRID_API_KEY not configured');
    return;
  }

  const res = await fetch(`${SENDGRID_API}/mail/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'marketing@goingec.com', name: 'Going Ecuador' },
      subject,
      content: [{ type: 'text/html', value: htmlBody }],
    }),
  });

  if (!res.ok) {
    throw new Error(`SendGrid transactional error: ${res.status} ${await res.text()}`);
  }
  console.log(`[email] Transactional email sent to ${to}`);
}

// ─── HTML email wrapper ───────────────────────────────────────
function buildEmailHtml(campaign: EmailCampaign): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaign.subject}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
    .header { background: #ff4c41; padding: 24px; text-align: center; }
    .header img { height: 40px; }
    .header h1 { color: white; margin: 8px 0 0; font-size: 22px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #999; }
    .cta { display: inline-block; background: #ff4c41; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Going Ecuador 🚗</h1>
    </div>
    <div class="body">
      ${campaign.bodyHtml}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Going Ecuador – <a href="https://goingec.com">goingec.com</a>
      &nbsp;|&nbsp; <a href="https://www.instagram.com/goingappecuador/">Instagram</a>
      &nbsp;|&nbsp; <a href="https://www.facebook.com/goingappecuador">Facebook</a>
      &nbsp;|&nbsp; <a href="https://www.tiktok.com/@goingappecuador">TikTok</a>
      &nbsp;|&nbsp; <a href="https://t.me/goingappecuador">Telegram</a><br>
      <a href="{{unsubscribe}}">Cancelar suscripción</a>
    </div>
  </div>
</body>
</html>`;
}
