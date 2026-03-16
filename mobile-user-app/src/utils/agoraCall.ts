/**
 * Going — Agora In-App Call Manager
 *
 * Lógica:
 * 1. Chequea calidad de red (ping al API < 300ms)
 * 2. Si hay buena señal → llama por Agora (VoIP gratis)
 * 3. Si no hay señal → fallback a Twilio proxy number (PSTN)
 *
 * Instalación:
 *   npx expo install react-native-agora
 *   (requiere development build — no funciona en Expo Go)
 *
 * Variables de entorno: ninguna en mobile — el token lo genera el backend.
 */

import { Linking, Alert } from 'react-native';
import { api } from '../services/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CallSession {
  type:    'agora' | 'pstn';
  token?:  string;
  appId?:  string;
  channel?: string;
  uid?:    number;
  proxyNumber?: string;
}

export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'in_call'
  | 'ended'
  | 'error';

// ─── Chequeo de red ───────────────────────────────────────────────────────────

async function hasGoodConnection(): Promise<boolean> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    await fetch(
      'https://api-gateway-780842550857.us-central1.run.app/health',
      { method: 'HEAD', signal: controller.signal },
    );
    clearTimeout(timeout);
    const latency = Date.now() - start;
    return latency < 300; // < 300ms = buena conexión para VoIP
  } catch {
    return false;
  }
}

// ─── Obtener token Agora del backend ─────────────────────────────────────────

async function fetchAgoraToken(rideId: string): Promise<{
  token: string; appId: string; channel: string; uid: number; enabled: boolean;
} | null> {
  try {
    const { data } = await api.get(`/rides/${rideId}/call-token`);
    return data;
  } catch {
    return null;
  }
}

// ─── Obtener número proxy Twilio (fallback) ───────────────────────────────────

async function fetchProxyNumber(rideId: string): Promise<string | null> {
  try {
    const { data } = await api.get(`/rides/${rideId}/proxy-number`);
    return data.proxyNumber || null;
  } catch {
    return null;
  }
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Resuelve qué canal usar para la llamada y retorna la sesión configurada.
 * La app debe usar esta sesión para mostrar el InCallOverlay (Agora)
 * o abrir el marcador telefónico (PSTN).
 */
export async function resolveCallSession(rideId: string): Promise<CallSession | null> {
  // 1. Verificar conexión
  const goodConnection = await hasGoodConnection();

  if (goodConnection) {
    // 2. Intentar Agora
    const agora = await fetchAgoraToken(rideId);
    if (agora?.enabled && agora.token && agora.appId) {
      return {
        type:    'agora',
        token:   agora.token,
        appId:   agora.appId,
        channel: agora.channel,
        uid:     agora.uid,
      };
    }
  }

  // 3. Fallback: Twilio proxy / número real
  const proxyNumber = await fetchProxyNumber(rideId);
  if (proxyNumber) {
    return { type: 'pstn', proxyNumber };
  }

  return null;
}

/**
 * Ejecuta la llamada PSTN directamente (abre el marcador del teléfono).
 */
export function startPSTNCall(proxyNumber: string): void {
  Linking.openURL(`tel:${proxyNumber}`).catch(() => {
    Alert.alert('Error', 'No se pudo abrir el marcador telefónico.');
  });
}
