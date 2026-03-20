'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─────────────────────────────────────────────
   COURSE CONTENT DATABASE
   Contenido real basado en el documento LA ACADEMIA GOING
   ───────────────────────────────────────────── */

type LessonFormat = 'text' | 'podcast' | 'video' | 'slides' | 'quiz';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  format: LessonFormat;
  duration: string;
  content?: string;        // HTML/text content
  audioDescription?: string;  // For podcasts
  videoUrl?: string;       // YouTube embed URL or hosted video
  videoDescription?: string;  // Summary shown below video
  slides?: { title: string; points: string[] }[];  // For slides
  quiz?: QuizQuestion[];   // For quizzes
  completed?: boolean;
}

interface CourseData {
  id: string;
  icon: string;
  school: string;
  schoolColor: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  lessons: Lesson[];
}

const COURSES_DB: Record<string, CourseData> = {

  // ─── CONDUCTORES ───────────────────────────────────────────────
  c1: {
    id: 'c1',
    icon: '👋',
    school: 'Escuela de Conductores',
    schoolColor: '#ff4c41',
    title: 'La Primera Impresión',
    subtitle: 'Módulo 1 — Ruta del Volante',
    description: 'El arte de recibir. Checklist del vehículo, el saludo Going, uso del lanyard y manejo de equipaje. Este módulo es la base de todo: los primeros 30 segundos definen la calificación del viaje.',
    badge: '🏅 Conductor Estrella',
    lessons: [
      {
        id: 'c1-l1',
        title: 'Capítulo 1: La Preparación',
        format: 'text',
        duration: '5 min',
        content: `
<h2>Capítulo 1: La Preparación — Tu vehículo es Going-ready</h2>

<p>Antes de encender el motor, tu vehículo debe ser <strong>Going-ready</strong>. No es solo un auto; es la primera extensión de la hospitalidad ecuatoriana que el viajero experimentará.</p>

<h3>🧹 Tu Checklist Visual</h3>
<ul>
  <li><strong>Interior impecable:</strong> Asientos limpios, piso sin basura, sin olores fuertes. Una fragancia suave está bien; no uses perfumes intensos.</li>
  <li><strong>Revisión de seguridad:</strong> Llantas, frenos, nivel de combustible, luces. Un auto seguro es la prioridad número uno.</li>
  <li><strong>Temperatura lista:</strong> Si hay sol, el aire acondicionado encendido antes de que llegue el pasajero. En frío, calefacción lista.</li>
  <li><strong>Cargador disponible:</strong> Ten un cable USB accesible. Los pasajeros agradecen poder cargar su teléfono.</li>
</ul>

<blockquote>
  <strong>El estándar Going:</strong> "Un auto limpio es el primer saludo que das antes de abrir la boca."
</blockquote>

<h3>🪪 Tu Uniforme Going</h3>
<p>El <strong>lanyard de Going</strong> es tu insignia de confianza. Úsalo siempre visible. Los pasajeros lo buscan para identificarte. Es tu sello de profesionalismo.</p>

<h3>📱 La App lista</h3>
<p>Antes de salir a conducir, verifica que la app esté abierta, con GPS activo y notificaciones habilitadas. Un conductor Going que no responde solicitudes pierde posiciones en el algoritmo.</p>
        `,
      },
      {
        id: 'c1-l2',
        title: 'Capítulo 2: El Saludo Going',
        format: 'text',
        duration: '5 min',
        content: `
<h2>Capítulo 2: El Saludo y el Arte de Recibir</h2>

<p>El momento del <strong>"Hola"</strong> define todo el viaje. Como Carlos (el conductor estrella de Imbabura de nuestros ejemplos), debes salir del vehículo con una sonrisa genuina.</p>

<h3>🤝 Las Siete Palabras Mágicas</h3>
<blockquote>
  <strong>"¡Bienvenido a Going! Soy [Tu Nombre]."</strong>
</blockquote>
<p>Estas siete palabras, dichas con calidez, desarman cualquier ansiedad del viajero. Y recuerda: la hospitalidad Going siempre incluye ayudar activamente con el equipaje.</p>

<h3>✅ El Protocolo de Llegada</h3>
<ol>
  <li><strong>Sal del vehículo</strong> — no esperes dentro. Los pasajeros valoran que te muestres.</li>
  <li><strong>Sonríe genuinamente</strong> — no forzado. La empatía se nota.</li>
  <li><strong>Usa tu lanyard</strong> — visible y orgulloso.</li>
  <li><strong>Di la frase</strong> — "¡Bienvenido a Going! Soy [nombre]."</li>
  <li><strong>Ayuda con el equipaje</strong> — activamente, sin esperar que te pidan.</li>
</ol>

<h3>🌍 Si el pasajero no habla español</h3>
<p>Usa la traducción automática en el chat de la app. Un simple <em>"Welcome! I'm your Going driver"</em> hace una diferencia enorme. En el módulo de Inglés Turístico aprenderás las frases más útiles.</p>

<h3>⚠️ Lo que NO debes hacer</h3>
<ul>
  <li>Estar en el teléfono cuando llega el pasajero.</li>
  <li>No bajarte del auto en zonas seguras.</li>
  <li>Dar información personal (número privado, redes sociales).</li>
  <li>Comentar sobre política, religión o temas controversiales.</li>
</ul>
        `,
      },
      {
        id: 'c1-l3',
        title: 'Podcast: Going en Ruta — La Primera Impresión',
        format: 'podcast',
        duration: '8 min',
        audioDescription: `
🎙️ Episodio 1 — "La Primera Impresión"

Bienvenido a <strong>Going en Ruta</strong>, el podcast oficial de la Academia Going. Diseñado para escucharse mientras conduces sin pasajeros — aprende en movimiento.

<strong>En este episodio:</strong>
<ul>
  <li>Ana (host) entrevista a Carlos, conductor estrella de Imbabura</li>
  <li>El secreto de Carlos para conseguir siempre 5 estrellas</li>
  <li>Cómo manejar pasajeros cansados después de vuelos largos</li>
  <li>La historia del turista australiano que volvió a Ecuador solo para viajar con Going</li>
</ul>

<strong>Extracto del episodio:</strong>
<hr/>
<em>Ana: "Carlos, ¿cuál es tu secreto para ese primer saludo perfecto?"</em><br/><br/>
<em>Carlos: "Hola Ana. Para mí el secreto es la empatía. Me pongo en los zapatos del turista. Salgo del auto, sonrío, y les digo: '¡Bienvenido a Going! Soy Carlos, y estoy aquí para llevarte seguro'. Esas palabras, con una sonrisa real, lo cambian todo."</em>
<hr/>

<p style="color:#6b7280; font-size:0.85rem; margin-top:1rem;">
  📻 El audio estará disponible en la app móvil Going para escucha offline. Descárgalo antes de salir a conducir.
</p>
        `,
      },
      {
        id: 'c1-l4',
        title: 'Diapositivas: Repaso Rápido',
        format: 'slides',
        duration: '3 min',
        slides: [
          {
            title: '🧹 El Checklist de Carlos',
            points: [
              'Interior impecable (asientos, piso, sin olores)',
              'Revisión de seguridad (llantas, frenos, luces)',
              'Temperatura lista antes de que llegue el pasajero',
              'Un auto limpio es el primer saludo',
            ],
          },
          {
            title: '👋 El Saludo Going',
            points: [
              'Sal fuera del vehículo',
              'Sonríe con calidez genuina',
              'Usa tu lanyard de Going visible',
              '"¡Bienvenido a Going! Soy [Tu Nombre]."',
              'Ayuda activamente con el equipaje',
            ],
          },
          {
            title: '🌟 Los 3 Pilares de la Primera Impresión',
            points: [
              '1. Auto limpio y listo (antes de salir)',
              '2. Saludo cálido y profesional (al llegar)',
              '3. Actitud de servicio genuina (todo el viaje)',
            ],
          },
          {
            title: '⚠️ Lo que NUNCA debes hacer',
            points: [
              'Estar en el teléfono al recibir al pasajero',
              'No bajar del auto cuando es seguro hacerlo',
              'Dar tu número personal o redes sociales',
              'Hablar de política, religión o temas controversiales',
            ],
          },
        ],
      },
      {
        id: 'c1-quiz',
        title: 'Quiz: ¿Aprendiste el módulo?',
        format: 'quiz',
        duration: '3 min',
        quiz: [
          {
            question: '¿Cuál es la frase de saludo oficial de Going?',
            options: [
              '"Hola, ¿cómo está usted?"',
              '"¡Bienvenido a Going! Soy [Tu Nombre]."',
              '"Buenas, suba nomás."',
              '"¿Es usted el pasajero de la app?"',
            ],
            correct: 1,
            explanation: 'La frase exacta "¡Bienvenido a Going! Soy [nombre]." crea confianza inmediata. Es breve, cálida y profesional.',
          },
          {
            question: 'Cuando llega tu pasajero, ¿qué debes hacer primero?',
            options: [
              'Tocar el claxon para que sepa que llegaste',
              'Esperar dentro del vehículo con la app abierta',
              'Salir del vehículo, sonreír y saludar con el lanyard visible',
              'Enviarle un mensaje por la app',
            ],
            correct: 2,
            explanation: 'Salir del vehículo muestra proactividad y hospitalidad. Es la marca Going. Los pasajeros lo valoran muchísimo.',
          },
          {
            question: '¿Qué elemento de tu uniforme Going debes usar siempre visible?',
            options: [
              'La camisa azul Going',
              'El lanyard de Going',
              'Los guantes blancos',
              'El pin de conductor',
            ],
            correct: 1,
            explanation: 'El lanyard de Going es tu insignia de confianza. Los pasajeros lo buscan para identificarte como conductor verificado.',
          },
        ],
      },
    ],
  },

  // ─── TRONCO COMÚN ──────────────────────────────────────────────
  tc1: {
    id: 'tc1',
    icon: '🌍',
    school: 'Tronco Común — Todos los roles',
    schoolColor: '#ff4c41',
    title: 'El ADN de Going',
    subtitle: 'Filosofía y hospitalidad ecuatoriana',
    description: 'La misión de Going, hospitalidad ecuatoriana, empatía, resolución pacífica de problemas y por qué somos embajadores del país.',
    badge: '🔰 Proveedor Verificado Going',
    lessons: [
      {
        id: 'tc1-l1',
        title: 'La Misión de Going',
        format: 'text',
        duration: '5 min',
        content: `
<h2>¿Qué es Going y por qué importa?</h2>

<p>Going no es solo una app de transporte. Es una <strong>plataforma de economía colaborativa</strong> diseñada para conectar a viajeros con los mejores proveedores locales del Ecuador — conductores, anfitriones, guías y operadores.</p>

<h3>🌍 La diferencia entre una app del montón y una super-app</h3>
<p>La diferencia radica exactamente en la <strong>estandarización de la calidad</strong>. Si capacitamos a nuestros proveedores, los empoderamos, ellos ganan más dinero y los viajeros reciben un servicio de nivel mundial.</p>

<blockquote>
  "Cada proveedor Going es un embajador de Ecuador."
</blockquote>

<h3>🤝 Los 3 valores fundamentales de Going</h3>
<ol>
  <li><strong>Hospitalidad ecuatoriana:</strong> La calidez y la generosidad que nos caracteriza como pueblo. No es un protocolo — es una actitud.</li>
  <li><strong>Empatía:</strong> Ponerse en los zapatos del viajero. ¿Cómo me sentiría yo llegando a una ciudad extraña después de 12 horas de vuelo?</li>
  <li><strong>Resolución pacífica:</strong> Los problemas ocurren. Lo que nos define es cómo los resolvemos: con calma, empatía y orientación a la solución.</li>
</ol>

<h3>🏆 El impacto que generamos juntos</h3>
<p>Cada estrella de calificación que recibes no es solo para tu perfil. Es para la reputación del Ecuador como destino turístico. Cuando un turista alemán o canadiense vive un servicio Going de 5 estrellas, vuelve. Y trae a sus amigos.</p>
        `,
      },
      {
        id: 'tc1-l2',
        title: 'Hospitalidad Ecuatoriana',
        format: 'text',
        duration: '5 min',
        content: `
<h2>La Hospitalidad Ecuatoriana: Nuestro Mayor Activo</h2>

<p>Ecuador tiene algo que ningún country branding puede comprar: la <strong>calidez genuina de su gente</strong>. El "bienvenido" ecuatoriano es diferente al de cualquier otro lugar del mundo. En Going, esa es nuestra ventaja competitiva.</p>

<h3>🌿 ¿Qué significa ser embajador de Going?</h3>
<ul>
  <li>Mostrar orgulloso tu ciudad, región y cultura.</li>
  <li>Recomendar lugares auténticos, no solo los turísticos.</li>
  <li>Tratar a cada pasajero como a un invitado en tu casa.</li>
  <li>Hablar con orgullo de Ecuador, sus paisajes y su gastronomía.</li>
</ul>

<h3>💡 Resolución pacífica de conflictos</h3>
<p>Si un pasajero está molesto o hay un malentendido:</p>
<ol>
  <li><strong>Escucha sin interrumpir.</strong> Deja que exprese su frustración.</li>
  <li><strong>Valida su sentimiento:</strong> "Entiendo, eso no es lo que esperabas."</li>
  <li><strong>Ofrece una solución concreta,</strong> no excusas.</li>
  <li>Si no puedes resolver, <strong>escala al soporte Going</strong> a través de la app.</li>
</ol>

<blockquote>
  "Un problema bien resuelto genera más fidelidad que un servicio sin problemas."
</blockquote>
        `,
      },
      {
        id: 'tc1-quiz',
        title: 'Quiz: El ADN de Going',
        format: 'quiz',
        duration: '3 min',
        quiz: [
          {
            question: 'Como proveedor Going, ¿cuál es tu rol principal?',
            options: [
              'Transportar pasajeros del punto A al punto B',
              'Ser embajador de Ecuador y de la calidad Going',
              'Conseguir la mayor cantidad de viajes posibles',
              'Mantener el vehículo limpio',
            ],
            correct: 1,
            explanation: 'Ser embajador es el rol más importante. El transporte es el medio; la experiencia memorable es el fin.',
          },
          {
            question: 'Si un pasajero está molesto, ¿cuál es el primer paso?',
            options: [
              'Explicar por qué no es tu culpa',
              'Llamar al soporte Going inmediatamente',
              'Escuchar sin interrumpir y validar su sentimiento',
              'Ofrecer un descuento',
            ],
            correct: 2,
            explanation: 'Escuchar y validar es siempre el primer paso. Las personas quieren sentirse escuchadas antes de recibir soluciones.',
          },
          {
            question: '¿Por qué la calidad de tu servicio afecta a Ecuador?',
            options: [
              'No afecta, es solo tu calificación personal',
              'Afecta al posicionamiento de Going en la bolsa',
              'Cada experiencia excelente fomenta el turismo en el país',
              'Solo afecta si el pasajero es extranjero',
            ],
            correct: 2,
            explanation: 'Cada viajero satisfecho es un embajador del Ecuador en su país. El impacto del turismo de calidad es enorme.',
          },
        ],
      },
    ],
  },

  // ─── TRONCO COMÚN tc2 ─────────────────────────────────────────
  tc2: {
    id: 'tc2',
    icon: '📱',
    school: 'Tronco Común — Todos los roles',
    schoolColor: '#ff4c41',
    title: 'Uso de la Plataforma',
    subtitle: 'Reservas, cobros y emergencias',
    description: 'Cómo aceptar reservas, usar el chat con traducción automática, entender los cobros y reportar emergencias.',
    badge: '📱 Experto en la App',
    lessons: [
      {
        id: 'tc2-v1',
        title: 'Video: Recorrido completo por la app',
        format: 'video',
        duration: '7 min',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoDescription: `
<h3>¿Qué vas a aprender en este video?</h3>
<ul>
  <li><strong>Panel principal:</strong> Cómo leer tu pantalla de inicio, el estado del viaje en tiempo real y las notificaciones.</li>
  <li><strong>Aceptar una reserva:</strong> Proceso paso a paso — desde la notificación hasta confirmar al pasajero.</li>
  <li><strong>Chat con traducción:</strong> Cómo activar el modo bilingüe y comunicarte con pasajeros extranjeros sin barreras.</li>
  <li><strong>Cobros y comisiones:</strong> Cómo se calcula tu ganancia, cuándo se deposita y cómo revisar tu historial.</li>
  <li><strong>Botón de emergencia:</strong> Cómo activar la alerta de seguridad y qué sucede al pulsarlo.</li>
</ul>
<blockquote><strong>Tip Going:</strong> Activa las notificaciones push para no perder ninguna reserva. Las solicitudes tienen ventana de aceptación de 30 segundos.</blockquote>
        `,
      },
      {
        id: 'tc2-l1',
        title: 'Preguntas frecuentes de la app',
        format: 'text',
        duration: '5 min',
        content: `
<h2>📱 Preguntas frecuentes — Plataforma Going</h2>

<h3>¿Qué hago si la app no carga?</h3>
<p>Cierra completamente la app y ábrela de nuevo. Si el problema persiste, verifica tu conexión a internet. Going funciona con 3G o superior.</p>

<h3>¿Cómo cancelo una reserva sin penalización?</h3>
<p>Puedes cancelar sin costo hasta <strong>10 minutos</strong> después de aceptar una reserva. Pasado ese tiempo, la cancelación puede afectar tu tasa de aceptación.</p>

<h3>¿Cuándo recibo mi pago?</h3>
<p>Los pagos con tarjeta se procesan y depositan en tu cuenta registrada cada <strong>lunes</strong> por los viajes de la semana anterior. Los pagos en efectivo los recibes directamente del pasajero.</p>

<h3>¿Cómo reportar una incidencia?</h3>
<p>En el menú principal ve a <strong>Soporte → Reportar incidencia</strong>. Describe lo ocurrido con detalles. El equipo responde en máximo 2 horas.</p>

<h3>¿Qué es la calificación mínima?</h3>
<p>Going requiere mantener <strong>4.5 estrellas o más</strong> para seguir recibiendo reservas. Si bajas de ese umbral recibirás un aviso y orientación para mejorar.</p>
        `,
      },
      {
        id: 'tc2-quiz',
        title: 'Quiz: Uso de la Plataforma',
        format: 'quiz',
        duration: '3 min',
        quiz: [
          {
            question: '¿Cuánto tiempo tienes para aceptar una solicitud de reserva?',
            options: ['10 segundos', '30 segundos', '2 minutos', '5 minutos'],
            correct: 1,
            explanation: 'Las solicitudes tienen 30 segundos de ventana. Activa notificaciones push para no perderte ninguna.',
          },
          {
            question: '¿Cuándo se depositan los pagos con tarjeta?',
            options: ['Al instante', 'Cada día', 'Cada lunes por viajes de la semana anterior', 'El 1 de cada mes'],
            correct: 2,
            explanation: 'Los pagos con tarjeta se consolidan semanalmente y se depositan cada lunes.',
          },
          {
            question: '¿Qué calificación mínima debes mantener?',
            options: ['3.0 ★', '4.0 ★', '4.5 ★', '5.0 ★'],
            correct: 2,
            explanation: 'Going requiere 4.5 estrellas o más. Por debajo de ese umbral se activa el plan de mejora.',
          },
        ],
      },
    ],
  },

  // ─── ANFITRIONES ──────────────────────────────────────────────
  a1: {
    id: 'a1',
    icon: '📸',
    school: 'Escuela de Anfitriones',
    schoolColor: '#3B82F6',
    title: 'Fotografía con el Celular',
    subtitle: 'Fotos que venden el vibe',
    description: 'Luz natural, ángulos, composición y edición gratis. Convierte tu teléfono en una cámara profesional para mostrar tu alojamiento.',
    badge: '📸 Fotógrafo Going',
    lessons: [
      {
        id: 'a1-l1',
        title: 'Luz Natural: Tu Mejor Herramienta',
        format: 'text',
        duration: '5 min',
        content: `
<h2>La Luz Natural es Gratis y es la Mejor</h2>

<p>No necesitas una cámara profesional. Necesitas <strong>la hora correcta del día y una ventana abierta</strong>. El 80% de las fotos de alojamiento mal tomadas tienen el mismo problema: mala luz.</p>

<h3>☀️ La Hora Dorada para Fotos de Interiores</h3>
<ul>
  <li><strong>Mañana (8–10am):</strong> Luz suave y cálida. Ideal para habitaciones orientadas al este.</li>
  <li><strong>Tarde (4–6pm):</strong> Luz dorada y acogedora. La favorita de los fotógrafos.</li>
  <li><strong>Evita el mediodía:</strong> Luz dura que crea sombras feas y quema los blancos.</li>
</ul>

<h3>🪟 Cómo usar las ventanas</h3>
<ol>
  <li>Abre todas las cortinas/persianas antes de fotografiar.</li>
  <li>Coloca la cámara de modo que la ventana quede de lado (luz lateral = dimensión y textura).</li>
  <li>Nunca fotografíes directamente hacia una ventana brillante — la habitación quedará oscura.</li>
</ol>

<h3>💡 Truco del reflector gratis</h3>
<p>Toma una cartulina blanca o una hoja grande de papel y úsala para reflejar la luz hacia las zonas oscuras. Funciona exactamente igual que un reflector profesional de $300.</p>
        `,
      },
      {
        id: 'a1-l2',
        title: 'Composición: La Regla de los Tercios',
        format: 'slides',
        duration: '5 min',
        slides: [
          {
            title: '📐 La Regla de los Tercios',
            points: [
              'Divide la imagen en una cuadrícula de 3×3',
              'Activa la cuadrícula en tu cámara (Ajustes → Cámara → Cuadrícula)',
              'Coloca los elementos importantes en las intersecciones',
              'Horizonte en el tercio superior o inferior, nunca en el centro',
            ],
          },
          {
            title: '🛏️ Fotografiando la Habitación',
            points: [
              'Esquina de la habitación para mostrar más espacio',
              'Cámara a la altura de la cintura, no del ojo',
              'Incluye el techo: da sensación de amplitud',
              'Arregla la cama y abre el edredón ligeramente',
            ],
          },
          {
            title: '🌿 Detalles que Venden el Vibe',
            points: [
              'Un libro abierto en la mesita de noche',
              'Flores o plantas en la foto (frescas, no artificiales)',
              'Café o té en la mesa → sensación acogedora',
              'Toallas dobladas en forma de abanico',
            ],
          },
          {
            title: '📱 Edición Gratis en el Celular',
            points: [
              'App Snapseed (gratis) → Herramientas → Curvas',
              'Aumenta ligeramente el brillo y reduce las sombras',
              'Aumenta el color blanco de las paredes (Blancos +10)',
              'NUNCA uses filtros de Instagram para fotos de alojamiento',
            ],
          },
        ],
      },
      {
        id: 'a1-quiz',
        title: 'Quiz: Fotografía con el Celular',
        format: 'quiz',
        duration: '3 min',
        quiz: [
          {
            question: '¿Cuál es el mejor momento del día para fotografiar interiores?',
            options: [
              'Mediodía, cuando hay más luz solar',
              'Por la noche con las luces artificiales encendidas',
              'Mañana temprano (8–10am) o tarde (4–6pm)',
              'Da igual la hora si tienes buena cámara',
            ],
            correct: 2,
            explanation: 'La luz de la mañana y la tarde dorada crea imágenes cálidas y acogedoras. El mediodía produce luces duras y sombras feas.',
          },
          {
            question: '¿Cómo debes posicionar la cámara para fotografiar una habitación?',
            options: [
              'Desde el centro mirando hacia la ventana',
              'Desde una esquina, a la altura de la cintura',
              'Desde la puerta, a la altura de los ojos',
              'Desde arriba, en picada',
            ],
            correct: 1,
            explanation: 'Desde la esquina se ve más espacio. A la altura de la cintura muestra las proporciones reales de la habitación.',
          },
          {
            question: '¿Qué detalle NO ayuda a vender el vibe del alojamiento en la foto?',
            options: [
              'Flores frescas sobre la mesa',
              'Una taza de café humeante',
              'Ropa tendida en el respaldo de la silla',
              'Un libro abierto en la mesita',
            ],
            correct: 2,
            explanation: 'La ropa tendida hace la habitación ver desordenada. Los otros elementos crean ambiente y calidez.',
          },
        ],
      },
    ],
  },

  // ─── GUÍAS ─────────────────────────────────────────────────────
  g1: {
    id: 'g1',
    icon: '📖',
    school: 'Escuela de Guías Locales',
    schoolColor: '#10B981',
    title: 'El Arte del Storytelling',
    subtitle: 'Cuenta tu historia, vende tu experiencia',
    description: 'Técnicas para estructurar la historia de tu comunidad, artesanía o taller. Cómo crear momentos memorables que hagan que los viajeros te recomienden.',
    badge: '📖 Narrador Going',
    lessons: [
      {
        id: 'g1-l1',
        title: '¿Por qué el Storytelling vende más que los datos?',
        format: 'text',
        duration: '6 min',
        content: `
<h2>Las historias se recuerdan. Los datos, no.</h2>

<p>Cuando termina un tour, los visitantes no recuerdan el año en que se construyó la iglesia. Recuerdan la historia de la familia que la financió vendiendo cacao durante 40 años. <strong>Las historias crean conexión emocional.</strong> Los datos llenan PDF's.</p>

<h3>🧠 El cerebro humano y las historias</h3>
<p>Los estudios de neurociencia muestran que cuando escuchamos una buena historia, nuestro cerebro libera oxitocina — la hormona de la confianza y la empatía. Eso explica por qué los tours con narrativa potente reciben calificaciones más altas que los tours "informativos".</p>

<h3>📖 La Estructura de Tres Actos (para cualquier experiencia)</h3>
<ol>
  <li>
    <strong>El Gancho (0–2 min):</strong> Una pregunta intrigante o una historia sorprendente que captura la atención al inicio.
    <br/><em>Ejemplo: "¿Sabían que este mercado fue clandestino durante 50 años? Hoy les voy a contar por qué."</em>
  </li>
  <li>
    <strong>El Desarrollo:</strong> La historia con sus personajes, conflicto y contexto. Datos insertados dentro de la narrativa, no en lista.
  </li>
  <li>
    <strong>El Cierre Memorable:</strong> Algo que los visitantes llevan consigo — una reflexión, un dato asombroso, una foto perfecta, una tradición que pueden repetir en casa.
  </li>
</ol>

<h3>🗣️ Tu historia personal ES tu diferenciador</h3>
<p>Los visitantes pueden leer sobre la iglesia en Wikipedia. Lo que NO pueden leer es <em>tu</em> conexión con ese lugar. Cuando compartes algo personal — "Mi abuela me traía aquí cada domingo" — creates una experiencia única e irrepetible.</p>
        `,
      },
      {
        id: 'g1-quiz',
        title: 'Quiz: El Arte del Storytelling',
        format: 'quiz',
        duration: '3 min',
        quiz: [
          {
            question: '¿Qué elemento es más efectivo para iniciar un tour según la técnica de Storytelling?',
            options: [
              'La historia de la ciudad con todas las fechas exactas',
              'Una pregunta intrigante o historia sorprendente',
              'Las reglas y restricciones del tour',
              'La agenda y los horarios del recorrido',
            ],
            correct: 1,
            explanation: 'El "gancho" — una pregunta intrigante o historia sorprendente — captura la atención emocional desde el inicio.',
          },
          {
            question: '¿Por qué tu historia personal es tu mayor diferenciador?',
            options: [
              'Porque hace el tour más largo y justifica el precio',
              'Porque los visitantes pueden encontrar datos en Wikipedia, pero no TU conexión personal',
              'Porque los turistas no saben sobre historia ecuatoriana',
              'Porque hace que el tour sea más fácil de preparar',
            ],
            correct: 1,
            explanation: 'La información está en Google. Lo que no está en ningún lado es tu experiencia personal y tu conexión con el lugar.',
          },
          {
            question: '¿Qué libera el cerebro cuando escucha una buena historia?',
            options: [
              'Adrenalina',
              'Cortisol',
              'Oxitocina (hormona de confianza y empatía)',
              'Dopamina',
            ],
            correct: 2,
            explanation: 'La oxitocina es la hormona que genera confianza y conexión emocional — exactamente lo que necesitas que sientan tus visitantes.',
          },
        ],
      },
    ],
  },

  // ─── VIAJEROS ──────────────────────────────────────────────────
  v1: {
    id: 'v1',
    icon: '🗺️',
    school: 'Escuela de Viajeros',
    schoolColor: '#F59E0B',
    title: 'Viaja Inteligente con Going',
    subtitle: 'Guía completa del pasajero',
    description: 'Cómo reservar, rastrear tu viaje, comunicarte con el conductor y usar todas las funciones de la app.',
    badge: '🌟 Viajero Going Pro',
    lessons: [
      {
        id: 'v1-l1',
        title: 'Cómo pedir tu primer viaje',
        format: 'text',
        duration: '5 min',
        content: `
<h2>Tu Primer Viaje con Going — Paso a Paso</h2>

<p>Going es más que pedir un taxi. Es una experiencia completa. Aquí aprenderás a aprovecharla al máximo.</p>

<h3>🚗 Pidiendo un viaje</h3>
<ol>
  <li><strong>Abre la app Going</strong> e inicia sesión.</li>
  <li>En la pantalla principal, ingresa tu destino en el campo de búsqueda.</li>
  <li>Confirma tu punto de recogida (puedes arrastrarlo en el mapa).</li>
  <li>Elige el <strong>tipo de vehículo</strong>: Automóvil, SUV, SUV XL, VAN, o Compartido.</li>
  <li>Revisa el <strong>precio estimado</strong> antes de confirmar.</li>
  <li>Toca <strong>"Confirmar viaje"</strong> — en segundos verás quién acepta.</li>
</ol>

<h3>📍 Tracking en tiempo real</h3>
<p>Una vez confirmado, puedes ver al conductor moviéndose en el mapa hacia ti. La app te avisa cuando está a 2 minutos y cuando llega.</p>

<h3>💬 Chat con el conductor</h3>
<p>Usa el chat de la app para coordinar — no compartas tu número personal. El chat tiene <strong>traducción automática</strong> si no hablas el mismo idioma.</p>

<h3>💳 Pago</h3>
<p>Al final del viaje puedes pagar con tarjeta (DATAFAST) o efectivo. El recibo llega a tu email automáticamente.</p>
        `,
      },
      {
        id: 'v1-quiz',
        title: 'Quiz: Viaja Inteligente',
        format: 'quiz',
        duration: '3 min',
        quiz: [
          {
            question: '¿Qué debes revisar ANTES de confirmar un viaje en Going?',
            options: [
              'El nombre del conductor',
              'El precio estimado del viaje',
              'El color del vehículo',
              'La calificación del conductor',
            ],
            correct: 1,
            explanation: 'Siempre verifica el precio estimado antes de confirmar. Así no hay sorpresas al llegar al destino.',
          },
          {
            question: '¿Cómo debes coordinar con el conductor si necesitas darle instrucciones?',
            options: [
              'Llamarle al número personal que te da la app',
              'Usar el chat dentro de la app Going',
              'Escribirle por WhatsApp',
              'Esperar a que llegue para hablar en persona',
            ],
            correct: 1,
            explanation: 'El chat de la app es la forma segura y oficial. Tiene traducción automática y mantiene tu privacidad.',
          },
        ],
      },
    ],
  },
};

/* ─────────────────────────────────────────────
   FORMAT RENDERER
   ───────────────────────────────────────────── */
function FormatIcon({ format }: { format: LessonFormat }) {
  const icons: Record<LessonFormat, string> = {
    text: '📖',
    podcast: '🎧',
    video: '📺',
    slides: '📊',
    quiz: '✅',
  };
  const labels: Record<LessonFormat, string> = {
    text: 'Lectura',
    podcast: 'Podcast',
    video: 'Video',
    slides: 'Diapositivas',
    quiz: 'Quiz',
  };
  return (
    <span className="text-xs text-gray-500">
      {icons[format]} {labels[format]}
    </span>
  );
}

function LessonContent({ lesson, schoolColor }: { lesson: Lesson; schoolColor: string }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Text / Podcast
  if (lesson.format === 'text' && lesson.content) {
    return (
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: lesson.content }} />
    );
  }

  if (lesson.format === 'podcast' && lesson.audioDescription) {
    return (
      <div>
        {/* Simulated audio player */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 flex items-center gap-4">
          <button className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0"
            style={{ backgroundColor: schoolColor }}>
            ▶
          </button>
          <div className="flex-1">
            <div className="h-1.5 bg-gray-700 rounded-full mb-2">
              <div className="h-1.5 rounded-full w-0" style={{ backgroundColor: schoolColor }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0:00</span>
              <span>8:00</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lesson.audioDescription }} />
      </div>
    );
  }

  // Video
  if (lesson.format === 'video') {
    return (
      <div>
        {lesson.videoUrl ? (
          <div className="rounded-2xl overflow-hidden mb-5 bg-black"
            style={{ aspectRatio: '16/9', position: 'relative' }}>
            <iframe
              src={lesson.videoUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
            />
          </div>
        ) : (
          /* Placeholder when no real video URL yet */
          <div className="rounded-2xl overflow-hidden mb-5 flex items-center justify-center"
            style={{
              aspectRatio: '16/9',
              background: `linear-gradient(135deg, ${schoolColor}20, ${schoolColor}08)`,
              border: `2px dashed ${schoolColor}40`,
            }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3"
                style={{ backgroundColor: schoolColor }}>
                <span className="text-white">▶</span>
              </div>
              <p className="text-gray-500 text-sm font-medium">Video en producción</p>
              <p className="text-gray-400 text-xs mt-1">Disponible pronto</p>
            </div>
          </div>
        )}
        {/* Description / transcript below video */}
        {lesson.videoDescription && (
          <div>
            <h4 className="font-bold text-gray-700 text-sm mb-3">📋 Resumen del video</h4>
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: lesson.videoDescription }} />
          </div>
        )}
        {lesson.content && (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mt-4"
            dangerouslySetInnerHTML={{ __html: lesson.content }} />
        )}
      </div>
    );
  }

  // Slides
  if (lesson.format === 'slides' && lesson.slides) {
    const slide = lesson.slides[slideIndex];
    return (
      <div>
        <div className="rounded-2xl p-8 mb-4 min-h-48"
          style={{ background: `linear-gradient(135deg, ${schoolColor}15, ${schoolColor}08)`, border: `1px solid ${schoolColor}30` }}>
          <div className="text-sm font-bold mb-1" style={{ color: schoolColor }}>
            Diapositiva {slideIndex + 1} de {lesson.slides.length}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">{slide.title}</h3>
          <ul className="space-y-2">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                <span className="font-bold mt-0.5" style={{ color: schoolColor }}>→</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setSlideIndex(Math.max(0, slideIndex - 1))}
            disabled={slideIndex === 0}
            className="px-4 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40 transition-opacity"
            style={{ borderColor: schoolColor, color: schoolColor }}>
            ← Anterior
          </button>
          <div className="flex gap-1.5">
            {lesson.slides.map((_, i) => (
              <button key={i} onClick={() => setSlideIndex(i)}
                className="w-2.5 h-2.5 rounded-full transition-colors"
                style={{ backgroundColor: i === slideIndex ? schoolColor : '#e5e7eb' }} />
            ))}
          </div>
          <button onClick={() => setSlideIndex(Math.min(lesson.slides!.length - 1, slideIndex + 1))}
            disabled={slideIndex === lesson.slides.length - 1}
            className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity text-white"
            style={{ backgroundColor: schoolColor }}>
            Siguiente →
          </button>
        </div>
      </div>
    );
  }

  // Quiz
  if (lesson.format === 'quiz' && lesson.quiz) {
    const score = quizSubmitted
      ? lesson.quiz.filter((q, i) => quizAnswers[i] === q.correct).length
      : 0;
    const passed = score >= Math.ceil(lesson.quiz.length * 0.67);

    if (quizSubmitted) {
      return (
        <div>
          <div className={`rounded-2xl p-6 mb-6 text-center ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="text-4xl mb-2">{passed ? '🎉' : '📖'}</div>
            <h3 className={`text-xl font-bold mb-1 ${passed ? 'text-green-700' : 'text-red-700'}`}>
              {passed ? '¡Aprobado!' : 'Inténtalo de nuevo'}
            </h3>
            <p className={`text-sm ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {score} de {lesson.quiz.length} respuestas correctas
            </p>
          </div>
          <div className="space-y-4">
            {lesson.quiz.map((q, qi) => {
              const isCorrect = quizAnswers[qi] === q.correct;
              return (
                <div key={qi} className={`rounded-xl p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className="font-semibold text-gray-900 text-sm mb-2">{isCorrect ? '✅' : '❌'} {q.question}</p>
                  <p className={`text-sm font-medium mb-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                    Tu respuesta: {q.options[quizAnswers[qi] ?? 0]}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-green-700">Correcta: {q.options[q.correct]}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 italic">{q.explanation}</p>
                </div>
              );
            })}
          </div>
          {!passed && (
            <button onClick={() => { setQuizAnswers([]); setQuizSubmitted(false); }}
              className="w-full mt-4 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: schoolColor }}>
              Intentar de nuevo
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {lesson.quiz.map((q, qi) => (
          <div key={qi}>
            <p className="font-semibold text-gray-900 mb-3 text-sm">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <button key={oi}
                  onClick={() => {
                    const next = [...quizAnswers];
                    next[qi] = oi;
                    setQuizAnswers(next);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    quizAnswers[qi] === oi
                      ? 'text-white font-semibold'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                  style={quizAnswers[qi] === oi ? { backgroundColor: schoolColor, borderColor: schoolColor } : {}}>
                  {String.fromCharCode(65 + oi)}. {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={() => setQuizSubmitted(true)}
          disabled={quizAnswers.filter(a => a !== null && a !== undefined).length < lesson.quiz!.length}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: schoolColor }}>
          Ver resultados
        </button>
      </div>
    );
  }

  return <p className="text-gray-500">Contenido no disponible.</p>;
}

/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */
export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const course = COURSES_DB[courseId];
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Curso en construcción</h1>
          <p className="text-gray-500 mb-6">Este curso estará disponible muy pronto. Mientras tanto, prueba otro.</p>
          <Link href="/academy"
            className="inline-block px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#ff4c41' }}>
            Ver todos los cursos
          </Link>
        </div>
      </div>
    );
  }

  const lesson = course.lessons[currentLesson];
  const progress = Math.round((completedLessons.size / course.lessons.length) * 100);
  const isCompleted = completedLessons.has(lesson.id);

  const markComplete = () => {
    setCompletedLessons(prev => new Set([...prev, lesson.id]));
    if (currentLesson < course.lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/academy" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
            ← Academia
          </Link>
          <span className="text-gray-200">|</span>
          <span className="text-xs font-semibold truncate" style={{ color: course.schoolColor }}>
            {course.school}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: course.schoolColor }} />
            </div>
            <span className="text-xs text-gray-500 hidden sm:block">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">

        {/* ── Sidebar (lessons) ── */}
        <aside className="w-72 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
            {/* Course header */}
            <div className="p-5 border-b border-gray-100"
              style={{ background: `linear-gradient(135deg, ${course.schoolColor}12, ${course.schoolColor}06)` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{course.icon}</span>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm leading-snug">{course.title}</h2>
                  <p className="text-xs mt-0.5" style={{ color: course.schoolColor }}>{course.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Lesson list */}
            <div className="divide-y divide-gray-50">
              {course.lessons.map((l, i) => {
                const done = completedLessons.has(l.id);
                const active = i === currentLesson;
                return (
                  <button key={l.id} onClick={() => setCurrentLesson(i)}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
                      active ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                      done ? 'bg-green-500 text-white' : active ? 'text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                      style={active && !done ? { backgroundColor: course.schoolColor } : {}}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug truncate ${active ? 'text-gray-900' : 'text-gray-600'}`}>
                        {l.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <FormatIcon format={l.format} />
                        <span className="text-xs text-gray-400">{l.duration}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Badge earned */}
            {completedLessons.size === course.lessons.length && (
              <div className="p-4 border-t border-gray-100 bg-green-50 text-center">
                <div className="text-2xl mb-1">🏅</div>
                <p className="text-xs font-bold text-green-700">{course.badge}</p>
                <p className="text-xs text-green-600">¡Curso completado!</p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          {/* Lesson header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FormatIcon format={lesson.format} />
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{lesson.duration}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
          </div>

          {/* Lesson body */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <LessonContent lesson={lesson} schoolColor={course.schoolColor} />
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentLesson > 0 && (
              <button onClick={() => setCurrentLesson(currentLesson - 1)}
                className="flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all hover:shadow-sm"
                style={{ borderColor: course.schoolColor, color: course.schoolColor }}>
                ← Lección anterior
              </button>
            )}
            {lesson.format !== 'quiz' && (
              <button onClick={markComplete}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 ${isCompleted ? 'opacity-60' : ''}`}
                style={{ backgroundColor: course.schoolColor }}>
                {isCompleted
                  ? '✓ Completada'
                  : currentLesson < course.lessons.length - 1
                  ? 'Marcar completada y continuar →'
                  : 'Finalizar curso 🎉'}
              </button>
            )}
          </div>

          {/* Mobile: lesson list */}
          <div className="mt-6 md:hidden bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">Lecciones del curso</p>
            </div>
            {course.lessons.map((l, i) => {
              const done = completedLessons.has(l.id);
              const active = i === currentLesson;
              return (
                <button key={l.id} onClick={() => setCurrentLesson(i)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0 ${active ? 'bg-gray-50' : ''}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    done ? 'bg-green-500 text-white' : active ? 'text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                    style={active && !done ? { backgroundColor: course.schoolColor } : {}}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-gray-700 truncate">{l.title}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
