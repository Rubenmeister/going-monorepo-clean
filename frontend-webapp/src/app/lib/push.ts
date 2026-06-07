'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import app from './firebase';
import { authFetch } from '@/lib/providers/auth-client';

const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

export type EnablePushResult =
  | { ok: true }
  | { ok: false; reason: 'no-config' | 'unsupported' | 'denied' | 'no-token' | 'register-failed' | 'error' };

/** ¿El navegador soporta push (y está configurado)? */
export async function isPushAvailable(): Promise<boolean> {
  if (!VAPID) return false;
  try {
    return (await isSupported()) && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  } catch {
    return false;
  }
}

/**
 * Pide permiso de notificaciones, obtiene el token FCM y lo registra en
 * notifications-service para que los avisos (recordatorios de viaje, etc.)
 * lleguen a este navegador.
 */
export async function enablePush(): Promise<EnablePushResult> {
  if (!VAPID) return { ok: false, reason: 'no-config' };
  if (!(await isPushAvailable())) return { ok: false, reason: 'unsupported' };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID, serviceWorkerRegistration: reg });
    if (!token) return { ok: false, reason: 'no-token' };

    const res = await authFetch(`${API_URL}/notifications/device-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: 'web' }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: 'register-failed' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
