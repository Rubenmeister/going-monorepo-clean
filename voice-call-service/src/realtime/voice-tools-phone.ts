import { Logger } from '@nestjs/common';
// Fuente ÚNICA de tarifas: libs/pricing (FARES). La misma que usa el buscador
// del sitio y el cobro → la voz, la web y el pago dan el MISMO número.
// (Antes esta tool cotizaba desde going-kb, una 2ª tabla que derivaba.)
import { getFare, getPrivateFare, applyDynamicPricing, FARES } from '@going-platform/pricing';
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
];

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
  const origen  = String(args?.origen  || '').toLowerCase().replace(/\s+/g, '_');
  const destino = String(args?.destino || '').toLowerCase().replace(/\s+/g, '_');
  const modalidad = (args?.modalidad === 'privado' ? 'privado' : 'compartido') as
    | 'compartido'
    | 'privado';
  // Por defecto SUV (lo más común en una llamada). Si especifican vehículo, lo respetamos.
  const vehicle = (['suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus'].includes(
    String(args?.vehiculo || '').toLowerCase().replace(/\s+/g, '_'),
  )
    ? String(args?.vehiculo || '').toLowerCase().replace(/\s+/g, '_')
    : 'suv') as keyof typeof FARES.vehicles;

  if (!origen || !destino) {
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

  // Tarifa COMPARTIDA por persona desde FARES (fuente canónica única; getFare
  // normaliza nombres y cubre ambas direcciones). Mismo número que el sitio.
  const sharedPerSeat = getFare(origen, destino);
  if (sharedPerSeat == null) {
    return {
      ok: false,
      error: 'route_not_listed',
      message: `Ruta ${origen} ↔ ${destino} no está en el catálogo.`,
      spoken_suggestion:
        `Esa ruta entre ${origen.replace(/_/g, ' ')} y ${destino.replace(/_/g, ' ')} ` +
        'no la tengo a mano. ¿Quieres que te envíe opciones por mensaje al mismo número?',
    };
  }

  // Base según modalidad: compartido = por asiento; privado = vehículo completo
  // (compartido × multiplicador del vehículo, vía getPrivateFare).
  const basePrice =
    modalidad === 'compartido'
      ? sharedPerSeat
      : getPrivateFare(sharedPerSeat, vehicle);

  // Recargos dinámicos (horario/día/feriado) — misma lógica que el buscador web.
  // originSurcharge=0: el +$5 por zona de Quito se aplica al RESERVAR, no en la
  // cotización telefónica. clientSegment 'public' (retail).
  const dyn = applyDynamicPricing({
    basePrice,
    mode: modalidad,
    dateTime,
    clientSegment: 'public',
    originSurcharge: 0,
  });
  const finalPrice = dyn.adjustedPrice;

  const spokenSurcharges =
    dyn.timeSurchargeRate > 0
      ? `más ${numberToSpanish(Math.round(dyn.timeSurchargeRate * 100))} por ciento por horario de mayor demanda`
      : '';
  const spokenUnit = modalidad === 'compartido' ? 'por asiento' : 'por el viaje completo';

  toolsLogger.log(
    `[tool:get_quote_phone] ${origen}↔${destino} ${modalidad} ${vehicle} → ` +
      `$${finalPrice} (${priceToSpanish(finalPrice)}) [FARES]`,
  );

  return {
    ok: true,
    origen,
    destino,
    modalidad,
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
