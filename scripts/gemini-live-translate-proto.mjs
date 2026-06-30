/**
 * Prototipo Gemini LIVE TRANSLATE — voz↔voz en tiempo real (Live API, WebSocket).
 *
 * Conecta al Live API de Gemini, envía un turno y mide el tiempo hasta el primer
 * audio (TTFB) + guarda el audio resultante. Diseñado para evaluar la latencia
 * real del carril de tiempo real (vs el generateContent de 3–11s).
 *
 * ⚠️ ESTADO (30-jun-2026): BLOQUEADO para correr porque:
 *   - La key AI Studio GEMINI_API_KEY está SIN crédito (429 "prepayment depleted").
 *   - El modelo live (gemini-3.5-live-translate-preview / native-audio) NO está
 *     en Vertex us-central1/global (404). El Live API hoy es solo AI Studio.
 *   → Para correrlo: cargar crédito en AI Studio (ai.studio) y reintentar; o
 *     esperar a que el modelo llegue a Vertex (facturado a GCP).
 *
 * Requisitos: Node con WebSocket global (Node 22+) o el paquete `ws`.
 * Uso:
 *   GEMINI_API_KEY=... node scripts/gemini-live-translate-proto.mjs
 *   (o se lee de gcloud: gcloud secrets versions access latest --secret=GEMINI_API_KEY)
 */
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'out');
const MODEL = process.env.LIVE_MODEL || 'models/gemini-3.5-live-translate-preview';
const TARGET = 'English';
const SOURCE_TEXT = 'Hola, soy tu asistente de Going. Tu conductora llega en tres minutos, por favor sal al punto de encuentro.';

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  return execSync('gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=going-5d1ae', { encoding: 'utf8' }).trim();
}

async function getWebSocket() {
  if (typeof globalThis.WebSocket !== 'undefined') return globalThis.WebSocket;
  try { return (await import('ws')).default; } catch {
    console.error('No hay WebSocket global (Node<22) ni paquete `ws`. Instala: pnpm add -w ws');
    process.exit(1);
  }
}

function pcmToWav(pcm, sampleRate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const WS = await getWebSocket();
  const key = apiKey();
  const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`;
  const ws = new WS(url);

  const t0 = Date.now();
  let firstAudioMs = null;
  const chunks = [];

  ws.onopen = () => {
    console.log('WS abierto. Enviando setup...');
    ws.send(JSON.stringify({
      setup: {
        model: MODEL,
        generationConfig: { responseModalities: ['AUDIO'] },
        systemInstruction: { parts: [{ text: `You are a real-time interpreter. Translate everything the user says into ${TARGET}, spoken naturally.` }] },
      },
    }));
  };

  ws.onmessage = async (ev) => {
    let raw = ev.data;
    if (raw instanceof Blob) raw = Buffer.from(await raw.arrayBuffer());
    const txt = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    let msg; try { msg = JSON.parse(txt); } catch { return; }

    if (msg.setupComplete) {
      console.log(`setupComplete en ${Date.now() - t0}ms. Enviando turno de texto...`);
      ws.send(JSON.stringify({
        clientContent: { turns: [{ role: 'user', parts: [{ text: SOURCE_TEXT }] }], turnComplete: true },
      }));
      return;
    }
    const parts = msg.serverContent?.modelTurn?.parts || [];
    for (const p of parts) {
      const data = p.inlineData?.data;
      if (data) {
        if (firstAudioMs === null) { firstAudioMs = Date.now() - t0; console.log(`⏱️  primer audio (TTFB): ${firstAudioMs}ms`); }
        chunks.push(Buffer.from(data, 'base64'));
      }
    }
    if (msg.serverContent?.turnComplete) {
      const pcm = Buffer.concat(chunks);
      if (pcm.length) {
        const file = join(OUT_DIR, 'gemini-live-translate-en.wav');
        writeFileSync(file, pcmToWav(pcm));
        console.log(`✅ audio ${pcm.length} bytes → ${file} (TTFB ${firstAudioMs}ms)`);
      } else {
        console.log('Turno completo sin audio.');
      }
      ws.close();
    }
    if (msg.error) { console.error('Error del servidor:', JSON.stringify(msg.error).slice(0, 200)); ws.close(); }
  };

  ws.onerror = (e) => console.error('WS error:', e?.message || e);
  ws.onclose = (e) => console.log(`WS cerrado (code ${e?.code ?? '?'}).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
