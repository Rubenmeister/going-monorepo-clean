import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@services/api';

const GOING_RED    = '#ff4c41';
const GOING_YELLOW = '#FFCD00';
const BLACK        = '#1a1a1a';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Ingresa tu correo electrónico');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Ingresa un correo válido');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch {
      // Mostrar éxito igual para evitar enumeración de usuarios
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.successBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={48} color={GOING_RED} />
          </View>
          <Text style={styles.successTitle}>Revisa tu correo</Text>
          <Text style={styles.successText}>
            Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </Text>
          <Text style={styles.successHint}>Revisa también tu carpeta de spam.</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={BLACK} />
      </TouchableOpacity>

      <View style={styles.header}>
        {/* Logo Going — rojo + letras negras (fondo blanco) */}
        <Image
          source={require('../../../assets/going-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.iconCircle}>
          <Ionicons name="lock-open-outline" size={40} color={GOING_RED} />
        </View>
        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Enviar enlace</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center',
  },
  back: { position: 'absolute', top: 50, left: 20, padding: 8 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${GOING_RED}15`,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  logo: { width: 150, height: 58, marginBottom: 16 },
  header: { alignItems: 'center', marginBottom: 36 },
  title: {
    fontWeight: '800', fontSize: 22, color: BLACK,
    marginTop: 14, marginBottom: 10, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: '#888', textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 10,
  },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 16,
    backgroundColor: '#F9FAFB', fontSize: 15, color: '#111827',
  },
  button: {
    backgroundColor: GOING_RED, padding: 15, borderRadius: 14,
    alignItems: 'center', marginBottom: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontWeight: '700', color: '#fff', fontSize: 16 },
  link: { color: '#888', textAlign: 'center', fontSize: 14 },
  successBox: { alignItems: 'center', marginBottom: 40, padding: 20 },
  successTitle: {
    fontWeight: '800', fontSize: 22, color: BLACK,
    marginTop: 16, marginBottom: 12,
  },
  successText: {
    fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22,
  },
  successHint: {
    fontSize: 12, color: '#aaa', marginTop: 10, textAlign: 'center',
  },
});
