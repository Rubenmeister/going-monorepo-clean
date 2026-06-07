'use client';

/**
 * Cursos MULTIFORMATO de la Academia Going App.
 *
 * Cada capacitación se presenta en 4 formatos del MISMO contenido para que
 * sirva a cualquier estilo de aprendizaje:
 *   📄 Leer (texto + Descargar PDF) · 🖼️ Manual gráfico (slides) ·
 *   🎧 Escuchar (podcast por voz TTS del navegador) · 🎬 Ver (video) · ✅ Evaluación
 *
 * El contenido es borrador para revisión (sobre todo lo normativo/legal).
 * Los cursos legacy (single-format) siguen funcionando en page.tsx.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { COLORS } from '../components/design-tokens';

export interface MfSlide { title: string; points: string[] }
export interface MfQuiz { question: string; options: string[]; correct: number; explanation: string }
export interface MultiFormatCourseData {
  id: string;
  school: string;
  schoolColor: string;
  title: string;
  subtitle: string;
  description: string;
  /** Texto largo en HTML para leer y exportar a PDF. */
  readingHtml: string;
  /** Manual gráfico: slides con puntos clave. */
  slides: MfSlide[];
  /** Guion del podcast: segmentos que la voz (TTS) lee en orden. */
  podcast: { intro: string; segments: { title: string; text: string }[] };
  /** Video incrustable (YouTube/hosted). Si falta → placeholder. */
  videoUrl?: string;
  quiz: MfQuiz[];
}

// ─── Curso ejemplar (plantilla de oro) ────────────────────────────────────
export const MULTIFORMAT_COURSES: Record<string, MultiFormatCourseData> = {
  tc2: {
    id: 'tc2',
    school: 'Tronco Común',
    schoolColor: COLORS.brand.red,
    title: 'Uso de la Plataforma Going App',
    subtitle: 'Reservas, cobros, envíos y emergencias',
    description:
      'Todo lo que necesitas para moverte con seguridad en Going App: pedir un viaje, pagar, enviar paquetes y usar las herramientas de seguridad.',
    readingHtml: `
<h2>1. Pedir un viaje</h2>
<p>Desde la pantalla principal eliges el <strong>tipo de servicio</strong> antes de continuar — no vuelven a preguntártelo después:</p>
<ul>
  <li><strong>Viaje Compartido:</strong> pagas solo tu asiento, entre ciudades. Precio por asiento.</li>
  <li><strong>Viaje Privado:</strong> el vehículo completo (Auto, SUV, VAN, Minibús o Bus).</li>
  <li><strong>En la ciudad:</strong> carrera inmediata; buscamos al conductor más cercano al instante.</li>
</ul>
<p>Indica <strong>origen y destino</strong>. Si no encuentras la dirección, usa <em>“Usar mi ubicación actual”</em> (GPS) o fija el punto exacto en el mapa.</p>
<p>Un viaje puede ser <strong>inmediato</strong> o <strong>reservado</strong>: si eliges una fecha/hora futura, queda reservado y <em>no</em> buscamos conductor de inmediato — lo asignamos cerca de la hora y te avisamos <strong>1 hora y 5 minutos antes</strong>.</p>

<h2>2. Cobros y pagos</h2>
<p>Antes de confirmar ves el precio: <strong>tarifa fija</strong> en rutas conocidas o <strong>estimado</strong> calculado por distancia real.</p>
<ul>
  <li><strong>Tarjeta (Datafast)</strong> y <strong>DeUna</strong> para pago digital.</li>
  <li><strong>Going App Wallet:</strong> saldo prepago. Puedes <em>recargar</em> (Datafast/DeUna) y <em>transferir</em> saldo a otro usuario.</li>
  <li><strong>Efectivo</strong> al conductor cuando aplica.</li>
</ul>

<h2>3. Envíos</h2>
<p>En <em>Envíos</em> cotizas puerta a puerta (pequeño/mediano/grande), eliges quién paga y haces el seguimiento <strong>en vivo</strong>. La entrega se confirma con un <strong>código OTP</strong> que da el destinatario.</p>

<h2>4. Seguridad y emergencias</h2>
<ul>
  <li><strong>Botón SOS</strong> durante el viaje para contactar ayuda.</li>
  <li><strong>Compartir el viaje</strong> en tiempo real con alguien de confianza.</li>
  <li><strong>Verificación al subir:</strong> confirma el código/placa del conductor.</li>
  <li><strong>Token de fin de viaje:</strong> confirmas que llegaste a tu destino.</li>
</ul>
<p>Recuerda: nunca compartas tu contraseña y revisa siempre los datos del conductor antes de subir.</p>
`,
    slides: [
      { title: 'Elige tu servicio', points: ['Compartido = pagas tu asiento', 'Privado = vehículo completo', 'En la ciudad = inmediato'] },
      { title: 'Origen y destino', points: ['Escribe la dirección', 'O usa tu ubicación (GPS)', 'O fija el punto en el mapa'] },
      { title: 'Inmediato vs reservado', points: ['Inmediato: busca conductor ya', 'Reservado: fecha/hora futura', 'Aviso 1 h y 5 min antes'] },
      { title: 'Pagos', points: ['Datafast / DeUna (digital)', 'Wallet: recarga y transfiere', 'Efectivo cuando aplica'] },
      { title: 'Envíos', points: ['Cotiza puerta a puerta', 'Seguimiento en vivo', 'Entrega con código OTP'] },
      { title: 'Seguridad', points: ['Botón SOS', 'Comparte tu viaje', 'Verifica al conductor', 'Token de fin de viaje'] },
    ],
    podcast: {
      intro: 'Bienvenido a la Academia Going App. En este episodio aprenderás a usar la plataforma de punta a punta: pedir un viaje, pagar, enviar paquetes y usar las herramientas de seguridad.',
      segments: [
        { title: 'Pedir un viaje', text: 'Primero eliges el tipo de servicio: compartido, donde pagas solo tu asiento; privado, el vehículo completo; o en la ciudad, una carrera inmediata. Luego indicas origen y destino. Si no encuentras la dirección, puedes usar tu ubicación por GPS o fijar el punto exacto en el mapa. Y recuerda: un viaje puede ser inmediato o reservado para más tarde.' },
        { title: 'Cobros y pagos', text: 'Antes de confirmar siempre ves el precio, ya sea una tarifa fija o un estimado por distancia. Puedes pagar con tarjeta vía Datafast, con DeUna, con tu saldo del Wallet de Going App, que además puedes recargar y transferir, o en efectivo cuando aplique.' },
        { title: 'Envíos', text: 'En la sección de envíos cotizas puerta a puerta según el tamaño del paquete, eliges quién paga y sigues el envío en vivo. La entrega se confirma con un código de un solo uso que entrega el destinatario.' },
        { title: 'Seguridad', text: 'Durante el viaje tienes el botón SOS para emergencias, puedes compartir tu viaje en tiempo real, verificar la identidad del conductor antes de subir, y confirmar el fin del viaje con un token. Nunca compartas tu contraseña.' },
      ],
    },
    // videoUrl pendiente de grabación → se muestra placeholder.
    quiz: [
      { question: '¿Cuándo se busca al conductor en un viaje RESERVADO?', options: ['Al instante', 'Cerca de la hora reservada (≈1 h antes)', 'Nunca', 'Al pagar'], correct: 1, explanation: 'Las reservas no buscan conductor de inmediato; se asigna cerca de la hora y se avisa 1 h y 5 min antes.' },
      { question: '¿Cómo se confirma la entrega de un envío?', options: ['Con una firma', 'Con un código OTP del destinatario', 'Con una foto', 'No se confirma'], correct: 1, explanation: 'El destinatario entrega un código OTP que confirma la entrega.' },
      { question: 'Si no encuentras tu dirección al pedir un viaje, puedes…', options: ['Cancelar', 'Usar GPS o fijar el punto en el mapa', 'Llamar a soporte', 'Esperar'], correct: 1, explanation: 'Puedes usar “Usar mi ubicación actual” (GPS) o fijar el punto exacto en el mapa.' },
      { question: '¿Qué te permite el Going App Wallet?', options: ['Solo ver saldo', 'Recargar y transferir saldo', 'Pedir préstamos', 'Nada'], correct: 1, explanation: 'El Wallet permite recargar saldo (Datafast/DeUna) y transferirlo a otros usuarios.' },
    ],
  },
};

// ─── Componente ───────────────────────────────────────────────────────────
type Fmt = 'leer' | 'manual' | 'escuchar' | 'ver' | 'quiz';
const TABS: { key: Fmt; label: string; icon: string }[] = [
  { key: 'leer', label: 'Leer', icon: '📄' },
  { key: 'manual', label: 'Manual', icon: '🖼️' },
  { key: 'escuchar', label: 'Escuchar', icon: '🎧' },
  { key: 'ver', label: 'Ver', icon: '🎬' },
  { key: 'quiz', label: 'Evaluación', icon: '✅' },
];

export function MultiFormatCourse({ courseId }: { courseId: string }) {
  const course = MULTIFORMAT_COURSES[courseId];
  const [fmt, setFmt] = useState<Fmt>('leer');
  const [slide, setSlide] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(course ? course.quiz.map(() => null) : []);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const accent = course?.schoolColor || COLORS.brand.red;

  // Detener la voz al cambiar de formato/desmontar.
  useEffect(() => {
    return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); };
  }, []);
  useEffect(() => {
    if (fmt !== 'escuchar' && typeof window !== 'undefined') { window.speechSynthesis?.cancel(); setSpeaking(false); }
  }, [fmt]);

  if (!course) return null;

  const fullScript = [course.podcast.intro, ...course.podcast.segments.map(s => `${s.title}. ${s.text}`)].join('\n\n');

  const playPodcast = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(fullScript);
    u.lang = 'es-ES';
    u.rate = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };
  const stopPodcast = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  const downloadPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${course.title} — Academia Going App</title>` +
      `<style>body{font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.6;color:#111}` +
      `h1{color:${accent}}h2,h3{color:#0033A0}ul{padding-left:20px}</style></head><body>` +
      `<h1>${course.title}</h1><p><em>${course.subtitle} · Academia Going App</em></p>${course.readingHtml}` +
      `<script>window.onload=function(){window.print()}</script></body></html>`,
    );
    w.document.close();
  };

  const score = quizSubmitted ? course.quiz.reduce((a, q, i) => a + (quizAnswers[i] === q.correct ? 1 : 0), 0) : 0;
  const passed = score >= Math.ceil(course.quiz.length * 0.67);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/academy" className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">←</Link>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{course.school}</p>
            <h1 className="text-base font-black text-gray-900 truncate">{course.title}</h1>
          </div>
        </div>
        {/* Tabs de formato */}
        <div className="max-w-3xl mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto">
          {TABS.map(t => {
            const active = fmt === t.key;
            return (
              <button key={t.key} onClick={() => setFmt(t.key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={active ? { backgroundColor: accent, color: '#fff' } : { backgroundColor: '#F3F4F6', color: '#4B5563' }}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* LEER */}
        {fmt === 'leer' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <button onClick={downloadPdf}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: accent }}>
              📄 Descargar PDF
            </button>
            <div className="academy-prose text-gray-700 text-[15px] leading-relaxed [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-gray-600 [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: course.readingHtml }} />
          </div>
        )}

        {/* MANUAL (slides) */}
        {fmt === 'manual' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="rounded-2xl p-6 min-h-[260px] flex flex-col justify-center" style={{ backgroundColor: accent + '0D' }}>
              <p className="text-xs font-bold text-gray-400 mb-2">Lámina {slide + 1} de {course.slides.length}</p>
              <h2 className="text-2xl font-black text-gray-900 mb-4">{course.slides[slide].title}</h2>
              <ul className="space-y-2">
                {course.slides[slide].points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-40">‹ Anterior</button>
              <div className="flex gap-1">
                {course.slides.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)} className="w-2 h-2 rounded-full" style={{ backgroundColor: i === slide ? accent : '#D1D5DB' }} />
                ))}
              </div>
              <button onClick={() => setSlide(s => Math.min(course.slides.length - 1, s + 1))} disabled={slide === course.slides.length - 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-40">Siguiente ›</button>
            </div>
          </div>
        )}

        {/* ESCUCHAR (podcast TTS) */}
        {fmt === 'escuchar' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={speaking ? stopPodcast : playPodcast}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl" style={{ backgroundColor: accent }}>
                {speaking ? '⏹' : '▶'}
              </button>
              <div>
                <p className="font-bold text-gray-900">Podcast · {course.title}</p>
                <p className="text-xs text-gray-500">{speaking ? 'Reproduciendo (voz del navegador)…' : 'Toca play para escuchar'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">Voz generada por tu navegador. Lee el guion completo del episodio.</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 italic">{course.podcast.intro}</p>
              {course.podcast.segments.map((s, i) => (
                <div key={i}>
                  <p className="text-sm font-bold text-gray-800">{s.title}</p>
                  <p className="text-sm text-gray-600">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VER (video) */}
        {fmt === 'ver' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {course.videoUrl ? (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
                <iframe src={course.videoUrl} title={course.title} className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 py-16 text-center">
                <p className="text-4xl mb-2">🎬</p>
                <p className="font-bold text-gray-700">Video próximamente</p>
                <p className="text-sm text-gray-400 mt-1">Mientras tanto, revisa el contenido en Leer, Manual o Escuchar.</p>
              </div>
            )}
          </div>
        )}

        {/* EVALUACIÓN (quiz) */}
        {fmt === 'quiz' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            {course.quiz.map((q, qi) => (
              <div key={qi}>
                <p className="font-bold text-gray-900 mb-2">{qi + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const chosen = quizAnswers[qi] === oi;
                    const correct = quizSubmitted && oi === q.correct;
                    const wrong = quizSubmitted && chosen && oi !== q.correct;
                    return (
                      <button key={oi} disabled={quizSubmitted}
                        onClick={() => setQuizAnswers(a => { const n = [...a]; n[qi] = oi; return n; })}
                        className="w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all"
                        style={{
                          borderColor: correct ? '#16a34a' : wrong ? '#ef4444' : chosen ? accent : '#E5E7EB',
                          backgroundColor: correct ? '#ECFDF5' : wrong ? '#FEF2F2' : chosen ? accent + '11' : '#fff',
                        }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && <p className="text-xs text-gray-500 mt-1.5">{q.explanation}</p>}
              </div>
            ))}
            {!quizSubmitted ? (
              <button onClick={() => setQuizSubmitted(true)} disabled={quizAnswers.some(a => a === null)}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ backgroundColor: accent }}>
                Ver resultado
              </button>
            ) : (
              <div className="text-center rounded-xl p-4" style={{ backgroundColor: passed ? '#ECFDF5' : '#FEF2F2' }}>
                <p className="text-2xl font-black" style={{ color: passed ? '#15803d' : '#ef4444' }}>{score}/{course.quiz.length}</p>
                <p className="text-sm font-semibold text-gray-700">{passed ? '¡Aprobado! 🎉' : 'Repasa y vuelve a intentar'}</p>
                <button onClick={() => { setQuizSubmitted(false); setQuizAnswers(course.quiz.map(() => null)); }}
                  className="mt-2 text-xs font-bold text-gray-500 hover:underline">Reintentar</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
