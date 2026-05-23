import { Logger } from '@nestjs/common';
import { FARES, applyDynamicPricing } from '@going-platform/pricing';
import { RealtimeTool } from '../infrastructure/openai-realtime.adapter';

/**
 * Tools que el modelo Realtime puede invocar durante una llamada de voz.
 *
 * Diseño: subset estrecho y de baja latencia. Acciones de alto impacto
 * (crear booking real, escalar a humano, cambiar políticas) tienen tools
 * dedicados; quotes y lookups responden inline sin side-effects.
 *
 * Por qué subset: la latencia de tool.call → ejecución → tool.result → audio
 * tts es de 800-2000ms; cada tool extra suma redondeos. Mejor pocos tools
 * confiables que muchos lentos. Las preguntas tipo FAQ las resuelve el
 * system prompt directamente.
 */
export const VOICE_TOOLS: RealtimeTool[] = [
  {
    type: 'function',
    name: 'get_quote',
    description:
      'Calcula la tarifa exacta de un viaje entre dos puntos canónicos del catálogo Going. ' +
      'Úsalo cuando el cliente pregunte por precio. Devuelve precio base, recargos vigentes ' +
      '(nocturno/fin-de-semana/feriado) y precio final. Si la ruta no existe en catálogo, ' +
      'devuelve error y deberías ofrecer al cliente cotizar por la app o WhatsApp.',
    parameters: {
      type: 'object',
      properties: {
        origen: {
          type: 'string',
          description: 'Ciudad/parroquia de origen, lowercase con underscores. Ej: "quito", "guayaquil", "cumbaya".',
        },
        destino: {
          type: 'string',
          description: 'Ciudad/parroquia de destino, mismo formato que origen.',
        },
        modalidad: {
          type: 'string',
          enum: ['compartido', 'privado'],
          description: 'Compartido (por asiento, hasta 7 pasajeros) o privado (todo el vehículo).',
        },
        fecha_hora: {
          type: 'string',
          description:
            'Fecha/hora del viaje en ISO 8601 (ej: 2026-06-15T18:30:00-05:00). ' +
            'Opcional — si no se pasa usa "ahora" para calcular recargo de tiempo.',
        },
      },
      required: ['origen', 'destino', 'modalidad'],
    },
  },
  {
    type: 'function',
    name: 'request_handoff',
    description:
      'Escala la llamada a un operador humano del equipo Going. Úsalo cuando: ' +
      '(1) el cliente lo pida explícitamente ("quiero hablar con una persona"), ' +
      '(2) detectes una emergencia o situación grave (accidente, robo, herido), ' +
      '(3) el cliente esté frustrado tras 2+ intentos fallidos de resolver algo, ' +
      '(4) la consulta esté fuera de tu alcance (disputa de cobro, denuncia formal). ' +
      'Después de invocar este tool, despídete brevemente del cliente y avísale que ya viene un agente.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Razón breve de la escalación (3-15 palabras). Ej: "cliente reporta robo en viaje".',
        },
        priority: {
          type: 'string',
          enum: ['RED', 'ORANGE', 'NORMAL'],
          description:
            'RED = emergencia (accidente, robo, peligro físico). ' +
            'ORANGE = frustración alta o problema grave de servicio. ' +
            'NORMAL = pedido explícito de hablar con humano sin urgencia.',
        },
      },
      required: ['reason', 'priority'],
    },
  },
];

/**
 * Resultado tipado de get_quote. Lo que se devuelve al modelo en
 * `sendToolResult(callId, JSON.stringify(result))`.
 */
export interface QuoteResult {
  ok: true;
  origen: string;
  destino: string;
  modalidad: 'compartido' | 'privado';
  base_price: number;
  final_price: number;
  surcharges: Record<string, string>;
  currency: 'USD';
  per_seat: boolean;
  datetime_used: string;
}

export interface QuoteError {
  ok: false;
  error: string;
  message?: string;
}

const toolsLogger = new Logger('VoiceTools');

/**
 * Handler de get_quote — mismo cálculo que `AgentService.toolGetQuote`
 * usa para el path de texto, mantenido en sync con `libs/pricing`. NO
 * duplica lógica: si cambian las FARES, ambos paths reflejan el cambio
 * automáticamente porque importan del mismo paquete.
 *
 * Decisión: no llamamos a `AgentService.toolGetQuote` directamente para
 * evitar dependencia circular agent → voice → agent. Las 30 líneas de
 * cálculo están bien aquí mientras la lógica de pricing canónica viva
 * en `@going-platform/pricing`.
 */
export function executeGetQuote(args: any): QuoteResult | QuoteError {
  const origen   = String(args?.origen   || '').toLowerCase().replace(/\s+/g, '_');
  const destino  = String(args?.destino  || '').toLowerCase().replace(/\s+/g, '_');
  const modalidad = (args?.modalidad === 'privado' ? 'privado' : 'compartido') as 'compartido' | 'privado';

  if (!origen || !destino) {
    return { ok: false, error: 'missing_route', message: 'Faltan origen o destino.' };
  }

  const dateTime = args?.fecha_hora ? new Date(args.fecha_hora) : new Date();
  if (isNaN(dateTime.getTime())) {
    return { ok: false, error: 'invalid_datetime', message: 'fecha_hora debe ser ISO 8601 válido.' };
  }

  const sharedFares = FARES.shared as Record<string, number>;
  const basePrice = sharedFares[`${origen}-${destino}`] ?? sharedFares[`${destino}-${origen}`];

  if (basePrice === undefined) {
    const known = Object.keys(sharedFares).slice(0, 10).join(', ');
    return {
      ok: false,
      error: 'route_not_listed',
      message: `Ruta ${origen} ↔ ${destino} no está en el catálogo. Rutas conocidas: ${known}...`,
    };
  }

  const pricing = applyDynamicPricing({
    basePrice,
    mode: modalidad,
    dateTime,
    clientSegment: 'public',
  });

  const surcharges: Record<string, string> = {};
  if (pricing.timeSurchargeRate > 0) {
    surcharges.tiempo = `+${(pricing.timeSurchargeRate * 100).toFixed(0)}%`;
  }
  if (pricing.clientSurchargeRate > 0) {
    surcharges.segmento = `+${(pricing.clientSurchargeRate * 100).toFixed(0)}%`;
  }

  toolsLogger.log(`[tool:get_quote] ${origen}↔${destino} ${modalidad} → $${pricing.adjustedPrice}`);

  return {
    ok: true,
    origen,
    destino,
    modalidad,
    base_price: basePrice,
    final_price: pricing.adjustedPrice,
    surcharges,
    currency: 'USD',
    per_seat: modalidad === 'compartido',
    datetime_used: dateTime.toISOString(),
  };
}
