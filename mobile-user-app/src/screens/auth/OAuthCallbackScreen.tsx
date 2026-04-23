import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/AuthNavigator';
import { useAuthStore } from '@store/useAuthStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'OAuthCallback'>;

export function OAuthCallbackScreen() {
  const route = useRoute();
  const navigation = useNavigation<Nav>();
  const { loginWithOAuthToken } = useAuthStore();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // The token arrives as a route param (React Navigation parses deep link query params)
    const params = route.params as { token?: string; isNewUser?: string } | undefined;
    const token = params?.token;

    if (!token) {
      // No token — go back to login
      navigation.replace('Login');
      return;
    }

    // Save token and fetch user profile
    loginWithOAuthToken(token).catch(() => {
      navigation.replace('Login');
    });
    // Once loginWithOAuthToken sets token in the store,
    // RootNavigator will automatically swap to MainNavigator
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ff4c41" />
      <Text style={styles.text}>Iniciando sesión…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
});
