/**
 * Going — Agora In-App Call Manager (Driver App)
 * 1. Chequea red (ping < 300ms)  →  Agora VoIP
 * 2. Sin señal  →  fallback Twilio PSTN
 *
 * Instalación: npx expo install react-native-agora
 */

import { Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API = process.env.EXPO_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

export interface CallSession {
  type:     'agora' | 'pstn';
  token?:   string;
  appId?:   string;
  channel?: string;
  uid?:     number;
  proxyNumber?: string;
}

export type CallStatus = 'idle' | 'connecting' | 'in_call' | 'ended' | 'error';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('driver_token');
  return { Authorization: 'Bearer ' + token };
}

async function hasGoodConnection(): Promise<boolean> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    await fetch(API + '/health', { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return (Date.now() - start) < 300;
  } catch {
    return false;
  }
}

async function fetchAgoraToken(rideId: string) {
  try {
    const headers = await getAuthHeaders();
    const { data } = await axios.get(API + '/rides/' + rideId + '/call-token', { headers });
    return data;
  } catch { return null; }
}

async function fetchProxyNumber(rideId: string): Promise<string | null> {
  try {
    const headers = await getAuthHeaders();
    const { data } = await axios.get(API + '/rides/' + rideId + '/proxy-number', { headers });
    return data.proxyNumber || null;
  } catch { return null; }
}

export async function resolveCallSession(rideId: string): Promise<CallSession | null> {
  const goodConnection = await hasGoodConnection();
  if (goodConnection) {
    const agora = await fetchAgoraToken(rideId);
    if (agora?.enabled && agora.token && agora.appId) {
      return { type: 'agora', token: agora.token, appId: agora.appId, channel: agora.channel, uid: agora.uid };
    }
  }
  const proxyNumber = await fetchProxyNumber(rideId);
  if (proxyNumber) return { type: 'pstn', proxyNumber };
  return null;
}

export function startPSTNCall(proxyNumber: string): void {
  Linking.openURL('tel:' + proxyNumber).catch(() => {
    Alert.alert('Error', 'No se pudo abrir el marcador telefónico.');
  });
}
