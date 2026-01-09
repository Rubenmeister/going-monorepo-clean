import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase message type for better typing
interface FirebaseRemoteMessage {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessagingModule = any;

// Note: This hook requires @react-native-firebase/messaging to be installed
// For now, we'll use a mock/stub approach that can be replaced when Firebase is configured

const DEVICE_TOKEN_KEY = '@going/device_token';
const API_URL = process.env.API_URL || 'http://localhost:3000';

export interface PushNotificationPayload {
  notificationId?: string;
  type?: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

export interface UsePushNotificationsResult {
  /** The FCM device token */
  token: string | null;
  /** Whether push notifications are enabled */
  hasPermission: boolean;
  /** Whether the hook is still initializing */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Request push notification permission */
  requestPermission: () => Promise<boolean>;
  /** Get the current device token */
  refreshToken: () => Promise<string | null>;
}

/**
 * Hook for managing push notifications in React Native.
 * 
 * Usage:
 * ```tsx
 * function App() {
 *   const { hasPermission, requestPermission, token } = usePushNotifications(userId);
 *   
 *   useEffect(() => {
 *     if (!hasPermission) {
 *       requestPermission();
 *     }
 *   }, [hasPermission]);
 * }
 * ```
 */
export function usePushNotifications(userId?: string): UsePushNotificationsResult {
  const [token, setToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check permission status on mount
  useEffect(() => {
    checkPermission();
  }, []);

  // Get token when permission is granted and user is logged in
  useEffect(() => {
    if (hasPermission && userId) {
      getToken();
    }
  }, [hasPermission, userId]);

  // Set up notification listeners
  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeTokenRefresh: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        // Dynamic import to avoid crash if firebase is not installed
        const messaging = await getMessaging();
        if (!messaging) return;

        // Handle foreground messages
        unsubscribeForeground = messaging().onMessage(async (remoteMessage: FirebaseRemoteMessage) => {
          console.log('[Push] Foreground notification:', remoteMessage);
          // You can show a local notification or custom UI here
          handleNotification(remoteMessage);
        });

        // Handle token refresh
        unsubscribeTokenRefresh = messaging().onTokenRefresh((newToken: string) => {
          console.log('[Push] Token refreshed');
          handleTokenRefresh(newToken);
        });

        // Handle notification when app is opened from background
        messaging().onNotificationOpenedApp((remoteMessage: FirebaseRemoteMessage) => {
          console.log('[Push] App opened from background:', remoteMessage);
          handleNotificationOpen(remoteMessage);
        });

        // Check if app was opened from a quit state
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          console.log('[Push] App opened from quit state:', initialNotification);
          handleNotificationOpen(initialNotification);
        }
      } catch {
        console.log('[Push] Firebase not configured yet');
      }
    };

    setupListeners();

    return () => {
      unsubscribeForeground?.();
      unsubscribeTokenRefresh?.();
    };
  }, [userId]);

  const checkPermission = async () => {
    try {
      const messaging = await getMessaging();
      if (!messaging) {
        setIsLoading(false);
        return;
      }

      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === 1 || // AUTHORIZED
        authStatus === 2;   // PROVISIONAL

      setHasPermission(enabled);
    } catch (err) {
      console.log('[Push] Permission check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const messaging = await getMessaging();
      if (!messaging) {
        // Firebase not installed, show instructions
        Alert.alert(
          'Push Notifications',
          'Push notifications are not configured yet. Please contact support.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // iOS: Request permission through Firebase
      // Android 13+: Request POST_NOTIFICATIONS permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === 1 || // AUTHORIZED
        authStatus === 2;   // PROVISIONAL

      setHasPermission(enabled);

      if (enabled) {
        await getToken();
      }

      return enabled;
    } catch (err) {
      setError(err as Error);
      console.error('[Push] Permission request failed:', err);
      return false;
    }
  }, [userId]);

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const messaging = await getMessaging();
      if (!messaging) return null;

      const fcmToken = await messaging().getToken();

      if (fcmToken) {
        const storedToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);

        if (storedToken !== fcmToken) {
          // Token changed, register with backend
          await registerToken(fcmToken);
          await AsyncStorage.setItem(DEVICE_TOKEN_KEY, fcmToken);
        }

        setToken(fcmToken);
        return fcmToken;
      }

      return null;
    } catch (err) {
      setError(err as Error);
      console.error('[Push] Failed to get FCM token:', err);
      return null;
    }
  }, [userId]);

  const handleTokenRefresh = async (newToken: string) => {
    await registerToken(newToken);
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const registerToken = async (fcmToken: string) => {
    if (!userId) {
      console.log('[Push] No userId, skipping token registration');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/device-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          token: fcmToken,
          platform: Platform.OS.toUpperCase(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register token: ${response.status}`);
      }

      console.log('[Push] Device token registered successfully');
    } catch (err) {
      console.error('[Push] Failed to register device token:', err);
      // Don't throw - failing to register shouldn't break the app
    }
  };

  const handleNotification = (remoteMessage: FirebaseRemoteMessage) => {
    // Override this to handle foreground notifications
    // Default: show an alert
    const notification = remoteMessage.notification;
    if (notification) {
      Alert.alert(
        notification.title || 'Notification',
        notification.body || ''
      );
    }
  };

  const handleNotificationOpen = (remoteMessage: FirebaseRemoteMessage) => {
    // Override this to handle notification taps
    // Navigate to appropriate screen based on data
    const data = remoteMessage.data;
    if (data?.clickAction) {
      console.log('[Push] Navigate to:', data.clickAction);
      // Navigation logic here
    }
  };

  return {
    token,
    hasPermission,
    isLoading,
    error,
    requestPermission,
    refreshToken: getToken,
  };
}

/**
 * Dynamic import of Firebase Messaging
 * Returns null if not installed
 */
async function getMessaging(): Promise<MessagingModule | null> {
  try {
    const firebaseMessaging = await import('@react-native-firebase/messaging');
    return firebaseMessaging.default;
  } catch {
    // Firebase not installed
    return null;
  }
}

export default usePushNotifications;
