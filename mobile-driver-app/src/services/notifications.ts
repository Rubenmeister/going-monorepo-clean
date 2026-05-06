/**
 * notifications — Expo Push Notifications para mobile-driver-app.
 *
 * Flujo:
 *  1. registerForPushNotificationsAsync() pide permisos y obtiene Expo push token
 *  2. sendTokenToBackend() lo envía a transport-service para que asocie con
 *     el driverId actual; sirve para que cuando hay un match, el backend envíe
 *     push notification al conductor
 *  3. setupNotificationListeners() escucha:
 *     - foreground: notificación llega → muestra Alert nativo + actualiza pendingTrip
 *     - tap: usuario abre la notificación → navega a RideRequestScreen con rideId
 *
 * Por qué Expo Push API y no Firebase Admin SDK directo:
 *  - No requiere FCM service account keys ni configuración Firebase compleja
 *  - Expo maneja la entrega para iOS (APNs) y Android (FCM) transparentemente
 *  - Backend solo hace POST a https://exp.host/--/api/v2/push/send
 *  - Mismo flujo funciona en preview/production sin credenciales adicionales
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.goingec.com';

// Configura cómo se manejan las notificaciones en foreground (mostrar/silenciar/etc)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Pide permisos de notificación (iOS prompt nativo) y obtiene el Expo push token.
 * Retorna null si el dispositivo es simulador (no soporta push) o el usuario denegó.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // Simuladores no reciben push reales — silencioso, no error.
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('[notifications] Permission denied');
    return null;
  }

  // Android requires a channel — sin esto las push no aparecen en versiones >= 8
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('ride-requests', {
      name: 'Solicitudes de viaje',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFCD00',
      sound: 'default',
    });
  }

  // EAS project ID — del app.json extra.eas.projectId
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('[notifications] EAS projectId missing in app.json');
    return null;
  }

  try {
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    return token;
  } catch (e) {
    console.warn('[notifications] getExpoPushTokenAsync failed:', e);
    return null;
  }
}

/**
 * Envía el Expo push token al backend para asociarlo al driver actual.
 * Idempotente: si ya está registrado, el backend lo actualiza ($set).
 * Best-effort: si falla, no bloquea la app — el conductor sigue funcionando
 * con polling como fallback. Reintenta en el siguiente login.
 */
export async function sendTokenToBackend(expoPushToken: string): Promise<void> {
  try {
    const authToken = await AsyncStorage.getItem('driver_token');
    if (!authToken) return;
    await axios.post(
      `${API_BASE}/transport/drivers/me/push-token`,
      { expoPushToken, platform: Platform.OS },
      { headers: { Authorization: `Bearer ${authToken}` }, timeout: 10000 },
    );
    await AsyncStorage.setItem('expo_push_token', expoPushToken);
  } catch (e: any) {
    console.warn(
      '[notifications] register token failed:',
      e?.response?.data?.message ?? e?.message,
    );
  }
}

/**
 * Setup listeners — debe llamarse UNA VEZ desde App.tsx tras login.
 *
 * onRideRequest: callback cuando el usuario toca la notificación de un viaje.
 * Recibe el rideId del payload `data.rideId` y debe navegar a RideRequestScreen.
 *
 * Retorna función de cleanup para llamar en unmount.
 */
export function setupNotificationListeners(
  onRideRequest: (rideId: string, rideData?: any) => void,
): () => void {
  // Foreground: notificación llega mientras app está abierta — el handler de
  // arriba ya muestra el banner. Aquí no necesitamos action adicional, el
  // pollPendingTrips del store actualizará pendingTrip en máximo 5s.
  const sub1 = Notifications.addNotificationReceivedListener((notif) => {
    const data = notif.request?.content?.data ?? {};
    if (data?.type === 'ride_match' && data?.rideId) {
      // Backend ya marcó el ride en /rides/pending — el polling lo atrapará.
      // Aquí solo logeamos para debugging.
      console.log('[notifications] ride_match received in foreground:', data.rideId);
    }
  });

  // User tapped notification (background o terminated) — navegar
  const sub2 = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data ?? {};
    if (data?.type === 'ride_match' && data?.rideId) {
      onRideRequest(String(data.rideId), data);
    }
  });

  return () => {
    sub1.remove();
    sub2.remove();
  };
}
