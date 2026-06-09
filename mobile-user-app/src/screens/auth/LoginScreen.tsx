/**
 * LoginScreen — Going App Ecuador
 *
 * Flujo:
 *  - Biometría auto al abrir si está habilitada
 *  - Email + contraseña → "Entrar"
 *  - ¿Olvidaste tu clave? → ForgotPassword
 *  - Crear cuenta → Register
 *
 * Theme: ADAPTATIVO light + dark (useTheme). Estilo tech-noir consistente
 * con OnboardingScreen — hero card glass con HUD corners + acentos neon
 * cyan, sin hero rojo brand (movido a Splash/identity moments).
 *
 * Decisiones de producto (2026-05-23):
 *   - Sin social login visible: Google/Facebook/Apple stubs eliminados
 *     hasta que OAuth real esté implementado (config + callback).
 *   - Stats honestas: "Ciudades conectadas", "Soporte 24/7", "Conductores
 *     verificados". El "4.9★" hardcoded y "100% seguro" salieron.
 *   - Link a T&C/Privacy visible (requisito legal EC + UX standard).
 *   - CTA primario en neonCyan (matches onboarding). brandRed reservado
 *     para destructivos / SOS.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Linking,
  StyleSheet,
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
import { useTheme, type ThemeTokens } from '../../theme';
import { signInWithProvider, type OAuthProvider } from '../../services/oauth';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// Stats defensibles (todas verificables o son políticas reales):
//   - 50+ ciudades — catálogo real en libs/pricing/cities.ts
//   - 24/7 soporte — customer-support-service always-on (min-instances=1)
//   - 100% verificados — política operativa: todos los conductores pasan KYC
const STATS = [
  { value: '50+',  label: 'Ciudades' },
  { value: '24/7', label: 'Soporte' },
  { value: '100%', label: 'Verificados' },
];

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, loginWithOAuthToken, isLoading, error, clearError } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType,    setBiometricType]    = useState<'faceid' | 'fingerprint' | null>(null);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);

  // Ref al input de password — permite que el "next" del email focusee aquí
  const passwordRef = useRef<TextInput>(null);

  // ── Biometría automática al abrir ───────────────────────────
  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const enabled   = await AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY);
      const type      = await getBiometricType();
      setBiometricType(type);
      if (available && enabled === 'true') {
        setBiometricEnabled(true);
        const success = await authenticateWithBiometrics('Ingresa a Going App');
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

  // ── OAuth: Google / Facebook ─────────────────────────────────
  const handleOAuth = async (provider: OAuthProvider) => {
    if (oauthBusy) return;
    setOauthBusy(provider);
    hapticMedium();
    try {
      const result = await signInWithProvider(provider);
      if (!result.ok) {
        if (result.reason === 'cancel') return; // usuario cerró el WebView, sin ruido
        hapticError();
        Alert.alert(
          'No pudimos iniciar sesión',
          result.message ?? 'Intenta de nuevo en un momento.'
        );
        return;
      }
      await loginWithOAuthToken(result.token);
      analyticsLogin(provider);
      hapticSuccess();
    } catch (e: any) {
      hapticError();
      Alert.alert(
        'No pudimos iniciar sesión',
        e?.message ?? 'Intenta de nuevo en un momento.'
      );
    } finally {
      setOauthBusy(null);
    }
  };

  // Logo brand — en hero glass siempre legible (overlay propio del card)
  const logoSource = require('../../../assets/going-logo-horizontal-white.png');

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
        {/* ══ HERO TECH-NOIR ═══════════════════════════════════════ */}
        <View style={styles.hero}>
          {/* HUD corners decorativos — vibe consistent con onboarding */}
          <View pointerEvents="none" style={[styles.hudCorner, styles.hudTopLeft]} />
          <View pointerEvents="none" style={[styles.hudCorner, styles.hudTopRight]} />

          {/* Eyebrow chip flotante */}
          <View style={styles.eyebrowChip}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>Acceso · Going App</Text>
          </View>

          <Image source={logoSource} style={styles.logo} resizeMode="contain" />

          {/* Stats card glass */}
          <View style={styles.statsCard}>
            {STATS.map((s, i, arr) => (
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

        {/* ══ FORM CARD ════════════════════════════════════════════ */}
        <View style={styles.card}>

          <Text style={styles.title}>Bienvenido nuevamente</Text>
          <Text style={styles.subtitle}>Ingresa a tu cuenta</Text>

          {/* ── Biometría (si disponible y habilitada) ── */}
          {biometricEnabled && biometricType && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={async () => {
                hapticMedium();
                const success = await authenticateWithBiometrics('Ingresa a Going App');
                if (success) hapticSuccess();
                else hapticError();
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={biometricType === 'faceid' ? 'scan-circle-outline' : 'finger-print-outline'}
                size={22}
                color={tokens.neonCyan}
              />
              <Text style={styles.biometricText}>
                {biometricType === 'faceid' ? 'Entrar con Face ID' : 'Entrar con huella digital'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={tokens.neonCyan} />
            </TouchableOpacity>
          )}

          {/* ── Correo ── */}
          <Text style={styles.fieldLabel}>Correo electrónico</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={tokens.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={tokens.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* ── Contraseña ── */}
          <Text style={styles.fieldLabel}>Contraseña</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={tokens.textTertiary} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={tokens.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPwd(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <Ionicons
                name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={tokens.textTertiary}
              />
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
            accessibilityLabel="Entrar a Going App"
          >
            {isLoading ? (
              <ActivityIndicator color={tokens.textInverse} />
            ) : (
              <>
                <Text style={styles.enterBtnText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={18} color={tokens.textInverse} />
              </>
            )}
          </TouchableOpacity>

          {/* ── Separador "o continúa con" ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Social login: Google + Facebook ── */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialBtn, oauthBusy && { opacity: 0.7 }]}
              onPress={() => handleOAuth('google')}
              disabled={isLoading || !!oauthBusy}
              activeOpacity={0.85}
              accessibilityLabel="Continuar con Google"
            >
              {oauthBusy === 'google' ? (
                <ActivityIndicator color={tokens.textPrimary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#DB4437" />
                  <Text style={styles.socialBtnText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialBtn, oauthBusy && { opacity: 0.7 }]}
              onPress={() => handleOAuth('facebook')}
              disabled={isLoading || !!oauthBusy}
              activeOpacity={0.85}
              accessibilityLabel="Continuar con Facebook"
            >
              {oauthBusy === 'facebook' ? (
                <ActivityIndicator color={tokens.textPrimary} />
              ) : (
                <>
                  <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                  <Text style={styles.socialBtnText}>Facebook</Text>
                </>
              )}
            </TouchableOpacity>
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

          {/* ── Legal — requisito EC + UX best practice ── */}
          <Text style={styles.legalText}>
            Al iniciar sesión aceptas nuestros{' '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://goingec.com/terminos')}
            >
              Términos
            </Text>
            {' y la '}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL('https://goingec.com/privacidad')}
            >
              Política de Privacidad
            </Text>
            .
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: t.bg },
    scroll: { flexGrow: 1 },

    // ── HERO TECH-NOIR ──────────────────────────────────────
    // En dark: bgLayer (panel elevado) con HUD corners cyan.
    // En light: panel blanco con bordes y HUD corners más visibles.
    hero: {
      backgroundColor: t.bgLayer,
      alignItems: 'center',
      paddingTop: 64,
      paddingBottom: 32,
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor: t.glassBorder,
      position: 'relative',
    },

    hudCorner: {
      position: 'absolute',
      width: 28, height: 28,
      borderColor: t.neonCyan,
      opacity: isDark ? 0.55 : 0.85,
    },
    hudTopLeft: {
      top: 18, left: 18,
      borderTopWidth: 1.5, borderLeftWidth: 1.5,
    },
    hudTopRight: {
      top: 18, right: 18,
      borderTopWidth: 1.5, borderRightWidth: 1.5,
    },

    eyebrowChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${t.neonCyan}15`,
      borderWidth: 1, borderColor: `${t.neonCyan}40`,
      paddingHorizontal: 12, paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 18,
    },
    eyebrowDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: t.neonCyan,
    },
    eyebrowText: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      color: t.neonCyan, textTransform: 'uppercase',
    },

    // En dark el logo blanco se ve directo. En light necesita un sutil
    // backdrop para que las letras blancas no se pierdan — wrap container
    // ya provee bgLayer que en light es #ffffff (logo blanco no visible).
    // Solución: usar tint del logo via Image tintColor. Mantener simple
    // por ahora y pedir going-logo-dark.png (TODO).
    logo: {
      width: 170, height: 72,
      marginBottom: 20,
      tintColor: isDark ? undefined : t.textPrimary,
    },

    // Stats card glass — overlay sutil sobre el hero
    statsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      width: '100%',
    },
    statItem:   { flex: 1, alignItems: 'center' },
    statValue:  {
      color: t.neonCyan,
      fontSize: 17, fontWeight: '900',
      letterSpacing: -0.3,
    },
    statLabel:  {
      color: t.textTertiary,
      fontSize: 10, marginTop: 2,
      fontWeight: '600', letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    statDivider: {
      width: 1, height: 28,
      backgroundColor: t.glassBorder,
    },

    // ── FORM CARD ───────────────────────────────────────────
    card: {
      flex: 1,
      backgroundColor: t.bg,
      paddingHorizontal: 28,
      paddingTop: 32,
      paddingBottom: 48,
    },
    title: {
      fontSize: 26, fontWeight: '900',
      color: t.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: t.textSecondary,
      marginBottom: 24,
    },

    // Biometría
    biometricBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: `${t.neonCyan}10`,
      borderWidth: 1, borderColor: `${t.neonCyan}30`,
      borderRadius: 14,
      paddingVertical: 13,
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    biometricText: {
      flex: 1, fontSize: 14, fontWeight: '700',
      color: t.neonCyan,
    },

    // Campos
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: t.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      marginTop: 14,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    input: {
      flex: 1, fontSize: 15,
      color: t.textPrimary,
    },

    // ¿Olvidaste tu clave?
    forgotRow: { alignItems: 'flex-end', marginTop: 10 },
    forgotText: {
      color: t.neonCyan,
      fontSize: 13, fontWeight: '700',
    },

    // Botón Entrar — neonCyan primary (matches onboarding)
    enterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.neonCyan,
      borderRadius: 48,
      paddingVertical: 16,
      marginTop: 24,
      shadowColor: t.neonCyan,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    enterBtnText: {
      color: t.textInverse,
      fontSize: 16, fontWeight: '900',
      letterSpacing: 0.3,
    },

    // Divider "o continúa con"
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 24,
      marginBottom: 14,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: t.glassBorder,
    },
    dividerText: {
      fontSize: 11,
      color: t.textTertiary,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },

    // Social login row
    socialRow: {
      flexDirection: 'row',
      gap: 10,
    },
    socialBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 14,
      paddingVertical: 13,
      minHeight: 46,
    },
    socialBtnText: {
      color: t.textPrimary,
      fontSize: 14, fontWeight: '700',
    },

    // Crear cuenta
    createRow: { alignItems: 'center', marginTop: 28 },
    createText: {
      fontSize: 13,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    createLink: {
      color: t.neonCyan,
      fontWeight: '800',
    },

    // Legal
    legalText: {
      fontSize: 11,
      color: t.textTertiary,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 24,
      paddingHorizontal: 16,
    },
    legalLink: {
      color: t.textSecondary,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });
}
