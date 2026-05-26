/**
 * Tests del validateTwilioSignature — verifica que el algoritmo HMAC-SHA1
 * coincide con la spec oficial Twilio + que las edge cases fail-cerrado.
 */
import { createHmac } from 'crypto';
import { validateTwilioSignature } from './twilio-signature';

/** Helper: genera una firma válida según la spec de Twilio para input dado. */
function sign(url: string, params: Record<string, string>, authToken: string): string {
  const sortedKeys = Object.keys(params).sort();
  let signatureString = url;
  for (const k of sortedKeys) {
    signatureString += k + (params[k] ?? '');
  }
  return createHmac('sha1', authToken).update(signatureString).digest('base64');
}

describe('validateTwilioSignature', () => {
  const url = 'https://voice-call-service-foo.run.app/twilio/voice-webhook';
  const authToken = 'test-auth-token-do-not-use-in-prod';

  it('acepta una firma válida calculada localmente', () => {
    const params = { CallSid: 'CAabc123', From: '+593987654321', To: '+593240188841' };
    const signature = sign(url, params, authToken);
    expect(validateTwilioSignature({ url, params, signature, authToken })).toBe(true);
  });

  it('rechaza si la firma no matchea (params modificados)', () => {
    const paramsOrig = { CallSid: 'CAabc123', From: '+593987654321' };
    const signature = sign(url, paramsOrig, authToken);
    // Atacante cambia From — la firma original ya no aplica
    const paramsTampered = { CallSid: 'CAabc123', From: '+593000000000' };
    expect(validateTwilioSignature({ url, params: paramsTampered, signature, authToken })).toBe(false);
  });

  it('rechaza si la firma no matchea (URL distinta)', () => {
    const params = { CallSid: 'CAabc123' };
    const signature = sign(url, params, authToken);
    const otherUrl = 'https://voice-call-service-foo.run.app/twilio/other-endpoint';
    expect(validateTwilioSignature({ url: otherUrl, params, signature, authToken })).toBe(false);
  });

  it('rechaza si authToken difiere (intento de spoof con token incorrecto)', () => {
    const params = { CallSid: 'CAabc123' };
    const signature = sign(url, params, 'attacker-guessed-token');
    expect(validateTwilioSignature({ url, params, signature, authToken })).toBe(false);
  });

  it('rechaza si signature undefined', () => {
    expect(
      validateTwilioSignature({ url, params: {}, signature: undefined, authToken }),
    ).toBe(false);
  });

  it('rechaza si signature vacía', () => {
    expect(validateTwilioSignature({ url, params: {}, signature: '', authToken })).toBe(false);
  });

  it('dev fallback: si authToken vacío retorna true (solo dev)', () => {
    expect(
      validateTwilioSignature({ url, params: { x: 'y' }, signature: 'bogus', authToken: '' }),
    ).toBe(true);
  });

  it('ordena params alfabéticamente — orden de declaración no afecta', () => {
    const paramsA = { CallSid: 'A', From: 'B', To: 'C' };
    const paramsB = { To: 'C', CallSid: 'A', From: 'B' };
    const signatureA = sign(url, paramsA, authToken);
    expect(validateTwilioSignature({ url, params: paramsB, signature: signatureA, authToken })).toBe(true);
  });

  it('handles params con caracteres especiales (e.g. + en E.164)', () => {
    const params = { CallSid: 'CAxyz', From: '+593 98 765 4321', To: '+593-2-401-8841' };
    const signature = sign(url, params, authToken);
    expect(validateTwilioSignature({ url, params, signature, authToken })).toBe(true);
  });

  it('rechaza si signature es de otra request (replay con params nuevos)', () => {
    const params1 = { CallSid: 'CA111' };
    const signature1 = sign(url, params1, authToken);
    const params2 = { CallSid: 'CA222' }; // nueva llamada
    expect(validateTwilioSignature({ url, params: params2, signature: signature1, authToken })).toBe(false);
  });
});
