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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDriverStore } from '@store/useDriverStore';
import type { DriverAuthStackParamList } from '@navigation/DriverAuthNavigator';

type Nav = NativeStackNavigationProp<DriverAuthStackParamList, 'Login'>;

const GOING_RED    = '#ff4c41';
const GOING_YELLOW = '#FFCD00';

export function DriverLoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login, isLoading, error, clearError } = useDriverStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

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
        {/* ── Hero rojo ─────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>GOING</Text>
          </View>
          <View style={styles.driverBadge}>
            <Ionicons name="car" size={14} color={GOING_YELLOW} />
            <Text style={styles.driverBadgeText}>CONDUCTORES</Text>
          </View>
          <Text style={styles.tagline}>Nos movemos contigo</Text>

          {/* Driver perks */}
          <View style={styles.perksRow}>
            {['Ganancias diarias', 'Horario flexible', 'Soporte 24/7'].map((p, i) => (
              <React.Fragment key={p}>
                <View style={styles.perkItem}>
                  <Ionicons name="checkmark-circle" size={14} color={GOING_YELLOW} />
                  <Text style={styles.perkText}>{p}</Text>
                </View>
                {i < 2 && <View style={styles.perkDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Formulario blanco ──────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acceso conductores</Text>
          <Text style={styles.cardSub}>Ingresa tus credenciales para continuar</Text>

          <Text style={styles.label}>Correo</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="conductor@going.com"
              placeholderTextColor="#CBD5E1"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#CBD5E1"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
              <Ionicons
                name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, isLoading && { opacity: 0.7 }]}
            onPress={() => login(email, password)}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerRow}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              ¿Quieres ser conductor?{' '}
              <Text style={styles.registerBold}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
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
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoBox: {
    backgroundColor: GOING_YELLOW,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: GOING_RED,
    letterSpacing: 5,
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 8,
  },
  driverBadgeText: {
    color: GOING_YELLOW,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    gap: 4,
  },
  perkItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  perkText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600', flex: 1 },
  perkDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    flex: 1,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 2 },
  cardSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
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
  forgotRow: { alignItems: 'flex-end', marginTop: 8 },
  forgotText: { color: GOING_RED, fontSize: 13, fontWeight: '600' },
  btn: {
    backgroundColor: GOING_RED,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  registerRow: { alignItems: 'center', marginTop: 16 },
  registerText: { color: '#6B7280', fontSize: 14 },
  registerBold: { color: GOING_RED, fontWeight: '700' },
});
