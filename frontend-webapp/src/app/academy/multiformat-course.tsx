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
import { completeAcademyCourse, completeAcademyLesson, CompleteCourseResult } from '../../lib/academy/api';
import { nextCourse, schoolKeyOf } from './catalog';
import { useIsAuthenticated } from '../../lib/providers/auth-client';
import { CourseArt } from './CourseArt';

/**
 * Convierte el manual HTML en texto hablado limpio para la voz (TTS):
 * quita etiquetas, emojis y etiquetas de caja ("Clave Going:", "Escenario:"),
 * pone una pausa tras cada título y colapsa espacios.
 */
function htmlToNarration(html: string): string {
  return html
    .replace(/<(h2|h3)[^>]*>/gi, ' … ')       // pausa antes del título
    .replace(/<\/(h2|h3|p|li|blockquote)>/gi, '. ')
    .replace(/<li[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')                    // resto de etiquetas
    .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é').replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó').replace(/&uacute;/gi, 'ú').replace(/&ntilde;/gi, 'ñ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, 'y').replace(/&[a-z]+;/gi, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, '') // emojis
    .replace(/\b(Clave Going|Escenario|Error com[uú]n|El porqu[eé]|En la pr[aá]ctica)\s*:/gi, '$1. ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\.\s*\.(\s*\.)?/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface MfSlide { title: string; points: string[]; image?: string }
export interface MfQuiz { question: string; options: string[]; correct: number; explanation: string }
export interface MultiFormatCourseData {
  id: string;
  school: string;
  schoolColor: string;
  title: string;
  subtitle: string;
  description: string;
  /** Resumen en HTML que se muestra en pantalla (pestaña "Leer"). Conciso. */
  readingHtml: string;
  /**
   * Manual EN EXTENSO en HTML (narrativa, escenarios, el porqué, errores). Es la
   * versión profunda: alimenta el PDF descargable y la narración de "Escuchar".
   * Si falta, PDF y podcast caen al readingHtml / podcast.segments.
   */
  manualHtml?: string;
  /** Manual gráfico: slides con puntos clave. */
  slides: MfSlide[];
  /** Guion del podcast: segmentos que la voz (TTS) lee en orden. */
  podcast: { intro: string; segments: { title: string; text: string }[] };
  /** Audio real del curso con voz del asistente. La persona elige timbre. */
  audioFemale?: string;  // Coral
  audioMale?: string;    // Echo
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
    manualHtml: `
<p>Son las 5:40 de la mañana en Riobamba. Doña Marta necesita llegar al aeropuerto de Quito para un vuelo a las 10, su hija Andrea quiere mandarle unas medicinas a la abuela en Ambato, y su vecino solo quiere cruzar la ciudad para una cita médica. Tres necesidades distintas, un mismo lugar donde resolverlas: Going App. La diferencia entre una persona que abre la app con confianza y otra que la cierra frustrada casi nunca es el precio ni la distancia: es saber usar la herramienta. Este manual te enseña a moverte dentro de Going App con soltura, sea que pidas o que ofrezcas el servicio, para que cada reserva, cada cobro y cada situación de riesgo se resuelva con calma y no con nervios.</p>

<h2>1. Cada viaje tiene su propia lógica</h2>
<p>El error más común de quien recién llega es tratar todos los viajes por igual. Going App tiene modalidades distintas porque las necesidades del Ecuador son distintas: no es lo mismo cruzar Quito a las 8 de la noche que reservar con dos días de anticipación un traslado Riobamba-aeropuerto. Entender qué modalidad usar te ahorra tiempo, dinero y malentendidos.</p>
<ul>
<li><strong>Viaje compartido.</strong> Pagas solo tu asiento y viajas con otras personas que van por la misma ruta. Es la opción más económica y la más comunitaria; ideal para rutas intercity frecuentes. Reservas tu cupo y la app arma el grupo.</li>
<li><strong>Viaje privado.</strong> Contratas el vehículo completo para ti y para quienes te acompañan. Cuesta más, pero ganas privacidad y horario propio. Sirve para familias, equipaje grande o quien prefiere no compartir.</li>
<li><strong>Carrera en ciudad.</strong> Es inmediata: pides y la plataforma te asigna a la conductora o conductor más cercano para moverte dentro de la ciudad, ahora mismo.</li>
<li><strong>Viaje reservado (intercity programado).</strong> Se agenda con anticipación y tiene <strong>tarifa fija</strong>: sabes cuánto pagas desde que reservas, sin sorpresas. La app te avisa <strong>1 hora antes</strong> y otra vez <strong>5 minutos antes</strong> para que estés listo.</li>
</ul>
<div class="box clave"><b>Clave Going</b> Elegir bien la modalidad no es un detalle técnico: es la diferencia entre pagar lo justo y llegar a tiempo.</div>

<h3>Cómo pedir y cómo aceptar</h3>
<p>Si eres pasajera o pasajero, marca tu punto de partida y tu destino, elige la modalidad y confirma. Si el viaje es programado, respeta los dos avisos: cuando llegue la alerta de los 5 minutos, ya deberías estar en el punto de encuentro. Si eres conductora o conductor, revisa bien los detalles antes de aceptar —ruta, número de asientos, hora— porque aceptar es un compromiso con una persona real que cuenta contigo.</p>
<div class="box escenario"><b>Escenario</b> Un cliente reserva un viaje Riobamba-aeropuerto para las 6 a.m. A las 5 a.m. le llega el aviso de 1 hora y prepara su maleta; a las 5:55 recibe el de 5 minutos y baja a la puerta. La conductora llega, ambos están listos y el viaje arranca sin una sola llamada de apuro. Eso es la app trabajando para ti.</div>

<h2>2. Pagar de la forma que te quede mejor</h2>
<p>Going App no te obliga a un solo método de pago porque en el Ecuador conviven muchas realidades: quien tiene tarjeta, quien usa transferencias móviles y quien todavía prefiere el efectivo. Conocer tus opciones te da libertad y evita el momento incómodo de "no tengo cómo pagar".</p>
<ul>
<li><strong>Tarjeta por Datafast.</strong> Cargas tu tarjeta una vez y el cobro se procesa de forma segura en cada viaje. Práctico para quien viaja seguido.</li>
<li><strong>DeUna.</strong> Pago desde tu billetera móvil, rápido y sin efectivo en mano.</li>
<li><strong>Wallet Going.</strong> Es tu saldo dentro de la app: lo recargas cuando quieres y hasta puedes transferirlo. Muy útil para tener el pago listo antes de salir y para regalar saldo a un familiar.</li>
<li><strong>Efectivo.</strong> Sigue disponible. Si pagas en efectivo, ten el monto lo más exacto posible; facilita el cierre y muestra respeto por el tiempo de la otra persona.</li>
</ul>
<div class="box error"><b>Error común</b> Dejar el método de pago para el final del viaje. Si tu tarjeta rebota o no tienes saldo en el Wallet justo al bajarte, generas una demora incómoda y arriesgas tu calificación. Confirma tu forma de pago <em>antes</em> de arrancar.</div>
<p>Para la conductora o conductor: nunca presiones por un método específico ni sugieras salir de la app para cobrar por fuera. Cobrar dentro de Going App protege a ambas partes, deja constancia y es lo que sostiene la confianza de toda la comunidad.</p>
<div class="box clave"><b>Clave Going</b> El pago siempre dentro de la app: es tu respaldo y el de tu pasajera o pasajero.</div>

<h2>3. Envíos: el código OTP es la firma de la entrega</h2>
<p>Los envíos puerta a puerta son una de las funciones más queridas de Going App, porque resuelven algo cotidiano: mandar un paquete, un documento o unas medicinas de una ciudad a otra sin ir personalmente. Pero un envío bien hecho depende de un detalle que muchos subestiman: el código OTP.</p>
<ol>
<li><strong>Cotiza por tamaño.</strong> La app calcula el costo según el tamaño del paquete. Describe bien lo que envías para que la cotización sea justa.</li>
<li><strong>Sigue el envío en vivo.</strong> Tanto quien envía como quien recibe pueden ver el trayecto en tiempo real. Esto reduce la ansiedad del "¿ya llegó?".</li>
<li><strong>Confirma con el código OTP.</strong> Al momento de la entrega, quien recibe da un código que solo esa persona tiene. Ese código es la prueba de que el paquete llegó a las manos correctas.</li>
</ol>
<blockquote>"El paquete no está entregado hasta que se digita el OTP." Esa frase resume por qué el sistema es confiable: sin código, no hay entrega válida.</blockquote>
<div class="box escenario"><b>Escenario</b> Andrea envía medicinas desde Riobamba a su abuela en Ambato. La conductora llega, pero quien abre la puerta es una vecina. Como pide el código OTP y la vecina no lo tiene, el paquete no se entrega a la persona equivocada: la conductora espera o llama a la abuela. El OTP acaba de evitar una entrega errada de algo delicado.</div>
<p>Si transportas un envío, nunca marques la entrega como completada sin recibir el código real de la persona destinataria. Saltarte ese paso rompe toda la cadena de confianza del servicio.</p>

<h2>4. Seguridad: herramientas que están para usarse</h2>
<p>Going App integra herramientas de seguridad no como adorno, sino para usarlas en el momento que hagan falta. Conocerlas <em>antes</em> de necesitarlas es lo que marca la diferencia. La seguridad es responsabilidad compartida: la app da las herramientas, tú las activas.</p>
<h3>Antes de subir</h3>
<ul>
<li><strong>Verifica identidad y placa.</strong> La app te muestra el nombre, la foto y la placa del vehículo. Compáralos con lo que ves antes de subir. Si algo no coincide, no subas.</li>
<li><strong>Reconoce al proveedor.</strong> Las conductoras y conductores usan un lanyard de identificación visible y saludan con la frase oficial: "Bienvenido a Going App, soy [nombre]". Es una señal de que estás con la persona correcta.</li>
</ul>
<h3>Durante el viaje</h3>
<ul>
<li><strong>Comparte tu viaje en vivo.</strong> Envía el trayecto a un familiar o amistad para que te siga en tiempo real. Un viaje observado es un viaje más seguro.</li>
<li><strong>Botón SOS.</strong> Está siempre a la mano para cualquier emergencia. No dudes en usarlo si te sientes en riesgo; para eso existe.</li>
<li><strong>Token de fin de viaje.</strong> Confirma que el viaje se cierra correctamente y que llegaste a tu destino, dejando constancia del recorrido completo.</li>
</ul>
<div class="box error"><b>Error común</b> Pensar que "el SOS es para casos extremos" y no compartir nunca el viaje. La consecuencia es viajar sin red: si algo pasa, nadie sabe dónde estás. Compartir el viaje toma tres segundos y cambia todo.</div>
<div class="box escenario"><b>Escenario</b> Una pasajera cruza Quito a las 9 de la noche. Antes de arrancar comparte el viaje con su hermano y verifica que la placa coincida con la app. No pasa nada malo —casi nunca pasa— pero ella viaja tranquila y su hermano ve que llegó bien. La tranquilidad también es un resultado del buen uso de la plataforma.</div>

<h2>5. El chat, la calificación y tu reputación</h2>
<p>La comunicación clara evita casi todos los problemas de un viaje. Going App tiene un chat con <strong>traducción automática</strong>, pensado para el turismo: puedes escribirle a una viajera extranjera en español y ella lo lee en su idioma. Úsalo para coordinar el punto de encuentro, avisar un retraso o aclarar una dirección.</p>
<ul>
<li><strong>Comunica dentro de la app.</strong> El chat deja constancia y activa la traducción. Coordinar por fuera pierde ese respaldo.</li>
<li><strong>Cuida tu calificación.</strong> La calificación mínima para conducir en Going App es de <strong>4.5 estrellas</strong>. No es un castigo: es la garantía de calidad que sostiene la confianza de toda la comunidad. Cada viaje suma a los niveles Aliado: Bronce, Plata y Oro.</li>
<li><strong>Califica con honestidad.</strong> Sea que viajes o que conduzcas, tu calificación ayuda a la siguiente persona. Un buen sistema de estrellas se construye entre todas y todos.</li>
</ul>
<div class="box clave"><b>Clave Going</b> Cada estrella que das o recibes es información que hace más segura y más humana a toda la comunidad Going.</div>

<h2>En resumen</h2>
<p>Usar bien Going App no es memorizar botones: es entender que detrás de cada modalidad, cada método de pago, cada código OTP y cada herramienta de seguridad hay una persona confiando en que las cosas salgan bien. Cuando eliges la modalidad correcta, confirmas tu pago antes de arrancar, respetas el OTP y activas las herramientas de seguridad, dejas de ser solo alguien que usa una app y te conviertes en embajadora o embajador del Ecuador: alguien que muestra que aquí, desde la Costa hasta Galápagos, sabemos recibir y cuidar. Esa es exactamente la clase de experiencia que se gana las 5 estrellas —no por perfección, sino por confianza bien cuidada.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/tc2-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/tc2-echo.mp3',
    slides: [
      { title: 'Elige tu servicio', points: ['Compartido = pagas tu asiento', 'Privado = vehículo completo', 'En la ciudad = inmediato'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc2-s0.png?v2' },
      { title: 'Origen y destino', points: ['Escribe la dirección', 'O usa tu ubicación (GPS)', 'O fija el punto en el mapa'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc2-s1.png?v2' },
      { title: 'Inmediato vs reservado', points: ['Inmediato: busca conductor ya', 'Reservado: fecha/hora futura', 'Aviso 1 h y 5 min antes'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc2-s2.png?v2' },
      { title: 'Pagos', points: ['Datafast / DeUna (digital)', 'Wallet: recarga y transfiere', 'Efectivo cuando aplica'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc2-s3.png?v2' },
      { title: 'Envíos', points: ['Cotiza puerta a puerta', 'Seguimiento en vivo', 'Entrega con código OTP'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc2-s4.png?v2' },
      { title: 'Seguridad', points: ['Botón SOS', 'Comparte tu viaje', 'Verifica al conductor', 'Token de fin de viaje'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc2-s5.png?v2' },
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
    manualHtml: `
<p>Son las cinco de la mañana en el Terminal de Riobamba. Una viajera sube a un vehículo con destino al aeropuerto de Quito; lleva tres horas de sueño, un vuelo a Galápagos y un nudo en el estómago porque nunca antes había reservado un asiento por una app. La conductora la mira por el retrovisor, sonríe y dice: "Bienvenida a Going App, soy Carmen. Llegamos con tiempo de sobra, tú tranquila". En ese instante, algo se afloja en los hombros de la pasajera. No fue el precio ni el modelo del auto: fue el trato. Ese momento diminuto es el verdadero producto de Going App, y entender por qué existe es lo que separa a quien maneja un carro de quien representa a un país entero. Este manual trata sobre eso: el ADN que llevas contigo cada vez que enciendes la app.</p>

<h2>1. La misión de Going: turismo colaborativo con rostro humano</h2>
<p>Going App nació como la primera superapp latinoamericana de turismo colaborativo, y esa palabra —colaborativo— no es decoración. Significa que el Ecuador se mueve gracias a personas que comparten lo que tienen: un asiento libre, un vehículo, una casa, el conocimiento de una ruta o de una comunidad. Cuando entiendes la misión, dejas de pensar "estoy llevando un pasajero" y empiezas a pensar "estoy conectando a alguien con el Ecuador". Esa diferencia se siente en cada gesto.</p>
<ul>
<li><strong>Compartir, no solo transportar.</strong> En un viaje compartido cada persona paga su asiento; en uno privado, el vehículo completo. En una carrera de ciudad la necesidad es inmediata, y en un viaje intercity programado hay una tarifa fija y avisos una hora y cinco minutos antes. Cada modalidad existe para resolver una necesidad humana distinta, y tu rol cambia con ella.</li>
<li><strong>Toda la cadena importa.</strong> Going también mueve envíos puerta a puerta, alojamiento, tours y experiencias. Aunque tú operes solo una parte, el pasajero o la huésped percibe una sola marca. Si tú fallas, "Going falló"; si tú brillas, "Going brilla".</li>
<li><strong>El país es el destino.</strong> Costa, Sierra, Amazonía y Galápagos no son puntos en un mapa: son historias que muchos viajeros descubren por primera vez a través de ti.</li>
</ul>
<div class="box clave"><b>Clave Going</b> No transportas cuerpos ni paquetes: conectas personas con el Ecuador, y esa conexión empieza con tu trato.</div>

<h2>2. Hospitalidad ecuatoriana: tu ventaja que ninguna app puede copiar</h2>
<p>Hay algo que la tecnología no fabrica: la calidez del Ecuador. En muchos lugares del mundo un servicio de transporte o alojamiento es una transacción fría. Aquí no. Aquí se saluda, se pregunta cómo estuvo el vuelo, se ofrece una recomendación sincera de dónde comer. Esa hospitalidad es tu mayor ventaja competitiva, y lo mejor es que ya la llevas dentro; solo hay que ponerla al servicio de cada viajera o viajero.</p>
<h3>El saludo que abre la puerta</h3>
<p>El saludo oficial existe por una razón profunda: en los primeros cinco segundos, la persona decide si puede confiar en ti. Por eso siempre empiezas con "Bienvenido a Going App, soy [tu nombre]" y llevas tu lanyard de identificación visible. No es un formalismo: es la forma en que le dices a alguien nervioso "estás en buenas manos, y yo doy la cara".</p>
<ul>
<li><strong>Usa el nombre de la persona.</strong> Escuchar el propio nombre relaja y personaliza. "Buenos días, señora Rocío" vale más que diez frases de manual.</li>
<li><strong>Ofrece, no impongas.</strong> Pregunta si prefiere conversar o ir en silencio, si quiere música, si le molesta el aire acondicionado. La hospitalidad genuina lee a la otra persona.</li>
<li><strong>Cierra con calidez.</strong> Un "que disfrutes tu vuelo" o "bienvenida a Baños, cualquier cosa me escribes" convierte un trayecto en un recuerdo.</li>
</ul>
<div class="box escenario"><b>Escenario</b> Recoges a un turista extranjero que no habla español y se le nota tenso. En lugar de quedarte callado, usas el chat de la app con traducción automática y le escribes: "Tranquilo, llegamos en 40 minutos, tienes tiempo". Su cara cambia. La herramienta existe justamente para que el idioma nunca sea una barrera para la calidez.</div>

<h2>3. Empatía: manejar desde el lugar del otro</h2>
<p>Empatía es una palabra grande para algo muy práctico: imaginar cómo se siente la persona antes de hablarle. Quien reserva por Going casi siempre carga un contexto que tú no ves —un vuelo que no puede perder, un paquete urgente, una madre que viaja sola con su bebé, alguien que ahorró meses para estas vacaciones. Cuando manejas desde ese lugar, tus decisiones cambian solas.</p>
<ul>
<li><strong>Anticipa la necesidad.</strong> Si recoges a alguien de madrugada, probablemente no durmió bien; baja el volumen, ten el vehículo climatizado y evita conversación forzada. Si llevas un envío, recuerda que del otro lado hay alguien esperando algo importante.</li>
<li><strong>Lee las señales.</strong> Una viajera que responde con monosílabos quiere silencio; un huésped que hace preguntas quiere conversar. Ajústate a la persona, no al revés.</li>
<li><strong>Cuida a quien viaja vulnerable.</strong> Con niñas o niños, personas mayores o con movilidad reducida, baja el ritmo, ofrece ayuda con el equipaje y confirma que todo esté cómodo antes de arrancar.</li>
</ul>
<div class="box clave"><b>Clave Going</b> La empatía no cuesta tiempo ni dinero: cuesta prestar atención, y es lo que más recuerda la gente.</div>
<blockquote>"No recuerdo el modelo del carro ni cuánto pagué. Recuerdo que el conductor se dio cuenta de que estaba nerviosa y me dijo que todo iba a salir bien." — Reseña real de una pasajera Going.</blockquote>

<h2>4. Resolución pacífica de problemas: la calma es tu herramienta</h2>
<p>Ningún servicio es perfecto todo el tiempo. Habrá tráfico, un malentendido con la tarifa, un paquete que llega más tarde de lo previsto, una persona de mal humor por razones que nada tienen que ver contigo. Lo que define a un proveedor de nivel Oro no es que nunca tenga problemas, sino cómo los resuelve. Y casi siempre la respuesta es la misma: con calma, información clara y honestidad.</p>
<h3>El método: escucha, explica, ofrece salida</h3>
<ol>
<li><strong>Escucha completo.</strong> Deja que la persona termine de hablar sin interrumpir. Muchas veces solo necesita sentirse escuchada, y la tensión baja sola.</li>
<li><strong>Reconoce y explica sin excusas.</strong> "Tienes razón, nos tomó más de lo previsto; hubo un cierre en la vía". La verdad tranquiliza más que una excusa.</li>
<li><strong>Ofrece una solución concreta.</strong> Un camino alterno, un tiempo estimado real, o apoyarte en el soporte de la app. En un envío, recuerda que la entrega se confirma con un código OTP: eso protege a ambas partes y evita discusiones.</li>
<li><strong>Nunca respondas a la agresión con agresión.</strong> Tu serenidad es profesional; discutir nunca sube tu calificación, siempre la baja.</li>
</ol>
<div class="box error"><b>Error común</b> Ponerte a la defensiva y "ganar" la discusión con el pasajero. Consecuencia: aunque tengas la razón, recibes una estrella, tu promedio cae y, como la calificación mínima del conductor es 4.5 estrellas, pones en riesgo tu permanencia. Tener la razón y perder la estrella es perder dos veces.</div>
<div class="box escenario"><b>Escenario</b> Una pasajera insiste en que la tarifa fija del intercity "está mal" porque esperaba pagar menos. En vez de discutir, le muestras con calma que la tarifa fija se acordó al reservar y no cambia por el tráfico ni por la ruta. Le explicas que justamente eso la protege de sorpresas. La persona entiende, y tú cierras el viaje sin tensión.</div>

<h2>5. Seguridad y confianza: la base de todo</h2>
<p>Nadie disfruta un viaje si no se siente seguro. Por eso Going pone en manos de la gente herramientas claras: el botón SOS, la opción de compartir el viaje en vivo, la verificación de identidad y placa del conductor, y el token de fin de viaje. Como proveedor, tu trabajo no es solo no fallar, sino hacer visible que todo está en regla, porque la confianza tranquila es la que fideliza.</p>
<ul>
<li><strong>Facilita la verificación.</strong> Que la persona confirme tu identidad y placa no es desconfianza hacia ti; es la app funcionando bien. Invítala a hacerlo con naturalidad.</li>
<li><strong>Maneja los pagos con transparencia.</strong> Going acepta tarjeta por Datafast, DeUna, Wallet Going —que se recarga y se transfiere— y efectivo. Conoce las opciones para responder con seguridad y sin improvisar.</li>
<li><strong>Cierra el ciclo correctamente.</strong> El token de fin de viaje y, en envíos, el código OTP de entrega, existen para que todos queden tranquilos. Respetarlos te protege a ti tanto como a la otra persona.</li>
</ul>
<div class="box clave"><b>Clave Going</b> La seguridad bien manejada no asusta: tranquiliza. Hazla visible y la confianza vendrá sola.</div>

<h2>6. Eres embajadora o embajador del Ecuador</h2>
<p>Aquí está el corazón de este curso. Para muchas viajeras y viajeros, tú eres la primera persona ecuatoriana con la que hablan a fondo. Lo que digas, cómo manejes, la recomendación que des, la paciencia que muestres: todo eso se convierte en la imagen que se llevan del país. No exageramos al decir que un buen trato tuyo puede ser la razón por la que alguien regrese al Ecuador o lo recomiende a diez personas más.</p>
<ul>
<li><strong>Conoce y comparte tu tierra.</strong> Un dato honesto sobre dónde comer un buen encebollado, qué mirador vale la pena, o cómo se llama ese volcán, transforma un trayecto en una experiencia.</li>
<li><strong>Cuida el lenguaje inclusivo y respetuoso.</strong> Tratas igual de bien a una conductora que a un conductor, a una anfitriona que a un anfitrión, a cada huésped y a cada guía. El respeto también es hospitalidad.</li>
<li><strong>Representa con orgullo.</strong> Tu vehículo limpio, tu lanyard visible, tu puntualidad y tu sonrisa dicen "así es el Ecuador" mucho antes de que hables.</li>
</ul>
<blockquote>"El proveedor de Going no lleva pasajeros: lleva la primera impresión de un país entero." </blockquote>

<h2>En resumen</h2>
<p>El ADN de Going App se resume en algo simple y poderoso: cada viaje, cada envío, cada noche de alojamiento es una oportunidad de mostrar lo mejor del Ecuador. La misión te da propósito, la hospitalidad te da tu ventaja, la empatía te da cercanía, la calma te da soluciones y la seguridad te da confianza. Cuando juntas todo eso, dejas de competir por precio y empiezas a ganar por trato. Ese es el camino real hacia las 5 estrellas y hacia subir de Aliado Bronce a Plata y a Oro: no se trata de un truco, sino de que la gente sienta que la cuidaste. Sé embajadora o embajador de tu país en cada trayecto, y las estrellas —y el orgullo de hacerlo bien— llegarán solas.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/tc1-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/tc1-echo.mp3',
    slides: [
      { title: 'Nuestra misión', points: ['Conectar al Ecuador con tecnología simple', 'Una red de personas que se cuidan', 'Cada interacción muestra lo mejor del país'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc1-s0.png?v2' },
      { title: 'Hospitalidad ecuatoriana', points: ['Recibir bien, escuchar y resolver', 'Calidez, puntualidad y limpieza', 'La persona siempre primero'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc1-s1.png?v2' },
      { title: 'Empatía y resolución', points: ['Escucha sin interrumpir', 'Reconoce la molestia', 'Propón una solución', 'Usa soporte, nunca la confrontación'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc1-s2.png?v2' },
      { title: 'Regla de oro', points: ['Nada de política ni religión', 'Trato amable y profesional', 'Honestidad en todo acuerdo'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc1-s3.png?v2' },
      { title: 'Embajadores del país', points: ['Eres la primera impresión de Ecuador', 'Tu amabilidad invita a volver', 'Cuidas la reputación de la comunidad'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc1-s4.png?v2' },
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
    manualHtml: `
<p>Imagina que llevas a una viajera desde Baños hacia una comunidad kichwa en la Amazonía. Al bajar, ella toma una fotografía sin preguntar, deja una botella plástica junto al sendero y suelta un comentario sobre "lo atrasado del lugar". Tú, que conoces a esa comunidad, sabes que acaba de romper tres hilos invisibles: el respeto, el cuidado y la dignidad. En Going App no movemos solo cuerpos de un punto a otro: cuidamos el Ecuador que hace posible cada viaje. Un páramo pisoteado, una cascada con basura o una comunidad tratada como espectáculo son pérdidas que no vuelven. Este curso trata de eso: de viajar y trabajar dejando el país mejor de como lo encontramos. Porque el turismo colaborativo solo tiene futuro si lo que nos hace únicos —la naturaleza, la gente, la cultura— sigue vivo mañana.</p>

<h2>1. No dejar rastro: el país que prestamos al futuro</h2>
<p>El Ecuador cabe en un territorio pequeño, pero guarda cuatro mundos: Costa, Sierra, Amazonía y Galápagos. Esa riqueza es frágil justamente porque la visitamos mucho. "No dejar rastro" no es una frase bonita: es entender que cada empaque, colilla o desvío del sendero se acumula con los de miles de personas. Lo que para ti es "una sola botella", para un manglar o un páramo es una herida que se suma.</p>
<ul>
<li><strong>Lleva de vuelta lo que trajiste.</strong> Envolturas, botellas y restos vuelven contigo en el vehículo. Un basurero improvisado en la naturaleza no existe; el basurero eres tú hasta el próximo punto adecuado.</li>
<li><strong>Respeta el sendero y la señalización.</strong> Salirte del camino para una mejor foto pisa plantas que tardaron años en crecer. En Galápagos y en los páramos, un solo paso fuera de ruta puede dañar especies que no existen en ningún otro lugar del planeta.</li>
<li><strong>No alimentes ni persigas fauna.</strong> Un lobo marino, un cóndor o un mono que aprende a pedir comida pierde su instinto y su vida silvestre. Observa, no interfieras.</li>
<li><strong>Cuida el agua.</strong> Ríos, cascadas y lagunas son fuente de vida para comunidades enteras. Nada de jabones, aceites ni residuos en ellos.</li>
</ul>
<div class="box escenario"><b>Escenario</b> Terminas un tour en una playa de Esmeraldas y ves envases que dejaron otros. En lugar de encogerte de hombros, recoges lo que puedes y lo llevas contigo. La viajera o el viajero que te acompaña lo nota, y ese gesto silencioso enseña más que cualquier discurso: el respeto se contagia.</div>

<h2>2. Respeto a las comunidades locales</h2>
<p>Muchos de los lugares más hermosos del Ecuador son el hogar de alguien: comunidades kichwa, shuar, montubias, afroecuatorianas, indígenas de la Sierra. Cuando llegamos, somos invitados en su casa, no clientes en un parque temático. El turismo responsable reconoce que esas comunidades tienen sus tiempos, sus normas y su dignidad, y que su cultura no está ahí para nuestro entretenimiento.</p>
<h3>Cómo se ve el respeto en la práctica</h3>
<ol>
<li><strong>Pide permiso antes de fotografiar.</strong> Una persona no es un paisaje. Un "¿te puedo tomar una foto?" con una sonrisa cambia todo. Si dicen que no, agradece igual.</li>
<li><strong>Aprende y usa un saludo local.</strong> Un "Alli puncha" en la Sierra o un simple saludo cálido abre puertas que ningún itinerario abre.</li>
<li><strong>Compra local y paga justo.</strong> La artesanía, el almuerzo y el guía comunitario sostienen economías reales. Regatear hasta lo indigno no es viajar listo, es faltar el respeto.</li>
<li><strong>No impongas tu forma de ver el mundo.</strong> Comentarios como "esto está atrasado" hieren. Lo distinto no es inferior: es riqueza.</li>
</ol>
<blockquote>"La comunidad no es el escenario del viaje; es la anfitriona. Y a quien te recibe en su casa, se le trata con gratitud."</blockquote>
<div class="box clave"><b>Clave Going</b> Eres invitado en la casa de alguien: comparta lo que compartas, hazlo con permiso y con gratitud.</div>

<h2>3. Trato inclusivo con toda la comunidad usuaria</h2>
<p>El respeto por el Ecuador empieza por respetar a su gente, toda su gente. En Going App viajan y trabajan personas de todas las edades, regiones, culturas, orientaciones, creencias y capacidades. Una conductora o conductor, una pasajera o pasajero, una anfitriona o anfitrión, una guía: cada quien merece el mismo trato digno. La inclusión no es un extra amable, es la base de un servicio de cinco estrellas.</p>
<ul>
<li><strong>Trato equitativo sin excepciones.</strong> No hay pasajera o pasajero de "segunda". El acento, la ropa, el barrio de recogida o el idioma no cambian la calidad de tu servicio.</li>
<li><strong>Accesibilidad real.</strong> Ayuda con equipaje, con una silla de ruedas, con una persona mayor o con quien viaja con niñas o niños. Pregunta "¿cómo te ayudo?" en vez de asumir.</li>
<li><strong>Cero discriminación ni acoso.</strong> Comentarios sobre apariencia, origen o identidad no tienen lugar. El respeto se nota en cada palabra.</li>
<li><strong>Usa el chat con traducción automática.</strong> Si viajas con alguien que habla otro idioma, la app traduce por ti. Un turista extranjero que se siente entendido regresa y recomienda al Ecuador.</li>
</ul>
<div class="box error"><b>Error común</b> Tratar con frialdad a quien pide un viaje corto o paga en efectivo, pensando que "rinde poco". Consecuencia: esa persona te califica bajo, tu promedio cae por debajo de 4.5 estrellas y pierdes acceso a más viajes. El trato desigual siempre se cobra.</div>

<h2>4. Cuidado del patrimonio natural y cultural</h2>
<p>El patrimonio del Ecuador —desde las iglesias coloniales de Quito hasta los petroglifos amazónicos, desde los manglares hasta los volcanes— es un legado que no fabricamos nosotros y que no tenemos derecho a dañar. Cuidarlo es un acto de orgullo nacional. Cada proveedora o proveedor de Going es, en la práctica, una guardiana o guardián de ese tesoro.</p>
<h3>Patrimonio natural</h3>
<ul>
<li><strong>Respeta áreas protegidas y sus reglas.</strong> Las tarifas, horarios y límites de visitantes existen para que el lugar sobreviva. En Galápagos, seguir al guía y las normas no es opcional: es lo que mantiene vivo el archipiélago.</li>
<li><strong>No extraigas nada.</strong> Ni conchas, ni piedras, ni plantas, ni "un recuerdito". Lo que se saca de un ecosistema no vuelve.</li>
</ul>
<h3>Patrimonio cultural</h3>
<ul>
<li><strong>Cuida los sitios históricos.</strong> No rayes, no trepes donde no se debe, no toques lo que se conserva por siglos.</li>
<li><strong>Cuenta bien la historia.</strong> Si guías o conversas, habla del lugar con datos reales y con respeto. Eres una voz del Ecuador ante quien lo visita por primera vez.</li>
</ul>
<div class="box escenario"><b>Escenario</b> Llevas a una familia extranjera al Centro Histórico de Quito. En lugar de solo conducir, les cuentas por qué es Patrimonio de la Humanidad y les pides que no toquen los retablos. Ellos salen sintiendo que conocieron algo sagrado, no solo bonito. Esa es la diferencia entre transportar y embajar.</div>
<div class="box clave"><b>Clave Going</b> No heredamos el Ecuador de nuestros abuelos; se lo prestamos a nuestros nietos. Cuídalo como algo prestado.</div>

<h2>5. Sostenibilidad en tu día a día Going</h2>
<p>La sostenibilidad no vive solo en los tours de naturaleza: vive en cómo trabajas cada jornada. Los viajes compartidos ya son, en sí mismos, una decisión ecológica: cuando varias personas pagan su asiento en un mismo vehículo, hay menos autos en la vía, menos combustible quemado y menos huella. Tú haces que ese modelo funcione.</p>
<ol>
<li><strong>Aprovecha los viajes compartidos.</strong> Un carro lleno es un carro eficiente. Promueve el asiento compartido cuando tenga sentido: es bueno para el bolsillo y para el planeta.</li>
<li><strong>Conduce de forma eficiente.</strong> Frenadas suaves, ritmo constante y motor apagado en esperas largas ahorran combustible y hacen el viaje más cómodo.</li>
<li><strong>Reduce lo descartable.</strong> Ofrece agua sin generar montañas de plástico; una botella reutilizable dice mucho de ti.</li>
<li><strong>Mantén tu vehículo al día.</strong> Un auto en buen estado contamina menos y es más seguro. El cuidado también es sostenibilidad.</li>
</ol>
<div class="box error"><b>Error común</b> Pensar que "una persona sola no cambia nada". Consecuencia: multiplica esa idea por miles de proveedoras y proveedores y el daño se vuelve enorme. En cambio, multiplica el buen gesto y el Ecuador entero mejora. Tú eres ese multiplicador.</div>

<h2>En resumen</h2>
<p>Sostenibilidad y respeto no son un módulo aparte de tu trabajo: son la forma en que cuidas la casa que todas y todos compartimos. Cuando no dejas rastro, honras a las comunidades, tratas con dignidad a cada viajera o viajero y proteges el patrimonio natural y cultural, dejas de ser solo un servicio y te conviertes en embajadora o embajador del Ecuador. Ese es, además, el camino más seguro hacia las cinco estrellas: la gente califica alto a quien la hace sentir cuidada, respetada y orgullosa del país que acaba de conocer. Cuida el Ecuador y el Ecuador —a través de cada calificación, cada recomendación y cada viaje que regresa— te cuidará a ti.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/tc3-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/tc3-echo.mp3',
    slides: [
      { title: 'No dejar rastro', points: ['El lugar queda igual o mejor', 'Maneja tu basura siempre', 'No alimentes fauna ni extraigas flora', 'Cuida agua y energía'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc3-s0.png?v2' },
      { title: 'Respeto a comunidades', points: ['Pide permiso para fotos', 'La cultura no es espectáculo', 'Apoya la economía local', 'Negocia con justicia'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc3-s1.png?v2' },
      { title: 'Trato inclusivo', points: ['Going App es para todas las personas', 'Lenguaje respetuoso', 'Ofrece accesibilidad', 'Cero tolerancia al acoso'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc3-s2.png?v2' },
      { title: 'Cero discriminación', points: ['Prohibida por origen, género, religión…', 'Discriminar = posible suspensión', 'Dignidad para cada persona'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc3-s3.png?v2' },
      { title: 'Tu huella positiva', points: ['No solo evitar daño: dejar algo bueno', 'Recomienda destinos responsables', 'Construye un Ecuador que invita a volver'], image: 'https://storage.googleapis.com/going-academy-audio/img/tc3-s4.png?v2' },
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
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/c1-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/c1-echo.mp3',
    manualHtml: `
<p>Imagina la escena: una viajera acaba de bajar de un vuelo de doce horas. Está cansada, quizá en una ciudad que no conoce, con el teléfono al 8% de batería. Abre la puerta de tu auto… y en los próximos <strong>treinta segundos</strong> decide, sin darse cuenta, qué tipo de viaje va a tener. Ese instante —antes de que digas una sola palabra sobre la ruta— es la Primera Impresión. Y en Going App, la primera impresión no la das solo tú: la da el Ecuador.</p>
<p>Los estudios sobre confianza coinciden en algo: las personas formamos un juicio en los primeros segundos de un encuentro, y ese juicio cuesta revertirlo después. La buena noticia es que esos segundos se pueden preparar. Este manual te enseña cómo.</p>

<h2>1. Tu vehículo habla antes que tú</h2>
<p>Antes de encender el motor, tu auto ya está enviando un mensaje. Un interior limpio, ordenado y con buen olor comunica "aquí estás en buenas manos" sin que digas nada. Un auto descuidado comunica lo contrario, y ninguna sonrisa alcanza a borrar esa primera señal.</p>
<h3>El checklist, y por qué importa cada punto</h3>
<ul>
  <li><strong>Interior impecable.</strong> Asientos sin migas, piso sin basura, ventanas sin marcas. No es solo estética: quien ve tu auto cuidado asume —con razón— que también cuidas tu manejo.</li>
  <li><strong>Olor neutro.</strong> Una fragancia suave está bien; los perfumes intensos son un error frecuente. Muchas personas llegan con náuseas del vuelo o de la carretera, y un ambientador fuerte puede arruinarles el viaje. Menos es más.</li>
  <li><strong>Seguridad revisada.</strong> Llantas, frenos, luces y combustible. Un auto seguro es la base de todo; sin eso, lo demás no cuenta.</li>
  <li><strong>Temperatura lista.</strong> Si hace calor, enciende el aire antes de que suba la persona; si hace frío en la Sierra, la calefacción. Que entre a un espacio cómodo desde el primer segundo.</li>
  <li><strong>Cargador a mano.</strong> Un cable USB accesible resuelve la ansiedad del teléfono en 12%. Un detalle pequeño que se agradece enormemente.</li>
</ul>
<div class="box escenario"><b>Escenario</b>Recoges a un ejecutivo en el aeropuerto de Quito a las 6 a.m. Sube, y lo primero que siente es un olor fuerte a pino. A los dos minutos te pide bajar la ventana. Ese ambientador, que pusiste con buena intención, jugó en tu contra. Un auto que huele a "limpio y neutro" nunca falla.</div>
<div class="box clave"><b>Clave Going</b>Un auto limpio es el primer saludo que das antes de abrir la boca. Prepáralo como si fueras a recibir a alguien en tu casa.</div>

<h2>2. El lanyard: tu insignia de confianza</h2>
<p>Ponte en el lugar de quien viaja: está por subirse al auto de una persona desconocida, a veces de noche, a veces en una ciudad ajena. Tu <strong>lanyard de Going App</strong>, visible, responde en silencio la pregunta más importante que tiene en la cabeza: "¿es este el auto correcto y la persona correcta?".</p>
<ul>
  <li>Úsalo <strong>siempre visible</strong>, no guardado en la guantera.</li>
  <li>Verifica que tu <strong>foto y placa en la app</strong> coincidan con la realidad. Cuando la persona compara lo que ve con lo que dice la app y todo cuadra, se relaja.</li>
</ul>
<div class="box error"><b>Error común</b>Llegar sin identificación visible y esperar a que la pasajera "adivine" que eres su conductor. Esa duda de diez segundos en la vereda es incomodidad pura, y muchas veces se traduce en una estrella menos. La confianza se construye antes de arrancar.</div>

<h2>3. El saludo: los primeros 30 segundos</h2>
<p>El momento del "hola" marca el tono de todo el viaje. No es un guion rígido, sino calidez genuina. Piensa en Carlos, conductor de Imbabura y uno de los mejor calificados de su zona: baja del auto, sonríe de verdad y dice siempre la misma frase.</p>
<blockquote><strong>"¡Bienvenido a Going App! Soy [tu nombre], y estoy aquí para llevarte seguro."</strong></blockquote>
<p>Esas pocas palabras, dichas con una sonrisa real, desarman la ansiedad de cualquiera. Pero el saludo es más que la frase; es un pequeño protocolo:</p>
<ol>
  <li><strong>Baja del vehículo.</strong> Mostrarte —en vez de esperar adentro— comunica respeto y proactividad. Es la diferencia entre un taxi cualquiera y un servicio Going.</li>
  <li><strong>Sonríe de verdad.</strong> La sonrisa forzada se nota; la genuina se contagia. Si tuviste un mal día, respira antes de bajar: la persona no tiene la culpa.</li>
  <li><strong>Muestra el lanyard.</strong> Confirma visualmente quién eres.</li>
  <li><strong>Di la frase de bienvenida</strong> con el nombre de la persona si lo tienes en la app. Escuchar su propio nombre genera confianza al instante.</li>
  <li><strong>Ofrece ayuda con el equipaje</strong> antes de que lo pida.</li>
</ol>
<div class="box escenario"><b>Escenario</b>Una viajera llega agotada tras un vuelo largo. No quiere conversación, solo llegar a su hotel. Tu saludo cálido y breve, sin exceso de charla, es justo lo que necesita. Leer a la persona —cuándo conversar y cuándo dar silencio— es parte del arte de recibir.</div>

<h2>4. El equipaje: hospitalidad en acción</h2>
<p>Ayudar con las maletas es una de las señales de servicio más apreciadas, y muchas conductoras y conductores la olvidan. Ofrécelo de forma natural: "¿Te ayudo con la maleta?". Si la persona prefiere hacerlo sola, respeta su decisión sin insistir. La intención de ayudar ya cuenta.</p>
<div class="box clave"><b>Clave Going</b>Cargar una maleta pesada por alguien mayor, o abrir la puerta bajo la lluvia, son gestos que la gente recuerda mucho después de olvidar la ruta.</div>

<h2>5. Cuando la persona no habla español</h2>
<p>Ecuador recibe viajeras y viajeros de todo el mundo, y muchas veces tú eres el primer ecuatoriano con quien conversan. Esa es una responsabilidad hermosa: eres embajador del país. No necesitas ser bilingüe para recibir bien.</p>
<ul>
  <li>Usa la <strong>traducción del chat de la app</strong> para coordinar cualquier detalle.</li>
  <li>Aprende un puñado de frases de bienvenida. Un simple <em>"Welcome! I'm your Going App driver"</em> con una sonrisa vale muchísimo.</li>
</ul>
<blockquote><em>"Welcome to Ecuador! I'm [tu nombre], your Going driver. You're safe with me."</em></blockquote>
<p>En el curso de <strong>Inglés Turístico Básico</strong> aprenderás las frases más útiles para cada momento del viaje.</p>

<h2>6. Los errores que cuestan estrellas</h2>
<p>Estos son los descuidos más comunes, y cada uno tiene una consecuencia concreta en la confianza y en tu calificación:</p>
<ul>
  <li><strong>Estar en el teléfono cuando llega la persona.</strong> Comunica desinterés desde el primer segundo.</li>
  <li><strong>Pedir datos personales</strong> (número privado, redes). Cruza un límite de privacidad y genera incomodidad. Todo se coordina por la app.</li>
  <li><strong>Comentar sobre política o religión.</strong> Son temas que dividen; tu rol es que la persona se sienta cómoda, no debatir.</li>
  <li><strong>Arrancar sin confirmar el nombre.</strong> Confirmar el nombre evita recoger a la persona equivocada y demuestra atención.</li>
</ul>
<div class="box error"><b>Error común</b>Terminar una llamada personal justo cuando la pasajera sube, sin siquiera saludarla. Esos primeros segundos distraídos pesan más que veinte minutos de buen manejo después.</div>

<h2>En resumen</h2>
<p>La Primera Impresión no depende de la suerte: se prepara. Un auto listo, una identificación visible, un saludo cálido y unos gestos de hospitalidad convierten un simple traslado en una experiencia de cinco estrellas que la gente recomienda. Y cada una de esas experiencias construye, viaje a viaje, la reputación del Ecuador.</p>
`,
    slides: [
      { title: 'Vehículo Going App-ready', points: ['Interior impecable, sin olores fuertes', 'Llantas, frenos, luces revisados', 'Temperatura lista antes de subir', 'Cargador USB a mano'], image: 'https://storage.googleapis.com/going-academy-audio/img/c1-s0.png?v2' },
      { title: 'Identificación visible', points: ['Lanyard siempre visible', 'Foto y placa coinciden con la app', 'Eres tu insignia de confianza'], image: 'https://storage.googleapis.com/going-academy-audio/img/c1-s1.png?v2' },
      { title: 'El saludo Going App', points: ['Sal del auto', 'Sonríe genuinamente', 'Muestra el lanyard', '“¡Bienvenido a Going App! Soy…”'], image: 'https://storage.googleapis.com/going-academy-audio/img/c1-s2.png?v2' },
      { title: 'Equipaje y empatía', points: ['Ayuda activamente con maletas', 'Confirma el nombre del pasajero', 'Usa traducción si no habla español'], image: 'https://storage.googleapis.com/going-academy-audio/img/c1-s3.png?v2' },
      { title: 'Lo que NO hacer', points: ['Nada de teléfono al recibir', 'No pedir datos personales', 'Nada de política ni religión'], image: 'https://storage.googleapis.com/going-academy-audio/img/c1-s4.png?v2' },
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
    manualHtml: `
<p>Son las cinco de la mañana en la vía Riobamba–Quito. La neblina baja del páramo y cubre la carretera como una cortina blanca; apenas ves veinte metros adelante. En el asiento de atrás, una pasajera viaja hacia el aeropuerto para tomar un vuelo internacional. Ella no conoce esta carretera, pero confía en ti. En ese momento entiendes algo esencial: el manejo defensivo no es un tema de examen, es la promesa silenciosa que le haces a cada viajera o viajero de que llegarán bien. En un país tan diverso como el Ecuador, donde en un solo día puedes bajar de un páramo helado a un valle tropical, saber leer la carretera según la región es lo que separa a una conductora o conductor promedio de una embajadora o embajador del Ecuador.</p>

<h2>1. El Ecuador cambia cada hora: aprende a leer la región</h2><p>Ninguna otra ventaja te protege tanto como anticiparte. Manejar en la Costa no es igual que manejar en la Sierra, y la Amazonía tiene sus propias reglas. El manejo defensivo empieza mucho antes de la curva: empieza cuando entiendes qué te va a pedir el terreno. Por eso, antes de salir, tómate treinta segundos para pensar en tu ruta.</p><ul><li><strong>Sierra: altura, curvas y frío.</strong> Vías de montaña con pendientes largas, curvas cerradas y cambios bruscos de clima. Aquí el freno se recalienta si abusas de él en las bajadas y el motor rinde distinto por la altura. La disciplina está en el uso del cambio, no del freno.</li><li><strong>Costa: lluvia tropical y velocidad.</strong> Carreteras más rectas y rápidas que invitan a acelerar, pero un aguacero convierte el asfalto en una pista resbalosa en segundos. El peligro no es la curva, es el exceso de confianza.</li><li><strong>Amazonía: vías estrechas y naturaleza viva.</strong> Tramos angostos, tierra o lastre, lluvia casi diaria y fauna que cruza. Aquí la paciencia es tu mejor neumático.</li></ul><div class="box clave"><b>Clave Going</b>El manejo defensivo no reacciona al peligro: lo anticipa antes de que aparezca.</div>

<h2>2. Sierra: domina la montaña, la altura y la neblina</h2><p>La Sierra es hermosa y traicionera. Las curvas de montaña castigan al que va apurado y la neblina esconde lo que viene. La regla de oro en pendientes largas de bajada es sencilla: usa el freno del motor. Baja un cambio antes de la pendiente para que el motor te ayude a retener y tus frenos no se recalienten. Un freno recalentado deja de responder justo cuando más lo necesitas.</p>

<h3>Curvas de montaña</h3><ul><li><strong>Frena antes, no dentro.</strong> Reduce la velocidad en la recta, antes de entrar. Frenar dentro de la curva desestabiliza el vehículo y puede sacarte del carril.</li><li><strong>Mantén tu carril.</strong> Nunca cortes la curva invadiendo el sentido contrario; en la montaña no sabes qué viene del otro lado.</li><li><strong>Toca la bocina en curvas ciegas.</strong> Un toque corto en las curvas sin visibilidad avisa a quien viene de frente. Es una costumbre que salva vidas en el Ecuador.</li></ul>

<h3>Neblina</h3><p>La neblina del páramo no se combate con luces altas: la luz alta rebota en la humedad y te enceguece más. Usa luces bajas o antiniebla, baja la velocidad y aumenta la distancia con el vehículo de adelante. Si la neblina es tan densa que no ves la vía, no juegues al héroe.</p><div class="box escenario"><b>Escenario</b>Subes El Arenal rumbo a Quito y la neblina se cierra de golpe. En lugar de seguir adivinando la carretera, enciendes las luces bajas, reduces a marcha lenta y buscas un lugar seguro y visible para orillarte con las balizas encendidas hasta que aclare. Le explicas con calma a tu pasajera o pasajero: "Prefiero esperar dos minutos y llegar bien". Eso es profesionalismo, no demora.</div>

<h3>La altura</h3><p>Sobre los 2.800 metros el motor pierde algo de potencia y los adelantamientos toman más distancia de la que crees. No fuerces sobrepasos en subida; espera un tramo recto y despejado. Y recuerda que el frío del páramo puede dejar escarcha en el asfalto de madrugada: trata esas zonas de sombra como si estuvieran mojadas.</p>

<h2>3. Costa: la lluvia tropical y el asfalto que engaña</h2><p>En la Costa el sol te da confianza y la lluvia te la quita en un instante. La primera lluvia después de días secos es la más peligrosa: el agua levanta el aceite y el polvo del asfalto y forma una película resbalosa. Ahí es donde más ocurren los derrapes.</p><ul><li><strong>Baja la velocidad al primer chubasco.</strong> No esperes a sentir que patinas; para entonces ya es tarde.</li><li><strong>Cuidado con el aquaplaning.</strong> Si el agua se acumula, el neumático flota y pierdes control. Si sientes el volante liviano, no frenes de golpe ni gires brusco: suelta el acelerador con suavidad y mantén firme el volante hasta recuperar agarre.</li><li><strong>Duplica la distancia de seguridad.</strong> Sobre mojado, la distancia de frenado se alarga muchísimo. La regla de los dos segundos con el auto de adelante se vuelve de cuatro.</li><li><strong>Revisa tus neumáticos.</strong> Sin buen labrado, el agua no tiene por dónde salir. Un neumático liso en la Costa es una invitación al accidente.</li></ul><div class="box error"><b>Error común</b>Mantener la velocidad de siempre porque "la vía está recta y la conoces". En la Costa, una vía recta y mojada es donde un solo frenazo brusco te cruza el vehículo. La consecuencia no es un susto: es perder el control con pasajeras o pasajeros a bordo.</div>

<h2>4. Amazonía: paciencia, lastre y respeto por la naturaleza</h2><p>La Amazonía te enseña humildad. Las vías son más angostas, muchas de lastre o tierra, y la lluvia es casi una compañera diaria. Aquí la velocidad no es tu aliada; la anticipación sí. Sobre lastre o barro, todos los movimientos deben ser suaves: acelerar suave, frenar suave, girar suave. Cualquier movimiento brusco rompe el agarre.</p><ul><li><strong>Reduce en las curvas ciegas de vegetación.</strong> La maleza tapa lo que viene. Un camión maderero o una moto pueden aparecer sin aviso.</li><li><strong>Atento a la fauna y al ganado.</strong> Animales que cruzan son parte del camino. Baja la velocidad al amanecer y al atardecer, cuando más se mueven.</li><li><strong>Cuida los puentes de un solo carril.</strong> Cede el paso y confirma que el otro lado esté libre antes de cruzar.</li><li><strong>Respeta a la gente de las comunidades.</strong> Al pasar por poblados, baja la velocidad. Vas representando a Going y al Ecuador.</li></ul><div class="box clave"><b>Clave Going</b>En la Amazonía, quien llega primero no gana nada; quien llega bien lo gana todo.</div>

<h2>5. Emergencias viales: qué hacer cuando algo falla</h2><p>Tarde o temprano algo pasa: un pinchazo, una avería, o un tramo cortado. Lo que define a una buena conductora o conductor no es que nunca tenga problemas, sino cómo los maneja cuando llegan. La calma es tu primera herramienta, porque tu pasajera o pasajero va a leer tu reacción antes que la situación misma.</p><ol><li><strong>Oríllate en un lugar seguro y visible.</strong> Nunca te detengas en una curva ciega o en plena vía. Busca un espaldón amplio.</li><li><strong>Enciende las balizas y coloca el triángulo.</strong> A suficiente distancia para que otros vehículos te vean con tiempo, sobre todo en neblina o de noche.</li><li><strong>Baja del lado seguro.</strong> Sal por el lado contrario al tráfico y mantén a las personas fuera de la vía.</li><li><strong>Comunica y usa las herramientas de la app.</strong> Explica con calma qué pasa y qué vas a hacer. Ante cualquier riesgo real para la integridad de las personas, usa el botón SOS y la función de compartir el viaje en vivo. Están ahí para protegerte a ti y a quien viaja contigo.</li><li><strong>Lleva lo básico siempre.</strong> Triángulos, chaleco reflectivo, llanta de emergencia, botiquín y linterna. Revisar esto es parte de tu rutina antes de arrancar, no algo para cuando ya es tarde.</li></ol><div class="box escenario"><b>Escenario</b>En plena vía a Baños sientes que una llanta se desinfla. En vez de frenar en seco, sueltas el acelerador, sujetas firme el volante y buscas orillarte poco a poco en un tramo recto y ancho. Enciendes balizas, colocas el triángulo y le dices a tu pasajera o pasajero: "Todo bajo control, es una llanta y la cambio en unos minutos". El problema es el mismo; la diferencia es que nadie sintió miedo.</div>

<h2>6. Antes de arrancar: la rutina que nunca falla</h2><p>La mayoría de emergencias se previenen en el parqueadero, no en la carretera. Un chequeo de dos minutos antes de cada jornada te ahorra la mitad de los sustos. No es burocracia: es respeto por tu oficio.</p><ul><li><strong>Neumáticos:</strong> presión y labrado. Son tu único contacto con el suelo.</li><li><strong>Frenos y luces:</strong> que respondan y que se vean, sobre todo antiniebla y balizas.</li><li><strong>Descanso y sobriedad:</strong> el cansancio reacciona igual de lento que el alcohol. Si tienes sueño, para. Ninguna carrera vale un microsueño.</li><li><strong>Cinturón para todos:</strong> pídelo con amabilidad apenas suben. Es tu primera regla de seguridad y la das con tu saludo oficial: "Bienvenido a Going App, soy [tu nombre]".</li></ul><blockquote>"El mejor freno del vehículo es la conductora o el conductor que sabe cuándo bajar la velocidad."</blockquote>

<h2>En resumen</h2><p>Manejar seguro en el Ecuador es entender que cada región te habla en su propio idioma: la Sierra te pide respeto por la montaña y la neblina, la Costa te exige humildad frente a la lluvia, y la Amazonía te enseña paciencia. El manejo defensivo se resume en una sola idea: anticipa, reduce y comunica. Cuando conduces así, no solo evitas accidentes; conviertes cada viaje en una muestra de lo mejor de nuestra gente. Esa pasajera o pasajero que llega tranquila y a tiempo al aeropuerto no olvidará tu calma, y eso es exactamente lo que te lleva de Aliado Bronce a Plata y a Oro. Cada vez que enciendes el motor con esta mentalidad, eres embajadora o embajador del Ecuador, y esas cinco estrellas dejan de ser una meta: se vuelven la consecuencia natural de manejar bien.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/c2-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/c2-echo.mp3',
    slides: [
      { title: 'Manejo defensivo', points: ['Anticipa el error de los demás', 'Regla de 3 segundos (doble con lluvia)', 'Cinturón para todos', 'Teléfono en soporte, nunca en la mano'], image: 'https://storage.googleapis.com/going-academy-audio/img/c2-s0.png?v2' },
      { title: 'Sierra', points: ['Reduce antes de la curva', 'Neblina: luces bajas', 'Pendientes: usa freno motor'], image: 'https://storage.googleapis.com/going-academy-audio/img/c2-s1.png?v2' },
      { title: 'Costa', points: ['Primer aguacero = asfalto resbaloso', 'Hidroplaneo: suelta el acelerador', 'Revisa llantas y temperatura'], image: 'https://storage.googleapis.com/going-academy-audio/img/c2-s2.png?v2' },
      { title: 'Amazonía', points: ['Lastre/barro: lento y constante', 'Atento a fauna y peatones', 'Avisa tu ruta; lleva combustible extra'], image: 'https://storage.googleapis.com/going-academy-audio/img/c2-s3.png?v2' },
      { title: 'Emergencia vial', points: ['Oríllate y luces de emergencia', 'Señaliza con triángulos', 'Protege a los pasajeros', 'Llama al 911 / botón SOS'], image: 'https://storage.googleapis.com/going-academy-audio/img/c2-s4.png?v2' },
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
    manualHtml: `
<p>Son las 5 de la mañana en la Panamericana, entre Riobamba y Quito. Vas con tres pasajeros dormidos, el aeropuerto los espera para un vuelo a las 8, y de pronto sientes ese golpeteo sordo en el volante: una llanta se está desinflando. No hay taller abierto, no hay grúa cerca, y el reloj corre. Ese momento decide dos cosas: si tus pasajeras y pasajeros pierden su vuelo, y si tú pierdes tu ingreso del día. La mecánica preventiva no es un tema de tornillos; es lo que separa a una conductora o conductor que gana con tranquilidad de quien vive apagando incendios. Tu vehículo es tu herramienta de trabajo, tu oficina y tu carta de presentación. Cuidarlo hoy, cinco minutos al día, es cuidar tu ingreso de mañana.</p>

<h2>1. La revisión diaria: cinco minutos que valen el día</h2>
<p>La mayoría de las fallas en carretera no llegan de sorpresa: avisan antes, pero nadie las estaba escuchando. Por eso, antes de tu primer viaje, dedica cinco minutos a una vuelta completa alrededor del auto. No es paranoia, es profesionalismo: revisas cuando estás tranquilo en tu casa, no cuando ya tienes gente a bordo y la presión encima.</p>
<ul>
<li><strong>Las cuatro llantas, con la mirada y con la mano.</strong> Busca que ninguna se vea más baja que las demás, revisa que no haya clavos, cortes ni abultamientos en el flanco. Un abultamiento es una llanta a punto de reventar; no la ignores.</li>
<li><strong>Luces completas.</strong> Direccionales, freno, reversa, altas y bajas. En la Sierra manejas con neblina y en la Costa con aguaceros: una luz de freno quemada es un choque esperando ocurrir, y también una multa.</li>
<li><strong>Limpiaparabrisas y agua del depósito.</strong> Suena menor hasta que un camión te lanza lodo en plena Ruta Viva y no ves nada por diez segundos a 90 km/h.</li>
<li><strong>Debajo del auto.</strong> Da un vistazo al piso donde estuvo estacionado. Una mancha fresca de aceite, refrigerante o líquido de frenos te avisa de una fuga antes de que sea una avería.</li>
</ul>

<div class="box escenario"><b>Escenario</b> Recoges a una viajera para un intercity programado con tarifa fija. Como revisaste las llantas en casa y notaste una baja de presión, la inflaste antes de salir. Llegas puntual, ella ni se entera del riesgo que evitaste, y te califica con cinco estrellas por un viaje "sin novedad". Esa tranquilidad la construiste tú a las 4:50 a.m.</div>

<h2>2. Niveles de fluidos: la sangre de tu vehículo</h2>
<p>Un motor puede fallar por falta de un líquido que cuesta pocos dólares. Aprender a revisar niveles no te convierte en mecánica o mecánico, pero te da el poder de detectar un problema barato antes de que se vuelva uno caro. Hazlo con el motor frío y el auto en piso plano, una o dos veces por semana.</p>
<h3>Los que debes conocer sí o sí</h3>
<ol>
<li><strong>Aceite del motor.</strong> Saca la varilla, límpiala, vuélvela a meter y mira que el nivel quede entre las dos marcas. Aceite muy bajo o negro y espeso pide cambio. Sin aceite, un motor se funde en minutos, y eso es una reparación de cientos o miles de dólares.</li>
<li><strong>Refrigerante.</strong> Revisa el depósito, nunca abras el radiador en caliente. En la Costa y la Amazonía, con calor y humedad, el motor sufre más; un refrigerante bajo termina en sobrecalentamiento.</li>
<li><strong>Líquido de frenos.</strong> Si el nivel baja solo, sospecha de una fuga o de pastillas muy gastadas. Los frenos no se negocian.</li>
<li><strong>Líquido de la dirección y agua del limpiaparabrisas.</strong> Sencillos de completar, marcan la diferencia entre un manejo suave y uno áspero.</li>
</ol>

<div class="box clave"><b>Clave Going</b> Un fluido a tiempo cuesta monedas; una avería por descuido cuesta tu semana de trabajo.</div>

<div class="box error"><b>Error común</b> Rellenar el aceite con "lo que había en casa" o mezclar refrigerante con agua de la llave. La consecuencia: obstrucciones, corrosión y un motor que se recalienta justo cuando llevas pasajeros y no puedes parar.</div>

<h2>3. Cambio de llanta en ruta: tu independencia sobre el asfalto</h2>
<p>Tarde o temprano vas a pinchar una llanta lejos de todo. Saber cambiarla tú es lo que convierte una emergencia de dos horas en una pausa de veinte minutos. No dependas de que alguien pase a ayudarte: en un tramo solitario de la Sierra, esa espera puede ser larga y riesgosa.</p>
<h3>Antes de arrancar el día, ten esto listo</h3>
<ul>
<li><strong>Llanta de emergencia con aire.</strong> Una llanta de repuesto desinflada no sirve de nada. Revísala igual que las otras.</li>
<li><strong>Gata y llave de ruedas completas.</strong> Confirma que estén en el auto y que la llave calce en tus pernos.</li>
<li><strong>Triángulos o señalización y un chaleco reflectivo.</strong> Tu seguridad primero; nadie cambia una llanta con carros pasando a un metro sin avisarles.</li>
</ul>
<h3>Los pasos, con calma</h3>
<ol>
<li>Oríllate a un lugar plano, firme y visible. Enciende las luces de emergencia y coloca la señalización varios metros atrás.</li>
<li>Afloja los pernos un poco <em>antes</em> de levantar el auto con la gata, nunca después.</li>
<li>Levanta, retira los pernos, cambia la llanta y ajústalos en cruz para que asiente parejo.</li>
<li>Baja el auto y da el apriete final. Maneja despacio hasta un taller para la reparación definitiva.</li>
</ol>

<div class="box escenario"><b>Escenario</b> Pinchas en la vía a Baños con dos huéspedes que van a un tour. En lugar de improvisar, les explicas con calma: "Tranquilos, es una llanta, en veinte minutos seguimos". Colocas los triángulos, haces el cambio con seguridad y retomas. Ellos cuentan después que se sintieron en manos de alguien que sabía lo que hacía. Eso también es turismo colaborativo bien hecho.</div>

<blockquote>"No fue que no tuviera problemas; fue que supo resolverlo sin ponernos nerviosos." Así describe una pasajera a la conductora que le dio confianza en plena carretera.</blockquote>

<h2>4. Señales de alerta: aprende a escuchar tu vehículo</h2>
<p>Tu auto te habla todo el tiempo, con ruidos, olores, vibraciones y luces. La diferencia entre quien previene y quien se vara está en prestar atención al primer aviso, no al décimo. Cuando algo cambia, tu vehículo te está pidiendo ayuda.</p>
<ul>
<li><strong>Ruidos nuevos.</strong> Un chirrido al frenar suele ser pastillas gastadas; un golpeteo en curvas puede ser suspensión. Lo nuevo casi nunca es bueno.</li>
<li><strong>Olores.</strong> A quemado puede ser embrague o frenos; a dulce, refrigerante; a gasolina, una fuga peligrosa. No sigas manejando "a ver si pasa".</li>
<li><strong>Vibraciones.</strong> En el volante a cierta velocidad, suele ser balanceo o alineación; al frenar, discos deformados.</li>
<li><strong>Luces del tablero.</strong> El testigo de aceite o de temperatura en rojo significa <em>detente ahora</em>. El de motor (amarillo) significa <em>revisa pronto</em>. Aprende qué dice cada uno en tu vehículo.</li>
</ul>

<div class="box clave"><b>Clave Going</b> La falla barata avisa temprano y bajito; la cara aparece de golpe. Escucha la primera para no pagar la segunda.</div>

<h2>5. Cuándo ir al taller: antes de que sea urgente</h2>
<p>El mejor momento para ir al taller es cuando tú decides, no cuando el auto decide por ti en medio de un viaje. Un mantenimiento programado es barato, rápido y lo agendas en tu día libre. Una emergencia es cara, te deja sin trabajar y arruina viajes ya aceptados.</p>
<ul>
<li><strong>Mantenimiento por kilometraje.</strong> Cambio de aceite y filtros según lo que indique tu manual. Llevar tú un registro simple de fechas y kilómetros te evita olvidos.</li>
<li><strong>Frenos y llantas por desgaste.</strong> Revisa pastillas y profundidad del labrado con regularidad. Una llanta lisa en carretera mojada de la Costa no frena, patina.</li>
<li><strong>Cualquier señal de alerta que no cede.</strong> Si el ruido, el olor o la luz siguen, no lo pospongas "hasta el fin de semana": agenda ya.</li>
<li><strong>Revisión general periódica.</strong> Una vez al mes, deja que alguien de confianza revise lo que tú no ves: suspensión, mangueras, correas, batería.</li>
</ul>

<div class="box error"><b>Error común</b> Aplazar un ruido de frenos "porque todavía frena". La consecuencia: pasas de un cambio de pastillas económico a rectificar o cambiar discos, y arriesgas no frenar a tiempo con pasajeros a bordo. Lo barato se volvió caro y peligroso.</div>

<div class="box escenario"><b>Escenario</b> Notas que el testigo de temperatura empieza a subir en un intracity urbano. En vez de "aguantar" hasta terminar el turno, terminas el viaje en curso con cuidado, no aceptas más carreras y llevas el auto a revisar. Descubren una manguera a punto de romperse. Perdiste una tarde; evitaste fundir el motor y quedarte semanas sin ingresar.</div>

<h2>6. Tu vehículo cuidado es tu mejor socio</h2>
<p>Cuando tu auto está en orden, todo lo demás fluye: llegas puntual a los intercity programados, cumples con los avisos de una hora y cinco minutos antes sin sobresaltos, mantienes tu calificación por encima de las 4.5 estrellas y avanzas hacia tu nivel Aliado Plata y Oro. La mecánica preventiva no compite con tu tiempo, lo protege.</p>
<blockquote>"El auto no me falla, porque yo no le fallo a él." Esa frase, de una conductora Aliada Oro, resume toda esta materia.</blockquote>

<h2>En resumen</h2>
<p>Cuidar tu vehículo es cuidar a las viajeras y viajeros que confían en ti, y es cuidar el ingreso que sostiene a tu familia. Cinco minutos de revisión diaria, unos niveles de fluidos al día, saber cambiar una llanta con calma, escuchar las señales de alerta e ir al taller antes de que sea urgente: eso es lo que convierte cada viaje en una experiencia segura y sin sorpresas. Un vehículo confiable te hace un embajador o embajadora del Ecuador que mueve a la gente por la Costa, la Sierra, la Amazonía y Galápagos con la certeza de que llegará bien. Y esa certeza, viaje tras viaje, es exactamente lo que te devuelve las cinco estrellas.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/c3-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/c3-echo.mp3',
    slides: [
      { title: 'Chequeo diario', points: ['Luces completas', 'Llantas: presión y estado', 'Aceite y fluidos', 'Combustible y frenos'], image: 'https://storage.googleapis.com/going-academy-audio/img/c3-s0.png?v2' },
      { title: 'Cambiar llanta', points: ['Afloja pernos antes de levantar', 'Gata en el punto correcto', 'Aprieta en cruz, no en círculo', 'Repuesto “galleta”: máx. 80 km/h'], image: 'https://storage.googleapis.com/going-academy-audio/img/c3-s1.png?v2' },
      { title: 'Niveles', points: ['Aceite con motor frío', 'Refrigerante: nunca en caliente', 'Frenos y dirección en rango', 'Agua de limpiaparabrisas'], image: 'https://storage.googleapis.com/going-academy-audio/img/c3-s2.png?v2' },
      { title: 'Señales de alerta', points: ['Check engine encendido', 'Ruidos u olores nuevos', 'Vibraciones en el volante'], image: 'https://storage.googleapis.com/going-academy-audio/img/c3-s3.png?v2' },
      { title: 'Regla de oro', points: ['Taller a tiempo cuesta menos', 'Evita perder días de trabajo', 'Vehículo cuidado = ingreso seguro'], image: 'https://storage.googleapis.com/going-academy-audio/img/c3-s4.png?v2' },
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
    manualHtml: `
<p>Son las cinco de la tarde en el aeropuerto de Quito. Una pareja de turistas baja con maletas grandes, sombreros nuevos y esa mirada de quien acaba de aterrizar en un país que no conoce. Te buscan entre la gente, ven tu lanyard de Going App y se acercan aliviados. Tú abres la puerta, sonríes y dices: "Welcome to Going App, I'm Carlos". En ese instante, aunque no domines el inglés, esas cuatro palabras hicieron algo enorme: convirtieron a dos extraños nerviosos en huéspedes que sienten que llegaron a buenas manos. El inglés turístico básico no es para dar cátedra; es para que ninguna viajera o viajero del mundo se sienta perdido en tu auto. Ecuador es Costa, Sierra, Amazonía y Galápagos, y tú eres su primer rostro. Empecemos.</p>

<h2>1. El saludo que abre todas las puertas</h2>
<p>El primer minuto define el viaje entero. Una persona que no habla español llega tensa: no sabe si subió al auto correcto, si el precio cambiará, si la entenderán. Tu saludo en inglés desactiva ese miedo de golpe. No necesitas acento perfecto; necesitas calidez y claridad. Practica estas frases hasta decirlas sin pensar, porque cuando salen naturales, transmiten confianza.</p>
<ul>
<li><strong>"Welcome to Going App, I'm [tu nombre]."</strong> Es el saludo oficial traducido. Dilo mirando a los ojos y señalando tu lanyard. Así confirmas que eres la conductora o el conductor correcto.</li>
<li><strong>"How are you? Welcome to Ecuador!"</strong> (¿Cómo estás? ¡Bienvenido a Ecuador!). Una frase corta que rompe el hielo y planta la semilla de la hospitalidad.</li>
<li><strong>"Let me help you with your bags."</strong> (Déjame ayudarte con tus maletas). Ofrecer ayuda antes de que la pidan es un gesto universal que se entiende sin traducir.</li>
<li><strong>"Please, come in. Take your time."</strong> (Por favor, pasa. Tómate tu tiempo). Nadie que acaba de bajar de un vuelo largo quiere sentir prisa.</li>
</ul>
<div class="box escenario"><b>Escenario</b> Recoges a una turista estadounidense en el Mariscal Sucre. Ella pregunta nerviosa: "Going App? Carlos?". Tú respondes: "Yes! Welcome to Going App, I'm Carlos", tocas tu lanyard y muestras la pantalla con su nombre. En dos segundos su cara pasa del susto a la sonrisa. Confirmar la identidad en inglés es también seguridad.</div>

<h2>2. Confirmar el viaje sin malentendidos</h2>
<p>Un turista teme dos cosas: ir al lugar equivocado y pagar de más. En Going App las tarifas intercity son FIJAS y se avisan con anticipación, así que tú no negocias precios. Tu trabajo es confirmar el destino con calma. Repetir el nombre del lugar en voz alta evita el 90% de los enredos.</p>
<ul>
<li><strong>"Are we going to [destino]? Is that correct?"</strong> (¿Vamos a [destino]? ¿Es correcto?). Espera el "yes" antes de arrancar.</li>
<li><strong>"The price is fixed. No surprises."</strong> (El precio es fijo. Sin sorpresas). Esta frase tranquiliza muchísimo a quien viene de países donde los taxis inflan tarifas.</li>
<li><strong>"You can pay by card, wallet or cash. Whatever you prefer."</strong> (Puedes pagar con tarjeta, billetera o efectivo. Lo que prefieras).</li>
<li><strong>"The trip is about [número] minutes."</strong> (El viaje es de unos [número] minutos). Da una noción de tiempo; reduce la ansiedad de "¿cuánto falta?".</li>
</ul>
<div class="box clave"><b>Clave Going</b> Tú no negocias precios: los confirmas. Repetir "fixed price" en voz alta convierte una posible discusión en tranquilidad.</div>

<h2>3. El chat de la app es tu copiloto que traduce</h2>
<p>Aquí está tu superpoder, y muchos conductores lo olvidan: el chat de Going App tiene traducción automática. Cuando una frase se te complica o el pasajero quiere explicar algo largo, no fuerces un inglés que no tienes. Escribe en español en el chat y le llega traducido; él escribe en inglés y te llega en español. El teléfono se vuelve un intérprete de bolsillo.</p>
<h3>Cómo usarlo bien</h3>
<ol>
<li><strong>Frases cortas.</strong> Escribe "¿Prefieres aire acondicionado o ventana abierta?" en vez de párrafos. La traducción de oraciones simples es mucho más fiel.</li>
<li><strong>Una idea por mensaje.</strong> No mezcles ruta, pago y recomendación en el mismo texto; sepáralos para que se traduzcan limpios.</li>
<li><strong>Detente en un lugar seguro para escribir.</strong> Nunca uses el chat manejando. Si necesitas coordinar algo, orillate primero.</li>
</ol>
<blockquote>"No hablo mucho inglés, pero con el chat nos entendimos perfecto. Escribí todo en español y a ella le llegaba en inglés. Me calificó con cinco estrellas y escribió 'best driver in Ecuador'." — Testimonio de un aliado de Riobamba</blockquote>
<div class="box error"><b>Error común</b> Quedarse mudo por vergüenza al inglés y manejar en silencio incómodo todo el trayecto. La consecuencia: el turista se siente ignorado y baja la calificación, aunque el viaje fuera seguro. El chat traductor existe justo para que eso nunca pase.</div>

<h2>4. Frases de a bordo: comodidad y pequeñas charlas</h2>
<p>Un viaje de veinte minutos en silencio se siente eterno para un visitante curioso. No necesitas conversar sin parar, pero unas cuantas frases amables hacen que la persona se sienta cuidada y, de paso, abren la puerta a que descubra el Ecuador. Recuerda: pregunta antes de actuar, porque cada quien viaja distinto.</p>
<ul>
<li><strong>"Are you comfortable? Too cold, too hot?"</strong> (¿Estás cómodo? ¿Mucho frío, mucho calor?). Clave en la Sierra, donde el clima quiteño sorprende a todos.</li>
<li><strong>"Do you want music? What kind?"</strong> (¿Quieres música? ¿De qué tipo?).</li>
<li><strong>"Is this your first time in Ecuador?"</strong> (¿Es tu primera vez en Ecuador?). Una pregunta que casi siempre despierta una sonrisa y una conversación.</li>
<li><strong>"On your left you can see the mountains."</strong> (A tu izquierda puedes ver las montañas). Señalar el paisaje te convierte en anfitriona o anfitrión, no solo en chofer.</li>
<li><strong>"Do you need to stop for water or a bathroom?"</strong> (¿Necesitas parar por agua o un baño?). En trayectos intercity largos, este detalle vale oro.</li>
</ul>
<div class="box escenario"><b>Escenario</b> Llevas a una familia alemana de Quito a Otavalo. A mitad de camino señalas: "On your right, a volcano". Los niños se pegan a la ventana emocionados. No dijiste una frase perfecta, pero les regalaste un recuerdo. Eso es ser embajador del Ecuador.</div>
<div class="box clave"><b>Clave Going</b> No tienes que hablar mucho inglés; tienes que hacer sentir bienvenida a la persona. Una frase amable a tiempo vale más que un párrafo perfecto.</div>

<h2>5. Seguridad y pagos explicados con calma</h2>
<p>Los turistas valoran enormemente sentirse seguros, y Going App tiene herramientas para eso. Explicarlas en inglés básico transmite profesionalismo. Al final del viaje, el token de fin de viaje y el pago son momentos donde un malentendido arruina la experiencia; anticípalos con frases claras.</p>
<ul>
<li><strong>"You can share your trip live for safety."</strong> (Puedes compartir tu viaje en vivo por seguridad). Muchos lo agradecen, sobre todo quien viaja solo.</li>
<li><strong>"This is my ID and the plate number, you can check."</strong> (Esta es mi identificación y la placa, puedes verificar). Invitar a verificar genera confianza, no sospecha.</li>
<li><strong>"At the end, I'll ask for a code to confirm the trip."</strong> (Al final te pediré un código para confirmar el viaje). Así el token de fin de viaje no lo toma por sorpresa.</li>
<li><strong>"How would you like to pay? Card, wallet or cash?"</strong> (¿Cómo te gustaría pagar? ¿Tarjeta, billetera o efectivo?).</li>
</ul>
<div class="box error"><b>Error común</b> Pedir el token de fin de viaje de golpe y sin explicar, con un inglés brusco. La consecuencia: el turista cree que es un cobro extra o una estafa, se pone a la defensiva y termina el viaje con desconfianza. Anúncialo antes con "I'll ask for a code" y todo fluye.</div>

<h2>6. La despedida que gana las cinco estrellas</h2>
<p>El último minuto pesa tanto como el primero. La persona decide su calificación mientras baja del auto, y una despedida cálida sella la buena impresión. Aquí no improvises: ten tus frases listas y dilas con una sonrisa genuina.</p>
<ul>
<li><strong>"We arrived! Here we are."</strong> (¡Llegamos! Aquí estamos).</li>
<li><strong>"Let me help you with your bags."</strong> Ayudar a bajar el equipaje cierra el círculo que abriste al recibir.</li>
<li><strong>"Enjoy Ecuador! Have a great trip."</strong> (¡Disfruta Ecuador! Que tengas un gran viaje).</li>
<li><strong>"Thank you for traveling with Going App. Take care!"</strong> (Gracias por viajar con Going App. ¡Cuídate!).</li>
<li><strong>"If you liked the trip, your rating helps me a lot. Thank you!"</strong> (Si te gustó el viaje, tu calificación me ayuda mucho. ¡Gracias!). Pedirlo con amabilidad, sin presionar, es válido y funciona.</li>
</ul>
<blockquote>"Have a great trip, enjoy Ecuador!" — Cinco palabras que, dichas con una sonrisa, se recuerdan más que el viaje entero.</blockquote>

<h2>En resumen</h2>
<p>No necesitas ser bilingüe para atender al mundo: necesitas un puñado de frases sinceras, tu lanyard visible, el chat traductor de Going App como copiloto y el corazón abierto de quien recibe visitas en su casa. La calificación mínima en Going es 4.5 estrellas, y cada nivel Aliado —Bronce, Plata, Oro— se construye sobre viajes donde la gente se sintió bienvenida. Cuando saludas con "Welcome to Going App" y te despides con "Enjoy Ecuador", dejas de ser solo una conductora o un conductor: te vuelves la primera y la última imagen que esa viajera o ese viajero se lleva de nuestro país. Habla el inglés que tengas, apóyate en la app para el resto, y cada turista bajará de tu auto con una historia buena que contar y cinco estrellas para ti.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/c4-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/c4-echo.mp3',
    slides: [
      { title: 'Bienvenida', points: ['Welcome to Going App! I\'m [name].', 'Let me help with your luggage.', 'Please, fasten your seatbelt.'], image: 'https://storage.googleapis.com/going-academy-audio/img/c4-s0.png?v2' },
      { title: 'Durante el viaje', points: ['We are going to [place].', 'The trip takes about 20 minutes.', 'Is the temperature okay?', 'Do you need a stop?'], image: 'https://storage.googleapis.com/going-academy-audio/img/c4-s1.png?v2' },
      { title: 'Recomendaciones', points: ['This is a good place to eat.', 'Try the local food.', 'Take care of your belongings.'], image: 'https://storage.googleapis.com/going-academy-audio/img/c4-s2.png?v2' },
      { title: 'Pago y despedida', points: ['You can pay by card or cash.', 'Have a great trip!', 'Please rate your trip. Thank you!'], image: 'https://storage.googleapis.com/going-academy-audio/img/c4-s3.png?v2' },
      { title: 'Si no entiendes', points: ['Could you repeat that?', 'I\'ll use the app to translate.', 'Una sonrisa siempre ayuda'], image: 'https://storage.googleapis.com/going-academy-audio/img/c4-s4.png?v2' },
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
    manualHtml: `
<p>Son las 5:40 de la mañana en la vía Riobamba–Quito. Llevas tres pasajeros rumbo al aeropuerto y, en la subida hacia el páramo de Chimborazo, una viajera del asiento trasero empieza a sudar frío, se pone pálida y dice que se marea. No hay hospital a la vista, ni señal de otro auto. En ese instante, tú no eres solo quien conduce: eres la primera persona que puede ayudarla. Saber qué hacer en esos minutos no te convierte en médico, pero sí puede marcar la diferencia entre un susto que se resuelve en la cuneta y una emergencia que se complica. Este manual existe para que, cuando algo pase en ruta, tus manos sepan qué hacer aunque el corazón te lata fuerte.</p>

<h2>1. La calma es tu primer instrumento</h2>
<p>Antes del botiquín, antes del ECU 911, lo primero que una persona en apuros necesita es ver que quien la acompaña no está en pánico. El miedo es contagioso, pero la serenidad también. Si tú respiras hondo y hablas pausado, la pasajera o el pasajero baja su propio nivel de alarma, y eso ya ayuda al cuerpo a estabilizarse.</p>
<ul>
<li><strong>Detente en un lugar seguro primero.</strong> Nunca atiendas una emergencia mientras manejas. Orilla el vehículo fuera de la vía, enciende las luces intermitentes y coloca el triángulo si el punto es peligroso. Un segundo accidente por atender el primero es el error que más vidas cuesta.</li>
<li><strong>Habla con voz firme y amable.</strong> "Estoy contigo, ya me detuve, vamos a resolver esto juntos." Nombrar lo que haces le devuelve control a la persona.</li>
<li><strong>Observa antes de tocar.</strong> ¿Respira? ¿Responde cuando le hablas? ¿Hay sangre, golpe o solo malestar? Tres segundos de mirada ordenada valen más que diez minutos de movimientos sin rumbo.</li>
</ul>
<div class="box clave"><b>Clave Going</b>Tu calma es el primer medicamento que administras: nadie se estabiliza al lado de alguien que grita.</div>

<h2>2. Evaluar sin diagnosticar</h2>
<p>Tú no vas a poner un diagnóstico, y no debes intentarlo. Tu trabajo es distinguir entre "esto se maneja aquí" y "esto necesita al ECU 911 ya". Para eso existe una secuencia sencilla que los rescatistas usan y que cualquiera puede recordar.</p>
<h3>El chequeo rápido</h3>
<ol>
<li><strong>Conciencia.</strong> Habla y toca el hombro. Si responde, respira y piensa, tienes tiempo. Si no responde, es una emergencia mayor.</li>
<li><strong>Respiración.</strong> Mira si el pecho sube y baja, escucha, siente el aire. Diez segundos bastan.</li>
<li><strong>Señales de gravedad.</strong> Labios morados, dolor fuerte en el pecho, dificultad para hablar, un lado de la cara caído, sangrado que no para. Cualquiera de estas manda a llamar de inmediato.</li>
</ol>
<p>En la altura de la Sierra, muchos malestares son leves: mareo por el soroche, náusea del vuelo, baja de azúcar por viajar en ayunas. Estos se atienden con calma, aire y agua. Pero si la persona no mejora en pocos minutos o empeora, no te quedes esperando.</p>
<div class="box escenario"><b>Escenario</b>Una huésped mayor que recoges en Quito para un tour a Cotopaxi se queja de mareo y hormigueo en un brazo. No es solo el soroche: dolor de pecho o brazo dormido son señales de alarma. Detente, mantenla sentada y tranquila, y llama al ECU 911 sin dudar. Es mejor una llamada de más que una de menos.</div>

<h2>3. El botiquín: conócelo antes de necesitarlo</h2>
<p>Un botiquín sirve solo si sabes qué tiene y dónde está. De nada vale un maletín perfecto en la cajuela si, en la urgencia, tienes que vaciar el equipaje para encontrarlo. Revísalo cada semana, igual que revisas llantas y aceite.</p>
<ul>
<li><strong>Ubícalo al alcance, no en el fondo.</strong> Debajo del asiento o en la puerta trasera. Los segundos cuentan.</li>
<li><strong>Lo esencial:</strong> guantes desechables, gasas y vendas estériles, esparadrapo, tijeras, suero fisiológico para limpiar heridas, agua embotellada y algo dulce (caramelo o gel) para bajas de azúcar.</li>
<li><strong>Guantes siempre.</strong> Antes de tocar sangre o fluidos, protégete. No es distancia con la persona: es cuidar tu salud para poder seguir ayudando.</li>
<li><strong>Para un sangrado:</strong> presiona directo sobre la herida con una gasa limpia y no la levantes para "ver cómo va". La presión constante es lo que detiene la hemorragia.</li>
</ul>
<div class="box error"><b>Error común</b>Dar pastillas o medicamentos propios "para el dolor" o "para el mareo". No sabes alergias ni condiciones de la persona, y un analgésico equivocado puede agravar todo. El botiquín es para heridas y apoyo básico, no para automedicar.</div>

<h2>4. RCP básico: cuando el corazón se detiene</h2>
<p>Es la situación que nadie quiere, pero para la que todos debemos estar listos. Si una persona no responde y no respira con normalidad, cada minuto sin compresiones reduce muchísimo sus posibilidades. La reanimación cardiopulmonar mantiene la sangre moviéndose hasta que llegue la ayuda profesional.</p>
<h3>Los pasos que salvan</h3>
<ol>
<li><strong>Confirma y llama.</strong> No responde, no respira: llama al ECU 911 de inmediato o pide a alguien que lo haga mientras tú empiezas. Pon el altavoz.</li>
<li><strong>Coloca las manos.</strong> Centro del pecho, una mano sobre la otra, brazos rectos.</li>
<li><strong>Comprime fuerte y rápido.</strong> Unas 100 a 120 compresiones por minuto, hundiendo el pecho unos 5 centímetros. El ritmo de la canción "La Bamba" te sirve de guía.</li>
<li><strong>No te detengas.</strong> Sigue hasta que la persona reaccione o llegue la ambulancia. Si hay alguien más, túrnense para no agotarse.</li>
</ol>
<p>El ECU 911 tiene operadores que te guían por teléfono paso a paso, incluso si nunca lo has hecho. No estás solo en esto: solo tienes que empezar y seguir sus indicaciones.</p>
<blockquote>"No sabía nada de primeros auxilios, pero la operadora del 911 me fue diciendo cada movimiento por el teléfono. Solo tuve que hacerle caso y no parar." — Conductor Going, ruta Santo Domingo–Quito.</blockquote>
<div class="box clave"><b>Clave Going</b>Ante una persona que no respira, unas compresiones imperfectas valen infinitamente más que la perfección que nunca empieza.</div>

<h2>5. El ECU 911 es tu aliado, no tu último recurso</h2>
<p>Muchas personas dudan en llamar por miedo a "molestar" o a exagerar. Ese titubeo cuesta minutos preciosos. El ECU 911 es gratuito, funciona en todo el Ecuador y prefiere una llamada de precaución antes que una tragedia evitable.</p>
<ul>
<li><strong>Llama sin dudar si:</strong> la persona no responde, no respira bien, tiene dolor de pecho, un lado del cuerpo debilitado, convulsiones, o un sangrado que no cede.</li>
<li><strong>Da datos claros y cortos:</strong> qué pasó, cuántas personas, y tu ubicación exacta. Usa la app para leer la dirección o el kilómetro de la vía; en carretera, menciona referencias como un peaje, un puente o un pueblo cercano.</li>
<li><strong>No cuelgues hasta que te lo digan.</strong> El operador puede necesitar más datos o guiarte mientras llega la ambulancia.</li>
<li><strong>Usa las herramientas de seguridad de la app.</strong> El botón SOS y compartir tu viaje en vivo permiten que otros sepan dónde estás y qué ocurre, un respaldo real cuando tus manos están ocupadas atendiendo.</li>
</ul>
<div class="box escenario"><b>Escenario</b>Un choque leve en la Panamericana: nadie parece herido, pero una pasajera se toca el cuello y le cuesta moverlo. No la muevas ni le pidas que "camine para ver". Ante posible lesión de columna o cuello, mantenla quieta, cálmala y deja que el ECU 911 decida. Mover a alguien mal puede causar el daño que aún no existía.</div>

<h2>6. Después de la emergencia: cuidar y acompañar</h2>
<p>Cuando lo peor pasó, tu rol no termina. La persona puede quedar asustada, temblando o avergonzada por lo ocurrido. Un buen acompañamiento humano cierra la experiencia con dignidad y confianza.</p>
<ul>
<li><strong>Quédate cerca.</strong> Ofrece agua, abrigo y palabras tranquilas mientras se recupera o llega la ayuda.</li>
<li><strong>Respeta su intimidad.</strong> No hagas fotos ni comentes el episodio con extraños. Lo que pasó es asunto de esa persona.</li>
<li><strong>Reporta por la app.</strong> Deja constancia de lo ocurrido a soporte Going. Sirve para el respaldo de la viajera o el viajero y para tu propia protección.</li>
<li><strong>Cuídate tú también.</strong> Atender una emergencia agota. Si quedas alterado, no retomes la ruta de inmediato; respira, toma agua y recupera el pulso antes de volver al volante.</li>
</ul>
<div class="box error"><b>Error común</b>Seguir el viaje "para no perder el itinerario" cuando la persona aún se siente mal o tú estás nervioso. La prisa después de un susto provoca segundos accidentes. La ruta espera; la salud, no.</div>

<h2>En resumen</h2>
<p>Ser conductora o conductor de Going App es mucho más que llevar a alguien de un punto a otro: es cuidar a cada viajera y viajero como cuidarías a tu propia familia. En una emergencia, tu calma, tu botiquín listo, unas compresiones a tiempo y una llamada oportuna al ECU 911 son el rostro más noble del Ecuador que recibe. Cuando una persona baja de tu auto diciendo "gracias, no sé qué habría hecho sin ti", esas cinco estrellas ya están ganadas, y tu nivel Aliado —Bronce, Plata u Oro— refleja algo más grande: que en la ruta, con las montañas de la Sierra o el calor de la Costa de fondo, hubo alguien preparado para responder antes de que llegara la ayuda. Ese alguien eres tú.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/c5-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/c5-echo.mp3',
    slides: [
      { title: 'Primero, la escena', points: ['Evalúa el entorno (tráfico, fuego)', 'Señaliza y protege', 'Llama al 911 con ubicación y estado'], image: 'https://storage.googleapis.com/going-academy-audio/img/c5-s0.png?v2' },
      { title: 'Botiquín básico', points: ['Guantes, gasas y vendas', 'Antiséptico y tijeras', 'Suero, frío instantáneo', 'Agua y manta térmica'], image: 'https://storage.googleapis.com/going-academy-audio/img/c5-s1.png?v2' },
      { title: 'Situaciones frecuentes', points: ['Mareo: aire fresco y agua', 'Desmayo: eleva las piernas', 'Sangrado: presión directa', 'Atragantamiento: Heimlich'], image: 'https://storage.googleapis.com/going-academy-audio/img/c5-s2.png?v2' },
      { title: 'RCP básico', points: ['Llama al 911', 'Compresiones al centro del pecho', '100–120 por minuto', 'No te detengas hasta que llegue ayuda'], image: 'https://storage.googleapis.com/going-academy-audio/img/c5-s3.png?v2' },
      { title: 'Qué NO hacer', points: ['No mover heridos sin necesidad', 'No dar comida si hay inconsciencia', 'No retirar objetos clavados'], image: 'https://storage.googleapis.com/going-academy-audio/img/c5-s4.png?v2' },
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
    manualHtml: `
<p>Son las cinco de la tarde en Cuenca. Una viajera de Guayaquil está buscando dónde quedarse este fin de semana y desliza el dedo por decenas de alojamientos en Going App. Todos ofrecen casi lo mismo: cama, baño, wifi. Pero su pulgar se detiene en el tuyo. ¿Por qué? Porque tu foto principal captó la luz dorada entrando por la ventana, la manta tejida sobre la cama y el patio con geranios al fondo. En dos segundos, ella sintió el <em>vibe</em> de tu lugar y ya se imaginó tomando café ahí. No reservó por el precio: reservó por lo que sintió. Eso es lo que hace una buena fotografía, y la buena noticia es que no necesitas una cámara profesional ni un fotógrafo. Tienes todo lo que hace falta en el bolsillo: tu celular.</p>

<h2>1. La luz lo es todo (y es gratis)</h2>
<p>Antes de pensar en ángulos o filtros, entiende esto: la fotografía es literalmente "escribir con luz". Un espacio hermoso con mala luz se ve triste; un espacio sencillo con buena luz se ve acogedor. Y la mejor luz de todas no cuesta nada: la del sol entrando por tus ventanas. El error de la mayoría de anfitrionas y anfitriones es fotografiar de noche con el foco del techo encendido, que vuelve todo amarillo, plano y con sombras duras.</p>
<ul>
<li><strong>Fotografía de día, con luz natural.</strong> Abre cortinas y ventanas. La luz del sol revela los colores reales de tus sábanas, tu madera y tus plantas. Un cuarto iluminado por el día se siente más grande y limpio.</li>
<li><strong>Busca las horas suaves.</strong> A media mañana (9 a 11) o a media tarde (3 a 5) la luz es dorada y cálida. Al mediodía el sol pega fuerte y crea sombras duras; muy temprano o al anochecer queda oscuro. En la Sierra el cielo cambia rápido, así que aprovecha cuando esté despejado.</li>
<li><strong>Apaga los focos del techo.</strong> Mezclar luz de foco amarillo con luz de ventana azulada confunde a tu celular y las paredes salen de un color raro. Mejor una sola fuente: la ventana.</li>
<li><strong>Nunca dispares contra la ventana.</strong> Si la ventana queda frente a tu cámara, el cuarto sale negro. Ponte de espaldas a la luz o de costado, para que ilumine lo que fotografías, no tu lente.</li>
</ul>
<div class="box clave"><b>Clave Going</b>La luz natural es tu mejor herramienta y no cuesta un centavo: fotografía siempre de día, con las cortinas abiertas.</div>

<h2>2. El ángulo que hace ver todo más grande</h2>
<p>La misma habitación puede verse como un clóset apretado o como un refugio amplio, y la diferencia es dónde pones el teléfono. Quien reserva quiere entender el espacio y sentir que cabe cómodamente. Tu trabajo es contar esa historia con honestidad, mostrando lo mejor sin engañar.</p>
<h3>La altura correcta</h3>
<p>El error más común es fotografiar parada o parado, apuntando hacia abajo: el piso se come la mitad de la foto y el cuarto se ve pequeño. Baja el teléfono a la altura del pecho o de la cintura, más o menos un metro veinte del suelo. A esa altura la habitación se abre y se ve como la ve alguien sentado en la cama.</p>
<ul>
<li><strong>Dispara desde una esquina.</strong> Párate en una esquina del cuarto y apunta a la esquina opuesta. Así capturas dos paredes y das sensación de profundidad y amplitud, en lugar de una pared plana.</li>
<li><strong>Mantén el celular derecho.</strong> Si inclinas el teléfono, las líneas de las paredes salen chuecas y da mareo. Activa la cuadrícula de tu cámara (en Ajustes) y alinea las líneas verticales con el borde de la pantalla.</li>
<li><strong>Muestra el espacio, no solo objetos.</strong> Una foto de toda la habitación vende más que un primer plano del velador. Los detalles vienen después; primero el panorama.</li>
</ul>
<div class="box escenario"><b>Escenario</b>Tu cuarto en Baños es pequeño pero tiene una vista increíble al Tungurahua. En vez de pararte y apuntar a la cama, te agachas a la altura de la cintura desde la esquina de la puerta: ahora entran la cama, la ventana y la montaña en una sola toma. La misma habitación, pero ahora se ve como un mirador.</div>

<h2>3. Composición: la regla de los tercios</h2>
<p>¿Por qué algunas fotos se sienten equilibradas y otras incómodas, aunque el lugar sea igual? El secreto es un truco que usan fotógrafos de todo el mundo: la regla de los tercios. Imagina que tu pantalla está dividida por dos líneas verticales y dos horizontales, como un tablero de tres en raya. Esas cuatro líneas y sus cruces son los puntos donde el ojo humano descansa con gusto.</p>
<ol>
<li><strong>Activa la cuadrícula de tu cámara.</strong> Casi todos los celulares la traen. Te dibuja esas líneas encima de la pantalla para que compongas sin adivinar.</li>
<li><strong>Coloca lo importante sobre una línea o un cruce.</strong> ¿Una lámpara bonita, un cuadro, una planta? Que caiga sobre una de las líneas, no siempre en el centro exacto. Descentrar un poco hace la foto más viva.</li>
<li><strong>Cuida el horizonte.</strong> Si sale un paisaje o el mar en Galápagos, alinea la línea del horizonte con la línea horizontal de arriba o de abajo, nunca torcida por la mitad.</li>
<li><strong>Deja respirar la imagen.</strong> No amontones todo. Un poco de pared vacía o de piso limpio le da elegancia y calma a la foto.</li>
</ol>
<div class="box error"><b>Error común</b>Poner siempre el objeto justo en el centro y llenar cada rincón de cosas. El resultado se ve tieso y recargado, la foto pierde el <em>vibe</em>, y la viajera sigue de largo hacia el siguiente alojamiento.</div>

<h2>4. Prepara la escena antes de disparar</h2>
<p>La mejor cámara no salva un cuarto desordenado. La fotografía solo captura lo que ya está ahí, así que dedica quince minutos a preparar antes de tocar el botón. Piensa como quien va a llegar cansado de un vuelo o de un bus: quiere ver un espacio limpio, ordenado y con vida.</p>
<ul>
<li><strong>Ordena y despeja.</strong> Guarda cables, cargadores, productos de limpieza y objetos personales. Menos cosas sueltas hacen que el lugar se vea más grande y cuidado.</li>
<li><strong>Tiende la cama como en revista.</strong> Estira las sábanas, ahueca las almohadas, endereza la cobija. La cama es la protagonista de un dormitorio; si se ve impecable, todo se ve impecable.</li>
<li><strong>Suma un toque de vida.</strong> Una planta, flores frescas, una fruta en un bol, una toalla doblada con cariño. Esos detalles cuentan que alguien atiende el lugar con orgullo.</li>
<li><strong>Limpia los vidrios y espejos.</strong> Las manchas y el polvo saltan a la vista en la foto aunque no los notes en persona. Un vidrio limpio deja entrar más luz.</li>
<li><strong>Muestra tu región.</strong> Una hamaca en la Costa, una manta de lana en la Sierra, madera y verde en la Amazonía. Vender el <em>vibe</em> también es vender el Ecuador que rodea a tu alojamiento.</li>
</ul>
<div class="box clave"><b>Clave Going</b>La foto no arregla el desorden: prepara la escena real primero y la cámara solo tendrá que capturar algo que ya se ve bien.</div>

<h2>5. Edición gratuita para el toque profesional</h2>
<p>Después de tomar la foto, un retoque suave la lleva de "bien" a "profesional", y no necesitas pagar nada. Tu propio celular ya trae un editor en la galería, y apps gratuitas como Snapseed te dan más control. La edición no sirve para mentir ni para inventar una luz que no existe; sirve para que la foto se parezca a lo bonito que se veía en persona.</p>
<h3>Qué ajustar (con moderación)</h3>
<ol>
<li><strong>Recorta y endereza.</strong> Corrige una línea torcida y elimina bordes que sobren. Un recorte limpio enfoca la mirada en lo importante.</li>
<li><strong>Sube un poco el brillo.</strong> Aclara con cuidado hasta que el espacio se sienta luminoso, sin quemar las ventanas ni perder detalle.</li>
<li><strong>Ajusta el contraste y las sombras.</strong> Un toque de contraste da fuerza; levantar las sombras revela los rincones oscuros.</li>
<li><strong>Cuida el color real.</strong> Corrige el tono para que el blanco se vea blanco y la madera, madera. Nada de filtros exagerados que tiñen todo de morado o naranja.</li>
</ol>
<div class="box error"><b>Error común</b>Pasarse con los filtros y la saturación hasta que el cuarto parece de otro planeta. Cuando la huésped llega y no reconoce el lugar de la foto, se siente engañada y eso se traduce en una calificación baja y un comentario que ahuyenta a futuros viajeros.</div>
<div class="box escenario"><b>Escenario</b>Tomaste una linda foto del desayuno en tu terraza de Vilcabamba, pero salió un poco oscura por una nube. Abres el editor, subes el brillo dos pasos, levantas las sombras y enderezas el horizonte. En un minuto, sin apps caras, la foto se ve como el momento se sintió: cálido y luminoso.</div>

<h2>6. Cuenta una historia con tu galería</h2>
<p>Una sola foto abre la puerta, pero es el conjunto el que cierra la reserva. Piensa en tus fotos como un pequeño recorrido: quien las mira debe poder caminar por tu alojamiento con la mirada y entender qué le espera. Un orden lógico genera confianza, y la confianza es lo que convierte una vista en una reserva.</p>
<ul>
<li><strong>Empieza por tu foto más fuerte.</strong> La primera imagen es la portada; que sea la más luminosa y acogedora, la que mejor resume el <em>vibe</em>.</li>
<li><strong>Sigue un recorrido natural.</strong> Fachada o entrada, sala, cocina, dormitorio, baño y por último los extras: terraza, vista, jardín. Como si acompañaras a la huésped en un tour.</li>
<li><strong>Sé honesto y completo.</strong> Muestra también el baño y los espacios comunes. Esconderlos genera desconfianza; mostrarlos con orgullo genera reservas.</li>
<li><strong>Incluye los detalles que enamoran.</strong> El café de la mañana, la vista al despertar, la mascota de la casa si la hay. Esos momentos venden la experiencia, no solo el espacio.</li>
</ul>
<blockquote>"No vendes una cama. Vendes cómo se va a sentir alguien al despertar en tu casa." Esa frase resume el trabajo de toda anfitriona y todo anfitrión detrás de la cámara.</blockquote>

<h2>En resumen</h2>
<p>Fotografiar tu alojamiento con el celular no es un truco técnico: es tu manera de dar la bienvenida antes de que la huésped cruce la puerta. Con luz natural, un buen ángulo desde la esquina, la regla de los tercios, una escena preparada con cariño y un retoque honesto, transformas tu teléfono en una herramienta que vende el verdadero <em>vibe</em> de tu espacio y del rincón del Ecuador donde vives. Cada foto bien tomada es una invitación sincera y, cuando la viajera o el viajero llega y encuentra exactamente lo que vio (o algo aún mejor), esa alegría vuelve en forma de cinco estrellas. Así te conviertes en algo más que anfitriona o anfitrión: en embajadora o embajador de tu tierra, mostrándole al mundo lo hermoso que es hospedarse en el Ecuador.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/a1-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/a1-echo.mp3',
    slides: [
      { title: 'La luz lo es todo', points: ['Fotografía de día con luz natural', 'Apaga lámparas (evita amarillo)', 'Hora dorada para exteriores', 'Evita el contraluz'], image: 'https://storage.googleapis.com/going-academy-audio/img/a1-s0.png?v2' },
      { title: 'Prepara el espacio', points: ['Ordena y despeja', 'Haz la cama, endereza cojines', 'Añade una planta o flores'], image: 'https://storage.googleapis.com/going-academy-audio/img/a1-s1.png?v2' },
      { title: 'Composición', points: ['Activa la cuadrícula (tercios)', 'Dispara a la altura del pecho', 'Desde la esquina = más amplio', 'Horizontal para espacios'], image: 'https://storage.googleapis.com/going-academy-audio/img/a1-s2.png?v2' },
      { title: 'Edición gratuita', points: ['Sube brillo y sombras', 'Endereza las verticales', 'No exageres los filtros'], image: 'https://storage.googleapis.com/going-academy-audio/img/a1-s3.png?v2' },
      { title: 'Foto de portada', points: ['La 1ª foto decide la visita', 'Elige la más luminosa', 'Sube 8–15 fotos', 'Muestra el lugar tal como es'], image: 'https://storage.googleapis.com/going-academy-audio/img/a1-s4.png?v2' },
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
    manualHtml: `
<p>Son las once de la mañana en Baños de Agua Santa. Una pareja de viajeras llega desde Guayaquil, cansadas del bus nocturno, y abre la puerta de tu hospedaje esperando una cosa: descanso limpio. Lo primero que hacen no es admirar la vista al Tungurahua; es pasar el dedo por el filo del velador, mirar el rincón del baño y oler la almohada. En esos tres segundos, sin que digas una palabra, ya decidieron si van a confiar en ti. La limpieza no es una tarea del final: es el primer mensaje de bienvenida que das como anfitriona o anfitrión de Going App. Este manual te enseña el protocolo que convierte una habitación limpia en una reputación de cinco estrellas.</p>

<h2>1. Por qué la limpieza es tu reputación, no tu tarea</h2>
<p>En turismo colaborativo la confianza se gana antes de conocerse. La huésped que reserva contigo no te ve la cara: ve fotos, lee reseñas y apuesta. Cuando llega y todo está impecable, esa apuesta se confirma y se traduce en estrellas. Cuando encuentra un pelo en la ducha o polvo bajo la cama, ninguna sonrisa lo arregla. Por eso la limpieza no es limpieza: es la promesa cumplida.</p>
<ul>
<li><strong>La primera impresión no se repite.</strong> El huésped califica con la memoria de lo que sintió al entrar, no de lo que ordenaste después. Un ingreso impecable perdona errores menores más tarde.</li>
<li><strong>Lo invisible pesa más que lo visible.</strong> Una cama tendida se nota; un baño desinfectado se siente. La gente percibe la salubridad aunque no sepa nombrarla, y castiga su ausencia sin piedad.</li>
<li><strong>La consistencia construye marca.</strong> Un solo hospedaje limpio es suerte; diez seguidos son tu firma. Going App premia a la anfitriona o anfitrión que entrega el mismo estándar cada vez.</li>
</ul>
<div class="box clave"><b>Clave Going</b>La limpieza es la primera reseña que el huésped escribe en su cabeza, mucho antes de tocar el teléfono.</div>

<h2>2. La secuencia de limpieza: un orden que no falla</h2>
<p>Limpiar sin orden es trabajar el doble. Si sacudes después de trapear, el polvo cae al piso limpio; si tocas la cama antes que el baño, arrastras gérmenes a las sábanas. El protocolo Going sigue una lógica simple: de lo más alto a lo más bajo, de lo más limpio a lo más sucio, y el baño siempre al final.</p>
<ol>
<li><strong>Ventila primero.</strong> Abre ventanas apenas entras. El aire fresco de la Sierra o el mar de la Costa renueva el ambiente mientras trabajas y evita que los productos se concentren.</li>
<li><strong>Retira todo lo usado.</strong> Sábanas, toallas y basura salen juntas, en una sola pasada, hacia la lavandería. Nunca dobles ropa sucia como si fuera limpia.</li>
<li><strong>Sacude y limpia de arriba hacia abajo.</strong> Ventiladores, repisas altas, veladores, superficies y por último el piso. La gravedad trabaja a tu favor.</li>
<li><strong>Cocina y áreas comunes.</strong> Desengrasa, revisa la refrigeradora y verifica que la vajilla esté seca y guardada.</li>
<li><strong>El baño, al final.</strong> Es la zona de mayor riesgo sanitario; hazlo con guantes y paños dedicados solo a esa área.</li>
<li><strong>Cierre y tendido.</strong> Recién entonces tiendes la cama con ropa limpia y colocas las toallas dobladas.</li>
</ol>
<div class="box error"><b>Error común</b>Limpiar el baño primero y la habitación después. Consecuencia: llevas bacterias del inodoro a las superficies donde el huésped apoya el cepillo de dientes, y una reseña de "olía raro" te baja de Oro a Plata.</div>

<h2>3. Productos seguros: limpiar sin dañar a nadie</h2>
<p>Un huésped puede ser alérgico, viajar con criaturas pequeñas o simplemente detestar el olor a cloro. Tu misión no es que "huela a limpio", sino que <em>esté</em> limpio y sea seguro. Los productos correctos protegen la salud de tu huésped, la tuya y la del planeta.</p>
<h3>Qué usar y cómo</h3>
<ul>
<li><strong>Desinfectante para superficies de contacto.</strong> Manijas, interruptores, controles y llaves concentran más gérmenes que el inodoro. Desinféctalos siempre.</li>
<li><strong>Desengrasante en cocina, no en dormitorios.</strong> Cada producto a su zona. Usar limpiavidrios en madera la reseca y la mancha.</li>
<li><strong>Aromas neutros o suaves.</strong> Igual que en un auto Going, el perfume intenso incomoda. Un ambiente sin olor fuerte se percibe como más limpio, no menos.</li>
</ul>
<h3>Reglas de oro con los químicos</h3>
<ul>
<li><strong>Nunca mezcles cloro con amoniaco ni con vinagre.</strong> La reacción libera gases tóxicos. Un producto a la vez, siempre.</li>
<li><strong>Respeta el tiempo de acción.</strong> El desinfectante necesita minutos húmedo sobre la superficie para funcionar. Si lo secas al instante, solo moviste el germen de lugar.</li>
<li><strong>Guarda los productos fuera del alcance del huésped.</strong> Especialmente si viajan con niñas o niños.</li>
</ul>
<div class="box escenario"><b>Escenario</b>Una huésped te escribe por el chat de la app: "Soy alérgica a los aromatizantes". Traduces el mensaje automáticamente si escribe en otro idioma, cambias a paños con agua y vinagre suave para esa estadía, y ventilas más tiempo. Le respondes que su habitación estará libre de fragancias. Acabas de ganar una reseña de cinco estrellas antes de que llegue.</div>

<h2>4. Desinfección entre huéspedes: el punto de mayor riesgo</h2>
<p>El momento más delicado no es cuando el huésped está; es el intervalo entre uno que se va y otro que llega. Ahí es donde la limpieza superficial engaña y la desinfección real protege. Tratar cada rotación como un reinicio total es lo que separa a una anfitriona o anfitrión Oro del resto.</p>
<ul>
<li><strong>Todo textil se cambia, sin excepción.</strong> Sábanas, fundas, toallas y tapetes de baño van a lavado aunque "se vean" sin usar. Lo que el ojo no ve, la piel sí lo siente.</li>
<li><strong>Puntos de alto contacto, uno por uno.</strong> Manijas, interruptores, control remoto, mesa de noche, grifería y descarga del inodoro. Son las superficies que más manos tocan y que casi nadie desinfecta.</li>
<li><strong>Revisa lo que se comparte.</strong> Vasos, cubiertos y utensilios de cocina se lavan aunque parezcan intactos.</li>
<li><strong>Deja secar de verdad.</strong> La humedad guarda hongos y olor. Una habitación cerrada con toallas húmedas huele a encierro apenas se abre la puerta.</li>
</ul>
<div class="box clave"><b>Clave Going</b>Entre un huésped y el siguiente, no limpias: reinicias. La habitación debe quedar como si nadie hubiera dormido nunca en ella.</div>
<blockquote>"No busco lujo cuando viajo. Busco entrar y saber, sin dudar, que soy la primera persona que usa esa toalla." — Viajera frecuente, Cuenca</blockquote>

<h2>5. La lista de verificación que sostiene tu reputación</h2>
<p>La memoria falla, sobre todo cuando limpias tres hospedajes seguidos un domingo. La lista de verificación no es burocracia: es el seguro que garantiza que el huésped número diez reciba lo mismo que el número uno. Un protocolo escrito convierte tu calidad en algo repetible y confiable.</p>
<h3>Antes de marcar "listo para recibir"</h3>
<ol>
<li><strong>Dormitorio:</strong> cama tendida, superficies sin polvo, piso limpio, focos funcionando.</li>
<li><strong>Baño:</strong> inodoro y ducha desinfectados, espejo sin manchas, toallas limpias, papel y jabón repuestos.</li>
<li><strong>Cocina:</strong> vajilla seca y guardada, refrigeradora sin restos, basura vacía.</li>
<li><strong>Detalles de contacto:</strong> manijas, interruptores y controles desinfectados.</li>
<li><strong>Aroma y luz:</strong> ambiente ventilado, sin olor fuerte, cortinas abiertas.</li>
<li><strong>Toque humano:</strong> agua disponible, wifi visible, una nota de bienvenida.</li>
</ol>
<div class="box escenario"><b>Escenario</b>Llegas apurada a preparar una cabaña en Tena antes de un check-in en la Amazonía. Sigues la lista y en el punto cuatro descubres que el control del ventilador no funciona. Cambias la pila a tiempo. Sin la lista, el huésped lo habría descubierto sudando a medianoche, y tú lo habrías sabido por una reseña de tres estrellas.</div>
<div class="box error"><b>Error común</b>Confiar en la memoria y saltarte la lista "porque ya sabes hacerlo". Consecuencia: un día olvidas reponer papel higiénico, el huésped se queda sin él a las seis de la mañana, y ese pequeño descuido pesa más en la calificación que toda tu decoración.</div>

<h2>6. El estándar como saludo, no como esfuerzo</h2>
<p>Cuando el protocolo se vuelve costumbre, deja de sentirse como trabajo pesado y empieza a sentirse como hospitalidad. La huésped que entra a un espacio impecable percibe respeto, cuidado y bienvenida, aunque tú no estés presente. Ese es el poder de la limpieza estándar: habla por ti cuando tú no puedes.</p>
<ul>
<li><strong>Documenta con fotos tu resultado final.</strong> Te ayudan a mantener el estándar y a resolver cualquier reclamo con evidencia.</li>
<li><strong>Repón siempre lo básico.</strong> Jabón, papel, agua y toallas extra: la abundancia discreta se siente como generosidad.</li>
<li><strong>Cierra el ciclo con una nota.</strong> "Bienvenida a Going App, soy [nombre]. Todo quedó listo para tu descanso." La calidez sella la limpieza.</li>
</ul>
<blockquote>"Un espacio limpio no le grita al huésped 'trabajé mucho'. Le susurra 'te esperaba'." — Anfitrión Oro, Otavalo</blockquote>

<h2>En resumen</h2>
<p>La limpieza estándar de Going App no es la parte aburrida de recibir gente: es el corazón de la confianza que sostiene tu reputación. Cada superficie desinfectada, cada toalla cambiada y cada casilla marcada en tu lista es una forma silenciosa de decir "eres bienvenida o bienvenido, y aquí te cuidamos". Cuando conviertes este protocolo en un hábito, dejas de limpiar habitaciones y empiezas a construir experiencias del Ecuador que las viajeras y viajeros recuerdan y recomiendan. Así se sube de Bronce a Plata y de Plata a Oro; así se ganan las cinco estrellas. Porque quien limpia con estándar no solo cuida un cuarto: cuida el nombre de su país frente a cada huésped que cruza la puerta.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/a2-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/a2-echo.mp3',
    slides: [
      { title: 'La limpieza vende', points: ['Factor #1 en las reseñas', 'Genera confianza al instante', 'Justifica tu precio'], image: 'https://storage.googleapis.com/going-academy-audio/img/a2-s0.png?v2' },
      { title: 'La secuencia', points: ['Ventila y recoge', 'Polvo de arriba a abajo', 'Cocina, luego baño al final', 'Pisos al cierre'], image: 'https://storage.googleapis.com/going-academy-audio/img/a2-s1.png?v2' },
      { title: 'Productos seguros', points: ['Desengrasante / desinfectante', 'Nunca mezcles cloro con amoniaco', 'Ventila al usar químicos', 'Vinagre y bicarbonato a diario'], image: 'https://storage.googleapis.com/going-academy-audio/img/a2-s2.png?v2' },
      { title: 'Entre huéspedes', points: ['Desinfecta puntos de contacto', 'Manijas, interruptores, controles', 'Ropa de cama y toallas siempre lavadas'], image: 'https://storage.googleapis.com/going-academy-audio/img/a2-s3.png?v2' },
      { title: 'Checklist final', points: ['Cama impecable', 'Baño seco y repuesto', 'Cocina sin grasa', 'Aroma neutro + foto de respaldo'], image: 'https://storage.googleapis.com/going-academy-audio/img/a2-s4.png?v2' },
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
    manualHtml: `
<p>Imagina que una viajera de Guayaquil abre la app buscando dónde quedarse dos noches en tu ciudad. Ha visto veinte anuncios que se parecen: paredes blancas, una cama, una foto sacada a las apuradas. De pronto llega al tuyo y ve una manta de lana tejida en Otavalo doblada sobre la cama, una repisa con una olla de barro llena de flores del jardín, y una lámpara que tiñe todo de un amarillo cálido. No es el lugar más grande ni el más caro. Pero es el que se siente a alguien. Y ese "alguien" eres tú. Diseñar con identidad no es cuestión de plata: es cuestión de mirada. En este curso vas a aprender que puedes hacer que tu espacio se recomiende solo, gastando poco y contando mucho.</p>

<h2>1. Menos cosas, más historia</h2>
<p>El error más caro que puedes cometer con poco presupuesto es intentar llenar. Un espacio abarrotado de adornos baratos no se ve acogedor, se ve desordenado, y en las fotos se ve peor. La riqueza visual no viene de la cantidad, viene de la intención: pocos objetos, pero cada uno con una razón para estar ahí. Antes de comprar nada, tu primer trabajo es quitar.</p>
<ul>
<li><strong>Despeja las superficies.</strong> Una mesa con tres objetos bien elegidos respira; con doce, agobia. El vacío también decora, porque le da descanso al ojo de tu huésped.</li>
<li><strong>Un objeto, una historia.</strong> Una vasija de La Victoria, una hamaca de Manabí, un cuadro de un pintor de tu barrio. Cuando cada pieza puede contarse, tu casa deja de ser un cuarto y se vuelve un lugar.</li>
<li><strong>Repite materiales nobles.</strong> Barro, lana, madera, fibra natural. No necesitas que combinen en color; combinan en textura y en verdad. Eso da armonía sin gastar.</li>
</ul>
<div class="box clave"><b>Clave Going</b>No decores para llenar el espacio; decora para contar quién eres y de dónde vienes.</div>

<h2>2. La luz cálida cambia todo (y cuesta centavos)</h2>
<p>Si solo pudieras invertir en una cosa, invierte en la luz. La iluminación blanca y fría de un foco de tienda hace que hasta el cuarto más bonito se sienta como una sala de espera. La luz cálida, en cambio, abraza: hace que la madera brille, que la piel se vea sana y que tu huésped, al entrar de noche, suelte los hombros. Y un foco cálido cuesta casi lo mismo que uno frío.</p>
<h3>Cómo lograr calidez sin gastar</h3>
<ol>
<li><strong>Cambia la temperatura de los focos.</strong> Busca focos LED de luz cálida (alrededor de 2700K, suelen decir "luz amarilla" o "cálida"). Es el cambio más barato con mayor impacto.</li>
<li><strong>Reparte la luz, no la centralices.</strong> Una sola lámpara en el techo aplana todo. Dos o tres puntos bajos —una lámpara de mesa, una tira de luz, una vela segura— crean rincones y profundidad.</li>
<li><strong>Aprovecha la luz natural del Ecuador.</strong> Tenemos sol todo el año. Cortinas livianas que dejen pasar la luz de día valen más que mil adornos. Deja las ventanas limpias y despejadas.</li>
</ol>
<div class="box escenario"><b>Escenario</b>Un huésped llega a las 7 de la noche cansado del viaje. Entra y en vez de un foco blanco parpadeante, encuentra dos lámparas de mesa encendidas con luz ámbar. Antes de decir palabra, ya siente que llegó a un lugar donde puede descansar. Esa sensación es la que después se convierte en cinco estrellas.</div>

<h2>3. Plantas: vida que no cuesta</h2>
<p>Una planta hace por un rincón lo que ningún mueble caro logra: lo llena de vida. El verde relaja, purifica el aire y da esa sensación de que alguien cuida el lugar. Y lo mejor es que en el Ecuador la naturaleza es generosa: un esqueje regalado por una vecina, una suculenta, una rama de sábila, y en semanas tienes decoración que crece sola.</p>
<ul>
<li><strong>Elige plantas resistentes.</strong> Sábila, potos, lengua de suegra o cactus perdonan el olvido. Si tienes huéspedes que van y vienen, no querrás plantas que mueran en tres días sin riego.</li>
<li><strong>Reutiliza como maceta.</strong> Una lata pintada, una olla de barro vieja, un canasto de fibra. El contenedor cuenta tanto como la planta y no necesita ser comprado nuevo.</li>
<li><strong>Agrupa en impares.</strong> Tres macetas de distintos tamaños juntas se ven mejor que una sola perdida en la esquina. El ojo lee los grupos como un jardín pequeño.</li>
<li><strong>Ubícalas donde reciban luz.</strong> Cerca de la ventana viven felices y de paso enmarcan la vista. Una planta seca comunica descuido; una planta sana comunica cariño.</li>
</ul>
<div class="box error"><b>Error común</b>Comprar plantas hermosas pero delicadas y dejarlas morir entre reservas. Un huésped que ve hojas amarillas y tierra seca concluye, con razón, que el lugar no se cuida bien, y eso se lo lleva a la reseña.</div>

<h2>4. Identidad local: tu ventaja que nadie puede copiar</h2>
<p>Los hoteles grandes tienen presupuesto; tú tienes algo que ellos no pueden fabricar: raíz. La persona que reserva contigo, muchas veces, viaja justamente para sentir el Ecuador de verdad. Un cuadro genérico comprado en cadena no le dice nada. En cambio, una artesanía de tu región, una foto antigua de tu ciudad o un textil andino le dice: aquí estás en Ecuador, y esto es real.</p>
<h3>Trae tu región a la habitación</h3>
<ul>
<li><strong>Si estás en la Sierra:</strong> textiles de lana, cerámica de barro, colores de páramo, una manta de Otavalo a los pies de la cama.</li>
<li><strong>Si estás en la Costa:</strong> fibras naturales, sombreros de paja toquilla como adorno de pared, tonos claros y frescos, conchas o maderas del lugar.</li>
<li><strong>Si estás en la Amazonía:</strong> artesanía de semillas, cestería, verdes profundos, referencias respetuosas a las culturas locales.</li>
<li><strong>Si estás en Galápagos:</strong> tonos de mar y arena, materiales sencillos, y siempre el mensaje de cuidado ambiental que define a las islas.</li>
</ul>
<p>Comprar estas piezas directamente a artesanas y artesanos de tu zona tiene doble premio: decoras barato y apoyas la economía de tu comunidad, algo que a los huéspedes conscientes les encanta descubrir.</p>
<div class="box clave"><b>Clave Going</b>Tu identidad local no se compra en una tienda de decoración; es tu ventaja natural y es gratis contarla.</div>

<h2>5. Los detalles económicos que se convierten en reseñas</h2>
<p>Las personas no recuerdan que la sábana era cara; recuerdan que había un termo con agua caliente y aromática de la Sierra esperándolas. Los detalles pequeños y baratos generan un cariño desproporcionado, porque comunican una cosa poderosa: pensé en ti antes de que llegaras. Ese es el corazón de la hospitalidad ecuatoriana.</p>
<ul>
<li><strong>Una bienvenida sencilla.</strong> Dos frutas de temporada, un chocolate local, una nota escrita a mano. Cuesta poco, vale muchísimo.</li>
<li><strong>Textiles limpios y bien planchados.</strong> No hace falta que sean de lujo; una cama tendida con esmero se ve más cara de lo que costó. La limpieza es el adorno más barato y el más importante.</li>
<li><strong>Aromas suaves, nunca invasivos.</strong> Un cuarto que huele a limpio y fresco gana; uno con ambientador fuerte espanta. Menos perfume, más ventilación.</li>
<li><strong>Rincones fotografiables.</strong> Arma un solo rincón bonito —la lámpara, la planta, el textil, la vista— y tus huéspedes lo fotografiarán y lo compartirán solos. Esa es publicidad gratis.</li>
</ul>
<div class="box escenario"><b>Escenario</b>Una pareja llega tarde y con hambre. Sobre la mesa encuentran una jarra de agua, dos mandarinas y una tarjeta que dice a mano: "Bienvenidos a mi casa, cualquier cosa escríbanme". Al día siguiente, sin que se lo pidas, dejan cinco estrellas y una foto de la tarjeta. Gastaste menos de un dólar y ganaste una reseña que te traerá diez reservas más.</div>

<h2>6. Piensa como la lente de la cámara</h2>
<p>Por más lindo que sea tu espacio, la mayoría de tus huéspedes lo van a conocer primero en una foto dentro de la app. Diseñar con bajo presupuesto incluye diseñar para que las fotos vendan. No necesitas cámara profesional; necesitas luz de día, orden y un punto de vista.</p>
<ol>
<li><strong>Fotografía con luz natural.</strong> Abre cortinas, apaga el foco frío y dispara de día. La luz gratis del sol es la mejor iluminadora que existe.</li>
<li><strong>Ordena antes de disparar.</strong> Guarda cables, endereza cuadros, estira la cama. La cámara exagera cualquier desorden.</li>
<li><strong>Muestra los detalles con identidad.</strong> No solo el cuarto entero: acércate a la manta tejida, a la planta, a la vista. Esos primeros planos son los que enamoran.</li>
</ol>
<blockquote>"La gente no reserva un cuarto; reserva la sensación de cómo se va a sentir ahí. Tu trabajo es que esa sensación empiece en la primera foto."</blockquote>
<div class="box error"><b>Error común</b>Tener un espacio precioso pero subir fotos oscuras, desordenadas o con foco amarillo apagado. El huésped nunca llega a verlo en persona porque el anuncio no lo convenció, y pierdes reservas que ya tenías ganadas.</div>

<h2>En resumen</h2>
<p>Diseñar con bajo presupuesto no es conformarse con menos; es entender que la calidez, la identidad y el cuidado valen más que el dinero. Una luz cálida, una planta viva, un textil de tu región y un detalle pensado con cariño transforman un cuarto común en un lugar que la gente recuerda y recomienda. Cuando un huésped se va sintiendo que estuvo en un pedazo auténtico del Ecuador —de la Costa, la Sierra, la Amazonía o Galápagos— tú dejas de ser solo un anfitrión o una anfitriona con un espacio en renta: te vuelves embajador o embajadora de tu tierra. Y esa hospitalidad genuina es, al final, lo que se traduce en cinco estrellas, en mejores niveles Aliado y en huéspedes que vuelven porque encontraron algo que en ningún otro lado, por mucho dinero que tengan, podrán comprar.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/a3-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/a3-echo.mp3',
    slides: [
      { title: 'Menos es más', points: ['Espacios limpios y con intención', 'Antes de comprar, quita', 'Despeja superficies'], image: 'https://storage.googleapis.com/going-academy-audio/img/a3-s0.png?v2' },
      { title: 'Iluminación barata', points: ['Luz cálida (2700–3000 K)', 'Varias fuentes, no un solo foco', 'Una lámpara transforma un rincón'], image: 'https://storage.googleapis.com/going-academy-audio/img/a3-s1.png?v2' },
      { title: 'Lo local', points: ['Artesanía y textiles ecuatorianos', 'Apoya a productores', 'Auténtico = memorable y fotografiable'], image: 'https://storage.googleapis.com/going-academy-audio/img/a3-s2.png?v2' },
      { title: 'Plantas y textiles', points: ['Plantas dan vida', 'Cojines, manta, cortinas', 'Paleta de 2–3 colores'], image: 'https://storage.googleapis.com/going-academy-audio/img/a3-s3.png?v2' },
      { title: 'Detalles 5★', points: ['Bienvenida: agua, café, nota', 'Wi-Fi fácil y cargadores', 'Ganchos y espacio para maletas'], image: 'https://storage.googleapis.com/going-academy-audio/img/a3-s4.png?v2' },
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
    manualHtml: `
<p>Son las 10 de la noche y acabas de recibir una notificación: una huésped que se hospedó en tu cabaña de Baños dejó tres estrellas y escribió que "el agua caliente tardaba en salir". Se te calienta la cara. Tú recuerdas que le explicaste el truco del calefón, que le llevaste chocolate caliente, que fue amable toda la estadía. Tu primer impulso es escribir de vuelta a la defensiva. Detente. Ese instante, entre lo que sientes y lo que escribes, es exactamente donde se define tu futuro como anfitriona o anfitrión en Going App. Una reseña no es una calificación final sobre ti como persona: es una conversación pública que apenas empieza, y tú tienes la última palabra. Aprender a manejarla con calma no solo salva una estadía; construye la reputación que hace que desconocidos elijan tu puerta entre cientos.</p>

<h2>1. Qué es de verdad una reseña</h2><p>Antes de responder cualquier reseña, tienes que entender para qué existe. Muchas anfitrionas y anfitriones creen que una reseña es una nota escolar, un juicio sobre su valor. No lo es. Una reseña es información: la voz de quien ya vivió tu servicio, escrita para dos públicos a la vez. Cuando cambias tu forma de verla, cambias tu forma de responder.</p><ul><li><strong>La reseña le habla a futuros huéspedes, no solo a ti.</strong> Quien lee tu perfil está decidiendo si confía en ti. Por eso tu respuesta importa tanto como la crítica: demuestra en vivo cómo tratas a las personas cuando algo sale mal.</li><li><strong>La reseña es un espejo del servicio, no de tu identidad.</strong> "La ducha demoró" habla de la ducha, no de que seas mala persona. Separar el dato del ego te libera para actuar.</li><li><strong>La reseña es gratis y honesta.</strong> Ningún estudio de mercado te dará esta claridad. Una viajera o viajero se tomó su tiempo para decirte qué mejorar. Eso es un regalo, aunque venga envuelto en una queja.</li></ul><div class="box clave"><b>Clave Going</b> La reseña no te califica a ti; describe una experiencia que tú sí puedes mejorar.</div>

<h2>2. Responde en frío, nunca en caliente</h2><p>La regla de oro del manejo de reseñas es de tiempo, no de palabras: nunca respondas con el corazón acelerado. El enojo y la vergüenza son malos redactores. Escriben frases que suenan cortantes, sarcásticas o suplicantes, y todas quedan públicas para siempre. La calma, en cambio, se lee como profesionalismo.</p><ol><li><strong>Espera antes de escribir.</strong> Si una reseña te duele, no respondas en ese minuto. Respira, camina, duerme si hace falta. La respuesta seguirá disponible mañana, y tu cabeza estará más clara.</li><li><strong>Escribe primero un borrador que no vas a enviar.</strong> Vacía ahí todo el enojo. Luego bórralo y escribe la versión real, la que quieres que un desconocido lea dentro de seis meses.</li><li><strong>Léela en voz alta antes de publicar.</strong> Si suena a que estás peleando o a que ruegas por estrellas, todavía no está lista.</li></ol><div class="box escenario"><b>Escenario</b> Un huésped en Otavalo se queja de "ruido en la madrugada" cuando fue una fiesta del vecindario que tú no controlas. En vez de escribir "eso no es mi culpa", esperas una hora y respondes: "Gracias por avisarme. Esa noche hubo una celebración del barrio; para próximas estadías dejaré tapones de oído en la habitación y te avisaré con antelación si hay eventos cercanos." Suenas dueña o dueño de la situación, no víctima de ella.</div>

<h2>3. Cómo responder una reseña negativa, paso a paso</h2><p>Una reseña negativa bien respondida convence más que diez reseñas perfectas. ¿Por qué? Porque quien lee sabe que algún día algo saldrá mal, y quiere ver cómo reaccionas. Tu respuesta es una demostración de carácter en tiempo real. Sigue esta estructura sencilla y humana.</p><h3>La fórmula ARMA</h3><ul><li><strong>Agradece.</strong> Empieza siempre reconociendo que la persona se tomó el tiempo de escribir. "Gracias por compartir tu experiencia" desarma la tensión de inmediato.</li><li><strong>Reconoce lo que sintió.</strong> No niegues su emoción, aunque no compartas su versión. "Lamento que la llegada te resultara confusa" valida sin necesariamente darte la culpa total.</li><li><strong>Muestra la mejora.</strong> Di qué vas a cambiar en concreto. Esto es lo que futuros huéspedes leen con lupa: "Ya coloqué señalización clara hasta la entrada."</li><li><strong>Acoge de vuelta.</strong> Cierra con una invitación cálida y sin rencor: "Serás siempre bienvenida o bienvenido; me encantaría que veas los cambios."</li></ul><p>Nunca discutas los hechos punto por punto en público, aunque tengas razón. Si hay un malentendido serio, usa el chat privado de la app, que además tiene traducción automática si tu huésped hablaba otro idioma. La respuesta pública se queda breve, digna y orientada a soluciones.</p><div class="box error"><b>Error común</b> Responder una crítica con una lista de excusas o culpando al huésped. Consecuencia: el futuro lector no ve la queja original, ve a una anfitriona o anfitrión que pelea con sus clientes, y cierra tu perfil para reservar en otro lado.</div>

<h2>4. No descuides las reseñas positivas</h2><p>Aquí se equivoca hasta la gente experimentada: creen que solo las quejas necesitan respuesta. Falso. Una reseña de cinco estrellas sin respuesta es una mano tendida que dejaste en el aire. Agradecer bien lo bueno multiplica lo bueno, porque le enseña a los demás qué valoras y hace que quien te elogió se sienta visto.</p><ul><li><strong>Personaliza, no copies y pegues.</strong> "Gracias por tu reseña" repetido veinte veces se nota y se siente frío. Menciona algo específico: "Me alegró que disfrutaras el desayuno con mote y el mirador al Chimborazo."</li><li><strong>Refuerza lo que quieres que se repita.</strong> Si alguien elogia tu puntualidad o tu limpieza, nómbralo. Estás enseñándole a futuros huéspedes qué esperar y a ti mismo qué mantener.</li><li><strong>Agradece rápido.</strong> Una respuesta a los pocos días muestra que estás presente y atenta o atento, no ausente.</li></ul><div class="box clave"><b>Clave Going</b> Una reseña positiva sin respuesta es una oportunidad de fidelidad que dejaste enfriar.</div><blockquote>"La gente olvida lo que dijiste, pero no olvida cómo la hiciste sentir." Esa frase vale doble cuando quedó por escrito y pública.</blockquote>

<h2>5. Convierte la crítica en mejora real</h2><p>El manejo de reseñas no termina cuando presionas "publicar". Termina cuando la próxima persona ya no tiene motivo para quejarse de lo mismo. Una crítica repetida que ignoras deja de ser mala suerte y se vuelve tu responsabilidad. La diferencia entre un nivel Bronce y un nivel Oro no es la ausencia de quejas: es la velocidad con que las conviertes en cambios.</p><ol><li><strong>Busca patrones, no incidentes.</strong> Una queja aislada puede ser un mal día. Tres personas mencionando "wifi lento" es un problema real que debes resolver ya.</li><li><strong>Haz el cambio y ciérralo.</strong> Si arreglaste el calefón, anótalo. La próxima vez que alguien elogie el agua caliente, sabrás que tu inversión funcionó.</li><li><strong>Actualiza tu anuncio con lo aprendido.</strong> Si la gente esperaba algo que no ofreces, ajusta la descripción para que las expectativas coincidan con la realidad. La mitad de las reseñas negativas nacen de una expectativa mal puesta, no de un mal servicio.</li></ol><div class="box escenario"><b>Escenario</b> Tres huéspedes seguidos comentan que la ubicación fue "más lejos del centro de lo que esperaban". En vez de defenderte, editas tu anuncio: añades el tiempo real en carro al centro y destacas la tranquilidad y el aire puro de estar en las afueras. Las siguientes reseñas dejan de quejarse de la distancia y empiezan a elogiar la paz. Convertiste una crítica en un argumento de venta.</div>

<h2>En resumen</h2><p>Manejar reseñas es, en el fondo, manejar la confianza. Cada respuesta tuya es una ventana por la que un desconocido decide si eres alguien digno de recibirlo en el Ecuador, sea en la Costa, la Sierra, la Amazonía o Galápagos. Cuando agradeces lo bueno, respondes lo malo con calma y transformas la crítica en un cambio visible, dejas de ser solo una anfitriona o anfitrión con una cama disponible: te vuelves embajadora o embajador de tu tierra, alguien que representa la calidez ecuatoriana incluso cuando algo sale mal. Y esa es, exactamente, la cualidad que sube tu calificación por encima de las 4.5 estrellas, que te mueve de Aliado Bronce hacia Oro, y que hace que la próxima viajera o viajero lea tu perfil, sonría y diga: "A esta persona sí le importo." Responde bien, y creces más.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/a4-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/a4-echo.mp3',
    slides: [
      { title: 'Las reseñas mandan', points: ['Son la moneda de confianza', 'Definen tu posición y la decisión', 'Tus respuestas también se leen'], image: 'https://storage.googleapis.com/going-academy-audio/img/a4-s0.png?v2' },
      { title: 'Reseñas positivas', points: ['Agradece de forma personal', 'Menciona algo específico', 'Invita a volver', 'Evita respuestas copiadas'], image: 'https://storage.googleapis.com/going-academy-audio/img/a4-s1.png?v2' },
      { title: 'Negativas: método LAPA', points: ['Lee con calma', 'Agradece y reconoce', 'Propón la mejora', 'Avanza en positivo'], image: 'https://storage.googleapis.com/going-academy-audio/img/a4-s2.png?v2' },
      { title: 'De la crítica a la mejora', points: ['Cada queja repetida es información', 'Resuelve la causa real', 'Menciona lo que mejoraste'], image: 'https://storage.googleapis.com/going-academy-audio/img/a4-s3.png?v2' },
      { title: 'Prevenir es la clave', points: ['Expectativas claras en el anuncio', 'Comunicación rápida', 'Instrucciones sencillas', 'Gesto de bienvenida'], image: 'https://storage.googleapis.com/going-academy-audio/img/a4-s4.png?v2' },
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
    manualHtml: `
<p>Son las 5:40 de la mañana en Riobamba y tienes un vuelo internacional que sale de Quito a mediodía. Antes, eso significaba madrugar aún más, negociar con un taxi en la calle y rezar para llegar a tiempo. Hoy abres Going App desde tu cama, ves que hay un asiento libre en un viaje compartido a las 6:00 rumbo al aeropuerto, tocas dos veces y listo: sabes el precio exacto, el nombre de tu conductor y a qué hora te recogen. Viajar inteligente no es tener suerte, es saber usar las herramientas que ya tienes en la mano. Este manual te enseña justo eso, para que cada viaje sea seguro, tranquilo y a tu favor.</p>

<h2>1. Reservar sin adivinar: elige el viaje correcto</h2>
<p>Going App no es un solo tipo de viaje, y ahí está su fuerza. Elegir bien desde el inicio te ahorra dinero y dolores de cabeza, porque cada modalidad resuelve una necesidad distinta. Antes de tocar "reservar", pregúntate qué necesitas realmente: ¿ir tú solo o compartir?, ¿ahora o programado?, ¿dentro de la ciudad o entre ciudades?</p>
<ul>
<li><strong>Carrera en ciudad.</strong> Es inmediata. La pides y un vehículo cercano viene por ti. Ideal para moverte dentro de Quito, Guayaquil o Cuenca sin planear con anticipación.</li>
<li><strong>Viaje compartido.</strong> Pagas solo tu asiento y viajas con otras personas que van en la misma ruta. Es la opción más económica y la más colaborativa: menos autos en la vía, menos costo para ti.</li>
<li><strong>Viaje privado.</strong> Reservas el vehículo completo. Perfecto cuando viajas en familia, con equipaje voluminoso o quieres total privacidad.</li>
<li><strong>Intercity programado.</strong> Para ir de una ciudad a otra con <strong>tarifa fija</strong>. Reservas con anticipación y la app te avisa una hora antes y de nuevo cinco minutos antes de que llegue tu conductor.</li>
<li><strong>Envíos.</strong> Si lo que viaja es un paquete y no tú, cotizas por tamaño, sigues la entrega en vivo y quien recibe confirma con un código OTP.</li>
</ul>
<p>La tarifa fija del intercity es tu mejor aliada: sabes cuánto pagarás antes de subir, sin sorpresas por tráfico ni por la hora. Ese número que ves es el número que pagas.</p>
<div class="box escenario"><b>Escenario</b>Vas al aeropuerto tú solo desde Riobamba a las 6 a.m. No necesitas todo el auto ni pagar de más. Eliges "viaje compartido", pagas únicamente tu asiento y compartes el trayecto con otras dos personas que también viajan a tomar su vuelo. Llegas igual de puntual, gastando menos.</div>
<div class="box clave"><b>Clave Going</b>Elegir la modalidad correcta es el 80% de un buen viaje: primero decide qué necesitas, después reserva.</div>

<h2>2. Rastrea tu viaje en tiempo real y viaja con calma</h2>
<p>La espera genera ansiedad cuando no sabes qué pasa. Por eso Going App te muestra todo en vivo: dónde está tu conductor, cuánto falta y por qué ruta va. Rastrear no es desconfiar, es simplemente tener la información para organizar tu tiempo.</p>
<h3>Qué ver antes de subir</h3>
<ol>
<li><strong>El mapa en vivo.</strong> Ves el vehículo acercarse en tiempo real. Si estás terminando de desayunar, sabes exactamente cuándo bajar a la puerta.</li>
<li><strong>Los avisos del intercity.</strong> En viajes programados recibirás la alerta de una hora antes y la de cinco minutos antes. Úsalas: son tu recordatorio para estar lista o listo con maletas en mano.</li>
<li><strong>Datos del conductor.</strong> Nombre, foto, calificación, modelo del vehículo y placa. Todo esto aparece para que confirmes que subes al auto correcto.</li>
</ol>
<div class="box error"><b>Error común</b>Subir al primer auto que se detiene sin verificar la placa. Si el vehículo que se acerca no coincide con la placa que muestra tu app, no es tu viaje: podrías subir con alguien ajeno a la plataforma y perder toda la protección que Going te da. Verifica siempre placa, nombre y foto antes de abrir la puerta.</div>

<h2>3. Comunícate por el chat sin barreras</h2>
<p>El chat dentro de la app existe para que no tengas que dar tu número personal ni gritar por la ventana. Y tiene una función que cambia todo en un país tan visitado como Ecuador: <strong>traducción automática</strong>. Tú escribes en español, la persona conductora lo lee en su idioma, y su respuesta te llega traducida. Esto es oro para viajeras y viajeros extranjeros que llegan a la Costa, la Sierra, la Amazonía o Galápagos sin hablar español.</p>
<ul>
<li><strong>Comparte el punto exacto.</strong> Un mensaje corto como "Estoy junto a la entrada principal, camiseta azul" evita que tu conductor dé vueltas buscándote.</li>
<li><strong>Avisa cambios a tiempo.</strong> Si bajarás en dos minutos, escríbelo. La comunicación clara respeta el tiempo de ambos.</li>
<li><strong>Mantén todo en la app.</strong> El chat deja registro y tu conversación queda protegida. No hace falta pasar a otras aplicaciones.</li>
</ul>
<blockquote>"Bienvenido a Going App, soy Andrés." Ese saludo, sumado a un chat que traduce solo, hace que una huésped de Alemania se sienta acompañada desde el primer mensaje.</blockquote>
<div class="box clave"><b>Clave Going</b>El chat traduce por ti: nunca dejes de preguntar o coordinar por miedo al idioma.</div>

<h2>4. Paga como te convenga</h2>
<p>Going App se adapta a cómo prefieres pagar, porque no todas las personas usan tarjeta ni todas cargan efectivo. Conocer tus opciones te da libertad y control sobre tu gasto.</p>
<ul>
<li><strong>Tarjeta con Datafast o DeUna.</strong> Rápido y sin manejar billetes. El cobro es automático al terminar el viaje.</li>
<li><strong>Wallet Going.</strong> Recargas saldo dentro de la app y puedes incluso transferirlo. Es ideal si viajas seguido: pagas en un toque y llevas el control de tu presupuesto.</li>
<li><strong>Efectivo.</strong> Sigue disponible para quien lo prefiera. Ten el monto listo para agilizar la despedida.</li>
</ul>
<div class="box escenario"><b>Escenario</b>Llegas a Quito de visita y aún no activas tu tarjeta internacional. Recargas la Wallet Going una sola vez con la ayuda de un familiar y, durante toda tu semana en la Sierra, cada carrera se paga sola desde tu saldo. Cero efectivo, cero fricción.</div>

<h2>5. Tu seguridad no es opcional: úsala siempre</h2>
<p>Ecuador es hermoso y la enorme mayoría de viajes transcurre sin novedad, pero viajar inteligente significa tener herramientas listas por si acaso. Going App las trae integradas para que nunca te sientas sola o solo en el camino. No las guardes "por si algún día"; conócelas hoy.</p>
<h3>Las cuatro herramientas que debes dominar</h3>
<ol>
<li><strong>Verificar identidad y placa.</strong> Ya lo dijimos y lo repetimos porque es lo primero: nombre, foto y placa deben coincidir antes de subir.</li>
<li><strong>Compartir tu viaje en vivo.</strong> Con un toque, un familiar o amistad ve tu recorrido en tiempo real. Saber que alguien te acompaña a distancia cambia por completo cómo te sientes en un viaje nocturno.</li>
<li><strong>Botón SOS.</strong> Si algo no se siente bien, está a la mano para pedir ayuda de inmediato. Ojalá nunca lo uses, pero saber dónde está te da tranquilidad.</li>
<li><strong>Token de fin de viaje.</strong> Confirma que el trayecto terminó donde debía y como debía, cerrando el viaje de forma segura.</li>
</ol>
<p>Reconoce además a tu conductora o conductor por su <strong>lanyard de identificación visible</strong>: es una señal más de que subes con alguien verificado dentro de la plataforma. Y recuerda que en Going la calificación mínima para conducir es de 4.5 estrellas, así que la persona que te lleva ya cumple un estándar de calidad.</p>
<div class="box error"><b>Error común</b>Pensar "es un trayecto corto, no hace falta compartir el viaje". Justo en los viajes cortos y de confianza es cuando bajamos la guardia. Compartir tu recorrido toma un segundo y no cuesta nada; no hacerlo puede dejar a tu gente sin saber dónde estás si algo se complica.</div>
<div class="box escenario"><b>Escenario</b>Son las 11 de la noche y regresas a casa tras un vuelo demorado. Antes de arrancar, tocas "compartir viaje en vivo" con tu hermana. Ella ve tu punto avanzar en el mapa hasta tu puerta y te escribe "llegaste, que descanses". Ese pequeño gesto convirtió un viaje tenso en uno tranquilo.</div>

<h2>6. Califica y aprovecha los niveles</h2>
<p>Al terminar, la app te pide calificar. Tu estrella no es un trámite: es la brújula que mantiene alta la calidad de toda la comunidad Going. Una calificación honesta premia a quien hizo un gran trabajo y ayuda a mejorar a quien lo necesita.</p>
<ul>
<li><strong>Sé justa o justo.</strong> Si tu conductor te saludó, condujo con cuidado y llegó a tiempo, díselo con cinco estrellas y un comentario. Reconocer motiva.</li>
<li><strong>Comenta con detalle.</strong> "Vehículo impecable y conducción tranquila" ayuda más que una estrella suelta.</li>
<li><strong>Conoce los niveles Aliado.</strong> Las conductoras y conductores avanzan de Bronce a Plata y Oro. Tu buena calificación reconoce ese esfuerzo y eleva a toda la red.</li>
</ul>
<div class="box clave"><b>Clave Going</b>Cada calificación honesta que das construye una comunidad más segura y amable para el próximo viaje: el tuyo y el de todos.</div>

<h2>En resumen</h2>
<p>Viajar inteligente con Going App es más simple de lo que parece: elige la modalidad que de verdad necesitas, rastrea tu viaje en vivo para viajar con calma, comunícate por el chat aprovechando la traducción automática, paga como más te convenga y usa siempre tus herramientas de seguridad. Cuando dominas todo esto, dejas de ser solo pasajera o pasajero y te vuelves parte de algo más grande: eres embajadora o embajador del Ecuador, esa persona que recibe con calidez a quien nos visita desde la Costa hasta Galápagos y que trata con respeto a cada conductora o conductor que la lleva. Esa actitud es la que teje viajes de cinco estrellas en ambos sentidos. Buen viaje, y bienvenida o bienvenido a Going App.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/v1-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/v1-echo.mp3',
    slides: [
      { title: 'Pide en segundos', points: ['Elige servicio', 'Origen y destino (texto/GPS/mapa)', 'Inmediato o reservado'], image: 'https://storage.googleapis.com/going-academy-audio/img/v1-s0.png?v2' },
      { title: 'Verifica antes de subir', points: ['Placa, modelo y foto coinciden', 'Confirma tu nombre', 'Si no coincide, no subas'], image: 'https://storage.googleapis.com/going-academy-audio/img/v1-s1.png?v2' },
      { title: 'Durante el viaje', points: ['Sigue la ruta en vivo', 'Comparte tu viaje', 'Chat con traducción', 'Botón SOS'], image: 'https://storage.googleapis.com/going-academy-audio/img/v1-s2.png?v2' },
      { title: 'Al llegar', points: ['Confirma el código de fin', 'Califica al conductor', 'Revisa tu recibo'], image: 'https://storage.googleapis.com/going-academy-audio/img/v1-s3.png?v2' },
      { title: 'Tips', points: ['Guarda Casa y Trabajo', 'Activa notificaciones', 'Mantén la app actualizada'], image: 'https://storage.googleapis.com/going-academy-audio/img/v1-s4.png?v2' },
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
    manualHtml: `
<p>Son las tres de la tarde en Riobamba y tu prima en Quito cumple años mañana. Tienes en las manos una humita empacada con amor, un suéter tejido por tu abuela y una caja de chocolates de El Salinerito. Antes, esto significaba un viaje de horas en bus, un encargo con un desconocido o rezar para que "alguien que suba" lo llevara. Hoy abres Going App, pides un envío puerta a puerta y en minutos tu paquete tiene conductora o conductor, tarifa fija, seguimiento en vivo y un código que garantiza que solo tu prima lo reciba. Los envíos no son solo mover cajas: son confianza que viaja. Y cuando entiendes cómo funcionan, ese suéter llega tan seguro como si tú mismo lo hubieras entregado en la puerta.</p>

<h2>1. Empaca pensando en el viaje, no en tu sala</h2>
<p>El error empieza casi siempre antes de abrir la app: empacamos como si el paquete fuera a quedarse quieto en una mesa. Pero un envío se sube y se baja del vehículo, comparte espacio con otros bultos y viaja por la Panamericana con sus curvas y sus baches. Un buen empaque no es un lujo, es lo que separa un chocolate entero de uno derretido y aplastado.</p>
<ul>
<li><strong>Protege desde adentro.</strong> Rellena los espacios vacíos con papel o burbuja para que el contenido no se mueva. Lo que baila dentro de la caja, se rompe.</li>
<li><strong>Sella bien y por fuera.</strong> Usa cinta de embalaje en las uniones, no cinta de oficina. Una caja mal cerrada se abre en el peor momento y su contenido termina disperso.</li>
<li><strong>Etiqueta con nombre y teléfono.</strong> Aunque la app guíe a tu conductora o conductor, una etiqueta clara evita confusiones cuando hay varios paquetes juntos.</li>
<li><strong>Piensa en el clima del Ecuador.</strong> De la Sierra fría a la Costa húmeda, un cambio de región cambia todo. Un forro plástico protege del sol de Guayaquil y de la garúa quiteña.</li>
</ul>

<div class="box escenario"><b>Escenario</b>Envías galletas caseras de Cuenca a Machala. Las pones sueltas en una funda. Al llegar son migajas. Con una caja rígida y papel alrededor, habrían llegado enteras. El empaque no encarece el envío: protege su valor.</div>

<h3>Lo que no debe viajar</h3>
<p>Ser viajera o viajero responsable también es saber qué no enviar. Nada de dinero en efectivo, documentos irremplazables sin respaldo, sustancias peligrosas ni artículos prohibidos por ley. Si dudas de que algo sea apto para transporte, no lo envíes: proteges a tu conductora o conductor y a ti.</p>

<div class="box clave"><b>Clave Going</b>El empaque es la primera promesa que haces: lo que sale bien envuelto, llega bien recibido.</div>

<h2>2. Elige el tamaño correcto: ni de más, ni de menos</h2>
<p>Cuando cotizas, la app te pide el tamaño del paquete, y aquí muchas personas se equivocan por apuro. Elegir un tamaño menor al real no te ahorra dinero: puede impedir que el paquete entre en el vehículo asignado y retrasar todo. Elegir uno mayor te hace pagar de más. El tamaño correcto es honestidad práctica.</p>
<ol>
<li><strong>Mide de verdad.</strong> Considera alto, ancho y largo, y también el peso. Una caja pequeña pero muy pesada no es un envío "pequeño".</li>
<li><strong>Piensa en cómo se carga.</strong> Los envíos más grandes requieren vehículos con más espacio; por eso ciertos tamaños usan opciones tipo SUV. Declarar bien el tamaño asegura que llegue el vehículo adecuado a la primera.</li>
<li><strong>Agrupa con cabeza.</strong> Si mandas varias cosas al mismo destino, una sola caja bien organizada suele ser más simple y económica que varios envíos sueltos.</li>
</ol>

<div class="box error"><b>Error común</b>Declarar una encomienda grande como "pequeña" para pagar menos. Consecuencia: llega un vehículo que no puede cargarla, se cancela o se reprograma, y tu paquete que debía salir hoy sale mañana. La honestidad en el tamaño es puntualidad.</div>

<h2>3. Cotiza puerta a puerta con confianza</h2>
<p>Una de las cosas más tranquilizadoras de Going App es que sabes el precio antes de aceptar. La cotización es puerta a puerta: se calcula según el tamaño que declaras y la ruta entre origen y destino. No hay sorpresas al final ni "ajustes" misteriosos. Esa transparencia es parte de por qué confías en la plataforma.</p>
<ul>
<li><strong>Direcciones exactas.</strong> Escribe bien el punto de recogida y el de entrega, con referencias claras ("casa celeste junto a la tienda", "portón verde del conjunto"). Una dirección precisa evita vueltas y demoras.</li>
<li><strong>Revisa la tarifa antes de confirmar.</strong> La app te muestra el valor; tómate un segundo para leerlo. Confirmar es aceptar ese precio con conocimiento.</li>
<li><strong>Paga como te quede cómodo.</strong> Tarjeta por Datafast, DeUna, tu Wallet Going o efectivo. La Wallet se recarga y hasta se transfiere, ideal si envías seguido.</li>
</ul>

<blockquote>"Lo mejor no fue que llegó rápido; fue que supe cuánto pagaba desde el principio y nadie me cambió el precio en la puerta." — Testimonio de una usuaria de envíos en Ambato.</blockquote>

<div class="box clave"><b>Clave Going</b>Precio claro desde el inicio: cotizas, aceptas y ya está. La confianza se construye sin letra pequeña.</div>

<h2>4. Sigue tu envío en vivo</h2>
<p>La ansiedad de "¿ya llegó?" desaparece cuando puedes ver dónde está tu paquete. El seguimiento en vivo no es un adorno tecnológico: es paz mental. Tú y quien recibe pueden mirar el avance en el mapa y coordinarse sin llamadas nerviosas.</p>
<ul>
<li><strong>Abre el seguimiento apenas se asigna el envío.</strong> Verás a tu conductora o conductor acercarse al punto de recogida.</li>
<li><strong>Coordina la entrega por el chat de la app.</strong> Tiene traducción automática, así que si quien recibe habla otro idioma, igual se entienden.</li>
<li><strong>Avisa a quien recibe.</strong> Comparte que va en camino y comparte el viaje en vivo si quieres que siga el recorrido. Un destinatario listo hace la entrega más rápida.</li>
<li><strong>Usa la seguridad de la app.</strong> Puedes verificar identidad y placa, y el botón SOS está siempre disponible. La seguridad no es solo para pasajeras y pasajeros: acompaña también a tus envíos.</li>
</ul>

<div class="box escenario"><b>Escenario</b>Mandas medicinas a tu mamá en Loja y ella está pendiente. En vez de llamarte cada diez minutos, abre el mapa y ve que el vehículo está a cinco cuadras. Se prepara con calma, baja a tiempo y la entrega toma treinta segundos. El seguimiento convirtió la angustia en tranquilidad.</div>

<h2>5. Confirma la entrega con código OTP</h2>
<p>Aquí está el corazón de la seguridad en los envíos. Cuando el paquete sale, la app genera un código OTP, un número único que solo tiene quien debe recibir. La conductora o conductor solo puede cerrar el envío cuando ese código se ingresa. Así, tu paquete no se entrega "a cualquiera que abra la puerta": se entrega a la persona correcta.</p>
<ol>
<li><strong>Comparte el OTP solo con quien recibe.</strong> Ese código es la llave de tu envío. No lo publiques ni lo mandes a grupos.</li>
<li><strong>Que lo diga al momento de recibir.</strong> Quien recibe entrega el código a la conductora o conductor, se confirma la entrega y todos tienen certeza de que llegó a su destino.</li>
<li><strong>Guarda la confirmación.</strong> Una vez cerrado con el OTP, el envío queda registrado como entregado. Esa es tu prueba tranquila de que la misión se cumplió.</li>
</ol>

<div class="box error"><b>Error común</b>Compartir el código OTP por adelantado en un grupo de WhatsApp "para agilizar". Consecuencia: pierdes el control de quién puede recibir el paquete y anulas justo la protección que te cuida. El OTP se dice en la puerta, no antes.</div>

<div class="box clave"><b>Clave Going</b>El código OTP es la firma digital de tu envío: sin él, no hay entrega; con él, hay certeza.</div>

<h2>6. Cuida la relación con tu conductora o conductor</h2>
<p>Detrás de cada envío hay una persona real que cuida tu paquete como propio. La cortesía no cambia el precio, pero cambia la experiencia, y es parte de ser una viajera o viajero que la comunidad Going valora. Reconoce el saludo oficial —"Bienvenido a Going App, soy [nombre]"— y verifica el lanyard de identificación visible: eso confirma que estás con la persona correcta.</p>
<ul>
<li><strong>Ten el paquete listo antes de que llegue.</strong> Respetas su tiempo y agilizas todo.</li>
<li><strong>Sé claro con las indicaciones.</strong> Un dato exacto ahorra vueltas y combustible.</li>
<li><strong>Califica al final.</strong> Tu calificación honesta sostiene el estándar de calidad; recuerda que la calificación mínima del conductor es de 4.5 estrellas y cada valoración cuenta.</li>
</ul>

<div class="box escenario"><b>Escenario</b>Tu conductor llega puntual, con su lanyard visible, y te saluda por tu nombre. Tú ya tienes la caja sellada y la dirección de entrega clara en el chat. En dos minutos el envío está en camino. Esa fluidez nace de que ambos hicieron bien su parte.</div>

<h2>En resumen</h2>
<p>Enviar por Going App es mucho más que despachar una caja: es mover confianza a lo largo del Ecuador, de la Sierra a la Costa, de la Amazonía a donde haga falta. Cuando empacas pensando en el viaje, declaras el tamaño con honestidad, cotizas con claridad, sigues tu paquete en vivo y confirmas con el código OTP, no solo garantizas que tu envío llegue: te conviertes en embajadora o embajador del Ecuador, alguien que muestra que aquí las cosas se hacen bien, seguras y con cariño. Cada envío bien hecho es una historia que termina en sonrisa, y esas sonrisas son las que, envío tras envío, te ganan tus cinco estrellas.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/v2-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/v2-echo.mp3',
    slides: [
      { title: 'Prepara el paquete', points: ['Caja firme + relleno', 'Sella y etiqueta claro', 'Adjunta foto del paquete'], image: 'https://storage.googleapis.com/going-academy-audio/img/v2-s0.png?v2' },
      { title: 'Elige el tamaño', points: ['Pequeño 0–5 kg', 'Mediano 6–15 kg', 'Grande 16–30 kg', 'Ves el precio antes de confirmar'], image: 'https://storage.googleapis.com/going-academy-audio/img/v2-s1.png?v2' },
      { title: '¿Quién paga?', points: ['Remitente: tarjeta o efectivo', 'Destinatario: link o contra entrega'], image: 'https://storage.googleapis.com/going-academy-audio/img/v2-s2.png?v2' },
      { title: 'Seguimiento', points: ['Rastreo en vivo', 'Entrega con código OTP', 'Nada ilegal ni peligroso'], image: 'https://storage.googleapis.com/going-academy-audio/img/v2-s3.png?v2' },
      { title: 'Tip', points: ['Buen empaque + dirección clara', '= envío sin problemas'], image: 'https://storage.googleapis.com/going-academy-audio/img/v2-s4.png?v2' },
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
    manualHtml: `
<p>Estás en el aeropuerto de Tababela, acabas de bajar de tu viaje compartido desde Quito y el conductor pregunta cómo pagas. Sacas la billetera, pero no tienes efectivo justo; solo tu tarjeta. Sin drama: abres Going App, tocas "Pagar con tarjeta", confirmas y en dos segundos el viaje se cierra. Al día siguiente, tu contadora te pide la factura de ese traslado y la descargas desde la app en menos de un minuto. Saber cómo pagas y cómo documentas cada gasto no es un detalle menor: es lo que separa un viaje tranquilo de un dolor de cabeza. En Going, el pago es parte de la experiencia, y este manual te enseña a dominarlo.</p>

<h2>1. Conoce tus formas de pago</h2><p>Going App te da varias maneras de pagar porque cada viajera o viajero vive una realidad distinta: unos prefieren la tarjeta, otros manejan efectivo, y muchos quieren dejar todo listo por adelantado. Entender cada método te permite elegir el más cómodo según el momento, sin improvisar cuando ya estás sobre la marcha.</p>
<ul>
<li><strong>Tarjeta de crédito o débito (Datafast).</strong> Es el método más rápido y deja rastro automático de cada pago. Registras tu tarjeta una vez de forma segura y, en cada viaje o envío, se cobra el monto exacto. Ideal si viajas seguido o si necesitas facturas ordenadas para tu trabajo.</li>
<li><strong>DeUna.</strong> El pago digital desde tu banco, muy usado en Ecuador. Confirmas la transacción desde tu propia aplicación bancaria; es cómodo si prefieres no guardar la tarjeta en la app.</li>
<li><strong>Wallet Going.</strong> Tu monedero dentro de la app. Lo recargas cuando quieres y pagas al instante, sin depender de la señal del datáfono ni de tener efectivo. Además, puedes transferir saldo a otra persona, útil si le regalas un viaje a un familiar o coordinas un traslado para alguien más.</li>
<li><strong>Efectivo.</strong> Sigue siendo válido y muchas personas lo prefieren. Solo recuerda llevar el monto lo más aproximado posible para agilizar el cierre del viaje.</li>
</ul>

<div class="box clave"><b>Clave Going</b>El mejor método de pago es el que ya tienes listo antes de subir al vehículo: elige y configura con calma, no cuando el conductor ya te espera.</div>

<h3>Tarifa fija: lo que ves es lo que pagas</h3><p>En los viajes intercity programados la tarifa es FIJA. Eso significa que el precio que aceptaste al reservar es el que se cobra, sin sorpresas por tráfico o por la hora. En las carreras dentro de la ciudad el valor se calcula según el recorrido. Saber esto te evita malentendidos: si reservaste un Riobamba–Quito con tarifa fija, ese es el monto, punto.</p>

<div class="box escenario"><b>Escenario</b>Reservas un viaje compartido Sto. Domingo–aeropuerto por la mañana. Antes de salir, recargas tu Wallet Going desde casa con wifi. Cuando llegas, el pago se descuenta solo y no pierdes ni un segundo buscando billetes ni esperando el datáfono bajo la lluvia.</div>

<h2>2. Paga con tarjeta por Datafast, paso a paso</h2><p>Pagar con tarjeta parece obvio, pero hacerlo bien te ahorra rechazos incómodos y cobros que no reconoces. Datafast es la pasarela que procesa tu tarjeta de forma segura, así que tus datos viajan cifrados y Going nunca ve tu número completo.</p>
<ol>
<li><strong>Registra tu tarjeta antes de viajar.</strong> Ve a la sección de métodos de pago y añádela con calma en tu casa. Verifica que el nombre y la fecha de vencimiento estén correctos; un dígito mal escrito es la causa número uno de pagos rechazados.</li>
<li><strong>Confirma el monto antes de aceptar.</strong> La app te muestra el valor. Léelo. Es tu derecho saber cuánto pagas antes de autorizar.</li>
<li><strong>Autoriza el cobro.</strong> Al terminar el viaje o al confirmar el envío, aprueba el pago. Recibirás una confirmación en pantalla.</li>
<li><strong>Guarda el comprobante.</strong> La app registra la transacción en tu historial. Ahí queda todo, disponible cuando lo necesites.</li>
</ol>

<div class="box error"><b>Error común</b>Registrar la tarjeta con un fondo insuficiente o vencida y descubrirlo justo al bajar del vehículo. El pago se rechaza, se genera un momento incómodo con el conductor y el viaje queda pendiente. Revisa tu tarjeta antes, no después.</div>

<h2>3. Wallet Going: tu monedero siempre listo</h2><p>El Wallet es la forma más ágil de pagar porque el dinero ya está adentro de la app. No dependes de señal, de saldo en la tarjeta en ese instante ni de tener cambio exacto. Es especialmente útil para quien viaja a diario o para quien organiza traslados de la familia.</p>
<ul>
<li><strong>Recarga cuando tengas buena conexión.</strong> Hazlo desde casa o la oficina con wifi estable, para que el saldo esté disponible el día del viaje.</li>
<li><strong>Transfiere saldo a quien lo necesite.</strong> Si tu mamá viaja del aeropuerto a casa, le pasas saldo y ella paga sin cargar efectivo. Es seguridad y comodidad para ambos.</li>
<li><strong>Controla tu gasto.</strong> Al recargar un monto fijo, sabes exactamente cuánto destinas a movilidad en el mes. El Wallet se vuelve tu presupuesto de viajes.</li>
</ul>

<blockquote>"Recargué el Wallet el domingo y esta semana no toqué ni la billetera ni el banco: subo, viajo y bajo." — Testimonio de una viajera frecuente en la Sierra.</blockquote>

<h2>4. Descarga tus facturas y recibos</h2><p>Toda transacción en Going queda registrada, y eso te da poder: puedes comprobar lo que pagaste, respaldar un gasto ante tu empresa o llevar tu contabilidad personal al día. La factura no es un trámite; es tu respaldo.</p>
<ol>
<li><strong>Entra a tu historial de viajes o envíos.</strong> Ahí encuentras cada movimiento con su fecha, monto y método de pago.</li>
<li><strong>Abre el detalle de la transacción.</strong> Verás el desglose del viaje o envío que buscas.</li>
<li><strong>Descarga o solicita la factura.</strong> Asegúrate de tener tus datos de facturación completos y correctos: nombre o razón social, identificación y correo. Con esos datos bien cargados, tu factura sale al instante.</li>
<li><strong>Guárdala o reenvíala.</strong> Puedes conservarla en tu correo o compartirla con tu contadora directamente.</li>
</ol>

<div class="box clave"><b>Clave Going</b>Carga tus datos de facturación correctos una sola vez y bien: de ahí en adelante, cada recibo sale limpio y listo sin que tengas que corregir nada.</div>

<div class="box escenario"><b>Escenario</b>Viajas por trabajo de Quito a Ambato y tu empresa te reembolsa el traslado. Al final del mes abres tu historial, descargas las cuatro facturas de esos viajes intercity con tarifa fija y las envías juntas a tu jefa. Todo cuadra al centavo porque el precio fijo coincide con lo que reservaste.</div>

<h2>5. Resuelve disputas y controla tus gastos</h2><p>A veces algo no sale como esperabas: un cobro que no reconoces, un monto que no cuadra o un pago que quedó en el aire. Lo importante es que sepas cómo actuar con calma, porque en Going siempre queda evidencia de cada transacción y tienes canales para aclarar cualquier duda.</p>
<h3>Si ves un cobro que no reconoces</h3>
<ul>
<li><strong>Revisa primero tu historial.</strong> Compara la fecha, la ruta y el monto. Muchas veces el "cobro extraño" es simplemente un viaje que olvidaste.</li>
<li><strong>Verifica la tarifa acordada.</strong> En intercity, la tarifa era fija; si el monto coincide con lo reservado, todo está en orden.</li>
<li><strong>Reporta desde la app.</strong> Si algo no cuadra, usa el soporte de la aplicación con el detalle de la transacción a la mano. El chat cuenta con traducción automática, así que puedes explicarte en tu idioma. Adjunta lo que tengas: fecha, monto y descripción.</li>
<li><strong>Guarda la conversación.</strong> Todo queda registrado, lo que agiliza la solución.</li>
</ul>
<h3>Lleva el control de tu bolsillo</h3>
<ul>
<li><strong>Usa el historial como tu libro de gastos.</strong> Cada mes sabes cuánto invertiste en movilidad y envíos.</li>
<li><strong>Prefiere un método por objetivo.</strong> Tarjeta para lo laboral (facturas ordenadas), Wallet para lo personal (presupuesto controlado).</li>
<li><strong>Confirma el pago del envío.</strong> Recuerda que la entrega puerta a puerta se cierra con un código OTP: ese código confirma que el paquete llegó y que el pago corresponde a un servicio cumplido.</li>
</ul>

<div class="box error"><b>Error común</b>Ignorar un cobro dudoso "para revisarlo después" y dejar pasar semanas. Cuanto más tiempo pasa, más difícil es reconstruir qué ocurrió. Reporta apenas lo notes, mientras el detalle está fresco y a la mano.</div>

<blockquote>"No reclames a ciegas ni te quedes callado: abre tu historial, mira el detalle y reporta con datos. Con evidencia, todo se resuelve más rápido."</blockquote>

<h2>En resumen</h2><p>Dominar los pagos y la facturación en Going te da algo valioso: tranquilidad. Cuando eliges tu método con calma, cargas bien tus datos de facturación, descargas tus recibos y sabes cómo aclarar cualquier duda, dejas de preocuparte por el dinero y te enfocas en disfrutar del Ecuador, sea la Costa, la Sierra, la Amazonía o Galápagos. Una viajera o un viajero que paga sin fricciones y trata cada transacción con orden también trata bien a quien conduce: cierras el viaje con una sonrisa, no con un problema. Ese cuidado se nota, se agradece y se devuelve en forma de esas 5 estrellas que te convierten en la mejor versión de una viajera o viajero Going: alguien que se mueve por su país con confianza y respeto.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/v3-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/v3-echo.mp3',
    slides: [
      { title: 'Formas de pago', points: ['Tarjeta (Datafast) y DeUna', 'Wallet: recarga y transfiere', 'Efectivo cuando aplica'], image: 'https://storage.googleapis.com/going-academy-audio/img/v3-s0.png?v2' },
      { title: 'Going App Wallet', points: ['Recarga y paga con saldo', 'Transfiere por correo/teléfono', 'Revisa tus movimientos'], image: 'https://storage.googleapis.com/going-academy-audio/img/v3-s1.png?v2' },
      { title: 'Precio claro', points: ['Tarifa fija o estimado', 'Lo ves antes de confirmar', 'Reservas: precio garantizado'], image: 'https://storage.googleapis.com/going-academy-audio/img/v3-s2.png?v2' },
      { title: 'Recibos y cobros', points: ['Recibo en el historial', 'Factura: datos fiscales en el perfil', 'Cobro raro → soporte'], image: 'https://storage.googleapis.com/going-academy-audio/img/v3-s3.png?v2' },
      { title: 'Seguridad', points: ['Nunca compartas tu contraseña', 'Ni los códigos SMS', 'Going App jamás los pide'], image: 'https://storage.googleapis.com/going-academy-audio/img/v3-s4.png?v2' },
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
    manualHtml: `
<p>Imagina que una viajera acaba de bajar del bus en Salinas de Guaranda. Está cansada, tiene frío de páramo y solo quiere una foto del pueblo antes de seguir. Frente a ella hay dos guías. La primera dice: "Aquí hacen quesos, ¿vamos?". La segunda se acerca, la mira a los ojos y dice: "Hace cuarenta años este pueblo era el más pobre de la provincia. Hoy exportamos chocolate a Europa, y todo empezó con un sacerdote y una cooperativa. Ven, te cuento cómo lo lograron mientras probamos el queso que cambió su destino". ¿A cuál seguirías tú? El storytelling no es adornar; es la diferencia entre mostrar un lugar y hacer que alguien lo sienta. Cuando cuentas bien, no vendes un tour: regalas un recuerdo que la persona repetirá en su casa, y cada vez que lo repita, estará recomendándote sin saberlo.</p>

<h2>1. Por qué una historia vale más que un dato</h2>
<p>El cerebro humano olvida cifras, pero guarda historias. Puedes decir "esta cerámica tiene 300 años" y la persona asiente sin emocionarse. Pero si dices "las manos que amasaron este barro trabajaban igual que las de mi abuela, que me enseñó de niña", acabas de conectar un objeto con una emoción, y eso ya no se olvida. Como guía local, tu ventaja no es saber más datos que internet; internet siempre sabrá más. Tu ventaja es que tú estuviste ahí, tú conoces a la artesana, tú puedes contar el detalle que ningún buscador tiene.</p>
<ul>
<li><strong>El dato informa, la historia transforma.</strong> Un número entra por un oído y sale por el otro; una escena bien contada se queda. Usa los datos como semillas de historias, no como el plato principal.</li>
<li><strong>La emoción es lo que se recomienda.</strong> Nadie le dice a un amigo "me contaron la altura exacta del volcán". Le dice "sentí que se me erizaba la piel". Apunta siempre a ese segundo tipo de frase.</li>
<li><strong>Tu autenticidad es irreemplazable.</strong> Habla de lo que conoces de verdad, de tu comunidad, tu taller, tu región. Una historia prestada suena hueca; una vivida se nota en la voz.</li>
</ul>
<div class="box clave"><b>Clave Going</b> No cuentes lo que un buscador ya sabe; cuenta lo que solo tú, que vives aquí, puedes contar.</div>

<h2>2. La estructura de tres actos</h2>
<p>Toda buena historia, desde una película hasta la de tu comunidad, sigue la misma columna vertebral: un inicio que engancha, un medio con tensión y un final que resuelve. No necesitas ser escritora o escritor profesional; solo necesitas ordenar lo que ya sabes en tres actos. Esta estructura funciona porque respeta cómo escuchamos: primero queremos entender de qué se trata, luego queremos saber qué estuvo en juego, y al final queremos sentir que valió la pena.</p>
<h3>Acto 1: el gancho (el "antes")</h3>
<p>Los primeros treinta segundos deciden si la persona te escucha o mira el celular. Empieza con una pregunta, una imagen fuerte o un contraste. En vez de "les voy a hablar del sombrero de paja toquilla", prueba "¿Sabías que el sombrero que el mundo llama 'Panamá' en realidad nace aquí, en Montecristi, y una sola pieza puede tomar seis meses de trabajo?".</p>
<h3>Acto 2: el corazón (el "durante")</h3>
<p>Aquí va la tensión: el problema, el desafío, lo que estuvo en riesgo. Toda comunidad tiene una lucha. La sequía, la migración de los jóvenes, el terremoto del 2016 en Manabí, la tentación de vender la tierra. Sin conflicto no hay historia, solo un folleto.</p>
<h3>Acto 3: la resolución (el "hoy")</h3>
<p>Cierra mostrando el presente y conectándolo con la persona que tienes enfrente. "Y por eso, cuando tú compras esta pieza hoy, esa historia sigue viva". El final debe darle a tu viajera o viajero un papel en el relato.</p>
<div class="box escenario"><b>Escenario</b> Guías un taller de tejido en Otavalo. En vez de listar técnicas, cuentas: la abuela que aprendió a tejer a los ocho años (gancho), los años en que casi nadie compraba y la familia pensó en cerrar (corazón), y cómo hoy sus nietos venden en línea y el telar sigue sonando (resolución). Al final, la huésped no compró una bufanda: compró un capítulo de esa familia.</div>

<h2>3. Crear momentos memorables</h2>
<p>La gente no recuerda tours completos; recuerda momentos. Un instante que rompe la rutina se graba más que una hora entera de explicación correcta. Por eso, en lugar de repartir tu energía de forma pareja, concentra tu creatividad en diseñar dos o tres picos: un momento sensorial, uno de sorpresa y uno de participación. Esos picos son lo que la persona describirá cuando la llamen a contar su viaje.</p>
<ol>
<li><strong>Involucra los sentidos.</strong> Que huelan el cacao recién abierto, que toquen la lana sin lavar, que prueben la colada morada. Lo que se toca y se saborea se recuerda con el cuerpo, no solo con la cabeza.</li>
<li><strong>Regala una sorpresa pequeña.</strong> Un secreto del oficio, un mirador que no aparece en las guías, una probadita inesperada. Lo inesperado es lo que se cuenta después.</li>
<li><strong>Dale un papel activo.</strong> Que muela el grano, que dé una puntada, que ayude a apagar el horno de barro. Quien participa deja de ser espectador y se vuelve protagonista de tu historia.</li>
<li><strong>Cierra con un ritual.</strong> Un brindis con canelazo, una foto en el mismo punto, una palabra en kichwa que se lleven aprendida. El ritual final sella la experiencia.</li>
</ol>
<div class="box clave"><b>Clave Going</b> Diseña dos o tres picos memorables; la gente recomienda momentos, no recorridos completos.</div>

<h2>4. Adapta tu historia a quien tienes enfrente</h2>
<p>La misma historia no se cuenta igual a una familia con niños que a un grupo de fotógrafos o a una pareja en luna de miel. Contar bien no es recitar un guion memorizado; es leer a tu público y ajustar el ritmo, el detalle y el humor. Escucha las primeras preguntas que te hacen: te dicen qué les interesa. Si preguntan por precios y procesos, son curiosos del oficio; si preguntan por la gente, quieren lo humano.</p>
<ul>
<li><strong>Con familias.</strong> Baja el nivel, suma juego y preguntas: "¿Quién adivina de qué color sale este tinte?". Los niños felices hacen padres agradecidos.</li>
<li><strong>Con viajeras y viajeros internacionales.</strong> Apóyate en la traducción automática del chat de la app para las palabras difíciles, y traduce también lo cultural: explica qué es una minga, qué significa el páramo, por qué la Amazonía importa para el mundo.</li>
<li><strong>Con grupos mayores o de interés cultural.</strong> Profundiza en historia, dales tiempo, respeta los silencios. A veces el mejor momento es callar y dejar que el paisaje hable.</li>
</ul>
<blockquote>"No cuentes tu historia como la ensayaste; cuéntala como la necesita quien te escucha hoy."</blockquote>
<div class="box error"><b>Error común</b> Recitar exactamente el mismo discurso palabra por palabra en cada tour, sin mirar a la gente. El resultado se siente robótico y frío; el grupo se desconecta, nadie hace preguntas y la calificación baja porque, aunque el dato sea correcto, faltó la conexión humana que la gente venía a buscar.</div>

<h2>5. Cierra vendiendo sin vender</h2>
<p>El mejor cierre no dice "cómprame". Deja que la historia haga la venta por ti. Si contaste bien el valor del trabajo, la persona querrá llevarse un pedazo de esa historia de forma natural. Tu labor final es facilitarle ese deseo, no presionarlo. Vender desde el relato es honesto y genera clientes felices; vender desde la presión genera arrepentimiento y malas reseñas.</p>
<ul>
<li><strong>Conecta el producto con el relato.</strong> "Esta es la misma técnica que te conté que casi se pierde". El objeto deja de ser mercancía y se vuelve recuerdo con significado.</li>
<li><strong>Ofrece el pago fácil y claro.</strong> Recuerda que en Going puedes cobrar por tarjeta con Datafast, DeUna, Wallet Going o efectivo. Menciónalo con naturalidad, sin que el dinero corte la magia.</li>
<li><strong>Pide la recomendación en el momento justo.</strong> Cuando veas la sonrisa satisfecha, ahí, con calidez: "Si te gustó, me ayudas muchísimo con tus cinco estrellas y contándolo a quien viaje al Ecuador".</li>
</ul>
<div class="box escenario"><b>Escenario</b> Terminas un tour de café en la Amazonía. En vez de empujar la venta, dices: "Este es el café que la familia tostó frente a ti hace un rato". La pareja compra dos libras sin que tuvieras que insistir, porque ya no es café: es el sabor de la mañana que vivieron contigo. Y al despedirte con tu lanyard visible, te dejan cinco estrellas.</div>

<h2>En resumen</h2>
<p>Contar bien tu historia es el arte de convertir tu comunidad, tu artesanía o tu taller en una experiencia que alguien recuerde toda la vida. Empieza con un gancho, atraviesa el corazón del conflicto, cierra dándole a la persona un papel en el relato, y siembra dos o tres momentos que se lleven en el cuerpo. Cuando lo haces con verdad, dejas de ser guía y te vuelves embajadora o embajador del Ecuador: cada visitante que se va con tu historia en la boca lleva a la Costa, la Sierra, la Amazonía o Galápagos a su casa. Ese es el camino para subir de nivel Aliado, mantener tus cinco estrellas y hacer que te recomienden una y otra vez. Tu voz es tu mejor herramienta; úsala para que quien viaje contigo no solo vea el Ecuador, sino que lo sienta.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/g1-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/g1-echo.mp3',
    slides: [
      { title: '¿Por qué historias?', points: ['Se recuerdan emociones, no datos', 'Tu conocimiento local es tu ventaja', 'Una buena historia se recomienda sola'], image: 'https://storage.googleapis.com/going-academy-audio/img/g1-s0.png?v2' },
      { title: 'Estructura', points: ['Gancho que despierta curiosidad', 'Desarrollo con hilo claro', 'Clímax memorable', 'Cierre con algo que se llevan'], image: 'https://storage.googleapis.com/going-academy-audio/img/g1-s1.png?v2' },
      { title: 'Hazlo vivo', points: ['Involucra los sentidos', 'Detalles y nombres reales', 'Haz preguntas al grupo', 'Respeta la verdad'], image: 'https://storage.googleapis.com/going-academy-audio/img/g1-s2.png?v2' },
      { title: 'Momento memorable', points: ['Diseña 1 por experiencia', 'Mirador, degustación, demo', 'Es lo que comparten'], image: 'https://storage.googleapis.com/going-academy-audio/img/g1-s3.png?v2' },
      { title: 'Resultado', points: ['Visita → recuerdo', 'Recuerdo → recomendación', 'Recomendación → más reservas'], image: 'https://storage.googleapis.com/going-academy-audio/img/g1-s4.png?v2' },
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
    manualHtml: `
<p>Son las ocho de la mañana en la Plaza Grande de Quito. Tienes frente a ti a catorce personas: una pareja de jubilados alemanes que caminan despacio, tres jóvenes que ya se adelantaron a tomar fotos, una familia con un niño de seis años, y un señor que no ha soltado su teléfono desde que llegó. En una hora los llevarás por el Centro Histórico, subirán a un mirador y probarán chocolate. Tu reto no es solo mostrar iglesias bonitas: es lograr que estas catorce personas tan distintas terminen el día sintiéndose UN grupo, cuidado y feliz. Un guía novato ve turistas; una guía o un guía Going ve personas que confiaron su tiempo, su seguridad y su recuerdo del Ecuador en tus manos. Manejar un grupo es el arte invisible detrás de cada tour memorable, y es exactamente lo que separa las 4 estrellas de las 5.</p>

<h2>1. Antes de arrancar: el grupo se ordena solo si tú lo ordenas</h2>
<p>La mayoría de los problemas de un tour no nacen en el recorrido, nacen en los primeros cinco minutos, cuando nadie sabe quién eres, hacia dónde van ni qué reglas hay. Un grupo sin marco claro se dispersa, se atrasa y se pone nervioso. Por eso tu trabajo empieza antes del primer paso.</p>
<ul>
<li><strong>Preséntate con el saludo oficial y tu lanyard visible.</strong> "Bienvenido a Going App, soy [nombre]" no es una formalidad vacía: le dice al grupo que hay alguien a cargo. El lanyard de identificación confirma con la vista lo que dijiste con la voz, y calma a quien viene con dudas de seguridad.</li>
<li><strong>Haz un conteo inicial y memoriza señas.</strong> Cuenta cuántas personas son y fíjate en rasgos fáciles: la gorra roja, la pareja mayor, el niño. Ese mapa mental es tu herramienta para no perder a nadie después.</li>
<li><strong>Fija las tres reglas del día en voz alta.</strong> Cuánto dura el tour, dónde y a qué hora son las paradas de baño y comida, y qué hacer si alguien se separa ("si te pierdes, quédate donde estás y escríbeme por el chat de la app"). Reglas claras al inicio evitan discusiones al final.</li>
</ul>
<div class="box clave"><b>Clave Going</b>Un grupo bien recibido en los primeros cinco minutos casi nunca se vuelve un grupo difícil a la hora tres.</div>

<h2>2. Mantener la atención: hablas para el que está más distraído</h2>
<p>La atención de un grupo es como una batería: se descarga. A los quince minutos de datos y fechas, hasta la persona más interesada empieza a mirar el celular. Tu misión no es recitar información, es contar historias que la gente quiera repetir en su casa. Recuerda: no compites con otro guía, compites con el teléfono de cada persona.</p>
<h3>Cómo sostener el interés de 2 o de 20</h3>
<ul>
<li><strong>Cuenta historias, no enciclopedias.</strong> "Esta iglesia se terminó en 1765" se olvida; "los albañiles tardaron tanto que hubo abuelos, hijos y nietos trabajando en la misma pared" se recuerda. El dato entra escondido dentro del relato.</li>
<li><strong>Ubícate para que todos te vean y te oigan.</strong> Ponte de espaldas a lo que muestras, con el grupo en semicírculo, nunca hablando mientras caminas de espaldas hacia un grupo que te sigue en fila. En grupos grandes, espera a que los últimos lleguen antes de empezar a hablar.</li>
<li><strong>Haz preguntas y da micro-pausas para fotos.</strong> "¿Alguien adivina para qué servía esto?" despierta al grupo. Y si vas a hablar cinco minutos de un mirador, primero regala treinta segundos de fotos; así te escuchan sin la ansiedad de perder la toma.</li>
<li><strong>Usa el chat con traducción para el grupo mixto.</strong> Si tienes personas que hablan otro idioma, apóyate en la traducción automática del chat de la app para datos clave, direcciones y horarios. Nadie debe quedarse afuera de la experiencia por el idioma.</li>
</ul>
<div class="box escenario"><b>Escenario</b>A media mañana notas que tres personas se quedaron atrás mirando una tienda y el resto ya se aburrió esperando. En vez de gritar, acércate a los rezagados con calma, dales un cierre ("les doy dos minutos y seguimos, hay algo mejor adelante") y regresa al grupo grande con una pregunta que los reactive. Recuperas a los dos bandos sin regañar a nadie.</div>

<h2>3. Gestionar el tiempo: el reloj es parte del guion</h2>
<p>Un tour que se atrasa contagia estrés a todo el grupo, especialmente cuando hay un traslado Going esperando o una reserva de almuerzo. El tiempo mal manejado es la queja silenciosa que baja estrellas sin que la persona lo diga en voz alta. Tú eres el guardián del ritmo.</p>
<ol>
<li><strong>Divide el tour en bloques con hora tope.</strong> Mentalmente ten "hasta las 10:30 el centro, 11:00 el mirador". Si un bloque se estira, sabes de dónde recortar sin que se note.</li>
<li><strong>Da tiempos concretos, no vagos.</strong> "Nos vemos aquí en quince minutos, a las 11:15" funciona; "un ratito y seguimos" garantiza que alguien vuelva tarde. Señala un punto de encuentro visible y repítelo.</li>
<li><strong>Protege la conexión con otros servicios.</strong> Si el grupo continúa en un viaje intercity programado, recuerda que la tarifa es fija y que la app avisa una hora y cinco minutos antes; llega al punto de recogida con margen para que nadie corra ni se pierda el enlace.</li>
<li><strong>Ten un plan B de tiempo.</strong> Si llueve o una calle está cerrada, ya debes saber qué parada acortas. Improvisar frente al grupo se ve como desorden; decidir rápido se ve como experiencia.</li>
</ol>
<div class="box error"><b>Error común</b>Dar "diez minutos libres" sin señalar un punto y una hora exacta de regreso. Resultado: siempre hay dos personas que vuelven a los veinticinco minutos, el resto se molesta esperando bajo el sol, y el tour entero se atrasa arrastrando la queja hasta la calificación final.</div>

<h2>4. Personas difíciles: casi nunca son malas, casi siempre están incómodas</h2>
<p>En todo grupo aparece alguien que reta el ritmo: quien pregunta demasiado, quien se queja de todo, quien bebió de más o quien simplemente está cansado. La reacción de guía novato es defenderse o ignorar; la reacción profesional es entender que detrás de casi toda persona difícil hay una necesidad no atendida: atención, descanso, comida o miedo.</p>
<h3>Los perfiles que más verás</h3>
<ul>
<li><strong>Quien acapara con preguntas.</strong> No lo calles: reconoce su interés y redirígelo ("excelente pregunta, te la respondo completa en la próxima parada para no atrasar al grupo"). Le das valor y recuperas el ritmo.</li>
<li><strong>Quien se queja de todo.</strong> Escucha una vez de verdad, valida la molestia ("tienes razón, la subida es dura") y ofrece una salida concreta. Muchas quejas se apagan solo con sentirse escuchadas.</li>
<li><strong>Quien tomó de más o se pone agresivo.</strong> Aquí tu prioridad no es el tour, es el resto del grupo. Mantén la calma, no discutas, sepáralo del grupo con tacto y, si la seguridad se compromete, apóyate en el botón SOS de la app y en los protocolos. Tu tranquilidad es contagiosa.</li>
<li><strong>El niño o la persona mayor que marca otro ritmo.</strong> No es un problema, es información: ajusta pausas y velocidad. Un grupo que ve que cuidas al más lento confía en que te cuidará a cada uno.</li>
</ul>
<blockquote>"Nunca discutas con una persona molesta frente a su grupo. Bájala del escenario con respeto, resuelve en privado, y regresa al recorrido como si nada. El grupo recordará que mantuviste la calma."</blockquote>
<div class="box clave"><b>Clave Going</b>No manejas conflictos, manejas necesidades: encuentra qué le falta a la persona difícil y el conflicto casi siempre se desarma solo.</div>

<h2>5. Seguridad del grupo: tu responsabilidad silenciosa de principio a fin</h2>
<p>Puedes dar el tour más entretenido del Ecuador, pero si alguien se lastima, se pierde o se siente inseguro, todo lo demás desaparece. La seguridad no se ve cuando todo sale bien; se nota muchísimo cuando falla. Por eso la trabajas siempre, en silencio, sin alarmar al grupo.</p>
<ul>
<li><strong>Cuenta cabezas en cada traslado y cada parada.</strong> Antes de cruzar una calle, antes de subir a un vehículo, antes de dejar un sitio: cuenta. Es el hábito más simple y el que evita el peor susto.</li>
<li><strong>Camina con el grupo compacto en zonas concurridas.</strong> Tú adelante marcando el paso y, si es un grupo grande, pide que alguien de confianza cierre la fila. Así nadie queda suelto entre la multitud.</li>
<li><strong>Conoce las salidas, baños y punto de reunión de cada lugar.</strong> Si algo pasa, no es momento de improvisar. Un grupo siente la seguridad cuando el guía ya sabe a dónde ir.</li>
<li><strong>Aprovecha las herramientas de seguridad de la app.</strong> Recuerda a las viajeras y viajeros que pueden compartir su viaje en vivo, verificar identidad y placa en los traslados, y que existe el botón SOS. Y cuida los datos del grupo: la seguridad también es respeto por su información.</li>
<li><strong>Ten claro el protocolo si alguien se separa de verdad.</strong> Mantén al grupo junto en un punto seguro, contacta a la persona por el chat de la app y no fragmentes al grupo mandando a otros a buscar. Un extraviado se resuelve mejor con el grupo quieto y unido.</li>
</ul>
<div class="box escenario"><b>Escenario</b>En un mirador de la Sierra, una señora mayor se marea por la altura. No lo minimices ni sigas con la ruta. Siéntala a la sombra, dale agua, avisa con calma al grupo que harán una pausa de cinco minutos, y decide si acortas el siguiente tramo. El grupo entero recordará que cuidaste a una persona por encima del cronograma, y esa es la mejor propaganda que existe.</div>

<h2>6. El cierre: cómo terminas define cómo te califican</h2>
<p>La memoria humana premia el final. Un tour que se apaga porque "ya se acabó el tiempo" deja a la gente con sensación de vacío, aunque todo lo anterior fuera excelente. Un cierre cálido y ordenado convierte a un grupo satisfecho en un grupo que te recomienda y te da cinco estrellas.</p>
<ul>
<li><strong>Haz un cierre con sentido, no un "hasta aquí llegamos".</strong> Resume lo vivido en una frase, agradece con nombre cuando puedas, y conecta con la emoción del día: "hoy conocieron la Sierra que muchos ecuatorianos aman".</li>
<li><strong>Confirma el siguiente paso de cada persona.</strong> Quién continúa en un traslado, quién vuelve al alojamiento, quién sigue por su cuenta. Que nadie quede desorientado al final marca la diferencia entre un servicio y una experiencia.</li>
<li><strong>Invita a calificar sin presionar.</strong> Un "me encantó compartir el Ecuador con ustedes, sus comentarios me ayudan a mejorar" es honesto y suficiente. La calidad se recomienda sola.</li>
</ul>
<div class="box error"><b>Error común</b>Terminar el tour de golpe y despedirte apurado para correr al siguiente grupo. La gente lo lee como desinterés, y esa última impresión pesa más que dos horas buenas: es la causa número uno de una calificación tibia después de un tour que en realidad estuvo muy bien.</div>

<h2>En resumen</h2>
<p>Manejar un grupo, sean dos personas o veinte, es mucho más que caminar adelante señalando edificios: es crear un espacio donde gente distinta se siente vista, segura y bienvenida en tu país. Cuando recibes bien, cuentas historias, cuidas el tiempo, desarmas conflictos con empatía y proteges a cada persona hasta el final, dejas de ser un simple guía y te conviertes en embajadora o embajador del Ecuador. Cada grupo que despides feliz es una historia que viajará a otros países contando cómo es la Costa, la Sierra, la Amazonía o Galápagos, y cómo alguien de Going los cuidó de verdad. Esa reputación es la que sube tu nivel Aliado de Bronce a Plata y a Oro, la que sostiene tu 4.5 estrellas y la lleva a 5. Manejar bien a un grupo no es controlar personas: es ganarte su confianza, una parada a la vez.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/g2-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/g2-echo.mp3',
    slides: [
      { title: 'Empieza bien', points: ['Preséntate y pon reglas', 'Cuenta cabezas (inicio y paradas)', 'Acuerda punto de reunión'], image: 'https://storage.googleapis.com/going-academy-audio/img/g2-s0.png?v2' },
      { title: 'Mantén la atención', points: ['Ubícate donde te vean/oigan', 'Ritmo variado', 'Incluye a las orillas del grupo'], image: 'https://storage.googleapis.com/going-academy-audio/img/g2-s1.png?v2' },
      { title: 'Gestiona el tiempo', points: ['Avisa y respeta tiempos', 'Margen para imprevistos', 'Cierra puntual'], image: 'https://storage.googleapis.com/going-academy-audio/img/g2-s2.png?v2' },
      { title: 'Personas difíciles', points: ['Al que se adelanta: dale un rol', 'Al que monopoliza: redirige', 'Agradece y sigue'], image: 'https://storage.googleapis.com/going-academy-audio/img/g2-s3.png?v2' },
      { title: 'Seguridad', points: ['Conoce a tu grupo', 'Agua y botiquín', 'Plan ante emergencia'], image: 'https://storage.googleapis.com/going-academy-audio/img/g2-s4.png?v2' },
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
    manualHtml: `
<p>Son las seis de la mañana en la entrada al Cotopaxi. Una guía local ajusta el lanyard de Going App sobre su chaqueta, cuenta con la mirada a las ocho personas del grupo, revisa que cada una tenga agua y una capa impermeable, y mira el cielo del páramo que a esa hora parece calmo pero puede cerrarse en nube densa en cuarenta minutos. Nadie del grupo sabe todavía por dónde baja el viento, dónde no hay señal ni qué hacer si alguien resbala en una roca húmeda. Ella sí lo sabe, y por eso puede sonreír con tranquilidad. Esa es la diferencia entre pasear y guiar: en la naturaleza del Ecuador, la seguridad no se improvisa, se prepara. Este manual es para que tú seas esa persona que el grupo siente sólida aunque la montaña se ponga difícil.</p>

<h2>1. La evaluación de riesgos empieza el día anterior</h2>
<p>La mayoría de los accidentes en exteriores no ocurren por mala suerte, sino por una decisión que se tomó antes de salir y que nadie revisó. Evaluar el riesgo no es asustarte: es mirar de frente lo que puede fallar para tener una respuesta lista. Un grupo tranquilo es un grupo bien preparado, y esa calma la contagias tú.</p>
<ul>
<li><strong>Revisa el clima real de la zona, no el general.</strong> En la Sierra el páramo cambia por pisos de altura; en la Amazonía la lluvia crece los ríos en horas; en la Costa el sol y la marea marcan los tiempos. Consulta el pronóstico local la noche anterior y otra vez en la mañana.</li>
<li><strong>Conoce el perfil de tu grupo.</strong> Pregunta por edad, condición física, altura a la que están acostumbradas las personas y cualquier condición médica. Alguien que llega de Guayaquil a nivel del mar sentirá los 4000 metros del páramo muy distinto a quien vive en Quito.</li>
<li><strong>Ajusta la ruta a la persona más vulnerable.</strong> El ritmo del grupo lo marca quien va más lento o con menos experiencia, nunca la persona más entusiasta. Un buen guía adelanta el paso solo cuando todo el grupo puede seguirlo con seguridad.</li>
<li><strong>Prepara el equipo mínimo.</strong> Botiquín, agua suficiente, capa de abrigo e impermeable, silbato, linterna y carga completa en el teléfono y en una batería externa. Lo que no llevas no lo puedes usar cuando hace falta.</li>
</ul>
<div class="box escenario"><b>Escenario</b> Una viajera te comenta al inicio de la caminata, casi de pasada, que hace poco tuvo una cirugía de rodilla. En lugar de restarle importancia, ajustas la ruta a un tramo más corto y con menos pendiente, y caminas cerca de ella en los descensos. Ese pequeño cambio evita una lesión y ella termina el día agradecida en lugar de adolorida.</div>

<h2>2. Comunicación en zonas sin señal</h2>
<p>Buena parte de la naturaleza más hermosa del Ecuador no tiene cobertura: quebradas, selva amazónica, senderos de altura. Depender del celular ahí es un error, porque el momento en que más lo necesitas es justo cuando no hay señal. Por eso la comunicación se planifica antes de perder la barra.</p>
<h3>Antes de salir</h3>
<ul>
<li><strong>Deja un plan escrito con alguien de confianza.</strong> Comparte tu ruta, la hora estimada de regreso y el número de personas del grupo. Si algo pasa, esa persona sabe dónde buscarte y cuándo empezar a preocuparse.</li>
<li><strong>Usa las herramientas de la app mientras haya señal.</strong> Comparte el viaje en vivo con un contacto y ten a mano el botón SOS. La función de compartir ubicación deja un rastro que ayuda a ubicarte aunque después pierdas conexión.</li>
<li><strong>Acuerda un punto de reencuentro.</strong> Si alguien se separa del grupo, todos deben saber a qué lugar visible y seguro volver. La regla simple: si te pierdes, quédate donde estás y hazte notar.</li>
</ul>
<h3>Sin señal</h3>
<ul>
<li><strong>Señales sonoras.</strong> Tres pitidos de silbato es la señal universal de auxilio. La voz se apaga rápido; el silbato se escucha lejos y no cansa.</li>
<li><strong>Cuenta al grupo en cada punto clave.</strong> Al inicio, en cada parada y antes de cada tramo nuevo. Contar personas es el hábito más aburrido y el que más vidas cuida.</li>
</ul>
<div class="box clave"><b>Clave Going</b> La comunicación de emergencia se organiza cuando todavía hay señal, no cuando ya la perdiste.</div>

<h2>3. Protocolo ante lesiones</h2>
<p>Tarde o temprano alguien tropieza, se tuerce un tobillo o se marea por la altura. Lo que define a un guía no es evitar todo accidente, sino responder con calma y método cuando ocurre. El pánico se contagia igual que la calma, y tú eliges cuál transmites.</p>
<ol>
<li><strong>Protege la escena.</strong> Antes de correr a ayudar, revisa que el lugar sea seguro para ti y para el resto. Un rescatista lesionado se convierte en un segundo problema.</li>
<li><strong>Evalúa sin mover de más.</strong> Habla con la persona, pregunta qué le duele y observa. Si sospechas una lesión de columna o cabeza, no la muevas salvo peligro inmediato.</li>
<li><strong>Atiende lo básico.</strong> Detén sangrados con presión, inmoviliza lo que duele, abriga contra el frío y mantén a la persona hidratada si está consciente. Un botiquín bien usado gana tiempo.</li>
<li><strong>Decide con la cabeza fría: seguir o evacuar.</strong> Si la persona no puede continuar con seguridad, se organiza el descenso o se pide ayuda. El orgullo de "terminar la ruta" nunca vale más que una persona sana.</li>
<li><strong>Cuida al resto del grupo.</strong> Mantén a las demás personas juntas, abrigadas y ocupadas en algo útil. Un grupo disperso durante una emergencia es un segundo riesgo.</li>
</ol>
<div class="box error"><b>Error común</b> Minimizar un mareo por altura pensando que "ya se le pasa" y seguir subiendo. El mal de altura puede agravarse rápido; ignorarlo puede convertir una molestia en una emergencia seria que obliga a evacuar a todo el grupo de golpe.</div>
<div class="box escenario"><b>Escenario</b> En un sendero de la Amazonía, un huésped resbala en una raíz húmeda y no puede apoyar el tobillo. Detienes al grupo, revisas que no haya fractura evidente, inmovilizas con lo que tienes, sientas a la persona y organizas un descenso lento con apoyo. Nadie se apura, nadie se asusta, porque tú marcas el ritmo.</div>

<h2>4. Las normas del Ministerio de Turismo</h2>
<p>Guiar en la naturaleza no es solo un tema de buena voluntad: en el Ecuador está regulado, y esas normas existen porque alguien, en algún momento, aprendió a la mala. Cumplirlas te protege legalmente y le da a tu viajera o viajero la certeza de estar en manos profesionales.</p>
<ul>
<li><strong>Guía acreditada o acreditado.</strong> Las actividades de turismo de naturaleza y aventura requieren guías con la credencial correspondiente. Tu formación y tu registro son parte de tu identidad profesional, igual que el lanyard de Going App.</li>
<li><strong>Áreas protegidas con reglas propias.</strong> Parques nacionales y reservas tienen cupos, horarios, senderos permitidos y, en lugares como Galápagos, la obligación de ir con guía autorizado. Respeta los límites: no están para molestarte, están para cuidar el ecosistema y a las personas.</li>
<li><strong>Equipo y protocolos según la actividad.</strong> Cada actividad de aventura tiene requisitos de seguridad definidos. Conoce los de la tuya y cúmplelos sin atajos.</li>
<li><strong>No dejes rastro.</strong> El principio de bajo impacto es también una norma de convivencia: te llevas tu basura, respetas la fauna y no alteras el entorno. El Ecuador que muestras hoy debe seguir intacto para quien venga mañana.</li>
</ul>
<div class="box clave"><b>Clave Going</b> Cumplir la norma no te quita libertad; te da respaldo cuando algo sale mal.</div>

<h2>5. El grupo confía en tu calma</h2>
<p>La seguridad tiene una dimensión que no está en ningún botiquín: cómo se siente el grupo. Una viajera nerviosa toma peores decisiones, se cansa antes y disfruta menos. Tu actitud es una herramienta de seguridad tan real como el silbato.</p>
<ul>
<li><strong>Explica antes de empezar.</strong> Cuenta la ruta, los tiempos, dónde habrá señal y qué hacer si alguien se separa. Lo que se anticipa deja de dar miedo.</li>
<li><strong>Usa el chat con traducción de la app.</strong> Si tienes huéspedes de otros países, apóyate en la traducción automática para dar instrucciones de seguridad claras. Una indicación entendida a medias es un riesgo.</li>
<li><strong>Preséntate siempre igual.</strong> Un "Bienvenido a Going App, soy [nombre]" con el lanyard visible construye confianza desde el primer segundo, y esa confianza es la que hace que te obedezcan sin dudar en un momento crítico.</li>
</ul>
<blockquote>"No caminas para llegar rápido; caminas para que todas las personas del grupo lleguen bien. La montaña seguirá ahí mañana."</blockquote>

<h2>En resumen</h2>
<p>Ser guía local de naturaleza en el Ecuador es un privilegio y una responsabilidad enorme: tienes en tus manos la seguridad de personas que confiaron en ti para conocer el páramo, la selva, la playa o las islas. Evalúa el riesgo antes de salir, planifica la comunicación mientras hay señal, responde a las lesiones con método y no con pánico, cumple las normas del Ministerio de Turismo y sostén al grupo con tu calma. Cuando haces todo eso, no solo evitas accidentes: conviertes cada salida en una experiencia inolvidable y segura. Así te ganas las cinco estrellas y, más importante aún, te vuelves embajadora o embajador del Ecuador, alguien que muestra su naturaleza más hermosa cuidando a cada viajera y viajero como se cuida a la familia.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/g3-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/g3-echo.mp3',
    slides: [
      { title: 'Evalúa antes de salir', points: ['Clima y terreno', 'Condición y equipo del grupo', 'Ten un Plan B (cancelar es válido)'], image: 'https://storage.googleapis.com/going-academy-audio/img/g3-s0.png?v2' },
      { title: 'Lleva lo esencial', points: ['Botiquín, agua, abrigo', 'Teléfono cargado + batería', 'Silbato y contactos de emergencia'], image: 'https://storage.googleapis.com/going-academy-audio/img/g3-s1.png?v2' },
      { title: 'Sin señal', points: ['Deja tu plan y hora de regreso', 'Puntos de encuentro y señales', 'Mapas offline'], image: 'https://storage.googleapis.com/going-academy-audio/img/g3-s2.png?v2' },
      { title: 'Ante una lesión', points: ['Detén y asegura la zona', 'Primeros auxilios básicos', 'Llama al 911 con ubicación', 'Grupo junto y calmado'], image: 'https://storage.googleapis.com/going-academy-audio/img/g3-s3.png?v2' },
      { title: 'Criterio', points: ['No arriesgar también es decisión', 'Saber cuándo dar la vuelta', 'La seguridad va primero'], image: 'https://storage.googleapis.com/going-academy-audio/img/g3-s4.png?v2' },
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
    manualHtml: `
<p>Son las 5:40 de la mañana en el redondel de El Recreo. Tienes cuatro buses esperando, 137 personas de un colegio que viaja a Baños, tres guías, dos conductoras y un conductor, y un padre de familia que llama porque su hija "ya está lista pero no ve el bus". El motor de todo eso no es la suerte: es tu logística. Coordinar grupos grandes no se trata de mover cuerpos de un punto a otro, sino de sostener una promesa a decenas o cientos de personas a la vez, durante varios días, sin que nadie se sienta un número. Cuando un grupo de 20, 80 o 200 viajeras y viajeros llega a su destino cansado pero tranquilo, es porque alguien pensó cada detalle antes de que amaneciera. Ese alguien eres tú.</p>

<h2>1. La planificación es el 80% del viaje</h2>
<p>Un tour grande se gana o se pierde en el escritorio, días antes de la salida. Con grupos de esta escala, improvisar no es valentía: es exponer a mucha gente al mismo error al mismo tiempo. Por eso todo empieza con un plan escrito que cualquier miembro del equipo pueda leer y entender.</p>
<ul>
<li><strong>El manifiesto es sagrado.</strong> Una lista maestra con nombre, cédula o documento, contacto de emergencia, restricción alimentaria y necesidad especial de cada persona. Sin manifiesto no hay conteo confiable, y sin conteo confiable puedes dejar a alguien en un baño de la carretera.</li>
<li><strong>Divide para gobernar.</strong> Un grupo de 100 se maneja como cinco grupos de 20. Asigna a cada bus un número, un color y una guía o un guía responsable de su propia lista. Nadie coordina 100 personas mirándolas todas a la vez.</li>
<li><strong>Itinerario con holguras reales.</strong> Cargar y descargar 200 personas toma tiempo. Si tu cronograma no incluye 20 minutos por parada solo para subir y bajar, ya vas tarde antes de arrancar.</li>
</ul>
<div class="box clave"><b>Clave Going</b>Un grupo grande no es una multitud: son varios grupos pequeños que tú mantienes conectados.</div>

<h2>2. Transporte: la coreografía de la flota</h2>
<p>Cuando mueves varios vehículos a la vez, el reto deja de ser cada auto y pasa a ser la relación entre todos. En Going puedes combinar viajes privados de vehículo completo para subgrupos, coordinados como una sola flota. El secreto está en que ningún conductor viaje "a ciegas".</p>
<h3>Antes de rodar</h3>
<ul>
<li><strong>Punto de encuentro visible y amplio.</strong> Elige un lugar donde varios vehículos puedan estacionar sin bloquear el tráfico. En Quito, un redondel a las 6 a.m. funciona; una calle angosta del centro, jamás.</li>
<li><strong>Orden de marcha definido.</strong> Decide qué vehículo va primero y cuál cierra. El último debe llevar a una persona del equipo que confirme que nadie quedó atrás.</li>
<li><strong>Un solo canal de comunicación.</strong> Un grupo de chat con las conductoras, los conductores y las guías. El chat de la app tiene traducción automática, útil si tu grupo es internacional.</li>
</ul>
<div class="box escenario"><b>Escenario</b>Vas de Quito a Tena con tres vehículos. En el descenso a la Amazonía, uno se retrasa por una llanta baja. Como acordaste un punto de reagrupamiento en Baeza, los otros dos esperan ahí en vez de seguir dispersándose. Nadie se pierde y el grupo llega junto.</div>

<h2>3. Alojamiento: llegar no es lo mismo que acomodarse</h2>
<p>La escena más caótica de un tour ocurre en el lobby del hotel, cuando 90 personas cansadas quieren su llave al mismo tiempo. Tu trabajo es que ese momento dure minutos, no una hora. La regla es simple: el hotel nunca debe conocer a tu grupo el día de la llegada.</p>
<ul>
<li><strong>Rooming list enviada con anticipación.</strong> Entrega la asignación de habitaciones al hotel un día antes, con nombres y tipo de habitación. Así las llaves salen listas por bus o por subgrupo.</li>
<li><strong>Entrega por bloques.</strong> Reparte llaves grupo por grupo, no en una sola fila. Mientras un subgrupo sube, el siguiente termina su registro.</li>
<li><strong>Confirma accesibilidad real.</strong> Si viaja una persona con movilidad reducida o una familia con bebé, verifica piso bajo o ascensor antes, no cuando ya están con las maletas en el hombro.</li>
</ul>
<blockquote>"La habitación 214 tiene la reserva de la profesora Analía; su hijo necesita el cuarto contiguo." Ese nivel de detalle escrito una noche antes evita veinte minutos de confusión frente a la recepción.</blockquote>
<div class="box error"><b>Error común</b>Llegar al hotel sin rooming list y armar la asignación en el mostrador. Consecuencia: 40 minutos de fila, huéspedes molestos, personal del hotel tenso y una primera impresión del destino arruinada antes de deshacer maletas.</div>

<h2>4. Actividades: mover el grupo sin perder a nadie</h2>
<p>En destino, el peligro no es la caminata ni el teleférico: es el conteo. Cada vez que el grupo entra a un sitio y vuelve a salir, existe el riesgo de dejar a alguien. Por eso los conteos no son opcionales ni informales.</p>
<ul>
<li><strong>Cuenta al subir y al bajar, siempre.</strong> Antes de arrancar cada vehículo, la guía o el guía de ese bus confirma su número contra la lista. Si el bus 3 lleva 24, deben ser 24 cada vez.</li>
<li><strong>Sistema de compañía.</strong> Pide que cada persona tenga una pareja de viaje. Es más fácil notar "falta uno" cuando alguien pregunta "¿dónde está mi compañera?".</li>
<li><strong>Puntos de reencuentro claros.</strong> En un mercado de Otavalo o en las cascadas de Baños, señala un lugar y una hora exacta de regreso. "Nos vemos aquí a las 3:15" es más fuerte que "no se alejen".</li>
<li><strong>Ritmo para todos.</strong> Un grupo grande siempre tiene a alguien que camina más lento. Ajusta el paso al más lento, no al más rápido, o irás perdiendo gente por el camino.</li>
</ul>
<div class="box clave"><b>Clave Going</b>En logística de grupos, contar cabezas al bajar y al subir no es desconfianza: es cuidado.</div>

<h2>5. Imprevistos a gran escala: tu plan B ya debe existir</h2>
<p>Con 200 personas, un problema pequeño se multiplica por 200. Un vehículo que falla no deja varada a una persona: deja a un subgrupo entero. Por eso el manejo de crisis no se improvisa el día del problema; se prepara antes. Un buen operador o una buena operadora no es quien nunca tiene imprevistos, sino quien ya sabía qué hacer cuando llegaron.</p>
<ol>
<li><strong>Ten un vehículo o contacto de respaldo.</strong> Un conductor adicional disponible en la zona puede rescatar a un subgrupo sin detener a todo el tour.</li>
<li><strong>Kit de emergencia y salud.</strong> Botiquín, lista de restricciones alimentarias y contactos de emergencia a la mano. Un mareo en la vía a Papallacta es normal; que te tome por sorpresa, no.</li>
<li><strong>Usa las herramientas de seguridad de la app.</strong> Compartir el viaje en vivo, verificar identidad y placa de cada conductora o conductor, y el botón SOS para casos reales. Para grupos, saber dónde va cada vehículo en tiempo real vale oro.</li>
<li><strong>Comunica antes de que pregunten.</strong> Si hay retraso, avisa al grupo tú primero. El silencio genera más pánico que la mala noticia.</li>
</ol>
<div class="box escenario"><b>Escenario</b>En plena Panamericana, un bus se avería con 30 pasajeras y pasajeros. Activas tu contacto de respaldo, mueves a la gente al vehículo de refuerzo por bloques ordenados y avisas al grupo completo por el chat que la salida se retrasa 25 minutos. Nadie entra en pánico porque tú hablaste primero.</div>

<h2>6. El cierre: el viaje termina cuando la última persona llega a casa</h2>
<p>Muchos tours "terminan" cuando el bus regresa a la ciudad, pero para ti termina cuando la última viajera o el último viajero está en su puerta y confirmado. Ese último tramo es el que la gente recuerda al calificar.</p>
<ul>
<li><strong>Conteo final y equipaje.</strong> Verifica que nadie olvide una maleta y que el número de regreso coincida con el de salida.</li>
<li><strong>Cierra el círculo humano.</strong> Un mensaje de agradecimiento al grupo y a tu equipo de conductoras, conductores y guías consolida la relación para el próximo viaje.</li>
<li><strong>Registra lo aprendido.</strong> Anota qué parada tomó más de lo previsto o qué hotel respondió mejor. Tu próximo grupo de 200 se beneficiará de las notas de este.</li>
</ul>

<h2>En resumen</h2>
<p>Coordinar de 20 a 200 personas es, en el fondo, un acto de hospitalidad a gran escala: cada lista, cada conteo y cada plan B existen para que alguien se sienta cuidado en su propio país o de visita en el nuestro. Cuando divides el grupo en partes manejables, preparas el imprevisto antes de que llegue y comunicas con calma, dejas de ser un logista y te vuelves anfitriona o anfitrión del Ecuador entero: de su Costa, su Sierra, su Amazonía y sus Galápagos. Esa es la diferencia entre un tour que la gente sobrevive y uno que la gente cuenta con orgullo, ese es el camino hacia las 5 estrellas, y esa es la razón por la que subes de Aliado Bronce a Plata y a Oro. El grupo llega junto, tranquilo y a tiempo porque tú lo pensaste todo antes del amanecer.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/o1-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/o1-echo.mp3',
    slides: [
      { title: 'Planifica', points: ['Itinerario maestro compartido', 'Proveedores confirmados por escrito', 'Buffer de tiempo entre bloques'], image: 'https://storage.googleapis.com/going-academy-audio/img/o1-s0.png?v2' },
      { title: 'Divide y coordina', points: ['Subgrupos con líder', 'Manifiesto y conteo por vehículo', 'Un solo canal de comunicación'], image: 'https://storage.googleapis.com/going-academy-audio/img/o1-s1.png?v2' },
      { title: 'Transporte y hospedaje', points: ['Capacidad correcta del vehículo', 'Rooming list anticipada', 'Necesidades especiales anotadas'], image: 'https://storage.googleapis.com/going-academy-audio/img/o1-s2.png?v2' },
      { title: 'Imprevistos', points: ['Plan B por bloque', 'Fondo y contactos de respaldo', 'Comunica los cambios a tiempo'], image: 'https://storage.googleapis.com/going-academy-audio/img/o1-s3.png?v2' },
      { title: 'Clave', points: ['Lo que define a un operador', 'es cómo resuelve lo que sale mal'], image: 'https://storage.googleapis.com/going-academy-audio/img/o1-s4.png?v2' },
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
    manualHtml: `
<p>Son las 7 de la mañana en Baños de Agua Santa. Una familia colombiana espera junto a la entrada de tu agencia para una ruta de cascadas, y justo cuando cargan las mochilas al vehículo, un inspector del Ministerio de Turismo se acerca con una credencial y pide ver tu Registro de Turismo y la Licencia Única Anual de Funcionamiento. Si están vigentes y a la vista, sonríes, los muestras y la mañana sigue su curso. Si no lo están, el paseo se cae, la familia pierde su día y tú puedes recibir una sanción. Operar dentro del marco legal no es un trámite molesto: es lo que separa a una operadora turística que inspira confianza de una improvisación que pone en riesgo a las viajeras y viajeros. Este manual te acompaña para que estés siempre en regla, tranquila o tranquilo, y con el papeleo trabajando a tu favor.</p>

<h2>1. Por qué la ley te protege a ti primero</h2><p>Muchas personas ven las normativas como una carga. La verdad es al revés: el marco legal turístico existe para protegerte a ti, a tu personal y a quienes confían su viaje en tus manos. La Ley de Turismo del Ecuador y su reglamento definen qué es una operadora turística y qué obligaciones tiene, precisamente para que quien contrata un tour sepa que está tratando con un negocio serio, con responsabilidades claras y respaldo real.</p><ul><li><strong>La formalidad es tu mejor argumento de venta.</strong> Una viajera o viajero que compara opciones elige a quien puede mostrar registro, permisos y seguros. La legalidad se vuelve confianza, y la confianza se vuelve reservas.</li><li><strong>La ley reparte la responsabilidad.</strong> Si algo sale mal en la montaña o en carretera, estar en regla define quién responde y cómo. Operar sin permisos te deja expuesta o expuesto a que toda la carga caiga sobre ti.</li><li><strong>El Ministerio de Turismo es la autoridad rectora.</strong> Él fija las categorías, los requisitos y las actualizaciones. Tu trabajo es conocerlo como aliado, no esquivarlo.</li></ul><div class="box clave"><b>Clave Going</b>Estar en regla no es un costo: es el permiso para que la gente confíe su viaje, y su seguridad, en tus manos.</div>

<h2>2. Registro de Turismo y la LUAF: tus dos documentos madre</h2><p>Antes de vender un solo tour, una operadora turística necesita existir legalmente ante la autoridad. Eso se logra con dos documentos que debes entender bien, porque son la base de todo lo demás.</p><h3>El Registro de Turismo</h3><p>Es tu partida de nacimiento como prestador de servicios turísticos. Con él, el Ministerio de Turismo reconoce que tu negocio es una operadora o agencia de viajes con una categoría específica. Sin registro, cualquier venta de tours es informal y sancionable.</p><ol><li><strong>Constitúyete primero.</strong> Necesitas tu RUC activo, la actividad turística correctamente declarada y, según el caso, tu constitución como persona natural o jurídica.</li><li><strong>Declara tu categoría real.</strong> Una operadora que arma y opera sus propios paquetes no es lo mismo que una agencia que solo intermedia. Registrar la categoría equivocada genera problemas en inspecciones.</li></ol><h3>La Licencia Única Anual de Funcionamiento (LUAF)</h3><p>Es el permiso que te habilita a operar cada año y que, en la mayoría de cantones, se gestiona con el Gobierno Autónomo Descentralizado (el municipio) por competencia descentralizada del turismo. La palabra "anual" es la que más olvidos causa: vence y se renueva cada año.</p><div class="box error"><b>Error común</b>Sacar el Registro de Turismo una vez y creer que ya está todo listo "para siempre". La LUAF caduca cada año; si operas con la del año pasado, estás trabajando sin permiso vigente y una inspección puede clausurar la actividad ese mismo día.</div><div class="box escenario"><b>Escenario</b>Es enero y arranca la temporada de Galápagos. Revisa tu calendario: agenda la renovación de la LUAF en las primeras semanas del año, antes del pico de reservas, para no quedar sin permiso justo cuando más tours vendes.</div>

<h2>3. Guías, personal y placas: la operación también se legaliza</h2><p>Tener la empresa en regla no basta si quien lleva al grupo a la montaña no está habilitado. La normativa cuida especialmente a quienes acompañan a las viajeras y viajeros, porque de ellos depende la experiencia y la seguridad.</p><ul><li><strong>Guías con credencial vigente.</strong> El Ministerio de Turismo acredita a guías nacionales, nativos y especializados (por ejemplo, de áreas naturales protegidas). Un guía especializado de aventura o de un parque nacional necesita su credencial específica; no cualquiera puede conducir un grupo a cualquier ruta.</li><li><strong>Áreas protegidas con reglas propias.</strong> Operar en parques nacionales, reservas o en Galápagos exige permisos y cupos adicionales, además de guías autorizados por esa área. La Amazonía y Galápagos suelen tener requisitos más estrictos por su fragilidad.</li><li><strong>El transporte turístico también se regula.</strong> El vehículo con el que mueves grupos debe cumplir los permisos de transporte terrestre correspondientes. Un transporte informal es uno de los puntos más revisados en carretera.</li></ul><div class="box clave"><b>Clave Going</b>La operadora está en regla cuando la empresa, la persona que guía y el vehículo lo están, al mismo tiempo.</div><blockquote>"El permiso más caro es el que no sacaste: cuesta la reserva perdida, la multa y la reputación." — Dicho que vale repetir en cada reunión de equipo.</blockquote>

<h2>4. Seguros obligatorios: el respaldo que no se ve hasta que se necesita</h2><p>Un seguro es como el cinturón de un asiento: nadie piensa en él hasta el momento del frenazo. Para una operadora turística, contar con las coberturas adecuadas no es opcional, es parte de operar con responsabilidad frente a quien confía su integridad en una actividad que a veces incluye altura, agua o carretera.</p><ol><li><strong>Cobertura para pasajeras y pasajeros.</strong> Toda actividad con desplazamiento debe contemplar un respaldo para las personas transportadas. El vehículo de transporte, además, cuenta con el seguro obligatorio de ley para accidentes de tránsito.</li><li><strong>Responsabilidad civil.</strong> Te protege ante daños a terceros durante la operación. En tours de aventura o naturaleza, es especialmente valioso.</li><li><strong>Asistencia y actividades de riesgo.</strong> Si haces rafting, canopy, trekking de altura o buceo, verifica que la póliza cubra específicamente esa actividad. Un seguro genérico puede excluir justamente lo que tú vendes.</li></ol><div class="box escenario"><b>Escenario</b>Ofreces canopy en Mindo y una huésped resbala al bajar de la plataforma. Con la cobertura correcta y guía acreditado, la atiendes de inmediato y el seguro responde. Sin esa cobertura, el gasto y la responsabilidad caen enteros sobre tu operadora.</div><div class="box error"><b>Error común</b>Contratar el seguro más barato sin leer las exclusiones. Descubrir en el peor momento que "deportes de aventura" estaba excluido convierte un accidente manejable en una crisis económica y legal para tu negocio.</div>

<h2>5. Mantente al día: las normas cambian y tú también</h2><p>La regulación turística no es una foto fija; es una película. Cambian tasas, requisitos, formatos de trámite y, sobre todo, las condiciones para operar en zonas sensibles. Quien se entera tarde, opera tarde o mal.</p><ul><li><strong>Sigue las fuentes oficiales.</strong> El sitio y los canales del Ministerio de Turismo, y las ordenanzas de tu municipio, son tu fuente primaria. Evita guiarte solo por lo que "escuchaste" de otra operadora.</li><li><strong>Lleva un calendario de vencimientos.</strong> LUAF, credenciales de guías, pólizas y permisos de áreas protegidas tienen fechas distintas. Un recordatorio con 30 días de anticipación te salva de operar vencido.</li><li><strong>Gremios y capacitaciones ayudan.</strong> Pertenecer a asociaciones del sector y tomar las capacitaciones del Ministerio te mantiene informada o informado de los cambios antes de que te tomen por sorpresa.</li><li><strong>Guarda todo digitalizado.</strong> Ten copias en tu teléfono. En una inspección, mostrar el documento vigente en segundos transmite profesionalismo.</li></ul><div class="box clave"><b>Clave Going</b>Un vencimiento vigilado es un problema que nunca ocurre; la prevención es más barata que cualquier multa.</div><blockquote>"Bienvenido a Going App, soy Andrea." Ese saludo solo suena confiable cuando detrás hay una operadora que puede mostrar, sin dudar, que todo está en regla.</blockquote>

<h2>En resumen</h2><p>Operar dentro del marco legal es el cimiento invisible sobre el que se construye cada tour memorable en la Costa, la Sierra, la Amazonía o Galápagos. Tu Registro de Turismo, tu LUAF renovada cada año, tus guías acreditados, tu transporte habilitado y tus seguros vigentes no son papeles: son la promesa de que cada viajera y viajero está en manos serias. Cuando operas en regla, dejas de improvisar y te conviertes en embajadora o embajador del Ecuador, alguien que muestra el país con orgullo y respaldo. Esa tranquilidad se siente, se nota y se traduce en reseñas de cinco estrellas y en el ascenso natural por los niveles Aliado, de Bronce a Plata y a Oro. La ley no te frena: te da permiso para brillar.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/o2-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/o2-echo.mp3',
    slides: [
      { title: 'Registro y licencia', points: ['Registro de Turismo + LUAF', 'La categoría define qué vendes', 'Renovaciones al día'], image: 'https://storage.googleapis.com/going-academy-audio/img/o2-s0.png?v2' },
      { title: 'Permisos', points: ['Áreas protegidas: permisos y guías', 'Guías especializados con credencial', 'Transporte turístico habilitado'], image: 'https://storage.googleapis.com/going-academy-audio/img/o2-s1.png?v2' },
      { title: 'Seguros y seguridad', points: ['Responsabilidad civil', 'Protocolos documentados', 'Consentimiento en actividades de riesgo'], image: 'https://storage.googleapis.com/going-academy-audio/img/o2-s2.png?v2' },
      { title: 'Buenas prácticas', points: ['Información veraz', 'Facturación en regla', 'Sostenibilidad y respeto cultural'], image: 'https://storage.googleapis.com/going-academy-audio/img/o2-s3.png?v2' },
      { title: 'Recuerda', points: ['La normativa cambia', 'Confirma con el Ministerio', 'Operar en regla = confianza'], image: 'https://storage.googleapis.com/going-academy-audio/img/o2-s4.png?v2' },
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
    manualHtml: `
<p>Son las siete de la noche y Marisol, que maneja una operadora de tours en Baños, todavía tiene el celular en una mano y un cuaderno en la otra. En WhatsApp le confirman dos personas para el canopy de mañana; en su libreta figura que el cupo ya estaba lleno; y en la app de Going App acaba de entrar una reserva que ella no ha visto porque estaba cocinando. Tres fuentes, ninguna se habla con la otra, y el riesgo de sobrevender o dejar un asiento vacío es altísimo. Integrar tu operación con Going App existe precisamente para que esa escena no vuelva a pasar: que tu disponibilidad, tus cobros y tus números vivan en un solo lugar y trabajen para ti mientras tú atiendes a tus viajeras y viajeros. Este manual te acompaña a hacer esa integración con calma y criterio, entendiendo el porqué de cada paso.</p>

<h2>1. Por qué sincronizar antes que vender más</h2>
<p>La tentación de toda operadora que crece es abrir más canales de venta. Pero un canal más sin sincronización es una fuente más de errores. Sincronizar significa que Going App conozca, en tiempo real, cuántos cupos te quedan en cada salida, y que cada reserva que entra descuente automáticamente de ese inventario. La razón de fondo es simple: el turismo se vende sobre disponibilidad honesta. Un cupo sobrevendido no es un problema administrativo, es una viajera o un viajero parado en el punto de encuentro sin lugar.</p>
<ul>
<li><strong>Una sola verdad de disponibilidad.</strong> Cuando defines tus cupos dentro de la app, ese número es el que todos los canales respetan. Evitas el clásico "en mi cuaderno decía otra cosa", porque el cuaderno deja de existir.</li>
<li><strong>Descuento automático.</strong> Cada asiento reservado se resta solo. Tú no tienes que acordarte de tachar nada, y por eso no se te olvida cuando estás ocupada guiando.</li>
<li><strong>Ventana de tiempo clara.</strong> Los tours y experiencias se publican con fecha, hora y punto de encuentro. Igual que en los viajes intercity programados se avisa una hora y cinco minutos antes, tu operación gana ese ritmo de recordatorios que reduce los "no shows".</li>
</ul>
<div class="box clave"><b>Clave Going</b> Vender más solo es rentable si tu disponibilidad nunca miente; la sincronización es lo que protege esa verdad.</div>

<h2>2. Sincronizar reservas y disponibilidad sin miedo</h2>
<p>Muchas operadoras temen "perder el control" al automatizar. Es lo contrario: automatizar te devuelve el control, porque el sistema hace la parte repetitiva y tú decides la estrategia. Lo primero es cargar tu oferta con precisión, porque la app solo puede sincronizar lo que tú definiste bien.</p>
<h3>Cómo cargar tu oferta con criterio</h3>
<ol>
<li><strong>Define cada experiencia como una salida concreta.</strong> No vendas "tour a la cascada" en abstracto; publica la salida del jueves a las 9 a.m. con 12 cupos. Así la disponibilidad es medible y sincronizable.</li>
<li><strong>Separa cupos compartidos de servicios privados.</strong> Igual que en Going App un viaje compartido se paga por asiento y uno privado es el vehículo completo, tu tour puede tener plazas sueltas o reserva exclusiva de grupo. Márcalos distinto para que no se mezclen.</li>
<li><strong>Actualiza cuando algo cambia en el terreno.</strong> Si llueve fuerte en la Amazonía y cierras una salida, bájala de inmediato. La sincronización es tan buena como tu disciplina para reflejar la realidad.</li>
</ol>
<div class="box escenario"><b>Escenario</b> Tienes un tour de avistamiento en Galápagos con 10 cupos. Entran 4 reservas por la app y 6 por tu página. Si ambas leen la misma disponibilidad, al llegar al décimo el sistema cierra la venta solo. Nadie queda afuera y tú te enteras sin tocar el teléfono.</div>

<h2>3. Cobros integrados: cobra bien y a tiempo</h2>
<p>El cobro es el momento más delicado de toda operación turística, porque mezcla dinero, confianza y expectativa. Integrar los cobros a través de Going App significa que la viajera o el viajero paga por los medios que ya conoce y en los que confía, y que tú recibes el registro ordenado de cada transacción. Esto no solo te ahorra tiempo: te protege de disputas.</p>
<ul>
<li><strong>Medios que tu cliente ya usa.</strong> La plataforma admite tarjeta a través de Datafast, DeUna, la Wallet Going que se recarga y se transfiere, y efectivo. Ofrecer varios medios reduce el abandono de la reserva; muchas personas no llevan efectivo, y otras no confían su tarjeta a un desconocido.</li>
<li><strong>Registro trazable de cada pago.</strong> Cada cobro queda asociado a su reserva. Si mañana alguien reclama "yo ya pagué", tú tienes la evidencia sin buscar en cinco chats.</li>
<li><strong>Menos manejo de dinero en mano.</strong> Cuanto más cobro pasa por la app, menos vueltos, menos billetes falsos y menos cuadres nocturnos. El efectivo sigue siendo válido, pero deja de ser tu única red.</li>
</ul>
<div class="box error"><b>Error común</b> Cobrar por fuera de la app "para ahorrarse la comisión". La consecuencia es que ese pago no queda registrado, no cuenta para tus métricas, y si hay un reclamo o una devolución, quedas sin respaldo y sin protección ante la disputa.</div>
<blockquote>"El cliente no recuerda cuánto pagó de comisión; recuerda si el cobro fue claro y si le llegó su confirmación."</blockquote>

<h2>4. Leer tus métricas: conversión, calificación y ocupación</h2>
<p>Automatizar la gestión libera algo escaso: tiempo para pensar. Y pensar, en turismo, es leer tres números que cuentan la historia de tu negocio. No los mires por curiosidad; míralos para decidir.</p>
<h3>Conversión</h3>
<p>Es cuántas personas que vieron tu experiencia terminaron reservando. Una conversión baja no siempre es culpa del precio; muchas veces son fotos pobres, una descripción confusa o un punto de encuentro que da inseguridad. La métrica te dice dónde mirar.</p>
<h3>Calificación</h3>
<p>En Going App la confianza se mide en estrellas, y para las conductoras y conductores la calificación mínima es 4.5. Como operadora turística, tu reputación funciona igual: una calificación alta te sube en las búsquedas y te trae más reservas sin gastar en publicidad. Cada reseña es información gratuita sobre qué mejorar.</p>
<h3>Ocupación</h3>
<p>Es qué porcentaje de tus cupos se llena. Una ocupación baja los martes y alta los domingos te dice, sin adivinar, cuándo abrir salidas y cuándo no. Así dejas de operar por corazonada y empiezas a operar por evidencia.</p>
<ul>
<li><strong>Compara períodos, no días sueltos.</strong> Un mal día no es tendencia; una mala semana sí. Mira la curva, no el punto.</li>
<li><strong>Cruza calificación con conversión.</strong> Si te califican alto pero conviertes poco, el problema está antes de la experiencia: en cómo la muestras.</li>
<li><strong>Usa la ocupación para fijar precios.</strong> Salidas que siempre se llenan aguantan un precio más firme; las que quedan vacías piden promoción o mejor horario.</li>
</ul>
<div class="box clave"><b>Clave Going</b> Los números no te juzgan, te orientan: cada métrica es una pregunta sobre qué mejorar mañana.</div>
<div class="box escenario"><b>Escenario</b> Ves que tu tour de la Sierra tiene 90% de ocupación y 4.9 estrellas, pero el de la Costa apenas llena la mitad. En vez de bajar el precio a ciegas, lees las reseñas de la Costa: mencionan que el punto de encuentro cambió sin aviso. Corriges eso y la ocupación sube sola.</div>

<h2>5. La automatización no reemplaza el trato humano</h2>
<p>Integrarte a la app resuelve lo repetitivo para que tú brilles en lo humano, que es lo único que la tecnología no puede copiar. El chat de Going App incluso traduce automáticamente, así que puedes recibir a una huésped que habla otro idioma sin perder cercanía. Pero la calidez la pones tú.</p>
<ul>
<li><strong>Saluda como corresponde.</strong> Al recibir a tu grupo, preséntate con claridad y tu lanyard de identificación visible. El saludo oficial marca el tono: se siente esperado, no improvisado.</li>
<li><strong>Cuida la seguridad como parte del servicio.</strong> Recuerda a tus viajeras y viajeros que pueden verificar tu identidad, compartir su ubicación en vivo y contar con el botón SOS. La seguridad bien comunicada es parte de las cinco estrellas.</li>
<li><strong>Responde rápido dentro de la app.</strong> Un mensaje contestado a tiempo evita cancelaciones y sube tu conversión. La app te avisa; tú respondes con humanidad.</li>
</ul>
<blockquote>"Bienvenido a Going App, soy Marisol. Hoy subimos juntos a la cascada; cualquier cosa, estoy para ti."</blockquote>

<h2>En resumen</h2>
<p>Integrar tu operación con Going App no es volverte una máquina, es dejar de hacer a mano lo que roba tu energía para dedicarla a lo que de verdad importa: recibir bien, guiar con seguridad y dejar recuerdos. Cuando tu disponibilidad no miente, tus cobros quedan registrados y tus métricas te dicen dónde crecer, cada salida sale mejor que la anterior. Y ahí está el círculo virtuoso: una operación ordenada te libera para ser embajadora o embajador del Ecuador ante quien te visita, y esa hospitalidad, sostenida sobre buenos datos, es exactamente lo que convierte una reserva más en cinco estrellas y en la próxima viajera o viajero que llega recomendado.</p>
`,
    audioFemale: 'https://storage.googleapis.com/going-academy-audio/academy/o3-coral.mp3',
    audioMale: 'https://storage.googleapis.com/going-academy-audio/academy/o3-echo.mp3',
    slides: [
      { title: 'Publica tu oferta', points: ['Fichas claras y honestas', 'Disponibilidad real (evita sobreventa)', 'Cupos y horarios por salida'], image: 'https://storage.googleapis.com/going-academy-audio/img/o3-s0.png?v2' },
      { title: 'Reservas', points: ['Confirma rápido', 'Sincroniza el cupo', 'Comunica detalles desde la plataforma'], image: 'https://storage.googleapis.com/going-academy-audio/img/o3-s1.png?v2' },
      { title: 'Cobros', points: ['Pago integrado y seguro', 'Políticas claras de cancelación', 'Concilia tus liquidaciones'], image: 'https://storage.googleapis.com/going-academy-audio/img/o3-s2.png?v2' },
      { title: 'Métricas', points: ['Conversión', 'Calificaciones', 'Ocupación por fecha'], image: 'https://storage.googleapis.com/going-academy-audio/img/o3-s3.png?v2' },
      { title: 'Beneficio', points: ['Automatiza lo repetitivo', 'Gana tiempo para la calidad', 'Crece con menos trabajo manual'], image: 'https://storage.googleapis.com/going-academy-audio/img/o3-s4.png?v2' },
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
  const [voiceSel, setVoiceSel] = useState<'f' | 'm'>('f');
  const [verSlide, setVerSlide] = useState(0);
  const isAuthed = useIsAuthenticated();
  const accent = course?.schoolColor || COLORS.brand.red;

  // Detener la voz al cambiar de formato/desmontar.
  useEffect(() => {
    return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); };
  }, []);
  useEffect(() => {
    if (fmt !== 'escuchar' && typeof window !== 'undefined') { window.speechSynthesis?.cancel(); setSpeaking(false); }
  }, [fmt]);

  // Registra el formato abierto como "lección vista" → alimenta el anillo de
  // progreso y el banner "continúa donde quedaste" del inicio. No bloquea la UI.
  useEffect(() => {
    if (course) completeAcademyLesson(courseId, `fmt:${fmt}`).catch(() => {});
  }, [fmt, courseId, course]);

  if (!course) return null;

  // "Escuchar" narra el MANUAL en extenso si existe; si no, el guion por segmentos.
  const fullScript = course.manualHtml
    ? htmlToNarration(course.manualHtml)
    : [course.podcast.intro, ...course.podcast.segments.map(s => `${s.title}. ${s.text}`)].join('\n\n');

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
    const body = course.manualHtml || course.readingHtml;
    w.document.write(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${course.title} — Academia Going App</title>` +
      `<style>` +
      `@page{margin:22mm 18mm}` +
      `*{box-sizing:border-box}` +
      `body{font-family:Georgia,'Times New Roman',serif;max-width:720px;margin:0 auto;padding:0 8px;line-height:1.7;color:#1c1917;font-size:12pt}` +
      `.cover{border-bottom:3px solid ${accent};padding-bottom:14px;margin-bottom:22px}` +
      `.eyebrow{font-family:system-ui,sans-serif;font-size:9pt;letter-spacing:.16em;text-transform:uppercase;color:${accent};font-weight:700;margin:0}` +
      `h1{font-family:system-ui,sans-serif;color:#1c1917;font-size:24pt;margin:6px 0 2px;line-height:1.1}` +
      `.sub{font-family:system-ui,sans-serif;color:#6b615c;margin:0;font-size:11pt}` +
      `h2{font-family:system-ui,sans-serif;color:${accent};font-size:15pt;margin:24px 0 6px;border-left:4px solid ${accent};padding-left:10px}` +
      `h3{font-family:system-ui,sans-serif;color:#1c1917;font-size:12.5pt;margin:16px 0 4px}` +
      `ul,ol{padding-left:22px}li{margin:4px 0}` +
      `blockquote{margin:14px 0;padding:12px 16px;background:${accent}0F;border-left:4px solid ${accent};font-style:italic;border-radius:0 8px 8px 0}` +
      `.box{margin:14px 0;padding:12px 16px;border-radius:10px;font-family:system-ui,sans-serif;font-size:11pt;page-break-inside:avoid}` +
      `.box b{display:block;margin-bottom:3px;font-size:9.5pt;letter-spacing:.04em;text-transform:uppercase}` +
      `.box.clave{background:#ECFDF5;border:1px solid #A7F3D0}.box.clave b{color:#047857}` +
      `.box.escenario{background:#FFF7ED;border:1px solid #FED7AA}.box.escenario b{color:#B45309}` +
      `.box.error{background:#FEF2F2;border:1px solid #FECACA}.box.error b{color:#B91C1C}` +
      `.foot{margin-top:30px;padding-top:12px;border-top:1px solid #e7e5e4;font-family:system-ui,sans-serif;font-size:9pt;color:#9c948e;text-align:center}` +
      `</style></head><body>` +
      `<div class="cover"><p class="eyebrow">Academia Going · Manual del curso</p><h1>${course.title}</h1><p class="sub">${course.subtitle}</p></div>` +
      `${body}` +
      `<div class="foot">Academia Going App · Formación gratuita para la comunidad Going · goingec.com</div>` +
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
      <style>{`
        .academy-manual h2{font-size:1.05rem;font-weight:800;color:#1f2937;border-left:4px solid ${accent};padding-left:.6rem;margin:1.4rem 0 .5rem}
        .academy-manual h3{font-size:.95rem;font-weight:800;color:#111827;margin:1rem 0 .3rem}
        .academy-manual blockquote{margin:.9rem 0;padding:.7rem 1rem;background:${accent}0F;border-left:4px solid ${accent};font-style:italic;border-radius:0 .6rem .6rem 0;color:#374151}
        .academy-manual .box{margin:.9rem 0;padding:.7rem 1rem;border-radius:.7rem;font-size:.9rem}
        .academy-manual .box b{display:block;margin-bottom:.15rem;font-size:.72rem;letter-spacing:.04em;text-transform:uppercase}
        .academy-manual .box.clave{background:#ECFDF5;border:1px solid #A7F3D0}.academy-manual .box.clave b{color:#047857}
        .academy-manual .box.escenario{background:#FFF7ED;border:1px solid #FED7AA}.academy-manual .box.escenario b{color:#B45309}
        .academy-manual .box.error{background:#FEF2F2;border:1px solid #FECACA}.academy-manual .box.error b{color:#B91C1C}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @media (prefers-reduced-motion: reduce){.academy-ver-img{transition:opacity .3s ease !important;transform:none !important}}
      `}</style>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/academy" aria-label="Volver a la Academia" className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><span aria-hidden="true">←</span></Link>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{course.school}</p>
            <h1 className="text-base font-black text-gray-900 truncate">{course.title}</h1>
          </div>
        </div>
        {/* Tabs de formato — oculta "Ver" si el curso no tiene video real */}
        <div className="max-w-3xl mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto">
          {TABS.filter(t => t.key !== 'ver' || !!course.videoUrl || ((!!course.audioFemale || !!course.audioMale) && course.slides.length > 0)).map(t => {
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
        {/* Cabecera ilustrada del curso */}
        <div className="relative overflow-hidden rounded-2xl mb-4 p-5 flex items-center gap-4 border border-gray-100"
          style={{ background: `radial-gradient(130% 150% at 90% -20%, ${accent}2E, ${accent}0A 70%)` }}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: accent }}>{course.subtitle}</p>
            <h2 className="text-lg font-black text-gray-900 leading-snug">{course.title}</h2>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{course.description}</p>
          </div>
          <div className="flex-shrink-0 hidden sm:block">
            <CourseArt courseId={courseId} school={schoolKeyOf(courseId)} accent={accent} className="drop-shadow-sm" />
          </div>
        </div>
        {/* Aviso suave para invitados: contenido abierto, progreso al iniciar sesión */}
        {!isAuthed && (
          <Link href={`/auth/login?from=/academy/${courseId}`}
            className="flex items-center gap-3 mb-4 rounded-xl border px-4 py-3 hover:shadow-sm transition-shadow"
            style={{ borderColor: `${accent}44`, backgroundColor: `${accent}0D` }}>
            <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ backgroundColor: accent }}>🎓</span>
            <span className="text-sm text-gray-600 flex-1">
              Estás explorando de invitado. <strong className="text-gray-800">Inicia sesión</strong> para guardar tu progreso y ganar insignias.
            </span>
          </Link>
        )}
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
              <div className="flex">
                {course.slides.map((_, i) => (
                  <button key={i} onClick={() => setSlide(i)}
                    aria-label={`Ir a la diapositiva ${i + 1}`} aria-current={i === slide}
                    className="flex items-center justify-center min-w-[40px] min-h-[40px]">
                    <span className="w-2 h-2 rounded-full block transition-colors" style={{ backgroundColor: i === slide ? accent : '#D1D5DB' }} />
                  </button>
                ))}
              </div>
              <button onClick={() => setSlide(s => Math.min(course.slides.length - 1, s + 1))} disabled={slide === course.slides.length - 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-40">Siguiente ›</button>
            </div>
          </div>
        )}

        {/* ESCUCHAR (audio real con voz Going, o TTS del navegador de respaldo) */}
        {fmt === 'escuchar' && (() => {
          const audioUrl = voiceSel === 'm' ? (course.audioMale || course.audioFemale) : (course.audioFemale || course.audioMale);
          const hasAudio = !!(course.audioFemale || course.audioMale);
          return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {hasAudio ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0" style={{ backgroundColor: accent }}>🎧</span>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">Podcast · {course.title}</p>
                    <p className="text-xs text-gray-500">Voz Going · escúchalo o descárgalo para el camino</p>
                  </div>
                </div>
                {/* Selector de voz */}
                {course.audioFemale && course.audioMale && (
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setVoiceSel('f')}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all border"
                      style={voiceSel === 'f' ? { backgroundColor: accent, color: '#fff', borderColor: accent } : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>
                      ♀ Voz femenina
                    </button>
                    <button onClick={() => setVoiceSel('m')}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all border"
                      style={voiceSel === 'm' ? { backgroundColor: accent, color: '#fff', borderColor: accent } : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>
                      ♂ Voz masculina
                    </button>
                  </div>
                )}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio key={audioUrl} controls preload="metadata" src={audioUrl} className="w-full mb-4" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={speaking ? stopPodcast : playPodcast}
                    aria-label={speaking ? 'Detener narración' : 'Reproducir narración'}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl" style={{ backgroundColor: accent }}>
                    <span aria-hidden="true">{speaking ? '⏹' : '▶'}</span>
                  </button>
                  <div>
                    <p className="font-bold text-gray-900">Podcast · {course.title}</p>
                    <p className="text-xs text-gray-500">{speaking ? 'Reproduciendo (voz del navegador)…' : 'Toca play para escuchar'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">Voz generada por tu navegador. Narra el manual completo del curso.</p>
              </>
            )}
            {course.manualHtml ? (
              <div className="prose prose-sm max-w-none text-gray-700 academy-manual"
                dangerouslySetInnerHTML={{ __html: course.manualHtml }} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 italic">{course.podcast.intro}</p>
                {course.podcast.segments.map((s, i) => (
                  <div key={i}>
                    <p className="text-sm font-bold text-gray-800">{s.title}</p>
                    <p className="text-sm text-gray-600">{s.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })()}

        {/* VER (video real, o video-lección = diapositivas + voz sincronizadas) */}
        {fmt === 'ver' && (() => {
          const verAudio = voiceSel === 'm' ? (course.audioMale || course.audioFemale) : (course.audioFemale || course.audioMale);
          const canSlideshow = !!verAudio && course.slides.length > 0;
          const slide = course.slides[Math.min(verSlide, course.slides.length - 1)];
          return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {course.videoUrl ? (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
                <iframe src={course.videoUrl} title={course.title} className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : canSlideshow ? (
              <>
                {/* Escenario 16:9 con la diapositiva actual */}
                <div className="relative w-full rounded-2xl overflow-hidden mb-3" style={{ paddingTop: '56.25%',
                  background: slide.image ? '#1c1917' : `radial-gradient(120% 120% at 85% -10%, ${accent}26, ${accent}0A 70%)` }}>
                  {slide.image && (
                    <>
                      {/* Imágenes apiladas: cross-fade + zoom lento (movimiento tipo Ken Burns) */}
                      {course.slides.map((s, i) => s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={s.image} alt={i === verSlide ? s.title : ''} aria-hidden={i !== verSlide}
                          className="academy-ver-img absolute inset-0 w-full h-full object-cover"
                          style={{
                            opacity: i === verSlide ? 1 : 0,
                            transform: i === verSlide ? 'scale(1.07)' : 'scale(1)',
                            transition: 'opacity .8s ease, transform 8s ease-out',
                          }} />
                      ) : null)}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.45) 40%, rgba(0,0,0,0) 68%)' }} />
                    </>
                  )}
                  <div className={`absolute inset-0 p-5 sm:p-8 flex flex-col ${slide.image ? 'justify-end' : 'justify-center'}`}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: slide.image ? '#fff' : accent, opacity: slide.image ? 0.85 : 1 }}>
                      {course.title} · {verSlide + 1}/{course.slides.length}
                    </p>
                    <h3 className={`text-lg sm:text-2xl font-black mb-2 leading-tight ${slide.image ? 'text-white' : 'text-gray-900'}`}>{slide.title}</h3>
                    <ul className="space-y-1">
                      {slide.points.map((p, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm sm:text-[15px] ${slide.image ? 'text-gray-100' : 'text-gray-700'}`}>
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: slide.image ? '#fff' : accent }} />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Barra de progreso de diapositivas */}
                  <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-2 z-10">
                    {course.slides.map((_, i) => (
                      <span key={i} className="h-1 flex-1 rounded-full transition-colors"
                        style={{ backgroundColor: i <= verSlide ? (slide.image ? '#fff' : accent) : 'rgba(255,255,255,.35)' }} />
                    ))}
                  </div>
                </div>
                {/* Selector de voz */}
                {course.audioFemale && course.audioMale && (
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setVoiceSel('f')} className="flex-1 py-2 rounded-xl text-sm font-bold border"
                      style={voiceSel === 'f' ? { backgroundColor: accent, color: '#fff', borderColor: accent } : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>♀ Voz femenina</button>
                    <button onClick={() => setVoiceSel('m')} className="flex-1 py-2 rounded-xl text-sm font-bold border"
                      style={voiceSel === 'm' ? { backgroundColor: accent, color: '#fff', borderColor: accent } : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>♂ Voz masculina</button>
                  </div>
                )}
                {/* Audio que dirige el pase de diapositivas */}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio key={verAudio} controls preload="metadata" src={verAudio} className="w-full"
                  onTimeUpdate={(e) => {
                    const t = e.currentTarget;
                    if (t.duration > 0) {
                      const idx = Math.min(course.slides.length - 1, Math.floor((t.currentTime / t.duration) * course.slides.length));
                      setVerSlide(idx);
                    }
                  }}
                  onEnded={() => setVerSlide(course.slides.length - 1)} />
                <p className="text-xs text-gray-400 mt-2">Video-lección: las diapositivas avanzan con la narración. Toca play.</p>
              </>
            ) : (
              <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 py-16 text-center">
                <p className="text-4xl mb-2">🎬</p>
                <p className="font-bold text-gray-700">Video próximamente</p>
                <p className="text-sm text-gray-400 mt-1">Mientras tanto, revisa el contenido en Leer, Manual o Escuchar.</p>
              </div>
            )}
          </div>
          );
        })()}

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
                        className="w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all flex items-center gap-2"
                        style={{
                          borderColor: correct ? '#16a34a' : wrong ? '#ef4444' : chosen ? accent : '#E5E7EB',
                          backgroundColor: correct ? '#ECFDF5' : wrong ? '#FEF2F2' : chosen ? accent + '11' : '#fff',
                        }}>
                        {quizSubmitted && (correct || wrong) && (
                          <span aria-hidden="true" className="flex-shrink-0">{correct ? '✅' : '❌'}</span>
                        )}
                        <span className="flex-1">{opt}</span>
                        {quizSubmitted && correct && <span className="text-xs font-bold flex-shrink-0" style={{ color: '#15803d' }}>Correcta</span>}
                        {quizSubmitted && wrong && <span className="text-xs font-bold flex-shrink-0" style={{ color: '#b91c1c' }}>Tu respuesta</span>}
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
                {passed && !isAuthed && (
                  <Link href={`/auth/login?from=/academy/${courseId}`} className="mt-2 inline-block text-sm font-bold hover:underline" style={{ color: accent }}>
                    Inicia sesión para guardar tu insignia →
                  </Link>
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
