import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@services/api';

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';

export function SecurityScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Contraseña muy corta', 'Mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('No coinciden', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Contraseña actualizada', 'Tu contraseña fue cambiada exitosamente.');
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'No se pudo cambiar la contraseña.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={GOING_BLUE} />
          <Text style={styles.infoText}>
            Usa una contraseña fuerte con letras, números y símbolos
          </Text>
        </View>

        {/* Password form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

          <PasswordField
            label="Contraseña actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            label="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />

          {/* Strength indicator */}
          {newPassword.length > 0 && (
            <StrengthBar password={newPassword} />
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={GOING_BLUE} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color={GOING_BLUE} />
              <Text style={styles.saveBtnText}>Actualizar contraseña</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor="#CBD5E1"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle}>
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StrengthBar({ password }: { password: string }) {
  const strength = getStrength(password);
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const labels = ['Muy débil', 'Débil', 'Buena', 'Fuerte'];
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={styles.strengthTrack}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.strengthSegment,
              { backgroundColor: i <= strength ? colors[strength] : '#E5E7EB' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: colors[strength] }]}>
        {labels[strength]}
      </Text>
    </View>
  );
}

function getStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return Math.min(score - 1, 3);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: GOING_BLUE, lineHeight: 18 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldWrapper: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
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
    backgroundColor: '#FAFAFA',
  },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  strengthTrack: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOING_YELLOW,
    borderRadius: 14,
    marginHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  saveBtnText: { fontSize: 16, fontWeight: '900', color: GOING_BLUE },
});
