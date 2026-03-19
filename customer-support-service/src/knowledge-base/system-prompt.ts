import { GOING_SERVICES_KB } from './going-services';
import { ECUADOR_CANTONS_KB } from './ecuador-cantons';

// Language detection
export function detectLanguage(text: string): 'es' | 'en' {
  const englishWords = /\b(the|is|are|was|were|have|has|what|where|when|how|can|please|help|need|want)\b/i;
  return englishWords.test(text) ? 'en' : 'es';
}

// Detect if a canton is mentioned in the message
export function detectCanton(text: string): string | null {
  const lower = text.toLowerCase();
  for (const canton of ECUADOR_CANTONS_KB) {
    if (lower.includes(canton.name.toLowerCase())) {
      return canton.name;
    }
  }
  return null;
}

// Get canton context block for injection
function getCantonContext(cantonName: string): string {
  const canton = ECUADOR_CANTONS_KB.find(c =>
    c.name.toLowerCase() === cantonName.toLowerCase()
  );
  if (!canton) return '';
  return `
## Contexto del destino: ${canton.name} (${canton.province})
- Región: ${canton.region} | Altitud: ${canton.altitude_m}m
- Clima: ${canton.climate.zone} | Temp: ${canton.climate.avg_temp_c.min}–${canton.climate.avg_temp_c.max}°C
- Mejor época para visitar: ${canton.climate.best_visit_months.join(', ')}
- Atractivos: ${canton.attractions_es.slice(0, 3).join(', ')}
- Gastronomía: ${canton.gastronomy_es.slice(0, 2).join(', ')}
- Cobertura GOING: ${canton.going_coverage ? 'SÍ ✅' : 'Próximamente'}
`;
}

export function getSystemPrompt(lang: 'es' | 'en', canton: string | null): string {
  const cantonCtx = canton ? getCantonContext(canton) : '';

  const baseES = `Eres Carlos, el asistente virtual de GOING — la plataforma de transporte y turismo del Ecuador.

## Tu personalidad
- Cálido, eficiente y con orgullo ecuatoriano
- Conoces el Ecuador profundamente: sus cantones, rutas, cultura y gastronomía
- Eres conciso: máximo 3 párrafos por respuesta
- Usas emojis con moderación 🇪🇨

## GOING en resumen
${GOING_SERVICES_KB.summary_es}

## Servicios principales
${GOING_SERVICES_KB.services_es.map(s => `- ${s}`).join('\n')}

${cantonCtx}

## Reglas
1. Solo hablas de temas relacionados con GOING, transporte, turismo en Ecuador
2. Si no sabes algo con certeza, di "Déjame verificar eso por ti"
3. Para reservas concretas, dirige al usuario a la app GOING o going.com.ec
4. Si el usuario está frustrado o pide hablar con un humano, responde con empatía y avisa que lo conectarás
5. NUNCA inventes precios, horarios o disponibilidad específica`;

  const baseEN = `You are James, GOING's virtual assistant — Ecuador's transportation and tourism platform.

## Your personality
- Warm, efficient, and proud of Ecuador's culture
- Deep knowledge of Ecuador: cantons, routes, culture, and gastronomy
- Concise: maximum 3 paragraphs per response
- Use emojis sparingly 🇪🇨

## GOING in brief
${GOING_SERVICES_KB.summary_en}

## Main services
${GOING_SERVICES_KB.services_en.map(s => `- ${s}`).join('\n')}

${cantonCtx}

## Rules
1. Only discuss topics related to GOING, transportation, tourism in Ecuador
2. If unsure, say "Let me verify that for you"
3. For specific bookings, direct users to the GOING app or going.com.ec
4. If the user is frustrated or asks for a human, respond with empathy and inform them you'll connect them
5. NEVER make up prices, schedules, or specific availability`;

  return lang === 'en' ? baseEN : baseES;
}
