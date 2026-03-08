import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '@store/useDriverStore';

export function DriverLoginScreen() {
  const { login, isLoading, error, clearError } = useDriverStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (error) Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>GOING</Text>
          </View>
          <Text style={styles.driverBadge}>
            <Ionicons name="car" size={14} color="#FFCD00" /> CONDUCTOR
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Acceso conductores</Text>

          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="conductor@going.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, isLoading && { opacity: 0.7 }]}
            onPress={() => login(email, password)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0033A0" />
            ) : (
              <Text style={styles.btnText}>Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001F6B' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    backgroundColor: '#FFCD00',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#001F6B',
    letterSpacing: 4,
  },
  driverBadge: {
    color: '#FFCD00',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  form: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  btn: {
    backgroundColor: '#FFCD00',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#001F6B', fontSize: 16, fontWeight: '900' },
});
