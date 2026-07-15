// Genera el MP3 de un curso de la Academia con OpenAI TTS (voz del asistente).
// Uso: OPENAI_API_KEY=... node scripts/academy-tts.mjs <courseId>
import fs from 'fs';
const courseId = process.argv[2] || 'c1';
const key = process.env.OPENAI_API_KEY;
if (!key) { console.error('Falta OPENAI_API_KEY'); process.exit(1); }
const VOICE = process.env.ACADEMY_TTS_VOICE || 'sage';
const src = fs.readFileSync('frontend-webapp/src/app/academy/multiformat-course.tsx', 'utf8');

// Extrae el manualHtml del curso: bloque `manualHtml: \`...\`` que sigue a id:'<courseId>'
const idIdx = src.indexOf(`id: '${courseId}'`);
if (idIdx < 0) { console.error('curso no encontrado'); process.exit(1); }
const mIdx = src.indexOf('manualHtml: `', idIdx);
if (mIdx < 0) { console.error('sin manualHtml'); process.exit(1); }
const start = mIdx + 'manualHtml: `'.length;
const end = src.indexOf('`,', start);
const manualHtml = src.slice(start, end);

function htmlToNarration(html) {
  return html
    .replace(/<(h2|h3)[^>]*>/gi, ' … ')
    .replace(/<\/(h2|h3|p|li|blockquote)>/gi, '. ')
    .replace(/<li[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, 'y').replace(/&[a-z]+;/gi, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, '')
    .replace(/\b(Clave Going|Escenario|Error com[uú]n)\s*:?/gi, '$1. ')
    .replace(/\s+([.,;:])/g, '$1').replace(/\.\s*\.(\s*\.)?/g, '. ').replace(/\s{2,}/g, ' ').trim();
}
const title = (src.slice(idIdx, mIdx).match(/title:\s*'([^']+)'/) || [])[1] || 'este curso';
const intro = `Bienvenida y bienvenido a la Academia Going App. Curso: ${title}. Escucha este manual mientras te preparas para dar lo mejor. `;
const text = intro + htmlToNarration(manualHtml);
console.log('narración:', text.length, 'caracteres');

// Trocea en <3500 chars por oraciones
function chunk(t, max=3500){ const out=[]; let cur=''; for(const s of t.split(/(?<=\. )/)){ if((cur+s).length>max){ out.push(cur); cur=s; } else cur+=s; } if(cur) out.push(cur); return out; }
const chunks = chunk(text);
console.log('trozos:', chunks.length);

const buffers = [];
for (let i=0;i<chunks.length;i++){
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body: JSON.stringify({ model:'gpt-4o-mini-tts', voice:VOICE, input:chunks[i], response_format:'mp3',
      instructions:'Español neutro de Ecuador (usa "tú", no "vos"). Voz cálida, cercana y profesional, ritmo pausado de podcast educativo. Enfatiza suavemente las ideas clave.' }),
  });
  if(!res.ok){ console.error('trozo',i,'error',res.status,(await res.text()).slice(0,200)); process.exit(1); }
  buffers.push(Buffer.from(await res.arrayBuffer()));
  process.stdout.write(`  trozo ${i+1}/${chunks.length} ✓\n`);
}
const OUTDIR = process.env.ACADEMY_TTS_OUTDIR || 'frontend-webapp/public/audio/academy';
const out = `${OUTDIR}/${courseId}-${VOICE}.mp3`;
fs.writeFileSync(out, Buffer.concat(buffers));
console.log('OK →', out, (fs.statSync(out).size/1024).toFixed(0)+'KB');
