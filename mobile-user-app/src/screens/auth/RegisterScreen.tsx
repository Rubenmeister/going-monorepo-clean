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
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/useAuthStore';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRegister = async () => {
    const { firstName, lastName, email, password, phone } = form;
    if (!firstName || !lastName || !email || !password || !phone) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    await register(form);
  };

  if (error) Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Únete a Going hoy</Text>
        </View>

        <View style={styles.form}>
          {[
            {
              label: 'Nombre',
              key: 'firstName',
              placeholder: 'Juan',
              type: 'default',
            },
            {
              label: 'Apellido',
              key: 'lastName',
              placeholder: 'Pérez',
              type: 'default',
            },
            {
              label: 'Correo',
              key: 'email',
              placeholder: 'correo@ejemplo.com',
              type: 'email-address',
            },
            {
              label: 'Teléfono',
              key: 'phone',
              placeholder: '+593 999 999 999',
              type: 'phone-pad',
            },
            {
              label: 'Contraseña',
              key: 'password',
              placeholder: '••••••••',
              type: 'default',
              secure: true,
            },
          ].map(({ label, key, placeholder, type, secure }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={form[key as keyof typeof form]}
                onChangeText={update(key as keyof typeof form)}
                keyboardType={type as any}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
                secureTextEntry={secure}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0033A0" />
            ) : (
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginTextBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0033A0' },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFCD00' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
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
  button: {
    backgroundColor: '#FFCD00',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#0033A0', fontSize: 16, fontWeight: '800' },
  loginLink: { alignItems: 'center', marginTop: 16 },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginTextBold: { color: '#0033A0', fontWeight: '700' },
});
