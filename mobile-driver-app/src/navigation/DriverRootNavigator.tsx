import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { useDriverStore } from '@store/useDriverStore';
import { DriverAuthNavigator } from './DriverAuthNavigator';
import { DriverMainNavigator } from './DriverMainNavigator';
import {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
  setupNotificationListeners,
} from '@services/notifications';

export function DriverRootNavigator() {
  const { token, isLoading, loadToken } = useDriverStore();
  const navRef = useRef<NavigationContainerRef<any>>(null);
  const bootstrapped = useRef(false);

  // Restore persisted token from AsyncStorage on app launch — solo una vez
  // aunque StrictMode o un re-mount intenten dispararlo dos veces.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    loadToken();
  }, []);

  // Push notifications: registrar token al login + setup listener para que tap
  // de notificación lleve al RideRequestScreen. Solo corre cuando hay token
  // (driver autenticado), y limpia listeners al logout.
  useEffect(() => {
    if (!token) return;
    let cleanup: (() => void) | null = null;
    (async () => {
      const expoPushToken = await registerForPushNotificationsAsync();
      if (expoPushToken) await sendTokenToBackend(expoPushToken);
      cleanup = setupNotificationListeners((rideId, data) => {
        // Tap en notificación push → abrir RideRequestScreen con los datos
        navRef.current?.navigate('RideRequest', {
          rideId,
          passengerName: data?.passengerName ?? 'Pasajero',
          origin: data?.origin ?? '',
          destination: data?.destination ?? '',
          amount: data?.amount,
          paymentMethod: data?.paymentMethod ?? 'card',
        });
      });
    })();
    return () => {
      if (cleanup) cleanup();
    };
  }, [token]);

  // Show spinner while checking stored token
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF4C41" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navRef}>
      {token ? <DriverMainNavigator /> : <DriverAuthNavigator />}
    </NavigationContainer>
  );
}
