import { Platform, ContentTopic, ContentType } from '../types/marketing.types';

// ============================================================
// Prompt templates for each platform + topic combination
// ============================================================

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: (context: Record<string, string | number>) => string;
  maxTokens: number;
  hashtags: string[];
}

// ─── Going social media handles ──────────────────────────────
export const GOING_SOCIAL = {
  instagram:  '@goingappecuador',
  facebook:   'facebook.com/goingappecuador',
  tiktok:     '@goingappecuador',
  x:          '@GoingAppecuador',
  telegram:   't.me/goingappecuador',
  youtube:    '@Goingappecuador',
  linkedin:   'linkedin.com/company/going-app',
  threads:    '@goingappecuador',
  whatsapp:   '+12138383591',
  web:        'goingec.com',
};

const GOING_BRAND_VOICE = `
Eres el community manager de Going, una plataforma de transporte terrestre premium en Ecuador.
Going conecta pasajeros con conductores verificados para viajes seguros, cómodos y confiables.
Rutas principales: Quito, Guayaquil, Cuenca, Manta, Ambato y destinos turísticos.
Redes sociales: Instagram/TikTok/Threads @goingappecuador | X @GoingAppecuador | FB goingappecuador.
Tono de marca: moderno, cercano, confiable y emocionante. Usa emojis con moderación.
Siempre escribe en español ecuatoriano (tuteo). Máximo 1-2 oraciones de hashtags al final.
Nunca uses más de 5 hashtags en Instagram/Facebook. En X máximo 3.
`;

const BASE_HASHTAGS = ['#Going', '#GoingEc', '#TransporteSeguro', '#Ecuador'];
const ROUTE_HASHTAGS = ['#ViajeSeguro', '#TravelEcuador', '#RoadTrip'];
const DRIVER_HASHTAGS = ['#ConductoresGoing', '#TeamGoing', '#Conductores'];
const PROMO_HASHTAGS = ['#Oferta', '#Descuento', '#ViajaMás'];

// ─── Templates by topic ──────────────────────────────────────

export const TEMPLATES: Record<ContentTopic, Partial<Record<Platform | 'default', Partial<PromptTemplate>>>> = {

  route_highlight: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post para destacar la ruta ${ctx.origin || 'Quito'} → ${ctx.destination || 'Guayaquil'}.
        ${ctx.price ? `Precio desde $${ctx.price}.` : ''}
        ${ctx.duration ? `Duración aproximada: ${ctx.duration}.` : ''}
        Resalta comodidad, seguridad y conveniencia. Incluye un llamado a la acción para reservar.`,
      hashtags: [...BASE_HASHTAGS, ...ROUTE_HASHTAGS],
      maxTokens: 300,
    },
    instagram: {
      userPrompt: (ctx) => `Escribe un caption de Instagram (máx 150 palabras) para la ruta ${ctx.origin || 'Quito'} → ${ctx.destination || 'Guayaquil'}.
        ${ctx.price ? `Precio desde $${ctx.price}.` : ''}
        Usa 1 emoji relevante al inicio. Termina con "Reserva en goingec.com 🚗 | @goingappecuador". Máximo 5 hashtags.`,
      hashtags: [...BASE_HASHTAGS, ...ROUTE_HASHTAGS, '#Instagram'],
    },
    x: {
      userPrompt: (ctx) => `Escribe un tweet (máx 280 caracteres) para la ruta ${ctx.origin || 'Quito'} → ${ctx.destination || 'Guayaquil'}.
        ${ctx.price ? `Desde $${ctx.price}.` : ''}
        Conciso, impactante. Máximo 2 hashtags.`,
      maxTokens: 100,
    },
  },

  driver_spotlight: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post para destacar a un conductor de Going.
        Nombre: ${ctx.name || 'Carlos'}.
        ${ctx.city ? `Ciudad: ${ctx.city}.` : ''}
        ${ctx.trips ? `Viajes completados: ${ctx.trips}.` : ''}
        ${ctx.rating ? `Calificación: ${ctx.rating}⭐.` : ''}
        Resalta confianza, profesionalismo y compromiso con los pasajeros.`,
      hashtags: [...BASE_HASHTAGS, ...DRIVER_HASHTAGS],
      maxTokens: 300,
    },
    instagram: {
      userPrompt: (ctx) => `Caption de Instagram para destacar al conductor ${ctx.name || 'Carlos'}.
        ${ctx.trips ? `${ctx.trips} viajes completados.` : ''}
        ${ctx.rating ? `Calificación: ${ctx.rating}⭐.` : ''}
        Tono humano y cercano. Máximo 120 palabras. 5 hashtags.`,
    },
  },

  promotion: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post de promoción/descuento para Going.
        ${ctx.discount ? `Descuento: ${ctx.discount}%.` : ''}
        ${ctx.route ? `Ruta: ${ctx.route}.` : 'Para todas las rutas.'}
        ${ctx.validUntil ? `Válido hasta: ${ctx.validUntil}.` : ''}
        ${ctx.code ? `Código: ${ctx.code}.` : ''}
        Genera urgencia y emoción. Incluye llamado a la acción claro.`,
      hashtags: [...BASE_HASHTAGS, ...PROMO_HASHTAGS],
      maxTokens: 300,
    },
  },

  testimonial: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post compartiendo una reseña positiva de un pasajero de Going.
        Reseña: "${ctx.review || 'Excelente servicio, conductor muy amable y puntual.'}"
        ${ctx.passenger ? `Pasajero: ${ctx.passenger}.` : ''}
        ${ctx.route ? `Ruta: ${ctx.route}.` : ''}
        Agradece al cliente y refuerza los valores de Going.`,
      hashtags: [...BASE_HASHTAGS, '#Testimonios', '#ClientesFelices'],
      maxTokens: 250,
    },
  },

  safety_tip: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: () => `Escribe un tip de seguridad vial o de viaje para los pasajeros de Going.
        Debe ser educativo, breve (máx 100 palabras) y reforzar la imagen de Going como plataforma segura.
        Varía el tema: cinturón de seguridad, verificar conductor, compartir ubicación, etc.`,
      hashtags: [...BASE_HASHTAGS, '#Seguridad', '#ViajeSeguro'],
      maxTokens: 200,
    },
  },

  company_milestone: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post celebrando un logro de Going.
        Logro: ${ctx.milestone || '1000 viajes completados'}.
        Agradece a la comunidad (pasajeros y conductores). Tono celebratorio y emotivo.`,
      hashtags: [...BASE_HASHTAGS, '#Milestone', '#Comunidad', '#Gracias'],
      maxTokens: 300,
    },
  },

  destination_guide: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe contenido sobre el destino "${ctx.destination || 'Cuenca'}" en Ecuador.
        Menciona 3 lugares imperdibles. Conecta con Going como la mejor forma de llegar.
        Tono de guía de viajes: inspirador y práctico.`,
      hashtags: [...BASE_HASHTAGS, '#TurismoEcuador', '#DescubreEcuador'],
      maxTokens: 400,
    },
  },

  behind_the_scenes: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post de "detrás de cámaras" de Going.
        Tema: ${ctx.topic || 'el equipo trabajando para mejorar la plataforma'}.
        Tono cercano y auténtico. Humaniza la marca.`,
      hashtags: [...BASE_HASHTAGS, '#TeamGoing', '#Startup', '#Ecuador'],
      maxTokens: 250,
    },
  },

  product_feature: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post anunciando una función nueva de la app Going.
        Feature: ${ctx.feature || 'nueva función de rastreo en tiempo real'}.
        Explica el beneficio para el usuario en 2-3 oraciones. Incluye llamado a actualizar la app.`,
      hashtags: [...BASE_HASHTAGS, '#AppGoing', '#Tecnología', '#Innovación'],
      maxTokens: 250,
    },
  },

  community: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post sobre el impacto de Going en la comunidad ecuatoriana.
        ${ctx.context || 'Going genera empleo para conductores y facilita el transporte seguro.'}
        Tono positivo y social.`,
      hashtags: [...BASE_HASHTAGS, '#Comunidad', '#ImpactoSocial', '#Ecuador'],
      maxTokens: 300,
    },
  },

  seasonal: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post de temporada/festivo para Going.
        Ocasión: ${ctx.occasion || 'Feriado de Navidad'}.
        Saluda a la comunidad y menciona que Going está disponible para sus viajes. Cálido y festivo.`,
      hashtags: [...BASE_HASHTAGS, '#Feriado', '#FelicesViajes'],
      maxTokens: 200,
    },
  },

  general: {
    default: {
      systemPrompt: GOING_BRAND_VOICE,
      userPrompt: (ctx) => `Escribe un post para Going.
        Tema: ${ctx.topic || 'viajar cómodo y seguro por Ecuador con Going'}.
        Tono: ${ctx.tone || 'amigable y motivador'}.`,
      hashtags: BASE_HASHTAGS,
      maxTokens: 300,
    },
  },
};

// Helper to get the best template for platform + topic
export function getTemplate(topic: ContentTopic, platform: Platform): PromptTemplate {
  const topicTemplates = TEMPLATES[topic] || TEMPLATES.general;
  const platformOverride = topicTemplates[platform] || {};
  const defaultTemplate = topicTemplates.default || TEMPLATES.general.default;

  return {
    systemPrompt: (platformOverride as Partial<PromptTemplate>).systemPrompt || (defaultTemplate as Partial<PromptTemplate>).systemPrompt || '',
    userPrompt: (platformOverride as Partial<PromptTemplate>).userPrompt || (defaultTemplate as Partial<PromptTemplate>).userPrompt || (() => ''),
    maxTokens: (platformOverride as Partial<PromptTemplate>).maxTokens || (defaultTemplate as Partial<PromptTemplate>).maxTokens || 300,
    hashtags: (platformOverride as Partial<PromptTemplate>).hashtags || (defaultTemplate as Partial<PromptTemplate>).hashtags || BASE_HASHTAGS,
  };
}

// Platform-specific max caption lengths
export const PLATFORM_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  x: 280,
  telegram_channel: 4096,
  whatsapp: 1000,
  threads: 500,
  youtube: 5000,
  email: 50000,
  blog: 100000,
};
