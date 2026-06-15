/**
 * Builders de respuestas TwiML XML.
 *
 * TwiML es el "lenguaje" que Twilio interpreta para decidir qué hacer con
 * una llamada. Cada respuesta es XML con verbs anidados:
 *  - <Say> — texto a voz (built-in TTS)
 *  - <Play> — audio pre-grabado
 *  - <Connect><Stream> — bridge bidireccional audio ↔ nuestro WS
 *  - <Hangup/> — cortar la llamada
 *
 * Doc: https://www.twilio.com/docs/voice/twiml
 *
 * Hardcoded XML aquí (sin usar SDK twiml builder) porque es trivial y nos
 * evita la dep al SDK completo. Cuando crezca complejidad, migrar a
 * `twilio` npm package builder.
 */

interface AnswerTwimlInput {
  /** Twilio CallSid — útil para correlación end-to-end con logs */
  callId:         string;
  /** wss:// URL pública del media stream bidi (donde Twilio conecta) */
  mediaStreamUrl: string;
  /** runId interno para correlación con cerebro events */
  runId:          string;
  /** E.164 del caller — lo pasamos como custom param del Stream para que el
   *  gateway lo tenga al recibir el 'start' event sin necesidad de mantener
   *  state extra fuera de la WS. Permite que el bridge → handoff lo use. */
  from:           string;
}

/**
 * Respuesta TwiML típica: saludo + conectar al media stream WS.
 *
 * El <Say> inicial es solo el "Aló" mientras el WS se conecta — apenas
 * el media stream esté listo, el AI toma el control y responde naturalmente.
 *
 * <Parameter> dentro de <Stream> permite pasar metadata al WS handler
 * (en este caso, callId y runId para que el gateway los use en logs/state).
 */
export function buildAnswerTwiml(input: AnswerTwimlInput): string {
  // Escape XML attribute values básico — los inputs vienen de Twilio /
  // nuestro service, ambos confiables, pero por las dudas.
  const escapeAttr = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const url   = escapeAttr(input.mediaStreamUrl);
  const cid   = escapeAttr(input.callId);
  const rid   = escapeAttr(input.runId);
  const from  = escapeAttr(input.from);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lupe" language="es-MX">Bienvenido a Going App. ¿En qué te puedo servir?</Say>
  <Connect>
    <Stream url="${url}">
      <Parameter name="callId" value="${cid}"/>
      <Parameter name="runId" value="${rid}"/>
      <Parameter name="from" value="${from}"/>
    </Stream>
  </Connect>
</Response>`;
}

interface HandoffTwimlInput {
  /** E.164 del operador (HANDOFF_OPERATOR_PHONE). Si vacío, modo callback. */
  operatorPhone: string;
  /** Frase opcional a decir antes de transferir/colgar. */
  spokenIntro?: string;
}

/**
 * TwiML para handoff:
 *  - Si tenemos operatorPhone: <Say> + <Dial> al operador (transferencia PSTN).
 *  - Si NO: <Say> "te vamos a llamar" + <Hangup/> (modo callback async — el
 *    operador notificado por Telegram devuelve la llamada manualmente).
 */
export function buildHandoffTwiml(input: HandoffTwimlInput): string {
  const intro = (input.spokenIntro ?? 'Te paso con un agente del equipo Going App. No cuelgues.')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (input.operatorPhone) {
    const phone = input.operatorPhone.replace(/[^+0-9]/g, ''); // sanity
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lupe" language="es-MX">${intro}</Say>
  <Dial timeout="20" answerOnBridge="true">${phone}</Dial>
  <Say voice="Polly.Lupe" language="es-MX">No pudimos conectarte ahora. Te vamos a llamar en breve. Gracias por llamar a Going App.</Say>
  <Hangup/>
</Response>`;
  }

  // Modo callback async: avisamos y colgamos. El handoff notifier ya alertó
  // al operador via Telegram con info contextual + número del caller.
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lupe" language="es-MX">Listo. Un agente del equipo Going App te va a llamar en pocos minutos. Gracias por llamar.</Say>
  <Hangup/>
</Response>`;
}

/**
 * Respuesta TwiML para rechazar la llamada (caller bloqueado o request
 * inválido). Mensaje al usuario + cuelga.
 */
export function buildBlockedTwiml(reason: string): string {
  const safeReason = reason
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lupe" language="es-MX">${safeReason}</Say>
  <Hangup/>
</Response>`;
}
