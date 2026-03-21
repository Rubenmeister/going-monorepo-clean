import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/useAuthStore';
import type { AuthStackParamList } from '@navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const GOING_RED    = '#ff4c41';
const GOING_YELLOW = '#FFCD00';

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
  const [showPwd, setShowPwd] = useState(false);

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (error) Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
  }, [error]);

  const handleRegister = async () => {
    const { firstName, lastName, email, password, phone } = form;
    if (!firstName || !lastName || !email || !password || !phone) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    await register(form);
  };

  const FIELDS: {
    label: string;
    key: keyof typeof form;
    placeholder: string;
    type?: any;
    secure?: boolean;
    icon: any;
  }[] = [
    { label: 'Nombre',     key: 'firstName', placeholder: 'Juan',               icon: 'person-outline' },
    { label: 'Apellido',   key: 'lastName',  placeholder: 'Pérez',              icon: 'person-outline' },
    { label: 'Correo',     key: 'email',     placeholder: 'correo@ejemplo.com', icon: 'mail-outline',        type: 'email-address' },
    { label: 'Teléfono',   key: 'phone',     placeholder: '+593 999 999 999',   icon: 'call-outline',        type: 'phone-pad' },
    { label: 'Contraseña', key: 'password',  placeholder: '••••••••',           icon: 'lock-closed-outline', secure: true },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Header rojo ─────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>GOING</Text>
          </View>
          <Text style={styles.heroTitle}>Crea tu cuenta</Text>
          <Text style={styles.heroSub}>Únete a la plataforma de movilidad de Ecuador</Text>
        </View>

        {/* ── Formulario blanco ──────────────────────────────────── */}
        <View style={styles.card}>
          {FIELDS.map((f) => (
            <View key={f.key} style={styles.fieldBlock}>
              <Text style={styles.label}>{f.label}</Text>
              <View style={styles.inputRow}>
                <Ionicons name={f.icon} size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor="#CBD5E1"
                  value={form[f.key]}
                  onChangeText={update(f.key)}
                  keyboardType={f.type ?? 'default'}
                  autoCapitalize={f.key === 'email' ? 'none' : f.key === 'password' ? 'none' : 'words'}
                  secureTextEntry={f.secure && !showPwd}
                  autoCorrect={false}
                />
                {f.secure && (
                  <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
                    <Ionicons
                      name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Crear cuenta gratis</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            Al registrarte aceptas nuestros{' '}
            <Text style={{ color: GOING_RED }}>Términos y condiciones</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GOING_RED },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: GOING_RED,
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  logoBox: {
    backgroundColor: GOING_YELLOW,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: GOING_RED,
    letterSpacing: 5,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    flex: 1,
  },
  fieldBlock: { marginBottom: 4 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  btn: {
    backgroundColor: GOING_RED,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  loginRow: { alignItems: 'center', marginTop: 16 },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginBold: { color: GOING_RED, fontWeight: '700' },
  terms: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 12,
    lineHeight: 16,
  },
});
