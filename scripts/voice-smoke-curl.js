#!/usr/bin/env node
/**
 * voice-smoke-curl.js — pre-smoke del webhook /twilio/voice-webhook.
 *
 * Genera un POST simulado de Twilio con X-Twilio-Signature HMAC-SHA1 válido
 * para verificar que el voice-call-service (Uyari) responde TwiML correcto
 * SIN gastar minutos reales de telefonía Twilio + OpenAI Realtime.
 *
 * Cuándo usar:
 *   - Después de cualquier deploy de voice-call-service
 *   - Antes del primer smoke con teléfono real (cuando ARCOTEL apruebe)
 *   - Después de rotar TWILIO_AUTH_TOKEN
 *   - Como health-check periódico (cron en CI)
 *
 * Uso (bash):
 *   export TWILIO_AUTH_TOKEN=$(gcloud secrets versions access latest --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae)
 *   export TWILIO_ACCOUNT_SID=$(gcloud secrets versions access latest --secret=TWILIO_ACCOUNT_SID --project=going-5d1ae)
 *   node scripts/voice-smoke-curl.js
 *
 * Uso (PowerShell):
 *   $env:TWILIO_AUTH_TOKEN = (gcloud secrets versions access latest --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae)
 *   $env:TWILIO_ACCOUNT_SID = (gcloud secrets versions access latest --secret=TWILIO_ACCOUNT_SID --project=going-5d1ae)
 *   node scripts/voice-smoke-curl.js
 *
 * Opciones:
 *   --dry-run          Imprime el curl, no lo ejecuta
 *   --url=URL          Override del webhook URL (default: prod Cloud Run)
 *   --from=+593...     Override caller number (default: +593984037949, Going oficial)
 *   --to=+593...       Override callee number (default: +59324018841, Uyari)
 *   --help, -h         Mostrar ayuda
 *
 * Success criteria:
 *   - Status 200
 *   - Content-Type text/xml o application/xml
 *   - Body XML con <Connect><Stream url="wss://..."> (path feliz)
 *   - O <Hangup/> si el caller cae en filtro suspicious-caller (esperado en rate-limit)
 *
 * Failure modes y diagnóstico:
 *   - 403: HMAC inválido (token desincronizado) — rotar/verificar TWILIO_AUTH_TOKEN
 *   - 5xx: bug en webhook handler — `gcloud run services logs tail voice-call-service`
 *   - 200 pero body sin <Stream> ni <Hangup>: TwiML builder roto
 *   - Network error: servicio caído — `curl /health`
 *
 * Requiere Node 18+ (usa fetch global).
 */

'use strict';

const crypto = require('crypto');

// ─── CLI args ──────────────────────────────────────────────────────────────

function parseArgs() {
  const args = { dryRun: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--url=')) args.url = arg.slice(6);
    else if (arg.startsWith('--from=')) args.from = arg.slice(7);
    else if (arg.startsWith('--to=')) args.to = arg.slice(5);
    else if (arg === '--help' || arg === '-h') {
      console.log(
        [
          'Usage: node scripts/voice-smoke-curl.js [options]',
          '',
          '  --dry-run          Print curl command, do not execute',
          '  --url=URL          Override webhook URL',
          '  --from=+593...     Override caller number (default: +593984037949)',
          '  --to=+593...       Override callee number (default: +59324018841)',
          '  --help, -h         Show this help',
          '',
          'Required env:',
          '  TWILIO_AUTH_TOKEN  Twilio auth token (for HMAC signature)',
          '  TWILIO_ACCOUNT_SID Twilio account SID (sent in form payload)',
        ].join('\n')
      );
      process.exit(0);
    }
  }
  return args;
}

const args = parseArgs();

// ─── Env validation ────────────────────────────────────────────────────────

const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;

if (!authToken || !accountSid) {
  console.error('❌ Falta TWILIO_AUTH_TOKEN y/o TWILIO_ACCOUNT_SID en env.');
  console.error('');
  console.error('Cargar desde Secret Manager:');
  console.error('  # bash:');
  console.error("  export TWILIO_AUTH_TOKEN=$(gcloud secrets versions access latest --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae)");
  console.error("  export TWILIO_ACCOUNT_SID=$(gcloud secrets versions access latest --secret=TWILIO_ACCOUNT_SID --project=going-5d1ae)");
  console.error('');
  console.error('  # PowerShell:');
  console.error('  $env:TWILIO_AUTH_TOKEN = (gcloud secrets versions access latest --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae)');
  console.error('  $env:TWILIO_ACCOUNT_SID = (gcloud secrets versions access latest --secret=TWILIO_ACCOUNT_SID --project=going-5d1ae)');
  process.exit(1);
}

// ─── Build simulated Twilio payload ────────────────────────────────────────

const url =
  args.url || 'https://voice-call-service-lw44cnhdeq-uc.a.run.app/twilio/voice-webhook';
const from = args.from || '+593984037949'; // Going oficial — simula llamada entrante de un user
const to = args.to || '+59324018841'; // Uyari (Quito landline)

// Fake but well-formed CallSid: "CA" + 32 hex chars (Twilio's actual format)
const callSid = 'CA' + crypto.randomBytes(16).toString('hex');

const params = {
  CallSid: callSid,
  AccountSid: accountSid,
  From: from,
  To: to,
  CallStatus: 'ringing',
  Direction: 'inbound',
  ApiVersion: '2010-04-01',
};

// ─── Twilio signature algorithm ────────────────────────────────────────────
//
// Per https://www.twilio.com/docs/usage/webhooks/webhooks-security:
//   1. Take the full URL (https + host + path + query)
//   2. Sort POST params alphabetically by key
//   3. Concatenate: url + key1 + value1 + key2 + value2 + ...
//   4. HMAC-SHA1 with auth_token as key
//   5. Base64 encode → that's the X-Twilio-Signature header

const sortedKeys = Object.keys(params).sort();
const data = url + sortedKeys.map((k) => k + params[k]).join('');
const signature = crypto.createHmac('sha1', authToken).update(data).digest('base64');

const formBody = Object.entries(params)
  .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  .join('&');

// ─── Dry-run: just print curl ──────────────────────────────────────────────

if (args.dryRun) {
  console.log('# Pre-smoke voice-call-service webhook (DRY RUN)');
  console.log('# Expected: HTTP 200, Content-Type text/xml, body con <Connect><Stream>');
  console.log('');
  console.log(`curl -i -X POST '${url}' \\`);
  console.log(`  -H 'Content-Type: application/x-www-form-urlencoded' \\`);
  console.log(`  -H 'X-Twilio-Signature: ${signature}' \\`);
  console.log(`  -d '${formBody}'`);
  process.exit(0);
}

// ─── Execute the request and verify ────────────────────────────────────────

console.log('🔵 Pre-smoke voice-call-service /twilio/voice-webhook');
console.log(`   URL:       ${url}`);
console.log(`   From:      ${from}`);
console.log(`   To:        ${to}`);
console.log(`   CallSid:   ${callSid}`);
console.log(`   Signature: ${signature.slice(0, 20)}...`);
console.log('');

const t0 = Date.now();

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Twilio-Signature': signature,
  },
  body: formBody,
})
  .then(async (res) => {
    const dt = Date.now() - t0;
    const body = await res.text();
    const contentType = res.headers.get('content-type') || '';

    console.log(`📡 Response en ${dt}ms`);
    console.log(`   Status:       ${res.status} ${res.statusText}`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Body length:  ${body.length} bytes`);
    console.log('');
    console.log('--- Body ---');
    console.log(body);
    console.log('--- end ---');
    console.log('');

    // ─── Verdict ─────────────────────────────────────────────────────────
    const isXml = contentType.includes('xml');
    const hasStream = /<Stream\s+url=/i.test(body);
    const hasHangup = /<Hangup\s*\/?>/i.test(body);
    const hasConnect = /<Connect>/i.test(body);

    if (res.status === 200 && isXml && hasStream && hasConnect) {
      console.log('✅ PASS — webhook respondió TwiML con <Connect><Stream>');
      console.log('   Listo para recibir llamadas reales.');
      console.log(`   Latencia: ${dt}ms (target < 500ms; > 2000ms = revisar cold start)`);
      process.exit(0);
    }

    if (res.status === 200 && isXml && hasHangup && !hasConnect) {
      console.log('⚠️  PARTIAL — 200 OK pero body es <Hangup/> sin <Connect>.');
      console.log('   Causa probable: suspicious-caller filter o rate-limit triggered para este From.');
      console.log('   Acción: probá con --from=+593<otro_numero> para confirmar que el path feliz funciona.');
      process.exit(0);
    }

    if (res.status === 403) {
      console.log('❌ FAIL — 403 Forbidden. HMAC inválido.');
      console.log('   Causas probables:');
      console.log('   1. TWILIO_AUTH_TOKEN en env != el de Secret Manager');
      console.log('   2. El token en Secret Manager != el de Twilio Console (Account → API keys → Auth Token)');
      console.log('   3. La URL difiere de la registrada en Twilio (mayúsculas/slash trailing/query params)');
      console.log('   Verificar:');
      console.log('     gcloud secrets versions access latest --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae');
      console.log('     (debe coincidir con Twilio Console → Account → API keys & tokens → Auth Token)');
      process.exit(1);
    }

    if (res.status >= 500) {
      console.log('❌ FAIL — 5xx server error. El webhook handler está roto.');
      console.log('   Revisar logs:');
      console.log('     gcloud run services logs tail voice-call-service --region us-central1');
      process.exit(1);
    }

    if (res.status === 404) {
      console.log('❌ FAIL — 404 Not Found. El path del webhook no existe en este deploy.');
      console.log(`   URL probada: ${url}`);
      console.log('   Verificar que voice-call-service esté deployado con la ruta /twilio/voice-webhook activa.');
      process.exit(1);
    }

    console.log(`❌ UNEXPECTED — status=${res.status}, content-type=${contentType}`);
    console.log('   Body arriba. Revisar manualmente.');
    process.exit(1);
  })
  .catch((err) => {
    console.error(`❌ Network error: ${err.message}`);
    console.error('   Verificar conectividad y que el servicio esté UP:');
    console.error(`   curl -i ${url.replace('/twilio/voice-webhook', '/health')}`);
    process.exit(1);
  });
