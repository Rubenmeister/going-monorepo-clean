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
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@store/useAuthStore';
import { authAPI } from '@services/api';

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState((user as any)?.phone ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y apellido son obligatorios.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
      Alert.alert('Guardado', 'Tu perfil ha sido actualizado.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const initials =
    `${(firstName[0] ?? '?').toUpperCase()}${(lastName[0] ?? '').toUpperCase()}`;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroSub}>Toca los campos para editar</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FieldInput
            label="Nombre"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Tu nombre"
            icon="person-outline"
          />
          <FieldInput
            label="Apellido"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Tu apellido"
            icon="person-outline"
          />
          <FieldInput
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            placeholder="+593 99 999 9999"
            icon="call-outline"
            keyboardType="phone-pad"
          />

          {/* Email (read-only) */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={[styles.inputRow, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
              <Text style={[styles.inputText, { color: '#9CA3AF' }]}>
                {user?.email ?? '—'}
              </Text>
              <Ionicons name="lock-closed-outline" size={14} color="#D1D5DB" />
            </View>
            <Text style={styles.helpText}>El correo no se puede cambiar</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={GOING_BLUE} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={GOING_BLUE} />
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: any;
  keyboardType?: any;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={18} color="#9CA3AF" />
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#CBD5E1"
          keyboardType={keyboardType ?? 'default'}
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: {
    backgroundColor: GOING_BLUE,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GOING_YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: GOING_BLUE },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    gap: 8,
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
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  helpText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOING_YELLOW,
    borderRadius: 14,
    marginHorizontal: 16,
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 32,
  },
  saveBtnText: { fontSize: 16, fontWeight: '900', color: GOING_BLUE },
});
