import { Logger } from '@nestjs/common';
// Fuente ÚNICA de tarifas: libs/pricing (FARES). La misma que usa el buscador
// del sitio y el cobro → la voz, la web y el pago dan el MISMO número.
// (Antes esta tool cotizaba desde going-kb, una 2ª tabla que derivaba.)
import { findRoute, listActiveCities, getRentalQuote, getShippingQuote, type Modality, type VehicleId } from '@going-platform/going-kb';
import { RealtimeTool } from './openai-realtime.adapter';

/**
 * Tools del agente Realtime para el canal TELEFÓNICO (Uyari).
 *
 * Diferencia clave vs voice-tools.ts del customer-support (in-app voice):
 *  - El usuario NO tiene pantalla — todo es verbal. Las respuestas del
 *    LLM deben ser pronunciables (números en palabras, no formato $X.YY).
 *  - El usuario llamó por TELÉFONO, suele querer respuesta rápida + concreta
 *    + opción de hablar con humano si no se resuelve en 1-2 turnos.
 *  - NO hay screenshare ni "te paso un link" — toda info es dictada o se
 *    promete enviar por SMS/WhatsApp posterior.
 *
 * Tools incluidos:
 *  - get_quote_phone: igual cálculo que get_quote del in-app, pero el
 *    resultado se devuelve con `spoken_*` fields pre-formateados para que
 *    el LLM los lea sin parsear ("veintidós dólares con cincuenta" en vez
 *    de "$22.50").
 *  - request_handoff_phone: escala con prioridad — para telefonía agregamos
 *    callback_requested para que el operador devuelva la llamada si el
 *    cliente cuelga antes del handoff.
 *  - send_followup_sms: prometemos enviar info (precios, link reserva) por
 *    SMS al mismo número. Útil cuando el cliente no puede tomar nota.
 */
export const VOICE_TOOLS_PHONE: RealtimeTool[] = [
  {
    type: 'function',
    name: 'get_quote_phone',
    description:
      'Calcula la tarifa de un viaje entre dos puntos del catálogo Going App y devuelve ' +
      'el precio en palabras (listo para dictar). Úsalo cuando el cliente pregunte ' +
      'por precio. Si la ruta no existe en catálogo, ofrecé enviar opciones por SMS ' +
      'usando send_followup_sms o transferí con request_handoff_phone.',
    parameters: {
      type: 'object',
      properties: {
        origen: {
          type: 'string',
          description: 'Ciudad/parroquia de origen lowercase con underscores: "quito", "guayaquil", "cumbaya".',
        },
        destino: {
          type: 'string',
          description: 'Ciudad/parroquia de destino, mismo formato.',
        },
        modalidad: {
          type: 'string',
          enum: ['compartido', 'privado'],
          description: 'Compartido (por asiento, hasta 7 pax) o privado (vehículo completo).',
        },
        vehiculo: {
          type: 'string',
          enum: ['suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus', 'bus_40'],
          description: 'Tipo de vehículo (solo privado/empresas). suv=4pax, suv_xl=5, van=7, van_xl=12, minibus=20, bus=30, bus_40=40. Default suv.',
        },
        tipo_cliente: {
          type: 'string',
          enum: ['retail', 'corporate'],
          description: 'retail = pasajero normal (default). corporate = Going Empresas (privado con contrato, +25%). Úsalo solo si la persona dice que llama por/para una empresa.',
        },
        fecha_hora: {
          type: 'string',
          description: 'ISO 8601 opcional (ej "2026-06-15T18:30:00-05:00"). Default: ahora.',
        },
      },
      required: ['origen', 'destino', 'modalidad'],
    },
  },
  {
    type: 'function',
    name: 'request_handoff_phone',
    description:
      'Transfiere la llamada a un operador humano del equipo Going App. Úsalo cuando: ' +
      '(1) el cliente lo pida explícitamente, (2) detectes emergencia (accidente, ' +
      'robo, herido), (3) cliente frustrado tras 2+ intentos, (4) consulta fuera de ' +
      'tu alcance (disputa de cobro, denuncia). Antes de invocar, decile al cliente ' +
      'algo como "te paso con un agente, no cuelgues por favor" — la transferencia es ' +
      'inmediata pero suave.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Razón breve (3-15 palabras). Ej: "cliente reporta robo en viaje activo".',
        },
        priority: {
          type: 'string',
          enum: ['RED', 'ORANGE', 'NORMAL'],
          description:
            'RED=emergencia (peligro físico). ORANGE=frustración alta o problema grave. ' +
            'NORMAL=pedido explícito de humano sin urgencia.',
        },
        callback_requested: {
          type: 'boolean',
          description:
            'Marca true si el cliente prefiere que el operador le devuelva la llamada ' +
            'en lugar de esperar en línea. Útil cuando hay cola y el cliente lo solicita.',
        },
      },
      required: ['reason', 'priority'],
    },
  },
  {
    type: 'function',
    name: 'send_followup_sms',
    description:
      'Promete enviar información por SMS al número desde el que llaman. Úsalo cuando ' +
      'el cliente necesita info que no puede tomar nota al teléfono (link de reserva, ' +
      'precios de varias rutas, dirección de oficina). Después de invocar, decile algo ' +
      'como "te llega un mensaje al ratito al mismo número, ¿alguna otra cosa?". ' +
      'El SMS real lo despacha customer-support — este tool solo marca el intent.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Tema del SMS en 2-5 palabras. Ej: "tarifas Quito-Cuenca", "link reserva privado".',
        },
        details: {
          type: 'string',
          description:
            'Contenido a incluir en el SMS, en lenguaje natural. ' +
            'El backend lo procesa y formatea el mensaje final.',
        },
      },
      required: ['topic'],
    },
  },
  {
    type: 'function',
    name: 'consultar_conocimiento',
    description:
      'Consulta el Centro de Información de Going para responder con datos reales sobre: ' +
      'turismo, historia y geografía de una CIUDAD (tema "turismo" + ciudad); preguntas frecuentes ("faq"); ' +
      'políticas de cancelación/reembolsos/mascotas ("politicas"); términos y privacidad ("legal"); ' +
      'y cómo inscribirse o descargar la app ("guias"). Úsala cuando pregunten por estos temas. ' +
      'Como es una llamada, resume en 1-3 frases lo esencial (no leas todo).',
    parameters: {
      type: 'object',
      properties: {
        tema: {
          type: 'string',
          enum: ['turismo', 'faq', 'politicas', 'legal', 'guias'],
          description: 'Tema a consultar.',
        },
        ciudad: {
          type: 'string',
          description: 'Solo para "turismo": ciudad (ej. "Quito", "Baños", "Cuenca").',
        },
      },
      required: ['tema'],
    },
  },
  {
    type: 'function',
    name: 'get_rental_quote',
    description:
      'Cotiza la RENTA de un vehículo por tiempo (con chofer). Modo "local" = dentro de la ciudad, por horas ' +
      '(unidad hora/medio_dia/dia); modo "por_dias" = a otra ciudad (indica origen, destino y días). ' +
      'Úsala si piden alquilar/rentar por horas o días, un tour, o "todo el día". Di el total. NO inventes.',
    parameters: {
      type: 'object',
      properties: {
        vehiculo: { type: 'string', enum: ['suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus', 'bus_40'], description: 'suv/suv_xl/van=pequeño, van_xl/minibus=mediano, bus/bus_40=grande.' },
        modo: { type: 'string', enum: ['local', 'por_dias'], description: 'local (por horas) o por_dias (a otra ciudad).' },
        unidad: { type: 'string', enum: ['hora', 'medio_dia', 'dia'], description: 'Solo modo local. Default dia.' },
        origen: { type: 'string', description: 'Solo por_dias. Default Quito.' },
        destino: { type: 'string', description: 'Solo por_dias.' },
        dias: { type: 'number', description: 'Solo por_dias. Default 1.' },
      },
      required: ['vehiculo', 'modo'],
    },
  },
  {
    type: 'function',
    name: 'get_shipping_quote',
    description:
      'Cotiza el ENVÍO de un paquete (crowdshipping interurbano, puerta a puerta). Precio PLANO por tamaño, ' +
      'igual para cualquier ruta. Úsala si preguntan cuánto cuesta enviar/mandar un paquete o encomienda. ' +
      'Pasa el tamaño (pequeno/mediano/grande) o el peso en kg. NO inventes.',
    parameters: {
      type: 'object',
      properties: {
        tamano: { type: 'string', enum: ['pequeno', 'mediano', 'grande'], description: 'pequeno (0-5kg), mediano (6-15kg), grande (16-30kg).' },
        peso_kg: { type: 'number', description: 'Peso en kg (si no sabe el tamaño).' },
      },
      required: [],
    },
  },
];

/** Handler de get_shipping_quote (voz) → going-kb.getShippingQuote. */
export function executeGetShippingPhone(args: any) {
  return getShippingQuote(args?.tamano, typeof args?.peso_kg === 'number' ? args.peso_kg : undefined);
}

/** Handler de get_rental_quote (voz) → going-kb.getRentalQuote. */
export function executeGetRentalPhone(args: any) {
  const norm = (s: any) => String(s || '').toLowerCase().trim().replace(/\s+/g, '_');
  const validVeh: VehicleId[] = ['suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus', 'bus_40'];
  const vehicle = (validVeh.includes(norm(args?.vehiculo) as VehicleId) ? norm(args?.vehiculo) : 'suv') as VehicleId;
  const mode = args?.modo === 'por_dias' ? 'por_dias' : 'local';
  if (mode === 'local') {
    const unit = ['hora', 'medio_dia', 'dia'].includes(args?.unidad) ? args.unidad : 'dia';
    return getRentalQuote({ vehicle, mode: 'local', unit });
  }
  let originCanton = norm(args?.origen) || 'quito';
  let zone: string | undefined;
  if (originCanton.includes('aeropuerto')) { originCanton = 'quito'; zone = 'aeropuerto'; }
  const destino = norm(args?.destino);
  const days = Math.max(1, parseInt(String(args?.dias), 10) || 1);
  return getRentalQuote({ vehicle, mode: 'por_dias', days, origin: { canton: originCanton, zone }, destination: { canton: destino } });
}

// ─── Resultados tipados de los tools ─────────────────────────

export interface QuotePhoneResult {
  ok: true;
  origen: string;
  destino: string;
  modalidad: 'compartido' | 'privado';
  /** Precio numérico final (USD). */
  final_price: number;
  /**
   * Versión hablable del precio para que el LLM lo lea sin transformar:
   * "veintidós dólares con cincuenta" en vez de "$22.50".
   */
  spoken_price: string;
  /** Versión hablable de los recargos vigentes, vacío si no aplica. */
  spoken_surcharges: string;
  /** Per seat (compartido) vs total (privado) — frase corta para el LLM. */
  spoken_unit: string;
  currency: 'USD';
  datetime_used: string;
}

export interface QuotePhoneError {
  ok: false;
  error: string;
  message: string;
  /** Sugerencia hablable para que el LLM la lea: "esa ruta aún no la tenemos, ¿querés que te mande opciones por SMS?". */
  spoken_suggestion: string;
}

const toolsLogger = new Logger('VoiceToolsPhone');

/**
 * Convierte un número decimal de dólares a su forma hablada en español.
 * Ej: 22.50 → "veintidós dólares con cincuenta"; 15 → "quince dólares".
 *
 * Implementación pragmática (cubre 0-9999 + centavos). Para amounts más
 * grandes que esto Going App no usa voz de todas formas — es transporte
 * local, no facturación corporativa.
 */
export function priceToSpanish(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '';
  const dollars = Math.floor(amount);
  const cents   = Math.round((amount - dollars) * 100);

  const dollarsWord = numberToSpanish(dollars);
  const dollarLabel = dollars === 1 ? 'dólar' : 'dólares';

  if (cents === 0) return `${dollarsWord} ${dollarLabel}`;
  const centsWord = numberToSpanish(cents);
  return `${dollarsWord} ${dollarLabel} con ${centsWord}`;
}

/** Números 0-9999 en español. Cobertura suficiente para tarifas Going App. */
function numberToSpanish(n: number): string {
  if (n === 0) return 'cero';
  if (n < 0 || n > 9999) return String(n);

  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
                 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
                 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens  = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta',
                 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos',
                    'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const sayBelow100 = (k: number): string => {
    if (k < 20) return units[k];
    const t = Math.floor(k / 10);
    const u = k % 10;
    if (u === 0) return tens[t];
    if (t === 2) return `veinti${units[u]}`;       // veintiuno, veintidós...
    return `${tens[t]} y ${units[u]}`;
  };

  const sayBelow1000 = (k: number): string => {
    if (k === 100) return 'cien';
    if (k < 100)   return sayBelow100(k);
    const h = Math.floor(k / 100);
    const rest = k % 100;
    if (rest === 0) return hundreds[h];
    return `${hundreds[h]} ${sayBelow100(rest)}`.trim();
  };

  if (n < 1000) return sayBelow1000(n);
  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  const thousands = th === 1 ? 'mil' : `${sayBelow1000(th)} mil`;
  if (rest === 0) return thousands;
  return `${thousands} ${sayBelow1000(rest)}`;
}

/**
 * Handler de get_quote_phone. Reusa el cálculo canónico de pricing del
 * Centro de Información Going App (@going-platform/going-kb) — misma fuente
 * de verdad que el chat web. Solo difiere en el shape del resultado:
 * pre-formateado para dictado verbal.
 */
export function executeGetQuotePhone(args: any): QuotePhoneResult | QuotePhoneError {
  const norm = (s: any) => String(s || '').toLowerCase().trim().replace(/\s+/g, '_');

  // Origen: si mencionan aeropuerto, es la zona 'aeropuerto' de Quito.
  let originCanton = norm(args?.origen);
  let originZone: string | undefined = args?.zona_origen ? norm(args.zona_origen) : undefined;
  if (originCanton.includes('aeropuerto')) { originCanton = 'quito'; originZone = 'aeropuerto'; }
  const destino = norm(args?.destino);

  const modality: Modality = args?.modalidad === 'privado' ? 'private' : 'shared';
  const validVeh: VehicleId[] = ['auto', 'suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus', 'bus_40'];
  const vehicle: VehicleId = (validVeh.includes(norm(args?.vehiculo) as VehicleId)
    ? (norm(args?.vehiculo) as VehicleId)
    : 'suv');
  const clientType = args?.tipo_cliente === 'corporate' ? 'corporate' : 'retail';

  if (!originCanton || !destino) {
    return {
      ok: false,
      error: 'missing_route',
      message: 'Faltan origen o destino.',
      spoken_suggestion: 'No escuché bien la ruta. ¿Me dices de dónde a dónde?',
    };
  }

  const dateTime = args?.fecha_hora ? new Date(args.fecha_hora) : new Date();
  if (isNaN(dateTime.getTime())) {
    return {
      ok: false,
      error: 'invalid_datetime',
      message: 'fecha_hora debe ser ISO 8601 válido.',
      spoken_suggestion: 'No entendí la fecha. ¿Es para hoy?',
    };
  }

  // Catálogo canónico (@going-platform/going-kb → knowledge-base/pricing). MISMA
  // fuente que el chat web → una sola verdad de precios. findRoute respeta los
  // precios privados EXPLÍCITOS por vehículo + recargos + tipo de cliente.
  // Probamos ambas direcciones (rutas bidireccionales).
  let fare = findRoute({
    origin: { canton: originCanton, zone: originZone },
    destination: { canton: destino },
    modality, vehicle, when: dateTime, clientType,
  });
  if (!fare) {
    fare = findRoute({
      origin: { canton: destino },
      destination: { canton: originCanton, zone: originZone },
      modality, vehicle, when: dateTime, clientType,
    });
  }

  if (!fare) {
    const suger = listActiveCities().slice(0, 6).map((c) => c.name).join(', ');
    return {
      ok: false,
      error: 'route_not_listed',
      message: `Ruta ${originCanton} ↔ ${destino} (${modality} ${vehicle}) no está en el catálogo.`,
      spoken_suggestion:
        `Esa ruta entre ${originCanton.replace(/_/g, ' ')} y ${destino.replace(/_/g, ' ')} ` +
        `no la tengo a mano. Cubrimos, por ejemplo: ${suger}. ¿Quieres que te la confirme por mensaje?`,
    };
  }

  const finalPrice = fare.finalPrice;
  const surchargeLabels = fare.breakdown.filter((b) => b.type !== 'base').map((b) => b.label);
  const spokenSurcharges = surchargeLabels.length ? `incluye ${surchargeLabels.join(' y ')}` : '';
  const spokenUnit = modality === 'shared' ? 'por asiento' : 'por el viaje completo';

  toolsLogger.log(
    `[tool:get_quote_phone] ${originCanton}↔${destino} ${modality} ${vehicle} [${clientType}] → ` +
      `$${finalPrice} (${priceToSpanish(finalPrice)}) [going-kb]`,
  );

  return {
    ok: true,
    origen: originCanton,
    destino,
    modalidad: modality === 'shared' ? 'compartido' : 'privado',
    final_price: finalPrice,
    spoken_price: priceToSpanish(finalPrice),
    spoken_surcharges: spokenSurcharges,
    spoken_unit: spokenUnit,
    currency: 'USD',
    datetime_used: dateTime.toISOString(),
  };
}

// ─── Handoff phone result ────────────────────────────────────

export interface HandoffPhoneResult {
  ok: true;
  reason: string;
  priority: 'RED' | 'ORANGE' | 'NORMAL';
  callback_requested: boolean;
  /** Frase hablable para que el LLM la lea antes de cerrar el turno. */
  spoken_confirmation: string;
}

/**
 * Handler de request_handoff_phone. Sintetiza la respuesta hablable; el
 * bridge dispara la transferencia REAL (twilioRest.redirectCall) tras
 * recibir el tool.call. La separación permite testear esta parte sin
 * depender de Twilio REST.
 */
export function executeHandoffPhone(args: any): HandoffPhoneResult {
  const reason   = String(args?.reason || 'sin razón').slice(0, 200);
  const priority = (['RED', 'ORANGE', 'NORMAL'].includes(args?.priority) ? args.priority : 'NORMAL') as 'RED' | 'ORANGE' | 'NORMAL';
  const callback = args?.callback_requested === true;

  toolsLogger.warn(`[tool:request_handoff_phone] priority=${priority} callback=${callback} reason="${reason}"`);

  const spoken = callback
    ? 'Listo, ya marqué tu pedido. Un agente te va a devolver la llamada en unos minutos. Gracias por llamar a Going App.'
    : priority === 'RED'
      ? 'Te paso ya mismo con el equipo de emergencias, no cuelgues por favor.'
      : 'Dame un segundo, te transfiero con un agente del equipo Going App. No cuelgues.';

  return { ok: true, reason, priority, callback_requested: callback, spoken_confirmation: spoken };
}

// ─── Send followup SMS result ────────────────────────────────

export interface SendSmsResult {
  ok: true;
  topic: string;
  details: string;
  /** Frase hablable. */
  spoken_confirmation: string;
}

/**
 * Handler de send_followup_sms. Sintetiza la confirmación hablable + el
 * payload SMS. El envío real lo dispara el bridge (twilioRest.sendSms)
 * usando el `from` E.164 del caller. Si Twilio REST no está configurado,
 * el bridge degrada gracefully — el LLM igual lee spoken_confirmation.
 */
export function executeSendFollowupSms(args: any): SendSmsResult {
  const topic   = String(args?.topic   || '').slice(0, 80);
  const details = String(args?.details || '').slice(0, 1000);
  toolsLogger.log(`[tool:send_followup_sms] topic="${topic}" details="${details.slice(0, 80)}"`);
  return {
    ok: true,
    topic,
    details,
    spoken_confirmation: `Listo, te llega un mensaje al ratito al mismo número con la info sobre ${topic || 'lo que pediste'}.`,
  };
}
