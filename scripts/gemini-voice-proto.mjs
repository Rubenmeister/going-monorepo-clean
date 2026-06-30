/**
 * Prototipo Gemini — voz + traducción (AISLADO, no toca el path de producción).
 *
 * Mide latencia y calidad de:
 *   1) Traducción multilingüe (gemini-2.5-flash) es → en/fr/de/kichwa
 *   2) TTS / voz nativa (gemini-2.5-flash-preview-tts) → archivos .wav
 *
 * Usa VERTEX AI (facturado al proyecto GCP going-5d1ae), porque la key de
 * AI Studio (GEMINI_API_KEY) está SIN CRÉDITO. Autentica con el token de la
 * sesión gcloud activa (Application Default / `gcloud auth print-access-token`).
 *
 * Uso:
 *   node scripts/gemini-voice-proto.mjs
 *
 * Salida: imprime latencias/traducciones y guarda WAVs en scripts/out/.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = process.env.GOING_GCP_PROJECT || 'going-5d1ae';
const REGION = process.env.GOING_VERTEX_REGION || 'us-central1';
const TEXT_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'out');

const PHRASE =
  'Tu conductora o conductor llega en 3 minutos, por favor sal al punto de encuentro.';
const LANGS = ['English', 'French', 'German', 'Kichwa (Ecuadorian Quichua)'];

function accessToken() {
  if (process.env.ACCESS_TOKEN) return process.env.ACCESS_TOKEN.trim();
  return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
}

function vertexUrl(model) {
  return `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/${model}:generateContent`;
}

async function call(model, body, token) {
  const t0 = Date.now();
  const res = await fetch(vertexUrl(model), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ms: Date.now() - t0, status: res.status, json };
}

/** Envuelve PCM (L16 mono) en un header WAV para que sea reproducible. */
function pcmToWav(pcm, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const token = accessToken();
  console.log(`Proyecto ${PROJECT} / ${REGION} · token len ${token.length}\n`);

  // 1) Traducción
  console.log(`== TRADUCCIÓN (${TEXT_MODEL}) ==`);
  console.log(`ES: ${PHRASE}`);
  for (const lang of LANGS) {
    const { ms, status, json } = await call(
      TEXT_MODEL,
      {
        contents: [{ role: 'user', parts: [{ text: `Translate this Going ride message to ${lang}. Return ONLY the translation, natural and inclusive: ${PHRASE}` }] }],
        generationConfig: { temperature: 0.2 },
      },
      token,
    );
    const txt = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? `ERROR ${status}: ${JSON.stringify(json?.error?.message || json).slice(0, 160)}`;
    console.log(`→ ${lang} [${(ms / 1000).toFixed(2)}s]: ${txt}`);
  }

  // 2) TTS (voz)
  console.log(`\n== VOZ / TTS (${TTS_MODEL}) ==`);
  const samples = [
    { name: 'es', voice: 'Kore', text: 'Hola, soy tu asistente de Going. Tu conductora llega en tres minutos, por favor sal al punto de encuentro.' },
    { name: 'en', voice: 'Puck', text: 'Hi, this is your Going assistant. Your driver arrives in three minutes, please head to the pickup point.' },
  ];
  for (const s of samples) {
    const { ms, status, json } = await call(
      TTS_MODEL,
      {
        contents: [{ role: 'user', parts: [{ text: s.text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } } },
        },
      },
      token,
    );
    const data = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (data) {
      const wav = pcmToWav(Buffer.from(data, 'base64'));
      const file = join(OUT_DIR, `gemini-voz-${s.name}.wav`);
      writeFileSync(file, wav);
      console.log(`→ voz ${s.name} (${s.voice}) [${(ms / 1000).toFixed(2)}s] → ${file}`);
    } else {
      console.log(`→ voz ${s.name} ERROR ${status}: ${JSON.stringify(json?.error?.message || json).slice(0, 160)}`);
    }
  }
  console.log('\nListo. Abre los .wav de scripts/out/ para escuchar la voz.');
}

main().catch((e) => { console.error(e); process.exit(1); });
