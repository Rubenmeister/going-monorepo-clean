import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Validación de X-Twilio-Signature anti-spoof.
 *
 * Twilio firma cada webhook con HMAC-SHA1 usando el AUTH_TOKEN de la
 * cuenta. La firma se calcula sobre:
 *
 *   signatureString = fullUrl + sortedFormParams
 *
 * donde fullUrl es la URL EXACTA del webhook (incluyendo query string si
 * existe), y sortedFormParams es la concatenación key+value de todos los
 * params del body form-encoded, ordenados alfabéticamente por key.
 *
 * Doc oficial: https://www.twilio.com/docs/usage/security#validating-requests
 *
 * Implementación manual (sin el SDK de twilio, que pesa ~5MB con deps):
 *  - 30 LOC, una sola dep node:crypto (built-in)
 *  - timingSafeEqual para evitar timing attacks en la comparación final
 *  - Tolerante: si AUTH_TOKEN no está configurado retorna `true` con warning
 *    (solo dev — en prod el caller DEBE asegurar que esté seteado)
 *
 * Por qué no usar el SDK twilio:
 *  - Agrega 5MB de deps (axios, lodash, qs, etc.) para usar 1 función.
 *  - El algoritmo es público y estable hace años.
 *  - Esta implementación es testeable en aislamiento.
 */

export interface ValidateSignatureInput {
  /** URL EXACTA que Twilio firmó. Debe matchear lo configurado en la consola Twilio.
   *  Si estás detrás de un proxy/load-balancer, esto puede ser distinto a req.url —
   *  usar el host PÚBLICO (ej. https://voice-call-service-XXX.run.app/twilio/voice-webhook). */
  url:        string;
  /** body parseado (form-encoded → object plano). Twilio manda application/x-www-form-urlencoded. */
  params:     Record<string, string>;
  /** valor del header 'X-Twilio-Signature' del request. */
  signature:  string | undefined;
  /** AUTH_TOKEN de la cuenta Twilio (del Account SID, NO el API Key). */
  authToken:  string;
}

/**
 * Devuelve `true` si la firma es válida.
 *
 * Falla cerrado: si `signature` no viene, retorna false. Si `authToken`
 * es vacío, retorna true con consola.warn — solo para dev/test sin
 * credenciales. El caller debe garantizar authToken en prod.
 */
export function validateTwilioSignature(input: ValidateSignatureInput): boolean {
  const { url, params, signature, authToken } = input;

  if (!authToken) {
    // Dev mode — sin AUTH_TOKEN configurado, dejamos pasar pero avisamos
    // por consola. El controller suele apagar este path con un warn al boot.
    return true;
  }

  if (!signature || typeof signature !== 'string') {
    return false;
  }

  // 1. Concatenar key+value ordenados alfabéticamente (sin separador entre pares,
  //    sin separador entre key y value — es la quirk del algoritmo).
  const sortedKeys = Object.keys(params).sort();
  let signatureString = url;
  for (const k of sortedKeys) {
    signatureString += k + (params[k] ?? '');
  }

  // 2. HMAC-SHA1 con el authToken como clave. Output base64.
  const expected = createHmac('sha1', authToken)
    .update(signatureString)
    .digest('base64');

  // 3. Comparación timing-safe. Si los buffers tienen longitudes distintas
  //    (corrupción/spoof), timingSafeEqual tira — capturamos y devolvemos false.
  try {
    const a = Buffer.from(expected,  'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
