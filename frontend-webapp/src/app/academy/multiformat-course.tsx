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
