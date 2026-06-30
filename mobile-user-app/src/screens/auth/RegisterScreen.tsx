/**
 * RegisterScreen — Going App Ecuador
 *
 * REGISTRO RÁPIDO: solo credenciales (correo + contraseña) + 2 checkboxes
 * LOPDP obligatorios. El nombre, apellido y teléfono se piden DESPUÉS, conforme
 * la persona usa la app (banner en Home + gate antes de la primera reserva).
 * El alta manda un nombre derivado del correo y un apellido centinela para no
 * tocar el backend de auth; el perfil queda "incompleto" hasta completarlo.
 *
 * Theme: ADAPTATIVO light + dark (useTheme). Hero navy brand (NO rojo —
 * el rojo del logo se reserva para identidad y SOS). CTA primario en
 * brandNavy, matching el mockup canónico.
 *
 * LOPDP: 2 consents EXPLÍCITOS y SEPARADOS son requisito de la Ley
 * Orgánica de Protección de Datos Personales de Ecuador. No es UX
 * decorativo — es compliance regulatorio.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/useAuthStore';
import type { AuthStackParamList } from '@navigation/AuthNavigator';
import { useTheme, type ThemeTokens } from '../../theme';
import { deriveNameFromEmail, PLACEHOLDER_LASTNAME } from '../../utils/profile';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type FormState = {
  email: string;
  password: string;
};

/** Mínimo de password alineado con el backend (RegisterUserDto: MinLength 12). */
const MIN_PASSWORD = 12;

type FieldDef = {
  label: string;
  key: keyof FormState;
  placeholder: string;
  keyboard?: any;
  secure?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

// REGISTRO RÁPIDO: solo credenciales. Nombre, apellido y teléfono se completan
// después, conforme la persona usa la app (ver utils/profile + EditProfile).
const FIELDS: FieldDef[] = [
  { label: 'Correo',     key: 'email',     placeholder: 'correo@ejemplo.com',   icon: 'mail-outline',        keyboard: 'email-address' },
  { label: 'Contraseña', key: 'password',  placeholder: 'Mínimo 12 caracteres', icon: 'lock-closed-outline', secure: true },
];

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [acceptedTerms,   setAcceptedTerms]   = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // Refs para que el "next" del teclado salte al siguiente input
  const refs = useRef<Record<keyof FormState, TextInput | null>>({
    email: null, password: null,
  });

  const update = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (error) Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
  }, [error]);

  // ── Validación de password — indicador visual de fortaleza ───
  // Reglas mínimas: 8 chars, 1 mayúscula, 1 minúscula, 1 dígito.
  const passwordStrength = useMemo(() => {
    const p = form.password;
    if (!p) return { score: 0, label: '', color: tokens.textTertiary };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { score, label: 'Débil',   color: tokens.error };
    if (score === 3) return { score, label: 'Media',  color: tokens.warning };
    return { score, label: 'Fuerte', color: tokens.success };
  }, [form.password, tokens]);

  const handleRegister = async () => {
    const email = form.email.trim();
    const { password } = form;
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y una contraseña.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      Alert.alert('Contraseña muy corta', `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Términos requeridos', 'Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }
    if (!acceptedPrivacy) {
      Alert.alert(
        'Privacidad requerida',
        'Debes autorizar el tratamiento de tus datos personales según la LOPDP del Ecuador para continuar.',
      );
      return;
    }
    // Alta mínima: derivamos un nombre del correo y mandamos un apellido
    // centinela para satisfacer el backend (que exige nombres no vacíos). El
    // nombre real + teléfono se piden después (perfil incompleto).
    await register({
      firstName: deriveNameFromEmail(email),
      lastName:  PLACEHOLDER_LASTNAME,
      email,
      password,
      phone:     '',
    });
  };

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
        {/* ── Hero NAVY brand ────────────────────────────────────── */}
        <View style={styles.hero}>
          <Image
            source={require('../../../assets/going-logo-horizontal-white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Crea tu cuenta</Text>
          <Text style={styles.heroSub}>Solo tu correo y una contraseña. El resto lo completas después.</Text>
        </View>

        {/* ── Formulario ─────────────────────────────────────────── */}
        <View style={styles.card}>
          {FIELDS.map((f, idx) => {
            const isLast = idx === FIELDS.length - 1;
            return (
              <View key={f.key} style={styles.fieldBlock}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputRow}>
                  <Ionicons name={f.icon} size={18} color={tokens.textTertiary} />
                  <TextInput
                    ref={(el) => { refs.current[f.key] = el; }}
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={tokens.textTertiary}
                    value={form[f.key]}
                    onChangeText={update(f.key)}
                    keyboardType={f.keyboard ?? 'default'}
                    autoCapitalize={
                      f.key === 'email' || f.key === 'password' ? 'none' : 'words'
                    }
                    secureTextEntry={f.secure && !showPwd}
                    autoCorrect={false}
                    returnKeyType={isLast ? 'done' : 'next'}
                    onSubmitEditing={() => {
                      if (isLast) handleRegister();
                      else {
                        const nextField = FIELDS[idx + 1].key;
                        refs.current[nextField]?.focus();
                      }
                    }}
                    blurOnSubmit={isLast}
                  />
                  {f.secure && (
                    <TouchableOpacity
                      onPress={() => setShowPwd((v) => !v)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <Ionicons
                        name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={tokens.textTertiary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Validaciones inline */}
                {f.key === 'password' && form.password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthBar,
                            i <= passwordStrength.score && { backgroundColor: passwordStrength.color },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* ── CTA principal — navy brand ── */}
          <TouchableOpacity
            style={[styles.btn, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.88}
            accessibilityLabel="Crear cuenta"
          >
            {isLoading ? (
              <ActivityIndicator color={tokens.textOnNavy} />
            ) : (
              <>
                <Text style={styles.btnText}>Crear cuenta</Text>
                <Ionicons name="arrow-forward" size={18} color={tokens.textOnNavy} />
              </>
            )}
          </TouchableOpacity>

          {/* ── Checkboxes LOPDP (compliance regulatorio EC) ────── */}
          <View style={styles.legalBlock}>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setAcceptedTerms((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Ionicons name="checkmark" size={13} color={tokens.textOnNavy} />}
              </View>
              <Text style={styles.checkLabel}>
                Acepto los{' '}
                <Text
                  style={styles.checkLink}
                  onPress={() => Linking.openURL('https://goingec.com/terminos')}
                >
                  Términos y Condiciones
                </Text>
                {' '}de uso del servicio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkRow, { marginTop: 12 }]}
              onPress={() => setAcceptedPrivacy((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedPrivacy && styles.checkboxChecked]}>
                {acceptedPrivacy && <Ionicons name="checkmark" size={13} color={tokens.textOnNavy} />}
              </View>
              <Text style={styles.checkLabel}>
                Autorizo el tratamiento de mis datos según la{' '}
                <Text
                  style={styles.checkLink}
                  onPress={() => Linking.openURL('https://goingec.com/privacidad')}
                >
                  Política de Privacidad
                </Text>
                {' '}(LOPDP — Ley Orgánica de Protección de Datos)
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Volver al login ── */}
          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver a iniciar sesión"
          >
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.brandNavy },
    scroll: { flexGrow: 1 },

    // ── Hero navy ───────────────────────────────────────────
    hero: {
      backgroundColor: t.brandNavy,
      alignItems: 'center',
      paddingTop: 56,
      paddingBottom: 32,
      paddingHorizontal: 24,
    },
    logo: {
      width: 170,
      height: 72,
      marginBottom: 16,
      // Logo blanco se ve bien sobre navy en ambos modos (no necesita tint)
    },
    heroTitle: {
      fontSize: 24, fontWeight: '900',
      color: t.textOnNavy,
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    heroSub: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.78)',
      textAlign: 'center',
      lineHeight: 19,
    },

    // ── Card form ───────────────────────────────────────────
    card: {
      backgroundColor: t.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 28,
      paddingBottom: 40,
      flex: 1,
    },

    fieldBlock: { marginBottom: 4 },
    label: {
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
      borderWidth: 1.5,
      borderColor: t.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: t.glass,
    },
    input: {
      flex: 1, fontSize: 15,
      color: t.textPrimary,
    },

    // Password strength
    strengthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
    },
    strengthBars: {
      flex: 1,
      flexDirection: 'row',
      gap: 4,
    },
    strengthBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.border,
    },
    strengthLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
      minWidth: 50,
      textAlign: 'right',
    },

    fieldWarning: {
      fontSize: 11,
      color: t.warning,
      marginTop: 6,
      fontWeight: '600',
    },

    // CTA primario navy
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: t.brandNavy,
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 28,
      shadowColor: t.brandNavyDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    btnText: {
      color: t.textOnNavy,
      fontSize: 16, fontWeight: '900',
      letterSpacing: 0.3,
    },

    // ── Legal LOPDP ─────────────────────────────────────────
    legalBlock: {
      marginTop: 22,
      backgroundColor: t.glass,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: t.border,
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    checkbox: {
      width: 22, height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: t.borderStrong,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 1,
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: t.brandNavy,
      borderColor: t.brandNavy,
    },
    checkLabel: {
      flex: 1,
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 18,
    },
    checkLink: {
      color: t.brandNavy,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },

    loginRow: { alignItems: 'center', marginTop: 18 },
    loginText: {
      color: t.textSecondary,
      fontSize: 14,
    },
    loginBold: {
      color: t.brandNavy,
      fontWeight: '800',
    },
  });
}
