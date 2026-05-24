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

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lupe" language="es-MX">Aló, Going. Un momento por favor.</Say>
  <Connect>
    <Stream url="${url}">
      <Parameter name="callId" value="${cid}"/>
      <Parameter name="runId" value="${rid}"/>
    </Stream>
  </Connect>
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
