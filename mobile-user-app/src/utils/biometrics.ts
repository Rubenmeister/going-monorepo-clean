/**
 * Wrapper seguro para expo-local-authentication.
 * Face ID, Touch ID o huella dactilar según el dispositivo.
 */
let LA: typeof import('expo-local-authentication') | null = null;
try { LA = require('expo-local-authentication'); } catch {}

export const BIOMETRIC_STORAGE_KEY = 'going_biometric_enabled';

/** Verifica si el dispositivo soporta biometría */
export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!LA) return false;
  const compatible = await LA.hasHardwareAsync();
  const enrolled   = await LA.isEnrolledAsync();
  return compatible && enrolled;
};

/** Retorna el tipo: 'faceid' | 'fingerprint' | 'iris' | null */
export const getBiometricType = async (): Promise<'faceid' | 'fingerprint' | null> => {
  if (!LA) return null;
  const types = await LA.supportedAuthenticationTypesAsync();
  if (types.includes(LA.AuthenticationType.FACIAL_RECOGNITION)) return 'faceid';
  if (types.includes(LA.AuthenticationType.FINGERPRINT))         return 'fingerprint';
  return null;
};

/** Solicita autenticación biométrica. Retorna true si fue exitosa */
export const authenticateWithBiometrics = async (reason: string): Promise<boolean> => {
  if (!LA) return false;
  try {
    const result = await LA.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Usar contraseña',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
};
