/**
 * LoginScreen — Going Ecuador
 * Pantalla 02: Bienvenido nuevamente
 *
 * Flujo:
 *  - Si ya tiene token guardado → auto-skip (maneja AuthNavigator)
 *  - Email + contraseña → "Entrar"
 *  - ¿Olvidaste tu clave? → ForgotPassword
 *  - Social login: Google | Facebook | Apple (UI lista, OAuth pendiente de config)
 *  - Crea una cuenta con nosotros → Register
 *  - Biometría: Face ID / Huella si está habilitado
 */
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
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { hapticError, hapticSuccess, hapticMedium } from '../../utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isBiometricAvailable, getBiometricType,
  authenticateWithBiometrics, BIOMETRIC_STORAGE_KEY,
} from '../../utils/biometrics';
import { useAuthStore } from '@store/useAuthStore';
import type { AuthStackParamList } from '@navigation/AuthNavigator';
import { analyticsLogin } from '../../utils/analytics';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// ── Brand tokens (DESIGN.md) ────────────────────────────────
const RED      = '#F04E40';   // Going red
const RED_DARK = '#C0392B';   // gradiente oscuro
const YELLOW   = '#F5C518';   // Going yellow
const NAVY     = '#131b2e';   // on_background
const SURFACE  = '#faf8ff';   // surface
const GRAY     = '#6B7280';

// ── Social providers ────────────────────────────────────────
const SOCIALS = [
  {
    id: 'google',
    label: 'Google',
    icon: 'logo-google' as const,
    color: '#EA4335',
    bg: '#FEF2F2',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: 'logo-facebook' as const,
    color: '#1877F2',
    bg: '#EFF6FF',
  },
  {
    id: 'apple',
    label: 'Apple',
    icon: 'logo-apple' as const,
    color: '#000000',
    bg: '#F3F4F6',
  },
];

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType,    setBiometricType]    = useState<'faceid' | 'fingerprint' | null>(null);

  // ── Biometría automática al abrir ───────────────────────────
  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const enabled   = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
      const type      = await getBiometricType();
      setBiometricType(type);
      if (available && enabled === 'true') {
        setBiometricEnabled(true);
        const success = await authenticateWithBiometrics('Ingresa a Going');
        if (success) {
          hapticSuccess();
          analyticsLogin('biometric');
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('No pudimos iniciar sesión', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      hapticError();
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña para continuar.');
      return;
    }
    hapticMedium();
    await login(email.trim().toLowerCase(), password);
    analyticsLogin('email');
  };

  const handleSocial = (provider: string) => {
    // TODO: configurar OAuth con expo-auth-session
    Alert.alert(
      `Continuar con ${provider}`,
      'El inicio de sesión con redes sociales estará disponible pronto.',
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ══ HERO ROJO ══════════════════════════════════════════ */}
        <View style={styles.hero}>
          <Image
            source={require('../../../assets/going-logo-horizontal-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Stats pill */}
          <View style={styles.statsRow}>
            {[
              { value: '50+',  label: 'Ciudades' },
              { value: '4.9★', label: 'Calificación' },
              { value: '100%', label: 'Seguro' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ══ CARD BLANCA ════════════════════════════════════════ */}
        <View style={styles.card}>

          {/* Título */}
          <Text style={styles.title}>Bienvenido nuevamente</Text>
          <Text style={styles.subtitle}>Ingresa a tu cuenta</Text>

          {/* ── Biometría ── */}
          {biometricEnabled && biometricType && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={async () => {
                hapticMedium();
                const success = await authenticateWithBiometrics('Ingresa a Going');
                if (success) hapticSuccess();
                else hapticError();
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={biometricType === 'faceid' ? 'scan-circle-outline' : 'finger-print-outline'}
                size={22}
                color={RED}
              />
              <Text style={styles.biometricText}>
                {biometricType === 'faceid' ? 'Entrar con Face ID' : 'Entrar con huella digital'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={RED} />
            </TouchableOpacity>
          )}

          {/* ── Correo ── */}
          <Text style={styles.fieldLabel}>Correo electrónico</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#C4C9D4"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* ── Contraseña ── */}
          <Text style={styles.fieldLabel}>Contraseña</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#C4C9D4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* ── ¿Olvidaste tu clave? ── */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu clave?</Text>
          </TouchableOpacity>

          {/* ── Botón ENTRAR ── */}
          <TouchableOpacity
            style={[styles.enterBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.enterBtnText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* ── Divisor ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Social login: Google | Facebook | Apple ── */}
          <View style={styles.socialRow}>
            {SOCIALS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.socialBtn, { backgroundColor: s.bg }]}
                onPress={() => handleSocial(s.label)}
                activeOpacity={0.85}
              >
                <Ionicons name={s.icon} size={22} color={s.color} />
                <Text style={[styles.socialText, { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Crear cuenta ── */}
          <TouchableOpacity
            style={styles.createRow}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.createText}>
              ¿No tienes cuenta?{'  '}
              <Text style={styles.createLink}>Crea una cuenta con nosotros</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: RED },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    backgroundColor: RED,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  logo: { width: 190, height: 81, marginBottom: 20 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  statItem:   { flex: 1, alignItems: 'center' },
  statValue:  { color: YELLOW, fontSize: 17, fontWeight: '900' },
  statLabel:  { color: 'rgba(255,255,255,0.70)', fontSize: 10, marginTop: 2 },
  statDivider:{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.20)' },

  // Card
  card: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: NAVY,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: GRAY,
    marginBottom: 24,
  },

  // Biometría
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  biometricText: { flex: 1, fontSize: 14, fontWeight: '700', color: RED },

  // Campos
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F2F3FF',   // surface_container_low
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 15, color: NAVY },

  // ¿Olvidaste tu clave?
  forgotRow: { alignItems: 'flex-end', marginTop: 10 },
  forgotText: { color: RED, fontSize: 13, fontWeight: '700' },

  // Botón Entrar (gradiente simulado: rojo oscuro → rojo)
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RED,
    borderRadius: 48,   // pill — xl roundedness
    paddingVertical: 16,
    marginTop: 24,
    // Sombra suave con tinte azul (DESIGN.md: sombra con on_surface)
    shadowColor: RED_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  enterBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Divisor
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 13,
  },
  socialText: { fontSize: 13, fontWeight: '700' },

  // Crear cuenta
  createRow: { alignItems: 'center' },
  createText: { fontSize: 13, color: GRAY, textAlign: 'center', lineHeight: 20 },
  createLink: { color: RED, fontWeight: '800' },
});
