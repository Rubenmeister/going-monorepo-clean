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
import { completeAcademyCourse, CompleteCourseResult } from '../../lib/academy/api';
import { nextCourse } from './course-nav';

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

  // ─── TRONCO COMÚN ─────────────────────────────────────────────────────────
  tc1: {
    id: 'tc1',
    school: 'Tronco Común',
    schoolColor: COLORS.brand.red,
    title: 'El ADN de Going App',
    subtitle: 'Filosofía y hospitalidad ecuatoriana',
    description:
      'Quiénes somos, por qué existimos y cómo cada persona de la comunidad Going App se convierte en embajadora del Ecuador. La base cultural que sostiene todo lo demás.',
    readingHtml: `
<h2>1. Nuestra misión</h2>
<p>Going App nació para <strong>conectar al Ecuador</strong> — sus personas, sus destinos y su economía — con tecnología simple y confiable. No somos solo una app de viajes y envíos: somos una red de personas que se cuidan entre sí.</p>
<p>Cada viaje, cada hospedaje, cada experiencia y cada envío es una oportunidad de mostrar lo mejor del país: su calidez, su honestidad y su diversidad.</p>

<h2>2. Hospitalidad ecuatoriana</h2>
<p>La hospitalidad es nuestro sello. Significa <strong>recibir bien, escuchar y resolver</strong>. No importa el rol que tengas en la plataforma: el trato cálido y respetuoso es lo que distingue a Going App de cualquier otra opción.</p>
<ul>
  <li><strong>Saluda con calidez:</strong> una sonrisa y un “bienvenido” genuino cambian toda la experiencia.</li>
  <li><strong>Cuida los detalles:</strong> puntualidad, limpieza y claridad generan confianza.</li>
  <li><strong>Pon a la persona primero:</strong> detrás de cada solicitud hay alguien con una necesidad real.</li>
</ul>

<h2>3. Empatía y resolución pacífica</h2>
<p>Las cosas no siempre salen perfectas. Lo que nos define es <strong>cómo respondemos</strong>. Ante un malentendido:</p>
<ol>
  <li><strong>Escucha</strong> sin interrumpir.</li>
  <li><strong>Reconoce</strong> la molestia de la otra persona.</li>
  <li><strong>Propón una solución</strong> concreta.</li>
  <li>Si no se resuelve, <strong>usa los canales de soporte</strong> de la app — nunca la confrontación.</li>
</ol>
<blockquote><strong>Regla de oro:</strong> nunca discutas de política, religión ni temas personales. Mantén la conversación amable y profesional.</blockquote>

<h2>4. Embajadores del país</h2>
<p>Muchas de las personas que usan Going App son turistas que conocen Ecuador por primera vez a través de ti. Eres la <strong>primera impresión del país</strong>. Tu amabilidad puede ser la razón por la que alguien regrese — o por la que recomiende Ecuador al mundo.</p>
<p>Ser embajador también significa <strong>cuidar la reputación de la comunidad</strong>: actuar con honestidad en los cobros, respetar los acuerdos y representar los valores de Going App en cada interacción.</p>
`,
    slides: [
      { title: 'Nuestra misión', points: ['Conectar al Ecuador con tecnología simple', 'Una red de personas que se cuidan', 'Cada interacción muestra lo mejor del país'] },
      { title: 'Hospitalidad ecuatoriana', points: ['Recibir bien, escuchar y resolver', 'Calidez, puntualidad y limpieza', 'La persona siempre primero'] },
      { title: 'Empatía y resolución', points: ['Escucha sin interrumpir', 'Reconoce la molestia', 'Propón una solución', 'Usa soporte, nunca la confrontación'] },
      { title: 'Regla de oro', points: ['Nada de política ni religión', 'Trato amable y profesional', 'Honestidad en todo acuerdo'] },
      { title: 'Embajadores del país', points: ['Eres la primera impresión de Ecuador', 'Tu amabilidad invita a volver', 'Cuidas la reputación de la comunidad'] },
    ],
    podcast: {
      intro: 'Bienvenido al primer episodio de la Academia Going App. Hoy hablamos del ADN de Going App: quiénes somos, por qué existimos y cómo cada persona de nuestra comunidad se convierte en embajadora del Ecuador.',
      segments: [
        { title: 'Nuestra misión', text: 'Going App nació para conectar al Ecuador: sus personas, sus destinos y su economía, con tecnología simple y confiable. No somos solo una app de viajes y envíos; somos una red de personas que se cuidan entre sí. Cada viaje y cada envío es una oportunidad de mostrar la calidez y la honestidad del país.' },
        { title: 'Hospitalidad ecuatoriana', text: 'La hospitalidad es nuestro sello: recibir bien, escuchar y resolver. Sin importar tu rol, el trato cálido y respetuoso es lo que distingue a Going App. Saluda con calidez, cuida los detalles como la puntualidad y la limpieza, y pon siempre a la persona primero.' },
        { title: 'Empatía y resolución pacífica', text: 'Las cosas no siempre salen perfectas, y lo que nos define es cómo respondemos. Ante un malentendido: escucha sin interrumpir, reconoce la molestia, propón una solución concreta y, si hace falta, usa los canales de soporte de la app. Nunca la confrontación. Y recuerda la regla de oro: nada de política, religión ni temas personales.' },
        { title: 'Embajadores del país', text: 'Para muchos turistas, tú eres la primera impresión del Ecuador. Tu amabilidad puede ser la razón por la que alguien regrese o recomiende el país al mundo. Ser embajador también es cuidar la reputación de la comunidad: honestidad en los cobros y respeto por cada acuerdo.' },
      ],
    },
    quiz: [
      { question: 'Ante un malentendido con un usuario, lo PRIMERO que debes hacer es…', options: ['Defender tu punto', 'Escuchar sin interrumpir', 'Cancelar el servicio', 'Subir el tono'], correct: 1, explanation: 'La resolución pacífica empieza por escuchar y reconocer la molestia de la otra persona.' },
      { question: '¿Qué temas se deben evitar en la conversación?', options: ['El clima', 'Recomendaciones turísticas', 'Política, religión y temas personales', 'La ruta'], correct: 2, explanation: 'La regla de oro: mantener la conversación amable y profesional, sin política, religión ni temas personales.' },
      { question: '¿Por qué se dice que somos “embajadores del país”?', options: ['Por un cargo oficial', 'Porque para muchos turistas somos la primera impresión del Ecuador', 'Por un uniforme', 'No es cierto'], correct: 1, explanation: 'Para muchos visitantes, la comunidad Going App es su primer contacto real con el país.' },
    ],
  },
  tc3: {
    id: 'tc3',
    school: 'Tronco Común',
    schoolColor: COLORS.brand.red,
    title: 'Sostenibilidad y Respeto',
    subtitle: 'Turismo responsable',
    description:
      'Cómo cuidar el entorno natural y cultural del Ecuador, respetar a las comunidades locales y dar un trato inclusivo a toda la comunidad usuaria.',
    readingHtml: `
<h2>1. No dejar rastro</h2>
<p>El Ecuador es uno de los países más biodiversos del planeta. Protegerlo es responsabilidad de todos. El principio de <strong>“no dejar rastro”</strong> es simple: el lugar debe quedar igual o mejor de como lo encontramos.</p>
<ul>
  <li><strong>Maneja tu basura:</strong> nunca la dejes en miradores, playas, páramos ni senderos.</li>
  <li><strong>Respeta la flora y fauna:</strong> no alimentes animales silvestres ni extraigas plantas.</li>
  <li><strong>Cuida el agua y la energía:</strong> en hospedajes y experiencias, usa solo lo necesario.</li>
</ul>

<h2>2. Respeto a las comunidades locales</h2>
<p>Muchos destinos están dentro de territorios de comunidades y pueblos. Visitar es un privilegio que exige respeto:</p>
<ul>
  <li><strong>Pide permiso</strong> antes de tomar fotos a personas, casas o ceremonias.</li>
  <li><strong>Valora la cultura local:</strong> tradiciones, idioma y formas de vida no son un “espectáculo”.</li>
  <li><strong>Apoya la economía local:</strong> compra artesanías y servicios directamente a sus productores.</li>
  <li><strong>Negocia con justicia:</strong> regatear de forma agresiva el trabajo de alguien no es respetuoso.</li>
</ul>

<h2>3. Trato inclusivo</h2>
<p>Going App es para <strong>todas las personas</strong>. La discriminación por origen, género, religión, orientación, discapacidad o cualquier otra condición está estrictamente prohibida.</p>
<ul>
  <li><strong>Lenguaje respetuoso</strong> con todas las personas.</li>
  <li><strong>Accesibilidad:</strong> ofrece ayuda a quien la necesite (movilidad, equipaje, orientación).</li>
  <li><strong>Cero tolerancia</strong> al acoso de cualquier tipo.</li>
</ul>
<blockquote>Rechazar o maltratar a una persona por su identidad o condición puede significar la <strong>suspensión de la cuenta</strong>.</blockquote>

<h2>4. Tu huella positiva</h2>
<p>El turismo responsable no es solo evitar daño: es <strong>dejar algo bueno</strong>. Recomendar destinos menos saturados, compartir buenas prácticas y tratar a cada persona con dignidad construye un Ecuador que vale la pena visitar una y otra vez.</p>
`,
    slides: [
      { title: 'No dejar rastro', points: ['El lugar queda igual o mejor', 'Maneja tu basura siempre', 'No alimentes fauna ni extraigas flora', 'Cuida agua y energía'] },
      { title: 'Respeto a comunidades', points: ['Pide permiso para fotos', 'La cultura no es espectáculo', 'Apoya la economía local', 'Negocia con justicia'] },
      { title: 'Trato inclusivo', points: ['Going App es para todas las personas', 'Lenguaje respetuoso', 'Ofrece accesibilidad', 'Cero tolerancia al acoso'] },
      { title: 'Cero discriminación', points: ['Prohibida por origen, género, religión…', 'Discriminar = posible suspensión', 'Dignidad para cada persona'] },
      { title: 'Tu huella positiva', points: ['No solo evitar daño: dejar algo bueno', 'Recomienda destinos responsables', 'Construye un Ecuador que invita a volver'] },
    ],
    podcast: {
      intro: 'En este episodio del Tronco Común hablamos de sostenibilidad y respeto: cómo cuidar el entorno natural y cultural del Ecuador y dar un trato inclusivo a toda la comunidad.',
      segments: [
        { title: 'No dejar rastro', text: 'El Ecuador es uno de los países más biodiversos del planeta y protegerlo es tarea de todos. El principio de no dejar rastro es simple: el lugar debe quedar igual o mejor de como lo encontramos. Maneja tu basura, no alimentes a la fauna silvestre, no extraigas plantas y usa el agua y la energía con conciencia.' },
        { title: 'Respeto a las comunidades', text: 'Muchos destinos están en territorios de comunidades y pueblos. Visitar es un privilegio: pide permiso antes de fotografiar personas o ceremonias, valora la cultura local que no es un espectáculo, apoya la economía comprando directamente a los productores y negocia siempre con justicia.' },
        { title: 'Trato inclusivo', text: 'Going App es para todas las personas. La discriminación por origen, género, religión, orientación o discapacidad está estrictamente prohibida. Usa lenguaje respetuoso, ofrece accesibilidad a quien la necesite y mantén cero tolerancia al acoso. Rechazar o maltratar a alguien por su identidad puede significar la suspensión de la cuenta.' },
        { title: 'Tu huella positiva', text: 'El turismo responsable no es solo evitar daño: es dejar algo bueno. Recomendar destinos menos saturados, compartir buenas prácticas y tratar a cada persona con dignidad construye un Ecuador que vale la pena visitar una y otra vez.' },
      ],
    },
    quiz: [
      { question: '¿Qué significa el principio de “no dejar rastro”?', options: ['Ir rápido', 'Que el lugar quede igual o mejor de como lo encontramos', 'No usar la app', 'No hablar con nadie'], correct: 1, explanation: 'No dejar rastro es devolver el entorno en igual o mejor estado: gestionar la basura y respetar flora y fauna.' },
      { question: 'Antes de fotografiar a personas o ceremonias en una comunidad debes…', options: ['Hacerlo sin avisar', 'Pedir permiso', 'Pagar siempre', 'Publicarlo de inmediato'], correct: 1, explanation: 'El respeto a las comunidades exige pedir permiso; la cultura local no es un espectáculo.' },
      { question: 'La discriminación a un usuario por su identidad o condición puede provocar…', options: ['Nada', 'Una advertencia verbal', 'La suspensión de la cuenta', 'Un descuento'], correct: 2, explanation: 'Going App aplica cero tolerancia: la discriminación o el acoso pueden derivar en suspensión de la cuenta.' },
    ],
  },

  // ─── ESCUELA DE CONDUCTORES ───────────────────────────────────────────────
  c1: {
    id: 'c1',
    school: 'Escuela de Conductores',
    schoolColor: COLORS.brand.red,
    title: 'La Primera Impresión',
    subtitle: 'Módulo 1 — Ruta del Volante',
    description:
      'El arte de recibir. Checklist del vehículo, el saludo Going App, uso del lanyard y manejo del equipaje. Los primeros 30 segundos definen la calificación del viaje.',
    readingHtml: `
<h2>1. Tu vehículo, Going App-ready</h2>
<p>Antes de encender el motor, tu vehículo debe estar listo. No es solo un auto: es la primera extensión de la hospitalidad que el viajero experimentará.</p>
<ul>
  <li><strong>Interior impecable:</strong> asientos limpios, piso sin basura, sin olores fuertes. Una fragancia suave está bien; evita perfumes intensos.</li>
  <li><strong>Seguridad primero:</strong> llantas, frenos, combustible y luces revisados.</li>
  <li><strong>Temperatura lista:</strong> aire o calefacción según el clima, antes de que suba el pasajero.</li>
  <li><strong>Cargador disponible:</strong> un cable USB accesible siempre se agradece.</li>
</ul>
<blockquote><strong>El estándar Going App:</strong> “Un auto limpio es el primer saludo que das antes de abrir la boca.”</blockquote>

<h2>2. Tu identificación visible</h2>
<p>El <strong>lanyard de Going App</strong> es tu insignia de confianza. Úsalo siempre visible: los pasajeros lo buscan para identificarte. Verifica también que tu perfil en la app (foto y placa) coincida con la realidad.</p>

<h2>3. El saludo Going App</h2>
<p>El momento del “hola” define todo el viaje. Sal del vehículo con una sonrisa genuina y di las palabras mágicas:</p>
<blockquote><strong>“¡Bienvenido a Going App! Soy [tu nombre].”</strong></blockquote>
<p>El protocolo de llegada:</p>
<ol>
  <li><strong>Sal del vehículo</strong> — no esperes dentro.</li>
  <li><strong>Sonríe</strong> de forma genuina.</li>
  <li><strong>Muestra tu lanyard.</strong></li>
  <li><strong>Di la frase</strong> de bienvenida.</li>
  <li><strong>Ayuda con el equipaje</strong> activamente, sin esperar que te lo pidan.</li>
</ol>

<h2>4. Si el pasajero no habla español</h2>
<p>Usa la traducción del chat de la app. Un simple <em>“Welcome! I'm your Going App driver”</em> hace una gran diferencia. En el curso de Inglés Turístico aprenderás más frases útiles.</p>

<h2>5. Lo que NO debes hacer</h2>
<ul>
  <li>Estar en el teléfono cuando llega el pasajero.</li>
  <li>Pedir datos personales (número privado, redes).</li>
  <li>Comentar sobre política o religión.</li>
  <li>Iniciar el viaje sin confirmar el nombre del pasajero.</li>
</ul>
`,
    slides: [
      { title: 'Vehículo Going App-ready', points: ['Interior impecable, sin olores fuertes', 'Llantas, frenos, luces revisados', 'Temperatura lista antes de subir', 'Cargador USB a mano'] },
      { title: 'Identificación visible', points: ['Lanyard siempre visible', 'Foto y placa coinciden con la app', 'Eres tu insignia de confianza'] },
      { title: 'El saludo Going App', points: ['Sal del auto', 'Sonríe genuinamente', 'Muestra el lanyard', '“¡Bienvenido a Going App! Soy…”'] },
      { title: 'Equipaje y empatía', points: ['Ayuda activamente con maletas', 'Confirma el nombre del pasajero', 'Usa traducción si no habla español'] },
      { title: 'Lo que NO hacer', points: ['Nada de teléfono al recibir', 'No pedir datos personales', 'Nada de política ni religión'] },
    ],
    podcast: {
      intro: 'Bienvenido a la Ruta del Volante. En este primer módulo hablamos de la primera impresión: cómo recibir a tu pasajero de forma que los primeros treinta segundos jueguen a tu favor.',
      segments: [
        { title: 'Vehículo listo', text: 'Antes de encender el motor, tu vehículo debe estar Going App-ready. Interior impecable y sin olores fuertes, seguridad revisada en llantas, frenos y luces, temperatura lista según el clima y un cargador USB a mano. Recuerda: un auto limpio es el primer saludo que das antes de abrir la boca.' },
        { title: 'El saludo perfecto', text: 'El momento del hola define todo el viaje. Sal del vehículo, sonríe de forma genuina, muestra tu lanyard y di las palabras mágicas: bienvenido a Going App, soy tu nombre. Y ayuda con el equipaje activamente, sin esperar a que te lo pidan.' },
        { title: 'Turistas y barreras de idioma', text: 'Si el pasajero no habla español, usa la traducción del chat de la app. Un simple welcome, I am your Going App driver hace una gran diferencia. En el curso de Inglés Turístico aprenderás muchas más frases útiles.' },
        { title: 'Errores a evitar', text: 'Para terminar, lo que no debes hacer: estar en el teléfono cuando llega el pasajero, pedir datos personales, comentar sobre política o religión, o iniciar el viaje sin confirmar el nombre del pasajero.' },
      ],
    },
    quiz: [
      { question: '¿Qué se recomienda hacer al llegar a recoger al pasajero?', options: ['Esperar dentro del auto', 'Salir del vehículo y saludar con una sonrisa', 'Tocar la bocina', 'Llamarlo por teléfono'], correct: 1, explanation: 'El protocolo Going App es salir del vehículo, sonreír, mostrar el lanyard y dar la bienvenida.' },
      { question: 'El lanyard de Going App sirve para…', options: ['Decoración', 'Que el pasajero te identifique y genere confianza', 'Cumplir un trámite', 'Nada en especial'], correct: 1, explanation: 'El lanyard es tu insignia de confianza: los pasajeros lo buscan para identificarte.' },
      { question: 'Si el pasajero no habla español, lo mejor es…', options: ['Hablar más fuerte', 'Usar la traducción del chat de la app', 'Cancelar el viaje', 'Ignorarlo'], correct: 1, explanation: 'La app traduce el chat; una frase de bienvenida en su idioma marca la diferencia.' },
      { question: '¿Cuál de estas acciones NO debes hacer?', options: ['Ayudar con el equipaje', 'Confirmar el nombre del pasajero', 'Comentar sobre política', 'Mostrar tu lanyard'], correct: 2, explanation: 'Nunca comentes sobre política o religión; mantén el trato amable y profesional.' },
    ],
  },
  c2: {
    id: 'c2',
    school: 'Escuela de Conductores',
    schoolColor: COLORS.brand.red,
    title: 'Seguridad Vial Ecuador',
    subtitle: 'Manejo defensivo por región',
    description:
      'Manejo defensivo en Costa, Sierra y Amazonía: curvas de montaña, lluvia tropical, neblina y respuesta ante emergencias viales. Tu seguridad y la de tus pasajeros, primero.',
    readingHtml: `
<h2>1. Principios del manejo defensivo</h2>
<p>Manejar a la defensiva es <strong>anticipar el error de los demás</strong> y dejar siempre una salida.</p>
<ul>
  <li><strong>Distancia de seguridad:</strong> regla de los 3 segundos; con lluvia, dóblala.</li>
  <li><strong>Velocidad según la vía,</strong> no según el límite máximo.</li>
  <li><strong>Cinturón siempre,</strong> tú y todos los pasajeros.</li>
  <li><strong>Sin distracciones:</strong> el teléfono va en soporte; nunca en la mano.</li>
</ul>

<h2>2. Sierra — curvas y altura</h2>
<ul>
  <li><strong>Curvas de montaña:</strong> reduce ANTES de la curva, acelera suave a la salida. Nunca frenes en plena curva.</li>
  <li><strong>Neblina (páramo):</strong> luces bajas (las altas reflejan), baja la velocidad y usa la línea de borde como guía.</li>
  <li><strong>Pendientes largas:</strong> baja en marcha reducida para no quemar los frenos (freno motor).</li>
</ul>

<h2>3. Costa — calor, lluvia y tráfico</h2>
<ul>
  <li><strong>Lluvia tropical:</strong> el primer aguacero saca el aceite del asfalto: extrema cuidado. Evita frenazos.</li>
  <li><strong>Hidroplaneo:</strong> si el volante se siente “liviano”, suelta el acelerador sin frenar de golpe.</li>
  <li><strong>Calor:</strong> revisa presión de llantas y temperatura del motor.</li>
</ul>

<h2>4. Amazonía — vías mixtas</h2>
<ul>
  <li><strong>Vías de lastre/barro:</strong> velocidad baja y constante, sin movimientos bruscos.</li>
  <li><strong>Fauna y peatones</strong> pueden aparecer de repente: máxima atención.</li>
  <li><strong>Tramos sin señal:</strong> avisa tu ruta antes de salir y lleva combustible de sobra.</li>
</ul>

<h2>5. Ante una emergencia vial</h2>
<ol>
  <li><strong>Oríllate</strong> en un lugar seguro y enciende las luces de emergencia.</li>
  <li><strong>Triángulos/conos</strong> a buena distancia.</li>
  <li><strong>Protege a los pasajeros</strong> primero.</li>
  <li><strong>Llama a emergencias: 911.</strong> Usa el botón SOS de la app si está disponible.</li>
  <li><strong>No muevas heridos</strong> salvo peligro inminente.</li>
</ol>
<blockquote>Conducir cansado es tan peligroso como conducir bajo efectos del alcohol. Descansa antes de manejar.</blockquote>
`,
    slides: [
      { title: 'Manejo defensivo', points: ['Anticipa el error de los demás', 'Regla de 3 segundos (doble con lluvia)', 'Cinturón para todos', 'Teléfono en soporte, nunca en la mano'] },
      { title: 'Sierra', points: ['Reduce antes de la curva', 'Neblina: luces bajas', 'Pendientes: usa freno motor'] },
      { title: 'Costa', points: ['Primer aguacero = asfalto resbaloso', 'Hidroplaneo: suelta el acelerador', 'Revisa llantas y temperatura'] },
      { title: 'Amazonía', points: ['Lastre/barro: lento y constante', 'Atento a fauna y peatones', 'Avisa tu ruta; lleva combustible extra'] },
      { title: 'Emergencia vial', points: ['Oríllate y luces de emergencia', 'Señaliza con triángulos', 'Protege a los pasajeros', 'Llama al 911 / botón SOS'] },
    ],
    podcast: {
      intro: 'Bienvenido a Seguridad Vial Ecuador. En este episodio repasamos el manejo defensivo según la región: Sierra, Costa y Amazonía, y qué hacer ante una emergencia.',
      segments: [
        { title: 'Manejo defensivo', text: 'Manejar a la defensiva es anticipar el error de los demás y dejar siempre una salida. Mantén la distancia de seguridad con la regla de los tres segundos, y dóblala cuando llueve. Ajusta la velocidad a la vía, no al límite máximo, usa el cinturón siempre y deja el teléfono en el soporte, nunca en la mano.' },
        { title: 'Sierra: curvas y neblina', text: 'En la Sierra, reduce antes de entrar a la curva y acelera suave a la salida; nunca frenes en plena curva. Con neblina del páramo usa luces bajas, porque las altas reflejan, y baja la velocidad. En pendientes largas, usa el freno motor para no quemar los frenos.' },
        { title: 'Costa y Amazonía', text: 'En la Costa, el primer aguacero saca el aceite del asfalto y lo vuelve resbaloso: extrema el cuidado y evita frenazos. Si sientes el volante liviano por hidroplaneo, suelta el acelerador sin frenar de golpe. En la Amazonía, en vías de lastre o barro maneja lento y constante, atento a fauna y peatones, y avisa tu ruta porque hay tramos sin señal.' },
        { title: 'Ante una emergencia', text: 'Si ocurre una emergencia: oríllate en un lugar seguro con las luces de emergencia, señaliza con triángulos, protege primero a los pasajeros y llama al 911 o usa el botón SOS de la app. No muevas a una persona herida salvo peligro inminente. Y recuerda: conducir cansado es tan peligroso como conducir bajo efectos del alcohol.' },
      ],
    },
    quiz: [
      { question: 'Con lluvia, la distancia de seguridad debe…', options: ['Reducirse', 'Mantenerse igual', 'Duplicarse (regla de 3 s → 6 s)', 'No importa'], correct: 2, explanation: 'Con piso mojado la frenada es más larga: dobla la regla de los 3 segundos.' },
      { question: 'En curvas de montaña, lo correcto es…', options: ['Frenar dentro de la curva', 'Reducir antes y acelerar suave a la salida', 'Acelerar al entrar', 'Apagar las luces'], correct: 1, explanation: 'Se reduce antes de la curva y se acelera de forma progresiva a la salida; nunca se frena en plena curva.' },
      { question: 'Con neblina en el páramo conviene usar…', options: ['Luces altas', 'Luces bajas', 'Sin luces', 'Solo intermitentes'], correct: 1, explanation: 'Las luces altas reflejan en la neblina y encandilan; se usan luces bajas y baja velocidad.' },
      { question: 'Ante una emergencia vial, ¿a qué número llamas?', options: ['132', '911', '171', '101'], correct: 1, explanation: 'El número único de emergencias en Ecuador es el 911; además puedes usar el botón SOS de la app.' },
    ],
  },
  c3: {
    id: 'c3',
    school: 'Escuela de Conductores',
    schoolColor: COLORS.brand.red,
    title: 'Mecánica Preventiva Básica',
    subtitle: 'Cuida tu vehículo, cuida tu ingreso',
    description:
      'Revisión diaria, cambio de llanta en ruta, control de niveles y cuándo ir al taller antes de que el problema sea urgente (y caro). Un vehículo cuidado es ingreso asegurado.',
    readingHtml: `
<h2>1. El chequeo diario (2 minutos)</h2>
<p>Antes de empezar tu jornada, una rutina corta evita el 90% de los imprevistos. Recuerda el acrónimo <strong>“LLANTAS”</strong> de forma simple:</p>
<ul>
  <li><strong>Luces:</strong> delanteras, traseras, freno y direccionales.</li>
  <li><strong>Llantas:</strong> presión y estado (sin cortes ni desgaste irregular).</li>
  <li><strong>Aceite y fluidos:</strong> nivel correcto (ver sección 3).</li>
  <li><strong>Niveles de combustible:</strong> nunca empieces casi vacío.</li>
  <li><strong>Frenos:</strong> sin ruidos ni pedal esponjoso.</li>
</ul>

<h2>2. Cambio de llanta en ruta</h2>
<ol>
  <li><strong>Oríllate</strong> en piso firme y plano; luces de emergencia y triángulos.</li>
  <li><strong>Afloja</strong> los pernos ANTES de levantar el auto con la gata.</li>
  <li><strong>Levanta</strong> con la gata en el punto de apoyo correcto del chasis.</li>
  <li><strong>Cambia</strong> la llanta y ajusta los pernos en cruz (no en círculo).</li>
  <li><strong>Baja</strong> el auto y aprieta firme. Revisa presión pronto.</li>
</ol>
<blockquote>La llanta de repuesto tipo “galleta” es temporal: máx. 80 km/h y cámbiala pronto.</blockquote>

<h2>3. Control de niveles</h2>
<ul>
  <li><strong>Aceite de motor:</strong> con el motor frío, varilla entre MIN y MAX.</li>
  <li><strong>Refrigerante:</strong> nunca abras el radiador caliente.</li>
  <li><strong>Líquido de frenos y dirección:</strong> dentro del rango marcado.</li>
  <li><strong>Limpiaparabrisas:</strong> agua con limpiador; visibilidad es seguridad.</li>
</ul>

<h2>4. Señales de que algo anda mal</h2>
<ul>
  <li><strong>Luz de check engine</strong> encendida fija o parpadeando.</li>
  <li><strong>Ruidos nuevos:</strong> chirridos al frenar, golpeteos, silbidos.</li>
  <li><strong>Olores:</strong> a quemado, a gasolina o dulzón (refrigerante).</li>
  <li><strong>Vibraciones</strong> en el volante a cierta velocidad.</li>
</ul>
<p><strong>Regla de oro:</strong> ir al taller a tiempo cuesta menos que una reparación de emergencia… y evita que pierdas días de trabajo.</p>
`,
    slides: [
      { title: 'Chequeo diario', points: ['Luces completas', 'Llantas: presión y estado', 'Aceite y fluidos', 'Combustible y frenos'] },
      { title: 'Cambiar llanta', points: ['Afloja pernos antes de levantar', 'Gata en el punto correcto', 'Aprieta en cruz, no en círculo', 'Repuesto “galleta”: máx. 80 km/h'] },
      { title: 'Niveles', points: ['Aceite con motor frío', 'Refrigerante: nunca en caliente', 'Frenos y dirección en rango', 'Agua de limpiaparabrisas'] },
      { title: 'Señales de alerta', points: ['Check engine encendido', 'Ruidos u olores nuevos', 'Vibraciones en el volante'] },
      { title: 'Regla de oro', points: ['Taller a tiempo cuesta menos', 'Evita perder días de trabajo', 'Vehículo cuidado = ingreso seguro'] },
    ],
    podcast: {
      intro: 'Bienvenido a Mecánica Preventiva Básica. Aquí aprenderás a cuidar tu vehículo con rutinas simples, porque cuidar tu auto es cuidar tu ingreso.',
      segments: [
        { title: 'El chequeo diario', text: 'Antes de empezar tu jornada, dos minutos de revisión evitan la mayoría de los imprevistos. Revisa luces delanteras, traseras y direccionales; presión y estado de las llantas; niveles de aceite y fluidos; combustible suficiente; y que los frenos no hagan ruido ni se sientan esponjosos.' },
        { title: 'Cambio de llanta en ruta', text: 'Si pinchas, oríllate en piso firme y plano, pon luces de emergencia y triángulos. Afloja los pernos antes de levantar el auto con la gata, ubica la gata en el punto de apoyo correcto, cambia la llanta y ajusta los pernos en cruz, no en círculo. Recuerda que la llanta de repuesto tipo galleta es temporal: máximo ochenta por hora.' },
        { title: 'Control de niveles', text: 'Revisa el aceite con el motor frío, manteniéndolo entre el mínimo y el máximo de la varilla. Nunca abras el radiador en caliente. Mantén el líquido de frenos y de dirección dentro de su rango, y no descuides el agua del limpiaparabrisas, porque la visibilidad también es seguridad.' },
        { title: 'Cuándo ir al taller', text: 'Presta atención a las señales: la luz de check engine, ruidos nuevos al frenar, olores a quemado o dulzón, y vibraciones en el volante. La regla de oro es simple: ir al taller a tiempo cuesta mucho menos que una reparación de emergencia, y evita que pierdas días de trabajo.' },
      ],
    },
    quiz: [
      { question: 'Al cambiar una llanta, los pernos se aflojan…', options: ['Después de levantar el auto', 'Antes de levantar el auto con la gata', 'No se aflojan', 'Con el motor encendido'], correct: 1, explanation: 'Se aflojan antes de levantar, porque con la rueda en el aire giraría sin poder destrabar los pernos.' },
      { question: 'El nivel de aceite se revisa con el motor…', options: ['Muy caliente', 'Frío y en piso plano', 'En movimiento', 'Da igual'], correct: 1, explanation: 'Con el motor frío y el auto nivelado la lectura de la varilla es confiable.' },
      { question: 'La llanta de repuesto tipo “galleta”…', options: ['Es permanente', 'Permite cualquier velocidad', 'Es temporal, máx. ~80 km/h', 'No debe usarse nunca'], correct: 2, explanation: 'Es temporal: limita la velocidad y debe reemplazarse pronto por una llanta normal.' },
      { question: '¿Cuál es una señal de alerta para ir al taller?', options: ['El auto está limpio', 'Luz de check engine encendida', 'El tanque lleno', 'Llantas nuevas'], correct: 1, explanation: 'El check engine, ruidos, olores o vibraciones nuevas indican que conviene revisar a tiempo.' },
    ],
  },
  c4: {
    id: 'c4',
    school: 'Escuela de Conductores',
    schoolColor: COLORS.brand.red,
    title: 'Inglés Turístico Básico',
    subtitle: 'Atiende turistas internacionales',
    description:
      'Frases esenciales para recibir, guiar y despedir a turistas que no hablan español. Pensado para escuchar y repetir mientras conduces sin pasajeros.',
    readingHtml: `
<h2>1. Saludo y bienvenida</h2>
<ul>
  <li><strong>Welcome to Going App! I'm [name].</strong> — ¡Bienvenido a Going App! Soy [nombre].</li>
  <li><strong>How are you today?</strong> — ¿Cómo está hoy?</li>
  <li><strong>Let me help you with your luggage.</strong> — Déjeme ayudarle con su equipaje.</li>
  <li><strong>Please, fasten your seatbelt.</strong> — Por favor, abróchese el cinturón.</li>
</ul>

<h2>2. Durante el viaje</h2>
<ul>
  <li><strong>We are going to [place].</strong> — Vamos a [lugar].</li>
  <li><strong>The trip takes about 20 minutes.</strong> — El viaje toma unos 20 minutos.</li>
  <li><strong>Is the temperature okay?</strong> — ¿Está bien la temperatura?</li>
  <li><strong>Would you like music?</strong> — ¿Desea música?</li>
  <li><strong>Do you need to make a stop?</strong> — ¿Necesita hacer una parada?</li>
</ul>

<h2>3. Recomendaciones y cultura</h2>
<ul>
  <li><strong>This is a good place to eat.</strong> — Este es un buen lugar para comer.</li>
  <li><strong>You should try the local food: encebollado, ceviche.</strong> — Debería probar la comida local.</li>
  <li><strong>It is safe, but take care of your belongings.</strong> — Es seguro, pero cuide sus pertenencias.</li>
</ul>

<h2>4. Pago y despedida</h2>
<ul>
  <li><strong>The fare is shown in the app.</strong> — La tarifa aparece en la app.</li>
  <li><strong>You can pay by card or cash.</strong> — Puede pagar con tarjeta o efectivo.</li>
  <li><strong>Here we are. Have a great trip!</strong> — Aquí estamos. ¡Que tenga un gran viaje!</li>
  <li><strong>Please rate your trip in the app. Thank you!</strong> — Por favor, califique su viaje. ¡Gracias!</li>
</ul>

<h2>5. Si no entiendes</h2>
<ul>
  <li><strong>Sorry, could you repeat that?</strong> — Disculpe, ¿podría repetir?</li>
  <li><strong>One moment, I'll use the app to translate.</strong> — Un momento, usaré la app para traducir.</li>
</ul>
<blockquote>No necesitas hablar inglés perfecto. Una sonrisa, buena actitud y estas frases bastan para que el turista se sienta bienvenido.</blockquote>
`,
    slides: [
      { title: 'Bienvenida', points: ['Welcome to Going App! I\'m [name].', 'Let me help with your luggage.', 'Please, fasten your seatbelt.'] },
      { title: 'Durante el viaje', points: ['We are going to [place].', 'The trip takes about 20 minutes.', 'Is the temperature okay?', 'Do you need a stop?'] },
      { title: 'Recomendaciones', points: ['This is a good place to eat.', 'Try the local food.', 'Take care of your belongings.'] },
      { title: 'Pago y despedida', points: ['You can pay by card or cash.', 'Have a great trip!', 'Please rate your trip. Thank you!'] },
      { title: 'Si no entiendes', points: ['Could you repeat that?', 'I\'ll use the app to translate.', 'Una sonrisa siempre ayuda'] },
    ],
    podcast: {
      intro: 'Welcome! Bienvenido a Inglés Turístico Básico. Escucha y repite estas frases mientras conduces sin pasajeros. No buscamos un inglés perfecto, sino que el turista se sienta bienvenido.',
      segments: [
        { title: 'Saludo y bienvenida', text: 'Empecemos con la bienvenida. Welcome to Going App, I am name. Bienvenido a Going App, soy nombre. How are you today. Cómo está hoy. Let me help you with your luggage. Déjeme ayudarle con su equipaje. Please, fasten your seatbelt. Por favor, abróchese el cinturón.' },
        { title: 'Durante el viaje', text: 'Durante el viaje. We are going to. Vamos a. The trip takes about twenty minutes. El viaje toma unos veinte minutos. Is the temperature okay. Está bien la temperatura. Would you like music. Desea música. Do you need to make a stop. Necesita hacer una parada.' },
        { title: 'Pago y despedida', text: 'Para el pago y la despedida. You can pay by card or cash. Puede pagar con tarjeta o efectivo. Here we are, have a great trip. Aquí estamos, que tenga un gran viaje. Please rate your trip in the app, thank you. Por favor, califique su viaje en la app, gracias.' },
        { title: 'Si no entiendes', text: 'Y si no entiendes algo, no te preocupes. Sorry, could you repeat that. Disculpe, podría repetir. One moment, I will use the app to translate. Un momento, usaré la app para traducir. Recuerda: una sonrisa y buena actitud valen más que un inglés perfecto.' },
      ],
    },
    quiz: [
      { question: '¿Cómo le pides a un pasajero que se abroche el cinturón?', options: ['Open the door, please', 'Please, fasten your seatbelt', 'Stop the car', 'Pay the fare'], correct: 1, explanation: '“Please, fasten your seatbelt” = por favor, abróchese el cinturón.' },
      { question: '“The trip takes about 20 minutes” significa…', options: ['El viaje cuesta 20 dólares', 'El viaje toma unos 20 minutos', 'Faltan 20 km', 'Pare en 20 metros'], correct: 1, explanation: '“Takes about 20 minutes” = toma unos 20 minutos.' },
      { question: 'Si no entendiste algo, dices…', options: ['Goodbye', 'Sorry, could you repeat that?', 'Thank you', 'Turn left'], correct: 1, explanation: '“Could you repeat that?” pide amablemente que repitan.' },
      { question: 'Para invitar a calificar el viaje, dices…', options: ['Please rate your trip in the app', 'Open the window', 'I am hungry', 'See the map'], correct: 0, explanation: '“Please rate your trip in the app” invita a calificar el servicio.' },
    ],
  },
  c5: {
    id: 'c5',
    school: 'Escuela de Conductores',
    schoolColor: COLORS.brand.red,
    title: 'Primeros Auxilios en Ruta',
    subtitle: 'Responde antes de que llegue la ayuda',
    description:
      'Cómo actuar ante un accidente, mareo o malestar de un pasajero mientras llega la ayuda profesional. Incluye nociones de RCP y uso del botiquín. Contenido informativo, no sustituye una certificación.',
    readingHtml: `
<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:12px 16px;margin-bottom:16px;">
<strong>Aviso importante:</strong> este curso es <strong>informativo</strong> y no reemplaza una certificación oficial de primeros auxilios (Cruz Roja, ECU 911 u otra entidad acreditada). Ante cualquier emergencia, llama siempre al <strong>911</strong>.
</div>

<h2>1. Lo primero: tu seguridad y la escena</h2>
<ol>
  <li><strong>Evalúa el entorno:</strong> ¿hay tráfico, fuego, cables? No te conviertas en otra víctima.</li>
  <li><strong>Señaliza y protege</strong> la zona (luces, triángulos).</li>
  <li><strong>Llama al 911</strong> e indica ubicación, número de personas y estado.</li>
</ol>

<h2>2. Botiquín básico</h2>
<ul>
  <li>Guantes desechables, gasas y vendas estériles.</li>
  <li>Antiséptico, esparadrapo y tijeras.</li>
  <li>Suero fisiológico y bolsas de frío instantáneo.</li>
  <li>Agua y una manta térmica.</li>
</ul>

<h2>3. Situaciones frecuentes</h2>
<ul>
  <li><strong>Mareo o náusea:</strong> detente con seguridad, aire fresco, agua a sorbos. Si empeora, llama al 911.</li>
  <li><strong>Desmayo:</strong> recuéstalo y eleva las piernas; verifica que respire. Si no despierta, llama al 911.</li>
  <li><strong>Herida con sangrado:</strong> presión directa con gasa limpia; no retires objetos clavados.</li>
  <li><strong>Atragantamiento:</strong> si no puede toser ni hablar, maniobra de Heimlich (compresiones bajo el esternón).</li>
</ul>

<h2>4. RCP — nociones básicas</h2>
<p>Si una persona <strong>no responde y no respira normalmente</strong>:</p>
<ol>
  <li><strong>Llama al 911</strong> (o pide a alguien que llame) y consigue un DEA si hay.</li>
  <li><strong>Compresiones en el centro del pecho:</strong> fuerte y rápido, ~100–120 por minuto, dejando subir el pecho.</li>
  <li><strong>No te detengas</strong> hasta que llegue ayuda o la persona reaccione.</li>
</ol>
<blockquote>Aprender RCP en un curso presencial certificado salva vidas. Este módulo es solo una guía de referencia.</blockquote>

<h2>5. Qué NO hacer</h2>
<ul>
  <li>No muevas a un herido salvo peligro inminente (riesgo de lesión de columna).</li>
  <li>No des comida ni bebida a alguien con pérdida de conciencia.</li>
  <li>No retires cascos ni objetos clavados.</li>
</ul>
`,
    slides: [
      { title: 'Primero, la escena', points: ['Evalúa el entorno (tráfico, fuego)', 'Señaliza y protege', 'Llama al 911 con ubicación y estado'] },
      { title: 'Botiquín básico', points: ['Guantes, gasas y vendas', 'Antiséptico y tijeras', 'Suero, frío instantáneo', 'Agua y manta térmica'] },
      { title: 'Situaciones frecuentes', points: ['Mareo: aire fresco y agua', 'Desmayo: eleva las piernas', 'Sangrado: presión directa', 'Atragantamiento: Heimlich'] },
      { title: 'RCP básico', points: ['Llama al 911', 'Compresiones al centro del pecho', '100–120 por minuto', 'No te detengas hasta que llegue ayuda'] },
      { title: 'Qué NO hacer', points: ['No mover heridos sin necesidad', 'No dar comida si hay inconsciencia', 'No retirar objetos clavados'] },
    ],
    podcast: {
      intro: 'Bienvenido a Primeros Auxilios en Ruta. Antes de empezar, un recordatorio: este contenido es informativo y no reemplaza una certificación oficial. Ante cualquier emergencia, llama siempre al 911.',
      segments: [
        { title: 'Lo primero: la escena', text: 'Lo primero siempre es tu seguridad. Evalúa el entorno: tráfico, fuego, cables. No te conviertas en otra víctima. Señaliza y protege la zona con luces y triángulos, y llama al 911 indicando la ubicación, el número de personas y su estado.' },
        { title: 'Situaciones frecuentes', text: 'Ante mareo o náusea, detente con seguridad, da aire fresco y agua a sorbos. En un desmayo, recuesta a la persona y eleva sus piernas, verificando que respire. Si hay una herida con sangrado, aplica presión directa con gasa limpia y no retires objetos clavados. Y si alguien se atraganta y no puede toser ni hablar, aplica la maniobra de Heimlich.' },
        { title: 'Nociones de RCP', text: 'Si una persona no responde y no respira con normalidad, llama al 911 o pide a alguien que lo haga, y comienza compresiones en el centro del pecho, fuerte y rápido, a un ritmo de cien a ciento veinte por minuto, dejando que el pecho vuelva a subir. No te detengas hasta que llegue la ayuda o la persona reaccione. Aprender RCP en un curso presencial certificado salva vidas.' },
        { title: 'Qué no hacer', text: 'Para cerrar, lo que no debes hacer: no muevas a un herido salvo peligro inminente, por el riesgo de lesión de columna; no des comida ni bebida a alguien con pérdida de conciencia; y no retires cascos ni objetos clavados. Tu calma y una llamada al 911 ya son una gran ayuda.' },
      ],
    },
    quiz: [
      { question: 'Lo PRIMERO ante un accidente es…', options: ['Mover a los heridos', 'Asegurar la escena y tu propia seguridad', 'Tomar fotos', 'Buscar testigos'], correct: 1, explanation: 'Primero la seguridad: evaluar el entorno y señalizar evita que haya más víctimas.' },
      { question: 'Ante una herida con sangrado debes…', options: ['Retirar cualquier objeto clavado', 'Aplicar presión directa con gasa limpia', 'Dar de beber', 'Esperar sin hacer nada'], correct: 1, explanation: 'La presión directa controla el sangrado; los objetos clavados no se retiran.' },
      { question: 'El ritmo aproximado de las compresiones de RCP es…', options: ['20–30 por minuto', '50–60 por minuto', '100–120 por minuto', '200 por minuto'], correct: 2, explanation: 'Las compresiones se realizan a unas 100 a 120 por minuto, fuertes y constantes.' },
      { question: '¿Cuál es una acción que NO debes hacer?', options: ['Llamar al 911', 'Mover a un herido sin necesidad', 'Señalizar la zona', 'Usar guantes del botiquín'], correct: 1, explanation: 'No se mueve a un herido salvo peligro inminente, por el riesgo de agravar lesiones de columna.' },
    ],
  },

  // ─── ESCUELA DE ANFITRIONES ───────────────────────────────────────────────
  a1: {
    id: 'a1',
    school: 'Escuela de Anfitriones',
    schoolColor: COLORS.system.blue,
    title: 'Fotografía con el Celular',
    subtitle: 'Fotos que venden el vibe',
    description:
      'Luz natural, ángulos, composición y edición gratuita. Convierte tu teléfono en una cámara que muestra lo mejor de tu alojamiento y llena tu calendario de reservas.',
    readingHtml: `
<h2>1. La luz lo es todo</h2>
<p>La buena foto no necesita una cámara cara: necesita <strong>buena luz</strong>.</p>
<ul>
  <li><strong>Luz natural:</strong> fotografía de día, con cortinas y ventanas abiertas. Apaga las lámparas para evitar tonos amarillos.</li>
  <li><strong>La “hora dorada”:</strong> la primera y la última hora de sol dan una luz cálida y favorecedora para exteriores.</li>
  <li><strong>Evita el contraluz:</strong> no pongas la ventana justo detrás del objeto; deja que la luz entre de lado.</li>
</ul>

<h2>2. Prepara el espacio antes de disparar</h2>
<ul>
  <li><strong>Ordena y despeja:</strong> menos objetos = foto más limpia. Guarda cables, basura y artículos personales.</li>
  <li><strong>Haz la cama</strong> y endereza cojines, toallas y cortinas.</li>
  <li><strong>Añade un detalle de vida:</strong> una planta, flores o una taza dan calidez.</li>
</ul>

<h2>3. Composición y ángulos</h2>
<ul>
  <li><strong>Regla de los tercios:</strong> activa la cuadrícula del celular y ubica lo importante en las líneas.</li>
  <li><strong>Toma a la altura del pecho,</strong> no desde arriba: muestra el espacio como se vive.</li>
  <li><strong>Esquinas:</strong> fotografiar desde una esquina hace que la habitación se vea más amplia.</li>
  <li><strong>Horizontal</strong> para espacios; vertical para detalles.</li>
</ul>

<h2>4. Edición gratuita</h2>
<p>Con apps gratis (Snapseed, Lightroom móvil o el editor del propio teléfono):</p>
<ul>
  <li>Sube un poco el <strong>brillo</strong> y las <strong>sombras</strong>.</li>
  <li>Endereza líneas verticales (paredes rectas).</li>
  <li><strong>No exageres</strong> los filtros: la foto debe parecerse a la realidad o tendrás malas reseñas.</li>
</ul>

<h2>5. La foto de portada</h2>
<p>La primera foto decide si alguien entra a tu anuncio. Elige la más <strong>luminosa y representativa</strong> (normalmente la sala o la mejor vista). Sube entre <strong>8 y 15 fotos</strong> que cuenten el recorrido del espacio.</p>
<blockquote>Honestidad ante todo: muestra el lugar tal como es. La mejor reseña es un huésped que llega y encuentra justo lo que vio.</blockquote>
`,
    slides: [
      { title: 'La luz lo es todo', points: ['Fotografía de día con luz natural', 'Apaga lámparas (evita amarillo)', 'Hora dorada para exteriores', 'Evita el contraluz'] },
      { title: 'Prepara el espacio', points: ['Ordena y despeja', 'Haz la cama, endereza cojines', 'Añade una planta o flores'] },
      { title: 'Composición', points: ['Activa la cuadrícula (tercios)', 'Dispara a la altura del pecho', 'Desde la esquina = más amplio', 'Horizontal para espacios'] },
      { title: 'Edición gratuita', points: ['Sube brillo y sombras', 'Endereza las verticales', 'No exageres los filtros'] },
      { title: 'Foto de portada', points: ['La 1ª foto decide la visita', 'Elige la más luminosa', 'Sube 8–15 fotos', 'Muestra el lugar tal como es'] },
    ],
    podcast: {
      intro: 'Bienvenido a Fotografía con el Celular. Hoy aprenderás a convertir tu teléfono en una herramienta que muestra lo mejor de tu alojamiento y llena tu calendario de reservas.',
      segments: [
        { title: 'La luz', text: 'La buena foto no necesita una cámara cara, necesita buena luz. Fotografía de día con luz natural, abre cortinas y ventanas y apaga las lámparas para evitar tonos amarillos. Para exteriores, aprovecha la hora dorada, la primera y la última hora de sol. Y evita el contraluz: deja que la luz entre de lado.' },
        { title: 'Prepara y compón', text: 'Antes de disparar, ordena y despeja: menos objetos significan una foto más limpia. Haz la cama, endereza cojines y añade un detalle de vida como una planta. Para componer, activa la cuadrícula del celular y usa la regla de los tercios, dispara a la altura del pecho y, desde una esquina, la habitación se ve más amplia.' },
        { title: 'Edición sin gastar', text: 'Con apps gratuitas como Snapseed o Lightroom móvil, sube un poco el brillo y las sombras y endereza las líneas verticales para que las paredes se vean rectas. Pero no exageres los filtros: la foto debe parecerse a la realidad, o tendrás malas reseñas.' },
        { title: 'La portada', text: 'La primera foto decide si alguien entra a tu anuncio, así que elige la más luminosa y representativa, normalmente la sala o la mejor vista. Sube entre ocho y quince fotos que cuenten el recorrido del espacio. Y recuerda: honestidad ante todo, muestra el lugar tal como es.' },
      ],
    },
    quiz: [
      { question: '¿Cuál es el mejor momento para fotografiar interiores?', options: ['De noche con flash', 'De día con luz natural', 'Con todas las lámparas encendidas', 'No importa'], correct: 1, explanation: 'La luz natural de día da los mejores resultados; las lámparas añaden tonos amarillos.' },
      { question: 'La regla de los tercios se aplica…', options: ['Recortando la foto en tres', 'Ubicando lo importante sobre las líneas de la cuadrícula', 'Tomando 3 fotos', 'Usando 3 filtros'], correct: 1, explanation: 'Se activa la cuadrícula y se sitúan los elementos clave sobre sus líneas.' },
      { question: 'Sobre los filtros de edición, lo correcto es…', options: ['Exagerarlos al máximo', 'Usarlos con mesura para que la foto se parezca a la realidad', 'No editar nunca', 'Cambiar los colores reales'], correct: 1, explanation: 'Una edición sutil mejora la foto; exagerar genera expectativas falsas y malas reseñas.' },
      { question: 'La foto de portada debería ser…', options: ['La más oscura', 'Una de detalle', 'La más luminosa y representativa', 'La del baño'], correct: 2, explanation: 'La portada decide la visita: elige la imagen más luminosa y representativa del espacio.' },
    ],
  },
  a2: {
    id: 'a2',
    school: 'Escuela de Anfitriones',
    schoolColor: COLORS.system.blue,
    title: 'Limpieza Estándar Going App',
    subtitle: 'El protocolo que construye confianza',
    description:
      'La secuencia de limpieza, los productos seguros, la desinfección entre huéspedes y la lista de verificación que convierten la limpieza en tu mejor reseña.',
    readingHtml: `
<h2>1. Por qué la limpieza vende</h2>
<p>La limpieza es el factor número uno en las reseñas de alojamientos. Un espacio impecable <strong>genera confianza al instante</strong> y justifica tu precio. Un detalle sucio puede arruinar una reseña perfecta.</p>

<h2>2. La secuencia correcta (de arriba a abajo, de limpio a sucio)</h2>
<ol>
  <li><strong>Ventila</strong> y recoge basura y ropa de cama usada.</li>
  <li><strong>Polvo de arriba hacia abajo:</strong> repisas, muebles, superficies.</li>
  <li><strong>Cocina:</strong> electrodomésticos, mesones y fregadero.</li>
  <li><strong>Baño al final:</strong> inodoro de último, con paño exclusivo.</li>
  <li><strong>Pisos al cierre:</strong> barre y trapea saliendo de la habitación.</li>
</ol>
<blockquote>Regla de oro: nunca uses el mismo paño para el baño y la cocina. Usa códigos de color para evitar contaminación cruzada.</blockquote>

<h2>3. Productos seguros</h2>
<ul>
  <li><strong>Desengrasante</strong> para cocina; <strong>desinfectante</strong> para baño.</li>
  <li><strong>Nunca mezcles</strong> cloro con amoniaco o con vinagre: liberan gases tóxicos.</li>
  <li><strong>Ventila</strong> mientras usas químicos y guárdalos fuera del alcance.</li>
  <li>Opciones nobles: vinagre y bicarbonato para limpieza diaria.</li>
</ul>

<h2>4. Desinfección entre huéspedes</h2>
<p>Presta atención a los <strong>puntos de contacto</strong> que muchos olvidan:</p>
<ul>
  <li>Manijas, interruptores y controles remotos.</li>
  <li>Llaves, mandos y superficies del baño.</li>
  <li>Ropa de cama y toallas: <strong>siempre</strong> lavadas entre huéspedes, aunque parezcan sin usar.</li>
</ul>

<h2>5. Tu checklist final</h2>
<ul>
  <li>Cama tendida con ropa limpia y sin pelos ni manchas.</li>
  <li>Baño seco, sin cabellos, con papel y amenidades repuestas.</li>
  <li>Cocina sin grasa, basura vaciada, vajilla limpia.</li>
  <li>Aroma neutro y fresco (sin perfumes fuertes).</li>
  <li>Foto rápida del espacio listo: tu respaldo ante cualquier reclamo.</li>
</ul>
`,
    slides: [
      { title: 'La limpieza vende', points: ['Factor #1 en las reseñas', 'Genera confianza al instante', 'Justifica tu precio'] },
      { title: 'La secuencia', points: ['Ventila y recoge', 'Polvo de arriba a abajo', 'Cocina, luego baño al final', 'Pisos al cierre'] },
      { title: 'Productos seguros', points: ['Desengrasante / desinfectante', 'Nunca mezcles cloro con amoniaco', 'Ventila al usar químicos', 'Vinagre y bicarbonato a diario'] },
      { title: 'Entre huéspedes', points: ['Desinfecta puntos de contacto', 'Manijas, interruptores, controles', 'Ropa de cama y toallas siempre lavadas'] },
      { title: 'Checklist final', points: ['Cama impecable', 'Baño seco y repuesto', 'Cocina sin grasa', 'Aroma neutro + foto de respaldo'] },
    ],
    podcast: {
      intro: 'Bienvenido a Limpieza Estándar Going App. Aquí verás cómo la limpieza se convierte en tu mejor reseña, con una secuencia clara, productos seguros y una desinfección que da confianza.',
      segments: [
        { title: 'Por qué vende', text: 'La limpieza es el factor número uno en las reseñas de alojamientos. Un espacio impecable genera confianza al instante y justifica tu precio, mientras que un solo detalle sucio puede arruinar una reseña perfecta.' },
        { title: 'La secuencia correcta', text: 'Limpia siempre de arriba hacia abajo y de lo más limpio a lo más sucio. Primero ventila y recoge basura y ropa de cama. Luego quita el polvo de arriba hacia abajo, sigue con la cocina y deja el baño para el final, con un paño exclusivo. Termina con los pisos, saliendo de la habitación. La regla de oro: nunca uses el mismo paño para el baño y la cocina.' },
        { title: 'Productos seguros', text: 'Usa desengrasante para la cocina y desinfectante para el baño. Y muy importante: nunca mezcles cloro con amoniaco ni con vinagre, porque liberan gases tóxicos. Ventila mientras usas químicos y guárdalos fuera del alcance. Para el día a día, el vinagre y el bicarbonato son grandes aliados.' },
        { title: 'Entre huéspedes y checklist', text: 'Entre un huésped y otro, desinfecta los puntos de contacto que muchos olvidan: manijas, interruptores, controles y mandos. La ropa de cama y las toallas se lavan siempre, aunque parezcan sin usar. Y antes de cerrar, revisa tu checklist: cama impecable, baño seco y repuesto, cocina sin grasa, aroma neutro y una foto rápida como respaldo.' },
      ],
    },
    quiz: [
      { question: '¿En qué orden se limpia?', options: ['De abajo hacia arriba', 'De arriba hacia abajo y de limpio a sucio', 'El baño primero', 'Al azar'], correct: 1, explanation: 'Se limpia de arriba hacia abajo y de lo más limpio a lo más sucio para no reensuciar.' },
      { question: '¿Qué NUNCA debes mezclar?', options: ['Agua y jabón', 'Cloro con amoniaco', 'Vinagre y agua', 'Bicarbonato y agua'], correct: 1, explanation: 'Mezclar cloro con amoniaco (o con vinagre) libera gases tóxicos peligrosos.' },
      { question: 'La ropa de cama entre huéspedes se debe…', options: ['Reutilizar si se ve limpia', 'Lavar siempre', 'Solo airear', 'Cambiar una vez al mes'], correct: 1, explanation: 'Se lava siempre entre huéspedes, aunque parezca sin usar: es higiene y confianza.' },
      { question: '¿Cuál es un buen respaldo ante un reclamo de limpieza?', options: ['Discutir', 'Una foto del espacio ya listo', 'Bajar el precio', 'Ignorarlo'], correct: 1, explanation: 'Una foto del espacio limpio y listo documenta el estado de entrega.' },
    ],
  },
  a3: {
    id: 'a3',
    school: 'Escuela de Anfitriones',
    schoolColor: COLORS.system.blue,
    title: 'Diseño con Bajo Presupuesto',
    subtitle: 'Haz más con menos',
    description:
      'Ideas de decoración local, plantas, iluminación y pequeños detalles que hacen que los huéspedes recomienden tu lugar — sin gastar de más.',
    readingHtml: `
<h2>1. Menos es más</h2>
<p>Un espacio recargado se ve pequeño y desordenado. El diseño que enamora suele ser <strong>limpio, claro y con intención</strong>. Antes de comprar, <strong>quita</strong>: despeja superficies y deja respirar el ambiente.</p>

<h2>2. Iluminación: el cambio más barato</h2>
<ul>
  <li><strong>Luz cálida</strong> (2700–3000 K) crea ambiente acogedor; la luz blanca fría se siente de oficina.</li>
  <li><strong>Varias fuentes</strong> de luz (lámpara de mesa, de pie) superan a un solo foco central.</li>
  <li>Una <strong>tira LED o una lámpara</strong> económica transforma un rincón.</li>
</ul>

<h2>3. Lo local cuenta una historia</h2>
<ul>
  <li>Artesanía, textiles y cerámica <strong>ecuatorianos</strong> dan identidad y apoyan a productores.</li>
  <li>Una foto o cuadro de un destino cercano conecta al huésped con el lugar.</li>
  <li>Evita la decoración genérica: lo auténtico es más memorable y “fotografiable”.</li>
</ul>

<h2>4. Plantas y textiles</h2>
<ul>
  <li><strong>Plantas</strong> (reales de bajo mantenimiento o artificiales de calidad) dan vida y frescura.</li>
  <li><strong>Textiles:</strong> cojines, una manta y cortinas combinadas cambian todo por poco dinero.</li>
  <li>Mantén una <strong>paleta de 2–3 colores</strong> para que se vea ordenado.</li>
</ul>

<h2>5. Detalles que generan reseñas 5★</h2>
<ul>
  <li>Una bienvenida pequeña: agua, café, fruta o una nota escrita.</li>
  <li>Wi-Fi visible y fácil, cargadores y un espejo de cuerpo entero.</li>
  <li>Ganchos, perchas y espacio para maletas: comodidad real.</li>
</ul>
<blockquote>El objetivo no es lujo, es que el huésped se sienta <strong>cuidado</strong>. Esos detalles son los que se mencionan en las reseñas.</blockquote>
`,
    slides: [
      { title: 'Menos es más', points: ['Espacios limpios y con intención', 'Antes de comprar, quita', 'Despeja superficies'] },
      { title: 'Iluminación barata', points: ['Luz cálida (2700–3000 K)', 'Varias fuentes, no un solo foco', 'Una lámpara transforma un rincón'] },
      { title: 'Lo local', points: ['Artesanía y textiles ecuatorianos', 'Apoya a productores', 'Auténtico = memorable y fotografiable'] },
      { title: 'Plantas y textiles', points: ['Plantas dan vida', 'Cojines, manta, cortinas', 'Paleta de 2–3 colores'] },
      { title: 'Detalles 5★', points: ['Bienvenida: agua, café, nota', 'Wi-Fi fácil y cargadores', 'Ganchos y espacio para maletas'] },
    ],
    podcast: {
      intro: 'Bienvenido a Diseño con Bajo Presupuesto. Verás cómo pequeños cambios de luz, color y detalles locales hacen que los huéspedes recomienden tu lugar sin gastar de más.',
      segments: [
        { title: 'Menos es más', text: 'Un espacio recargado se ve pequeño y desordenado. El diseño que enamora suele ser limpio, claro y con intención. Por eso, antes de comprar cosas nuevas, quita: despeja las superficies y deja respirar el ambiente.' },
        { title: 'Iluminación', text: 'La iluminación es el cambio más barato y más efectivo. Usa luz cálida, de unos dos mil setecientos a tres mil grados, que crea un ambiente acogedor, en lugar de la luz blanca fría que se siente de oficina. Combina varias fuentes de luz en vez de un solo foco central; una lámpara económica puede transformar un rincón.' },
        { title: 'Identidad local', text: 'Lo local cuenta una historia. La artesanía, los textiles y la cerámica ecuatorianos dan identidad a tu espacio y apoyan a productores. Una foto de un destino cercano conecta al huésped con el lugar. Evita la decoración genérica: lo auténtico es más memorable y más fotografiable.' },
        { title: 'Plantas y detalles', text: 'Las plantas y los textiles dan vida por poco dinero: cojines, una manta y cortinas combinadas cambian todo, manteniendo una paleta de dos o tres colores. Y no olvides los detalles que generan reseñas de cinco estrellas: una pequeña bienvenida, wifi fácil, cargadores y espacio para las maletas. El objetivo no es lujo, es que el huésped se sienta cuidado.' },
      ],
    },
    quiz: [
      { question: 'El cambio más barato y efectivo en un espacio suele ser…', options: ['Cambiar los muebles', 'La iluminación', 'Pintar todo de nuevo', 'Comprar electrodomésticos'], correct: 1, explanation: 'Mejorar la luz (cálida y de varias fuentes) transforma el ambiente con poca inversión.' },
      { question: '¿Qué tipo de luz crea un ambiente más acogedor?', options: ['Luz blanca fría', 'Luz cálida (2700–3000 K)', 'Luz de neón', 'Sin luz'], correct: 1, explanation: 'La luz cálida da calidez; la blanca fría se siente de oficina.' },
      { question: 'Para que el espacio se vea ordenado conviene…', options: ['Usar 10 colores', 'Mantener una paleta de 2–3 colores', 'Llenar las superficies', 'No usar textiles'], correct: 1, explanation: 'Una paleta limitada de 2 a 3 colores transmite orden y armonía.' },
      { question: 'Los detalles que más se mencionan en reseñas buscan que el huésped…', options: ['Gaste más', 'Se sienta cuidado', 'Se vaya rápido', 'No use el wifi'], correct: 1, explanation: 'No se trata de lujo sino de cuidado: bienvenida, comodidad y buenos básicos.' },
    ],
  },
  a4: {
    id: 'a4',
    school: 'Escuela de Anfitriones',
    schoolColor: COLORS.system.blue,
    title: 'Manejo de Reseñas',
    subtitle: 'Responde bien, crece más',
    description:
      'Cómo responder comentarios negativos sin perder la calma, agradecer los positivos y convertir cada crítica en una mejora real que sube tu calificación.',
    readingHtml: `
<h2>1. Por qué las reseñas mandan</h2>
<p>Las reseñas son la <strong>moneda de confianza</strong> de la plataforma. Determinan tu posición en las búsquedas y la decisión final del huésped. Pero igual de importante que la calificación es <strong>cómo respondes</strong>: tus respuestas las leen los futuros huéspedes.</p>

<h2>2. Responder reseñas positivas</h2>
<ul>
  <li><strong>Agradece</strong> de forma personal, mencionando algo específico de su estadía.</li>
  <li><strong>Invita a volver</strong> con calidez.</li>
  <li>Sé breve y genuino; evita respuestas copiadas e iguales para todos.</li>
</ul>

<h2>3. Responder reseñas negativas — el método LAPA</h2>
<ol>
  <li><strong>Lee</strong> con calma y no respondas en caliente.</li>
  <li><strong>Agradece</strong> el comentario y <strong>reconoce</strong> lo que se pueda.</li>
  <li><strong>Propón</strong> o explica la mejora, con respeto y sin excusas largas.</li>
  <li><strong>Avanza:</strong> cierra en positivo, mostrando que aprendiste.</li>
</ol>
<blockquote>Nunca discutas, ataques ni culpes al huésped en público. Una respuesta serena ante una crítica injusta te hace ganar la confianza de quien la lee.</blockquote>

<h2>4. De la crítica a la mejora</h2>
<p>Cada queja repetida es información gratis:</p>
<ul>
  <li>“La cama era incómoda” → evalúa el colchón.</li>
  <li>“El wifi fallaba” → mejora el plan o la ubicación del router.</li>
  <li>“No sabía cómo entrar” → mejora tus instrucciones de llegada.</li>
</ul>
<p>Cuando resuelvas algo, <strong>menciónalo</strong> en tu anuncio o en la respuesta: demuestra que escuchas.</p>

<h2>5. Buenas reseñas empiezan antes</h2>
<p>La mejor gestión de reseñas es <strong>prevenir</strong>: expectativas claras en el anuncio, comunicación rápida, instrucciones sencillas y un pequeño gesto de bienvenida. Un huésped bien informado y bien recibido casi siempre califica mejor.</p>
`,
    slides: [
      { title: 'Las reseñas mandan', points: ['Son la moneda de confianza', 'Definen tu posición y la decisión', 'Tus respuestas también se leen'] },
      { title: 'Reseñas positivas', points: ['Agradece de forma personal', 'Menciona algo específico', 'Invita a volver', 'Evita respuestas copiadas'] },
      { title: 'Negativas: método LAPA', points: ['Lee con calma', 'Agradece y reconoce', 'Propón la mejora', 'Avanza en positivo'] },
      { title: 'De la crítica a la mejora', points: ['Cada queja repetida es información', 'Resuelve la causa real', 'Menciona lo que mejoraste'] },
      { title: 'Prevenir es la clave', points: ['Expectativas claras en el anuncio', 'Comunicación rápida', 'Instrucciones sencillas', 'Gesto de bienvenida'] },
    ],
    podcast: {
      intro: 'Bienvenido a Manejo de Reseñas. Aprenderás a responder con inteligencia, a convertir críticas en mejoras y a hacer que cada respuesta sume confianza.',
      segments: [
        { title: 'Por qué mandan', text: 'Las reseñas son la moneda de confianza de la plataforma: determinan tu posición en las búsquedas y la decisión final del huésped. Pero tan importante como la calificación es cómo respondes, porque tus respuestas las leen los futuros huéspedes.' },
        { title: 'Responder lo positivo', text: 'Ante una reseña positiva, agradece de forma personal mencionando algo específico de la estadía e invita a volver con calidez. Sé breve y genuino, y evita respuestas copiadas e iguales para todos.' },
        { title: 'El método LAPA', text: 'Para las reseñas negativas usa el método LAPA. Lee con calma y no respondas en caliente. Agradece el comentario y reconoce lo que se pueda. Propón o explica la mejora con respeto, sin excusas largas. Y avanza, cerrando en positivo. Nunca discutas ni culpes al huésped en público: una respuesta serena ante una crítica injusta gana la confianza de quien la lee.' },
        { title: 'De la crítica a la mejora', text: 'Cada queja repetida es información gratis. Si dicen que la cama era incómoda, evalúa el colchón; si el wifi fallaba, mejora el plan o la ubicación del router. Cuando resuelvas algo, menciónalo. Y recuerda: la mejor gestión de reseñas es prevenir, con expectativas claras, comunicación rápida y un buen recibimiento.' },
      ],
    },
    quiz: [
      { question: 'Ante una reseña negativa, lo primero es…', options: ['Responder de inmediato y molesto', 'Leer con calma sin responder en caliente', 'Borrarla', 'Culpar al huésped'], correct: 1, explanation: 'El método LAPA empieza por leer con calma; nunca se responde en caliente.' },
      { question: 'En público, ante una crítica injusta debes…', options: ['Discutir y defenderte fuerte', 'Mantener la calma y responder con respeto', 'Atacar al huésped', 'No responder nunca'], correct: 1, explanation: 'Una respuesta serena ante una crítica injusta gana la confianza de quien la lee.' },
      { question: 'Una queja repetida (p. ej. “el wifi fallaba”) es…', options: ['Un ataque personal', 'Información gratis para mejorar', 'Algo que ignorar', 'Motivo para discutir'], correct: 1, explanation: 'Las quejas repetidas señalan la causa real a resolver; son una oportunidad de mejora.' },
      { question: 'La mejor forma de tener buenas reseñas es…', options: ['Pedirlas insistentemente', 'Prevenir: expectativas claras y buen recibimiento', 'Bajar el precio', 'Responder solo las positivas'], correct: 1, explanation: 'Prevenir con expectativas claras, comunicación e instrucciones sencillas evita la mayoría de las malas reseñas.' },
    ],
  },

  // ─── ESCUELA DE VIAJEROS ──────────────────────────────────────────────────
  v1: {
    id: 'v1',
    school: 'Escuela de Viajeros',
    schoolColor: COLORS.brand.yellowDark,
    title: 'Viaja Inteligente con Going App',
    subtitle: 'Guía completa del pasajero',
    description:
      'Cómo reservar, rastrear tu viaje, comunicarte con el conductor y usar todas las funciones de seguridad para que cada viaje sea fácil y tranquilo.',
    readingHtml: `
<h2>1. Pide tu viaje en segundos</h2>
<ul>
  <li><strong>Elige el servicio:</strong> compartido (pagas tu asiento), privado (todo el vehículo) o en la ciudad (carrera inmediata).</li>
  <li><strong>Origen y destino:</strong> escríbelos, usa tu ubicación (GPS) o fija el punto en el mapa.</li>
  <li><strong>Ahora o después:</strong> un viaje puede ser inmediato o <strong>reservado</strong> para una fecha/hora futura.</li>
</ul>

<h2>2. Antes de subir: verifica</h2>
<ul>
  <li><strong>Confirma el vehículo:</strong> placa, modelo y foto del conductor deben coincidir con la app.</li>
  <li><strong>Pregunta tu nombre:</strong> un buen conductor confirmará a quién recoge.</li>
  <li>Si algo no coincide, <strong>no subas</strong> y repórtalo.</li>
</ul>

<h2>3. Durante el viaje</h2>
<ul>
  <li><strong>Sigue la ruta</strong> en el mapa en tiempo real.</li>
  <li><strong>Comparte tu viaje</strong> con alguien de confianza desde el panel.</li>
  <li><strong>Chat con traducción</strong> si no hablas el mismo idioma.</li>
  <li><strong>Botón SOS</strong> para emergencias durante el trayecto.</li>
</ul>

<h2>4. Al llegar</h2>
<ul>
  <li>Confirma el <strong>fin del viaje</strong> con el código que te muestra la app.</li>
  <li><strong>Califica</strong> a tu conductor: tu opinión mejora la comunidad.</li>
  <li>Revisa tu <strong>recibo</strong> en el historial.</li>
</ul>
<blockquote>Consejo: guarda tus direcciones frecuentes (Casa, Trabajo) para pedir aún más rápido.</blockquote>
`,
    slides: [
      { title: 'Pide en segundos', points: ['Elige servicio', 'Origen y destino (texto/GPS/mapa)', 'Inmediato o reservado'] },
      { title: 'Verifica antes de subir', points: ['Placa, modelo y foto coinciden', 'Confirma tu nombre', 'Si no coincide, no subas'] },
      { title: 'Durante el viaje', points: ['Sigue la ruta en vivo', 'Comparte tu viaje', 'Chat con traducción', 'Botón SOS'] },
      { title: 'Al llegar', points: ['Confirma el código de fin', 'Califica al conductor', 'Revisa tu recibo'] },
      { title: 'Tips', points: ['Guarda Casa y Trabajo', 'Activa notificaciones', 'Mantén la app actualizada'] },
    ],
    podcast: {
      intro: 'Bienvenido a Viaja Inteligente con Going App. En este episodio te llevamos paso a paso por un viaje perfecto: pedir, verificar, viajar seguro y calificar.',
      segments: [
        { title: 'Pedir el viaje', text: 'Pedir un viaje toma segundos. Elige el servicio: compartido, privado o en la ciudad. Indica origen y destino escribiéndolos, usando tu ubicación por GPS o fijando el punto en el mapa. Y decide si lo quieres inmediato o reservado para más tarde.' },
        { title: 'Verifica antes de subir', text: 'Tu seguridad empieza antes de subir. Confirma que la placa, el modelo y la foto del conductor coincidan con lo que muestra la app, y deja que el conductor confirme tu nombre. Si algo no coincide, no subas y repórtalo.' },
        { title: 'Durante el viaje', text: 'Durante el trayecto puedes seguir la ruta en el mapa en tiempo real, compartir tu viaje con alguien de confianza, usar el chat con traducción automática y contar con el botón SOS para emergencias.' },
        { title: 'Al llegar', text: 'Al llegar, confirma el fin del viaje con el código que te muestra la app, califica a tu conductor para mejorar la comunidad y revisa tu recibo en el historial. Un consejo: guarda tus direcciones frecuentes para pedir aún más rápido.' },
      ],
    },
    quiz: [
      { question: 'Antes de subir al vehículo debes verificar…', options: ['Solo el color', 'Placa, modelo y foto del conductor', 'Nada', 'El precio'], correct: 1, explanation: 'Confirma que placa, modelo y foto coincidan con la app; si no, no subas.' },
      { question: 'Para que alguien siga tu viaje en tiempo real puedes…', options: ['Llamarlo', 'Usar “compartir viaje” en el panel', 'Mandar una foto', 'No se puede'], correct: 1, explanation: 'La función de compartir viaje envía un enlace de seguimiento en vivo.' },
      { question: 'Un viaje reservado es aquel que…', options: ['Se paga doble', 'Se programa para una fecha/hora futura', 'No tiene conductor', 'Es gratis'], correct: 1, explanation: 'Reservado = programado a futuro; el conductor se asigna cerca de la hora.' },
      { question: 'Al terminar el viaje conviene…', options: ['Cerrar la app sin más', 'Confirmar el código de fin y calificar', 'Pedir otro de inmediato', 'Borrar el historial'], correct: 1, explanation: 'Confirmar el fin y calificar cierra el viaje correctamente y ayuda a la comunidad.' },
    ],
  },
  v2: {
    id: 'v2',
    school: 'Escuela de Viajeros',
    schoolColor: COLORS.brand.yellowDark,
    title: 'Guía de Envíos',
    subtitle: 'Empaques, tarifas y seguimiento',
    description:
      'Cómo preparar tu paquete, elegir el tamaño correcto, entender la tarifa, hacer seguimiento en vivo y confirmar la entrega con código.',
    readingHtml: `
<h2>1. Prepara tu paquete</h2>
<ul>
  <li><strong>Empaca bien:</strong> caja firme, relleno para lo frágil y cinta resistente.</li>
  <li><strong>Sella y etiqueta:</strong> datos del destinatario claros y legibles.</li>
  <li><strong>Foto del paquete:</strong> adjúntala al crear el envío como respaldo del estado.</li>
</ul>

<h2>2. Elige el tamaño correcto</h2>
<ul>
  <li><strong>Pequeño</strong> (0–5 kg), <strong>Mediano</strong> (6–15 kg), <strong>Grande</strong> (16–30 kg).</li>
  <li>El precio sale de tu <strong>origen, destino y tamaño</strong>: lo ves antes de confirmar.</li>
  <li>Para rutas entre ciudades, la tarifa real la calcula el sistema por corredor.</li>
</ul>

<h2>3. ¿Quién paga?</h2>
<ul>
  <li><strong>Tú (remitente)</strong> con tarjeta o efectivo, o</li>
  <li><strong>El destinatario</strong>, con link de pago o efectivo contra entrega.</li>
</ul>

<h2>4. Seguimiento y entrega</h2>
<ul>
  <li><strong>Rastreo en vivo</strong> del envío desde que lo recogen.</li>
  <li><strong>Entrega con código OTP:</strong> el destinatario da un código que confirma la entrega.</li>
  <li>Prohibido enviar artículos ilegales, peligrosos o de alto valor sin declarar.</li>
</ul>
<blockquote>Un buen empaque y una dirección clara son el 90% de un envío sin problemas.</blockquote>
`,
    slides: [
      { title: 'Prepara el paquete', points: ['Caja firme + relleno', 'Sella y etiqueta claro', 'Adjunta foto del paquete'] },
      { title: 'Elige el tamaño', points: ['Pequeño 0–5 kg', 'Mediano 6–15 kg', 'Grande 16–30 kg', 'Ves el precio antes de confirmar'] },
      { title: '¿Quién paga?', points: ['Remitente: tarjeta o efectivo', 'Destinatario: link o contra entrega'] },
      { title: 'Seguimiento', points: ['Rastreo en vivo', 'Entrega con código OTP', 'Nada ilegal ni peligroso'] },
      { title: 'Tip', points: ['Buen empaque + dirección clara', '= envío sin problemas'] },
    ],
    podcast: {
      intro: 'Bienvenido a la Guía de Envíos de Going App. Aprenderás a empacar, elegir tamaño y tarifa, y seguir tu paquete hasta la entrega.',
      segments: [
        { title: 'Prepara el paquete', text: 'Empaca bien: una caja firme, relleno para lo frágil y cinta resistente. Sella y etiqueta con los datos del destinatario claros, y adjunta una foto del paquete al crear el envío como respaldo de su estado.' },
        { title: 'Tamaño y tarifa', text: 'Elige el tamaño correcto: pequeño hasta cinco kilos, mediano de seis a quince y grande de dieciséis a treinta. El precio sale de tu origen, destino y tamaño, y lo ves antes de confirmar. Para rutas entre ciudades, el sistema calcula la tarifa real por corredor.' },
        { title: 'Quién paga', text: 'Puedes pagar tú como remitente, con tarjeta o efectivo, o puede pagar el destinatario, con un link de pago o en efectivo contra entrega. Tú eliges el esquema al crear el envío.' },
        { title: 'Seguimiento y entrega', text: 'Sigues tu envío en vivo desde que lo recogen, y la entrega se confirma con un código de un solo uso que da el destinatario. Recuerda: está prohibido enviar artículos ilegales, peligrosos o de alto valor sin declarar. Un buen empaque y una dirección clara son el noventa por ciento de un envío sin problemas.' },
      ],
    },
    quiz: [
      { question: '¿Cómo se confirma la entrega de un envío?', options: ['Con una firma', 'Con un código OTP del destinatario', 'Con una llamada', 'No se confirma'], correct: 1, explanation: 'El destinatario entrega un código OTP que confirma la entrega.' },
      { question: 'El precio del envío depende de…', options: ['El clima', 'Origen, destino y tamaño del paquete', 'La hora', 'El color de la caja'], correct: 1, explanation: 'La tarifa se calcula por origen, destino y tamaño; la ves antes de confirmar.' },
      { question: 'Un paquete de 10 kg corresponde a tamaño…', options: ['Pequeño', 'Mediano', 'Grande', 'No se puede enviar'], correct: 1, explanation: 'Mediano cubre de 6 a 15 kg.' },
      { question: '¿Qué NO debes enviar?', options: ['Ropa', 'Documentos', 'Artículos ilegales o peligrosos', 'Un libro'], correct: 2, explanation: 'Está prohibido enviar artículos ilegales, peligrosos o de alto valor sin declarar.' },
    ],
  },
  v3: {
    id: 'v3',
    school: 'Escuela de Viajeros',
    schoolColor: COLORS.brand.yellowDark,
    title: 'Pagos y Facturación',
    subtitle: 'Datafast, efectivo y recibos',
    description:
      'Métodos de pago aceptados, el Wallet de Going App, cómo obtener tus recibos y qué hacer ante un cobro que no reconoces.',
    readingHtml: `
<h2>1. Formas de pago</h2>
<ul>
  <li><strong>Tarjeta (Datafast)</strong> y <strong>DeUna</strong> para pago digital seguro.</li>
  <li><strong>Going App Wallet:</strong> saldo prepago que puedes <em>recargar</em> y <em>transferir</em> a otro usuario.</li>
  <li><strong>Efectivo</strong> al conductor cuando aplica.</li>
</ul>

<h2>2. El Wallet de Going App</h2>
<ul>
  <li><strong>Recarga</strong> con Datafast o DeUna y paga tus viajes con saldo.</li>
  <li><strong>Transfiere</strong> saldo a otra persona por su correo o teléfono.</li>
  <li>Revisa tu <strong>historial de movimientos</strong> (recargas, viajes, transferencias).</li>
</ul>

<h2>3. Antes de confirmar, ves el precio</h2>
<ul>
  <li><strong>Tarifa fija</strong> en rutas conocidas o <strong>estimado</strong> por distancia real.</li>
  <li>En reservas, el precio puede quedar <strong>garantizado</strong> al momento de reservar.</li>
</ul>

<h2>4. Recibos y cobros</h2>
<ul>
  <li>Cada viaje/envío queda en tu <strong>historial</strong> con su recibo.</li>
  <li>Si necesitas <strong>factura</strong>, registra tus datos fiscales en tu perfil.</li>
  <li>¿Un cobro que no reconoces? Repórtalo desde soporte con el detalle del viaje.</li>
</ul>
<blockquote>Nunca compartas tu contraseña ni los códigos que te llegan por SMS: Going App jamás te los pedirá.</blockquote>
`,
    slides: [
      { title: 'Formas de pago', points: ['Tarjeta (Datafast) y DeUna', 'Wallet: recarga y transfiere', 'Efectivo cuando aplica'] },
      { title: 'Going App Wallet', points: ['Recarga y paga con saldo', 'Transfiere por correo/teléfono', 'Revisa tus movimientos'] },
      { title: 'Precio claro', points: ['Tarifa fija o estimado', 'Lo ves antes de confirmar', 'Reservas: precio garantizado'] },
      { title: 'Recibos y cobros', points: ['Recibo en el historial', 'Factura: datos fiscales en el perfil', 'Cobro raro → soporte'] },
      { title: 'Seguridad', points: ['Nunca compartas tu contraseña', 'Ni los códigos SMS', 'Going App jamás los pide'] },
    ],
    podcast: {
      intro: 'Bienvenido a Pagos y Facturación de Going App. Verás los métodos de pago, el Wallet, cómo obtener recibos y cómo cuidar tu dinero.',
      segments: [
        { title: 'Formas de pago', text: 'Puedes pagar con tarjeta a través de Datafast, con DeUna, con el saldo de tu Going App Wallet, o en efectivo al conductor cuando aplica. Todas son opciones seguras dentro de la app.' },
        { title: 'El Wallet', text: 'El Wallet de Going App es tu saldo prepago. Lo recargas con Datafast o DeUna, pagas tus viajes con ese saldo e incluso puedes transferirlo a otra persona usando su correo o teléfono. Y siempre puedes revisar tu historial de movimientos.' },
        { title: 'Precio claro', text: 'Antes de confirmar siempre ves el precio: una tarifa fija en rutas conocidas o un estimado calculado por distancia real. En las reservas, el precio puede quedar garantizado desde el momento en que reservas.' },
        { title: 'Recibos y seguridad', text: 'Cada viaje y envío queda en tu historial con su recibo; si necesitas factura, registra tus datos fiscales en el perfil. Si ves un cobro que no reconoces, repórtalo desde soporte con el detalle del viaje. Y lo más importante: nunca compartas tu contraseña ni los códigos que te llegan por SMS, porque Going App jamás te los pedirá.' },
      ],
    },
    quiz: [
      { question: '¿Qué te permite el Going App Wallet?', options: ['Solo ver saldo', 'Recargar y transferir saldo', 'Pedir préstamos', 'Nada'], correct: 1, explanation: 'El Wallet permite recargar (Datafast/DeUna) y transferir saldo a otros usuarios.' },
      { question: 'Para obtener factura de tus viajes debes…', options: ['Llamar al conductor', 'Registrar tus datos fiscales en el perfil', 'Pagar extra', 'No se puede'], correct: 1, explanation: 'Con tus datos fiscales en el perfil, el sistema puede emitir la factura.' },
      { question: 'Going App te pedirá tu contraseña o códigos SMS…', options: ['Sí, por teléfono', 'Sí, por correo', 'Nunca', 'Solo a veces'], correct: 2, explanation: 'Going App jamás pide tu contraseña ni los códigos SMS: no los compartas con nadie.' },
      { question: 'Antes de confirmar un viaje…', options: ['No sabes el precio', 'Ves el precio (tarifa fija o estimado)', 'Pagas siempre después', 'El precio cambia al azar'], correct: 1, explanation: 'Siempre ves el precio antes de confirmar: tarifa fija o estimado por distancia.' },
    ],
  },

  // ─── ESCUELA DE GUÍAS LOCALES ─────────────────────────────────────────────
  g1: {
    id: 'g1',
    school: 'Escuela de Guías Locales',
    schoolColor: COLORS.state.success,
    title: 'El Arte del Storytelling',
    subtitle: 'Cuenta tu historia, vende tu experiencia',
    description:
      'Cómo estructurar la historia de tu comunidad, tu taller o tu ruta para crear momentos memorables que los viajeros recomienden y repitan.',
    readingHtml: `
<h2>1. Por qué importan las historias</h2>
<p>La gente no recuerda datos: recuerda <strong>emociones e historias</strong>. Una experiencia con un buen relato se siente única y se recomienda sola. Tu conocimiento local es tu mayor ventaja.</p>

<h2>2. La estructura de un buen relato</h2>
<ol>
  <li><strong>Gancho:</strong> abre con una pregunta o un dato sorprendente que despierte curiosidad.</li>
  <li><strong>Desarrollo:</strong> lleva al grupo por un hilo claro (tiempo, lugar o personaje).</li>
  <li><strong>Clímax:</strong> el momento más memorable — guárdalo para el punto justo.</li>
  <li><strong>Cierre:</strong> conecta la historia con algo que el viajero se lleva (una lección, una foto, una emoción).</li>
</ol>

<h2>3. Hazlo vivo</h2>
<ul>
  <li><strong>Involucra los sentidos:</strong> qué se ve, se huele, se escucha, se prueba.</li>
  <li><strong>Detalles concretos</strong> y nombres reales superan a las generalidades.</li>
  <li><strong>Haz preguntas</strong> al grupo: una experiencia es diálogo, no monólogo.</li>
  <li><strong>Respeta la verdad:</strong> no inventes; lo auténtico conecta más.</li>
</ul>

<h2>4. Momentos “fotografiables”</h2>
<p>Diseña al menos un <strong>momento memorable</strong> por experiencia: un mirador, una degustación, una demostración. Es lo que el viajero comparte y lo que llena tu calendario.</p>
<blockquote>Una buena historia convierte una visita en un recuerdo — y un recuerdo en una recomendación.</blockquote>
`,
    slides: [
      { title: '¿Por qué historias?', points: ['Se recuerdan emociones, no datos', 'Tu conocimiento local es tu ventaja', 'Una buena historia se recomienda sola'] },
      { title: 'Estructura', points: ['Gancho que despierta curiosidad', 'Desarrollo con hilo claro', 'Clímax memorable', 'Cierre con algo que se llevan'] },
      { title: 'Hazlo vivo', points: ['Involucra los sentidos', 'Detalles y nombres reales', 'Haz preguntas al grupo', 'Respeta la verdad'] },
      { title: 'Momento memorable', points: ['Diseña 1 por experiencia', 'Mirador, degustación, demo', 'Es lo que comparten'] },
      { title: 'Resultado', points: ['Visita → recuerdo', 'Recuerdo → recomendación', 'Recomendación → más reservas'] },
    ],
    podcast: {
      intro: 'Bienvenido a El Arte del Storytelling. Hoy verás cómo convertir tu conocimiento local en experiencias que los viajeros recuerdan y recomiendan.',
      segments: [
        { title: 'Por qué importan', text: 'La gente no recuerda datos, recuerda emociones e historias. Una experiencia con un buen relato se siente única y se recomienda sola. Tu conocimiento local, la historia de tu comunidad o tu taller, es tu mayor ventaja.' },
        { title: 'La estructura', text: 'Un buen relato tiene cuatro partes. Un gancho que abre con una pregunta o un dato sorprendente. Un desarrollo con un hilo claro, ya sea el tiempo, el lugar o un personaje. Un clímax, el momento más memorable, que guardas para el punto justo. Y un cierre que conecta la historia con algo que el viajero se lleva.' },
        { title: 'Hazlo vivo', text: 'Para que la historia cobre vida, involucra los sentidos: qué se ve, se huele, se escucha y se prueba. Usa detalles concretos y nombres reales en lugar de generalidades, y haz preguntas al grupo, porque una experiencia es un diálogo y no un monólogo. Y sobre todo, respeta la verdad: lo auténtico conecta más.' },
        { title: 'Momentos memorables', text: 'Diseña al menos un momento memorable por experiencia: un mirador, una degustación, una demostración. Es lo que el viajero comparte en sus redes y lo que termina llenando tu calendario. Una buena historia convierte una visita en un recuerdo, y un recuerdo en una recomendación.' },
      ],
    },
    quiz: [
      { question: '¿Con qué conviene ABRIR una experiencia?', options: ['Una lista de reglas', 'Un gancho que despierte curiosidad', 'El precio', 'Una disculpa'], correct: 1, explanation: 'El gancho (pregunta o dato sorprendente) capta la atención desde el inicio.' },
      { question: 'Para que una historia cobre vida conviene…', options: ['Solo dar fechas', 'Involucrar los sentidos y dar detalles concretos', 'Hablar sin pausa', 'Leer un guion'], correct: 1, explanation: 'Los sentidos y los detalles reales hacen vívido el relato.' },
      { question: 'Una experiencia memorable es…', options: ['Un monólogo largo', 'Un diálogo con el grupo', 'Solo caminar', 'Improvisar todo'], correct: 1, explanation: 'Hacer preguntas e involucrar al grupo convierte la visita en diálogo.' },
      { question: 'El “momento fotografiable” sirve para…', options: ['Rellenar tiempo', 'Que el viajero lo comparta y te recomiende', 'Cobrar más', 'Terminar antes'], correct: 1, explanation: 'Ese momento memorable es lo que se comparte y atrae nuevas reservas.' },
    ],
  },
  g2: {
    id: 'g2',
    school: 'Escuela de Guías Locales',
    schoolColor: COLORS.state.success,
    title: 'Manejo de Grupos',
    subtitle: 'De 2 a 20 personas',
    description:
      'Técnicas para mantener la atención, gestionar los tiempos, manejar personas difíciles y garantizar la seguridad de todo el grupo.',
    readingHtml: `
<h2>1. Empieza con el pie derecho</h2>
<ul>
  <li><strong>Preséntate y pon reglas claras:</strong> puntos de encuentro, horarios y señales.</li>
  <li><strong>Cuenta cabezas</strong> al inicio y en cada parada (la “regla del conteo”).</li>
  <li><strong>Acuerda un punto de reunión</strong> por si alguien se separa.</li>
</ul>

<h2>2. Mantén la atención</h2>
<ul>
  <li><strong>Ubícate donde todos te vean y oigan;</strong> espera a que el grupo se acomode antes de hablar.</li>
  <li><strong>Ritmo variado:</strong> alterna caminar, contar y dejar explorar.</li>
  <li><strong>Incluye a todos:</strong> mira a las orillas del grupo, no solo al centro.</li>
</ul>

<h2>3. Gestiona los tiempos</h2>
<ul>
  <li><strong>Avisa los tiempos</strong> (“15 minutos aquí”) y respétalos.</li>
  <li><strong>Margen para imprevistos:</strong> baños, fotos, ritmo de los más lentos.</li>
  <li><strong>Cierra a tiempo:</strong> terminar puntual también es calidad.</li>
</ul>

<h2>4. Personas difíciles y seguridad</h2>
<ul>
  <li><strong>El que se adelanta o se queda:</strong> asígnale un rol (ayudar a cerrar el grupo).</li>
  <li><strong>El que monopoliza:</strong> agradece y redirige al resto con una pregunta.</li>
  <li><strong>Seguridad primero:</strong> conoce a tu grupo (movilidad, salud), lleva agua y un botiquín, y ten claro el plan ante una emergencia.</li>
</ul>
<blockquote>Un grupo bien manejado se siente cuidado: esa sensación es la que deja 5 estrellas.</blockquote>
`,
    slides: [
      { title: 'Empieza bien', points: ['Preséntate y pon reglas', 'Cuenta cabezas (inicio y paradas)', 'Acuerda punto de reunión'] },
      { title: 'Mantén la atención', points: ['Ubícate donde te vean/oigan', 'Ritmo variado', 'Incluye a las orillas del grupo'] },
      { title: 'Gestiona el tiempo', points: ['Avisa y respeta tiempos', 'Margen para imprevistos', 'Cierra puntual'] },
      { title: 'Personas difíciles', points: ['Al que se adelanta: dale un rol', 'Al que monopoliza: redirige', 'Agradece y sigue'] },
      { title: 'Seguridad', points: ['Conoce a tu grupo', 'Agua y botiquín', 'Plan ante emergencia'] },
    ],
    podcast: {
      intro: 'Bienvenido a Manejo de Grupos. Aprenderás a mantener la atención, gestionar el tiempo, manejar personas difíciles y cuidar la seguridad de grupos de 2 a 20 personas.',
      segments: [
        { title: 'Empieza con el pie derecho', text: 'Arranca presentándote y poniendo reglas claras: puntos de encuentro, horarios y señales. Cuenta cabezas al inicio y en cada parada, lo que llamamos la regla del conteo, y acuerda un punto de reunión por si alguien se separa.' },
        { title: 'Mantén la atención', text: 'Para mantener la atención, ubícate donde todos te vean y te oigan, y espera a que el grupo se acomode antes de hablar. Usa un ritmo variado, alternando caminar, contar y dejar explorar, e incluye a todos mirando también a las orillas del grupo, no solo al centro.' },
        { title: 'Gestiona los tiempos', text: 'Avisa los tiempos, por ejemplo quince minutos en este punto, y respétalos. Deja margen para imprevistos como baños, fotos o el ritmo de los más lentos. Y cierra a tiempo, porque terminar puntual también es parte de la calidad.' },
        { title: 'Difíciles y seguridad', text: 'Con la persona que se adelanta o se queda atrás, asígnale un rol, como ayudar a cerrar el grupo. Con quien monopoliza, agradece y redirige al resto con una pregunta. Y la seguridad primero: conoce a tu grupo, su movilidad y salud, lleva agua y botiquín, y ten claro el plan ante una emergencia. Un grupo bien manejado se siente cuidado, y esa sensación es la que deja cinco estrellas.' },
      ],
    },
    quiz: [
      { question: 'La “regla del conteo” consiste en…', options: ['Cobrar por persona', 'Contar cabezas al inicio y en cada parada', 'Contar el dinero', 'Limitar el grupo'], correct: 1, explanation: 'Contar al grupo en cada parada evita que alguien se quede atrás.' },
      { question: 'Antes de empezar a hablar al grupo conviene…', options: ['Hablar caminando rápido', 'Ubicarte donde todos te vean/oigan y esperar que se acomoden', 'Hablar de espaldas', 'Adelantarte solo'], correct: 1, explanation: 'Posición y atención del grupo aseguran que el mensaje llegue a todos.' },
      { question: 'Ante una persona que monopoliza la conversación…', options: ['La ignoras', 'Agradeces y rediriges al resto con una pregunta', 'Terminas el tour', 'Discutes'], correct: 1, explanation: 'Agradecer y redirigir mantiene el equilibrio sin generar conflicto.' },
      { question: '¿Qué es esencial para la seguridad del grupo?', options: ['Ir más rápido', 'Conocer al grupo, llevar agua/botiquín y un plan de emergencia', 'No hacer paradas', 'Improvisar la ruta'], correct: 1, explanation: 'Conocer al grupo y estar preparado (agua, botiquín, plan) es la base de la seguridad.' },
    ],
  },
  g3: {
    id: 'g3',
    school: 'Escuela de Guías Locales',
    schoolColor: COLORS.state.success,
    title: 'Seguridad en Exteriores',
    subtitle: 'Turismo de naturaleza seguro',
    description:
      'Evaluación de riesgos, protocolo ante lesiones, comunicación en zonas sin señal y buenas prácticas para actividades de naturaleza. Contenido informativo, no sustituye una certificación.',
    readingHtml: `
<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:12px 16px;margin-bottom:16px;">
<strong>Aviso:</strong> este curso es <strong>informativo</strong>. Las actividades de riesgo (alta montaña, ríos, etc.) requieren formación y certificaciones específicas y, cuando aplique, permisos del Ministerio de Turismo. Ante una emergencia, llama al <strong>911</strong>.
</div>

<h2>1. Evalúa el riesgo ANTES de salir</h2>
<ul>
  <li><strong>Clima y terreno:</strong> revisa el pronóstico y el estado del sendero/río.</li>
  <li><strong>El grupo:</strong> condición física, salud, calzado y ropa adecuados.</li>
  <li><strong>Plan B:</strong> ten siempre una ruta o decisión alternativa (cancelar es válido).</li>
</ul>

<h2>2. Lleva lo esencial</h2>
<ul>
  <li>Botiquín, agua suficiente, abrigo/impermeable y snacks.</li>
  <li>Carga completa en el teléfono + batería externa; silbato.</li>
  <li>Lista de contactos de emergencia y datos de salud del grupo.</li>
</ul>

<h2>3. Comunicación en zonas sin señal</h2>
<ul>
  <li><strong>Deja tu plan</strong> (ruta y hora de regreso) con alguien de confianza antes de salir.</li>
  <li><strong>Puntos de encuentro</strong> y señales acordadas (silbato, gestos).</li>
  <li>Descarga <strong>mapas offline</strong>; no dependas solo de la señal móvil.</li>
</ul>

<h2>4. Ante una lesión</h2>
<ol>
  <li><strong>Detén la actividad</strong> y asegura la zona.</li>
  <li><strong>Atiende</strong> según primeros auxilios básicos (no muevas a un herido grave salvo peligro).</li>
  <li><strong>Pide ayuda:</strong> 911; da ubicación lo más precisa posible.</li>
  <li><strong>Mantén al grupo</strong> junto, calmado y abrigado.</li>
</ol>
<blockquote>La mejor decisión de seguridad muchas veces es no arriesgar: un buen guía sabe cuándo dar la vuelta.</blockquote>
`,
    slides: [
      { title: 'Evalúa antes de salir', points: ['Clima y terreno', 'Condición y equipo del grupo', 'Ten un Plan B (cancelar es válido)'] },
      { title: 'Lleva lo esencial', points: ['Botiquín, agua, abrigo', 'Teléfono cargado + batería', 'Silbato y contactos de emergencia'] },
      { title: 'Sin señal', points: ['Deja tu plan y hora de regreso', 'Puntos de encuentro y señales', 'Mapas offline'] },
      { title: 'Ante una lesión', points: ['Detén y asegura la zona', 'Primeros auxilios básicos', 'Llama al 911 con ubicación', 'Grupo junto y calmado'] },
      { title: 'Criterio', points: ['No arriesgar también es decisión', 'Saber cuándo dar la vuelta', 'La seguridad va primero'] },
    ],
    podcast: {
      intro: 'Bienvenido a Seguridad en Exteriores. Un recordatorio antes de empezar: este contenido es informativo y no reemplaza una certificación; ante una emergencia, llama al 911.',
      segments: [
        { title: 'Evalúa el riesgo', text: 'La seguridad empieza antes de salir. Revisa el clima y el estado del terreno, evalúa al grupo en condición física, salud, calzado y ropa, y ten siempre un plan B. Recuerda que cancelar o cambiar la ruta es una decisión válida y a veces la más responsable.' },
        { title: 'Lleva lo esencial', text: 'Lleva siempre lo esencial: botiquín, agua suficiente, abrigo o impermeable y algo de comida. El teléfono con carga completa y una batería externa, un silbato, y la lista de contactos de emergencia junto con los datos de salud del grupo.' },
        { title: 'Zonas sin señal', text: 'En zonas sin señal, deja tu plan, la ruta y la hora de regreso, con alguien de confianza antes de salir. Acuerda puntos de encuentro y señales como el silbato o gestos, y descarga mapas offline para no depender solo de la señal móvil.' },
        { title: 'Ante una lesión', text: 'Si ocurre una lesión, detén la actividad y asegura la zona, atiende según primeros auxilios básicos sin mover a un herido grave salvo peligro, pide ayuda al 911 dando la ubicación más precisa posible, y mantén al grupo junto, calmado y abrigado. La mejor decisión de seguridad muchas veces es no arriesgar: un buen guía sabe cuándo dar la vuelta.' },
      ],
    },
    quiz: [
      { question: 'Si el clima o el terreno se ven peligrosos, lo correcto es…', options: ['Seguir igual', 'Tener un plan B, incluso cancelar', 'Ir más rápido', 'Dividir el grupo'], correct: 1, explanation: 'Un plan B (o cancelar) es una decisión de seguridad válida y responsable.' },
      { question: 'Antes de entrar a una zona sin señal debes…', options: ['No avisar a nadie', 'Dejar tu ruta y hora de regreso con alguien de confianza', 'Apagar el teléfono', 'Improvisar'], correct: 1, explanation: 'Dejar el plan con alguien permite activar ayuda si no regresas a tiempo.' },
      { question: 'Ante una lesión grave, ¿qué NO debes hacer?', options: ['Asegurar la zona', 'Llamar al 911', 'Mover al herido sin necesidad', 'Mantener al grupo calmado'], correct: 2, explanation: 'No se mueve a un herido grave salvo peligro inminente.' },
      { question: 'Este curso…', options: ['Certifica para alta montaña', 'Es informativo y no sustituye certificación', 'Reemplaza al 911', 'No menciona riesgos'], correct: 1, explanation: 'Es informativo; las actividades de riesgo requieren formación y permisos específicos.' },
    ],
  },

  // ─── ESCUELA DE OPERADORES ────────────────────────────────────────────────
  o1: {
    id: 'o1',
    school: 'Escuela de Operadores',
    schoolColor: '#8B5CF6',
    title: 'Logística de Grupos Grandes',
    subtitle: 'De 20 a 200 personas',
    description:
      'Coordinación de transporte, alojamiento y actividades para grupos grandes y tours de varios días, y cómo manejar imprevistos sin que se caiga la operación.',
    readingHtml: `
<h2>1. Planifica con antelación</h2>
<ul>
  <li><strong>Itinerario maestro:</strong> horarios, traslados, comidas y actividades en un solo documento compartido.</li>
  <li><strong>Confirma proveedores</strong> por escrito (transporte, hospedaje, restaurantes) con cupos y horarios.</li>
  <li><strong>Buffer de tiempo:</strong> agrega márgenes entre bloques; los grupos grandes siempre van más lentos.</li>
</ul>

<h2>2. Divide y coordina</h2>
<ul>
  <li><strong>Subgrupos con líder:</strong> para 50+ personas, asigna responsables por bus o sección.</li>
  <li><strong>Listas y conteo:</strong> manifiesto por vehículo; cuenta en cada traslado.</li>
  <li><strong>Canal de comunicación</strong> único con el equipo (radio o grupo de mensajería).</li>
</ul>

<h2>3. Transporte y alojamiento</h2>
<ul>
  <li><strong>Capacidad correcta:</strong> usa el tipo de vehículo adecuado (van, minibús, bus) según el grupo.</li>
  <li><strong>Rooming list</strong> entregada al hotel con antelación; check-in agrupado.</li>
  <li><strong>Necesidades especiales:</strong> accesibilidad, dietas y salud anotadas por persona.</li>
</ul>

<h2>4. Imprevistos</h2>
<ul>
  <li><strong>Plan B por bloque:</strong> qué hacer si llueve, si un proveedor falla o si hay retraso.</li>
  <li><strong>Fondo de contingencia</strong> y contactos de respaldo (otro transporte, otro restaurante).</li>
  <li><strong>Comunica a tiempo:</strong> un grupo informado tolera mucho mejor un cambio.</li>
</ul>
<blockquote>La diferencia entre un operador bueno y uno excelente es cómo resuelve lo que sale mal, no lo que sale bien.</blockquote>
`,
    slides: [
      { title: 'Planifica', points: ['Itinerario maestro compartido', 'Proveedores confirmados por escrito', 'Buffer de tiempo entre bloques'] },
      { title: 'Divide y coordina', points: ['Subgrupos con líder', 'Manifiesto y conteo por vehículo', 'Un solo canal de comunicación'] },
      { title: 'Transporte y hospedaje', points: ['Capacidad correcta del vehículo', 'Rooming list anticipada', 'Necesidades especiales anotadas'] },
      { title: 'Imprevistos', points: ['Plan B por bloque', 'Fondo y contactos de respaldo', 'Comunica los cambios a tiempo'] },
      { title: 'Clave', points: ['Lo que define a un operador', 'es cómo resuelve lo que sale mal'] },
    ],
    podcast: {
      intro: 'Bienvenido a Logística de Grupos Grandes. Verás cómo coordinar transporte, alojamiento y actividades para grupos de 20 a 200 personas sin que se caiga la operación.',
      segments: [
        { title: 'Planifica con antelación', text: 'Todo arranca con un itinerario maestro: horarios, traslados, comidas y actividades en un solo documento compartido. Confirma a tus proveedores por escrito, con cupos y horarios, y agrega buffers de tiempo entre bloques, porque los grupos grandes siempre se mueven más lento de lo que crees.' },
        { title: 'Divide y coordina', text: 'Para grupos de más de cincuenta personas, divide en subgrupos con un líder por bus o sección. Lleva un manifiesto por vehículo y cuenta en cada traslado. Y mantén un único canal de comunicación con tu equipo, ya sea radio o un grupo de mensajería.' },
        { title: 'Transporte y alojamiento', text: 'Usa el tipo de vehículo adecuado según el tamaño del grupo, van, minibús o bus. Entrega la rooming list al hotel con antelación para un check-in agrupado, y anota por persona las necesidades especiales: accesibilidad, dietas y temas de salud.' },
        { title: 'Imprevistos', text: 'Ten un plan B por bloque: qué hacer si llueve, si un proveedor falla o si hay un retraso. Maneja un fondo de contingencia y contactos de respaldo, y comunica los cambios a tiempo, porque un grupo informado tolera mucho mejor un cambio. La diferencia entre un operador bueno y uno excelente es cómo resuelve lo que sale mal.' },
      ],
    },
    quiz: [
      { question: 'Para coordinar un grupo de 50+ personas conviene…', options: ['Manejar todo solo', 'Dividir en subgrupos con líder por bus/sección', 'No hacer listas', 'Improvisar'], correct: 1, explanation: 'Subgrupos con responsables y manifiesto por vehículo hacen manejable la operación.' },
      { question: '¿Por qué agregar “buffers” de tiempo?', options: ['Para terminar antes', 'Porque los grupos grandes van más lento y surgen imprevistos', 'Para cobrar más', 'No sirven'], correct: 1, explanation: 'Los márgenes absorben demoras inevitables en grupos grandes.' },
      { question: 'Los proveedores deben confirmarse…', options: ['De palabra', 'Por escrito, con cupos y horarios', 'El mismo día', 'No hace falta'], correct: 1, explanation: 'La confirmación por escrito evita malentendidos de cupo y horario.' },
      { question: 'Lo que distingue a un gran operador es…', options: ['Que nunca pasa nada', 'Cómo resuelve los imprevistos', 'El precio más bajo', 'Improvisar siempre'], correct: 1, explanation: 'La excelencia está en la respuesta ante lo que sale mal (plan B, respaldo, comunicación).' },
    ],
  },
  o2: {
    id: 'o2',
    school: 'Escuela de Operadores',
    schoolColor: '#8B5CF6',
    title: 'Normativas del Ministerio de Turismo',
    subtitle: 'Opera dentro del marco legal',
    description:
      'Panorama de los requisitos para operar turismo en Ecuador: registro y licencias, permisos, seguros obligatorios y buenas prácticas. Contenido orientativo, no asesoría legal.',
    readingHtml: `
<div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:12px;padding:12px 16px;margin-bottom:16px;">
<strong>Nota:</strong> este curso es <strong>orientativo</strong> y resume buenas prácticas. La normativa cambia: confirma siempre los requisitos vigentes con el <strong>Ministerio de Turismo</strong> y un asesor. No es asesoría legal.
</div>

<h2>1. Registro y licencia</h2>
<ul>
  <li><strong>Registro de Turismo</strong> y la <strong>Licencia Única Anual de Funcionamiento (LUAF)</strong> son la base para operar legalmente.</li>
  <li>La <strong>categoría</strong> (agencia/operadora) define qué servicios puedes vender.</li>
  <li>Mantén tus datos y renovaciones <strong>al día</strong>.</li>
</ul>

<h2>2. Permisos según la actividad</h2>
<ul>
  <li><strong>Áreas protegidas:</strong> permisos y guías autorizados para parques nacionales.</li>
  <li><strong>Guías especializados</strong> (naturaleza, aventura) con su credencial vigente.</li>
  <li><strong>Transporte turístico</strong> habilitado para el traslado de pasajeros.</li>
</ul>

<h2>3. Seguros y seguridad</h2>
<ul>
  <li><strong>Seguro de responsabilidad civil</strong> y de asistencia al viajero según la actividad.</li>
  <li><strong>Protocolos de seguridad</strong> documentados, especialmente en turismo de aventura.</li>
  <li><strong>Consentimiento informado</strong> del pasajero en actividades de riesgo.</li>
</ul>

<h2>4. Buenas prácticas</h2>
<ul>
  <li><strong>Información veraz</strong> en publicidad y precios (sin sorpresas).</li>
  <li><strong>Facturación</strong> y comprobantes en regla.</li>
  <li><strong>Sostenibilidad y comunidades:</strong> cumple las normas ambientales y de respeto cultural.</li>
</ul>
<blockquote>Operar en regla no es solo evitar multas: es la base de la confianza del viajero y de tu reputación.</blockquote>
`,
    slides: [
      { title: 'Registro y licencia', points: ['Registro de Turismo + LUAF', 'La categoría define qué vendes', 'Renovaciones al día'] },
      { title: 'Permisos', points: ['Áreas protegidas: permisos y guías', 'Guías especializados con credencial', 'Transporte turístico habilitado'] },
      { title: 'Seguros y seguridad', points: ['Responsabilidad civil', 'Protocolos documentados', 'Consentimiento en actividades de riesgo'] },
      { title: 'Buenas prácticas', points: ['Información veraz', 'Facturación en regla', 'Sostenibilidad y respeto cultural'] },
      { title: 'Recuerda', points: ['La normativa cambia', 'Confirma con el Ministerio', 'Operar en regla = confianza'] },
    ],
    podcast: {
      intro: 'Bienvenido a Normativas del Ministerio de Turismo. Antes de empezar: este contenido es orientativo, no asesoría legal; confirma siempre los requisitos vigentes con el Ministerio y un asesor.',
      segments: [
        { title: 'Registro y licencia', text: 'La base para operar legalmente es estar inscrito en el Registro de Turismo y contar con la Licencia Única Anual de Funcionamiento. Tu categoría, como agencia u operadora, define qué servicios puedes vender. Mantén tus datos y renovaciones al día.' },
        { title: 'Permisos por actividad', text: 'Según lo que hagas, necesitarás permisos específicos: para operar en áreas protegidas y parques nacionales, guías autorizados y credenciales vigentes para actividades de naturaleza o aventura, y transporte turístico habilitado para trasladar pasajeros.' },
        { title: 'Seguros y seguridad', text: 'Contrata los seguros que correspondan, como responsabilidad civil y asistencia al viajero. Documenta tus protocolos de seguridad, sobre todo en turismo de aventura, y usa consentimiento informado del pasajero en las actividades de riesgo.' },
        { title: 'Buenas prácticas', text: 'Da información veraz en tu publicidad y precios, sin sorpresas; mantén tu facturación y comprobantes en regla; y cumple las normas ambientales y de respeto a las comunidades. Operar en regla no es solo evitar multas: es la base de la confianza del viajero y de tu reputación. Y recuerda, la normativa cambia, así que confirma siempre lo vigente.' },
      ],
    },
    quiz: [
      { question: '¿Cuál es la base para operar turismo legalmente en Ecuador?', options: ['Solo una página web', 'Registro de Turismo y la LUAF', 'Nada', 'Un permiso municipal cualquiera'], correct: 1, explanation: 'El Registro de Turismo y la Licencia Única Anual de Funcionamiento (LUAF) son el punto de partida.' },
      { question: 'Para operar en un parque nacional necesitas…', options: ['Nada especial', 'Permisos y guías autorizados', 'Solo un seguro', 'Pagar entrada nada más'], correct: 1, explanation: 'Las áreas protegidas exigen permisos y guías autorizados.' },
      { question: 'En actividades de riesgo es buena práctica…', options: ['No documentar nada', 'Protocolos de seguridad y consentimiento informado', 'Ir sin seguro', 'Ocultar los riesgos'], correct: 1, explanation: 'Protocolos documentados y consentimiento informado protegen al viajero y al operador.' },
      { question: 'Sobre la normativa, lo correcto es…', options: ['Asumir que nunca cambia', 'Confirmar los requisitos vigentes con el Ministerio', 'Ignorarla', 'Copiar a otro operador'], correct: 1, explanation: 'La normativa cambia; siempre verifica lo vigente con la autoridad y un asesor.' },
    ],
  },
  o3: {
    id: 'o3',
    school: 'Escuela de Operadores',
    schoolColor: '#8B5CF6',
    title: 'Integración con la App Going App',
    subtitle: 'Automatiza tu gestión',
    description:
      'Cómo sincronizar reservas, manejar tu disponibilidad, cobrar con la plataforma y leer tus métricas para crecer con menos trabajo manual.',
    readingHtml: `
<h2>1. Publica y mantén tu oferta</h2>
<ul>
  <li><strong>Fichas claras:</strong> título, descripción honesta, fotos buenas y precio correcto.</li>
  <li><strong>Disponibilidad real:</strong> mantén tu calendario actualizado para evitar sobreventas.</li>
  <li><strong>Cupos y horarios</strong> bien definidos por salida.</li>
</ul>

<h2>2. Reservas sin fricción</h2>
<ul>
  <li><strong>Confirmación rápida:</strong> responde y confirma a tiempo; la velocidad mejora tu posición.</li>
  <li><strong>Sincroniza</strong> para que una reserva descuente cupo automáticamente.</li>
  <li><strong>Comunica</strong> los detalles (punto de encuentro, qué llevar) desde la plataforma.</li>
</ul>

<h2>3. Cobros y pagos</h2>
<ul>
  <li><strong>Pago integrado:</strong> deja que la plataforma gestione el cobro de forma segura.</li>
  <li><strong>Políticas claras</strong> de cancelación y reembolso, visibles para el cliente.</li>
  <li><strong>Concilia</strong> tus liquidaciones con tu propia contabilidad.</li>
</ul>

<h2>4. Métricas para crecer</h2>
<ul>
  <li><strong>Conversión:</strong> cuántas visitas terminan en reserva (mejora fotos/precio si es baja).</li>
  <li><strong>Calificaciones:</strong> tu reputación impulsa más ventas; cuida cada reseña.</li>
  <li><strong>Ocupación:</strong> identifica tus mejores fechas y ajusta cupos/promos.</li>
</ul>
<blockquote>Automatizar lo repetitivo te libera tiempo para lo que de verdad importa: la calidad de la experiencia.</blockquote>
`,
    slides: [
      { title: 'Publica tu oferta', points: ['Fichas claras y honestas', 'Disponibilidad real (evita sobreventa)', 'Cupos y horarios por salida'] },
      { title: 'Reservas', points: ['Confirma rápido', 'Sincroniza el cupo', 'Comunica detalles desde la plataforma'] },
      { title: 'Cobros', points: ['Pago integrado y seguro', 'Políticas claras de cancelación', 'Concilia tus liquidaciones'] },
      { title: 'Métricas', points: ['Conversión', 'Calificaciones', 'Ocupación por fecha'] },
      { title: 'Beneficio', points: ['Automatiza lo repetitivo', 'Gana tiempo para la calidad', 'Crece con menos trabajo manual'] },
    ],
    podcast: {
      intro: 'Bienvenido a Integración con la App Going App. Verás cómo automatizar tu gestión: publicar, recibir reservas, cobrar y leer tus métricas para crecer con menos trabajo manual.',
      segments: [
        { title: 'Publica y mantén tu oferta', text: 'Empieza con fichas claras: un buen título, una descripción honesta, fotos de calidad y el precio correcto. Mantén tu disponibilidad real y el calendario actualizado para evitar sobreventas, con cupos y horarios bien definidos por cada salida.' },
        { title: 'Reservas sin fricción', text: 'La velocidad importa: responde y confirma a tiempo, porque mejora tu posición. Sincroniza para que cada reserva descuente cupo automáticamente, y comunica los detalles, como el punto de encuentro y qué llevar, desde la misma plataforma.' },
        { title: 'Cobros y pagos', text: 'Deja que la plataforma gestione el cobro de forma segura, define políticas claras de cancelación y reembolso visibles para el cliente, y concilia tus liquidaciones con tu propia contabilidad para que los números cuadren.' },
        { title: 'Métricas para crecer', text: 'Mira tus métricas: la conversión, es decir cuántas visitas terminan en reserva, y si es baja mejora fotos o precio. Cuida tus calificaciones, porque tu reputación impulsa más ventas. Y revisa tu ocupación para identificar tus mejores fechas y ajustar cupos o promociones. Automatizar lo repetitivo te libera tiempo para lo que de verdad importa: la calidad de la experiencia.' },
      ],
    },
    quiz: [
      { question: '¿Por qué mantener la disponibilidad actualizada?', options: ['Por estética', 'Para evitar sobreventas y malas experiencias', 'No importa', 'Para subir el precio'], correct: 1, explanation: 'Un calendario real evita vender cupos que no existen.' },
      { question: 'Confirmar las reservas rápido…', options: ['No cambia nada', 'Mejora tu posición y la experiencia', 'Molesta al cliente', 'Es opcional siempre'], correct: 1, explanation: 'La rapidez de respuesta mejora tu posicionamiento y la satisfacción.' },
      { question: 'Si tu conversión (visitas → reservas) es baja, conviene…', options: ['Ignorarlo', 'Revisar fotos, descripción y precio', 'Subir el precio', 'Cerrar la ficha'], correct: 1, explanation: 'Una conversión baja suele mejorar afinando fotos, descripción y precio.' },
      { question: 'El beneficio de automatizar lo repetitivo es…', options: ['Más trabajo manual', 'Liberar tiempo para la calidad de la experiencia', 'Perder control', 'Nada'], correct: 1, explanation: 'Automatizar reservas/cobros/métricas deja tiempo para lo que importa: la experiencia.' },
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
  const [completion, setCompletion] = useState<CompleteCourseResult | null>(null);
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
  const upNext = nextCourse(courseId);

  const submitQuiz = () => {
    setQuizSubmitted(true);
    const finalScore = course.quiz.reduce((a, q, i) => a + (quizAnswers[i] === q.correct ? 1 : 0), 0);
    const didPass = finalScore >= Math.ceil(course.quiz.length * 0.67);
    if (didPass) {
      // Registra el resultado en el backend (otorga insignia + recalcula nivel).
      // No bloquea la UI: si falla, el resultado del quiz igual se muestra.
      completeAcademyCourse(courseId, finalScore, course.quiz.length)
        .then(res => { if (res) setCompletion(res); })
        .catch(() => {});
    }
  };
  const retryQuiz = () => { setQuizSubmitted(false); setQuizAnswers(course.quiz.map(() => null)); setCompletion(null); };

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
              <button onClick={submitQuiz} disabled={quizAnswers.some(a => a === null)}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ backgroundColor: accent }}>
                Ver resultado
              </button>
            ) : (
              <div className="text-center rounded-xl p-4" style={{ backgroundColor: passed ? '#ECFDF5' : '#FEF2F2' }}>
                <p className="text-2xl font-black" style={{ color: passed ? '#15803d' : '#ef4444' }}>{score}/{course.quiz.length}</p>
                <p className="text-sm font-semibold text-gray-700">{passed ? '¡Aprobado! 🎉' : 'Repasa y vuelve a intentar'}</p>

                {/* Insignia ganada + subida de nivel (llega del backend) */}
                {passed && completion && completion.newlyAwardedBadges.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {completion.newlyAwardedBadges.map(b => (
                      <span key={b.code} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: accent }}>
                        🏅 {b.label}
                      </span>
                    ))}
                  </div>
                )}
                {passed && completion?.leveledUp && (
                  <p className="mt-2 text-sm font-bold" style={{ color: accent }}>
                    ¡Subiste a {completion.progress.level.label}! 🎉
                  </p>
                )}

                {passed ? (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    {upNext && (
                      <Link href={`/academy/${upNext.id}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90"
                        style={{ backgroundColor: accent }}>
                        Siguiente curso: {upNext.title} →
                      </Link>
                    )}
                    <Link href="/academy?tab=niveles"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 hover:bg-gray-50"
                      style={{ borderColor: accent, color: accent }}>
                      Ver mis insignias
                    </Link>
                  </div>
                ) : (
                  <button onClick={retryQuiz}
                    className="mt-2 text-xs font-bold text-gray-500 hover:underline">Reintentar</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
