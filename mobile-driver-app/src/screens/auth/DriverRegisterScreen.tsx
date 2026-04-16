import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
  Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriverStore } from '@store/useDriverStore';

const GOING_RED = '#ff4c41';
const NAVY   = '#001F6B'; // kept for internal use
const YELLOW = '#FFCD00';
const BLACK  = '#1a1a1a';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.goingec.com';

// ── Tipos de documentos requeridos ──────────────────────────────────────────
const DOCS = [
  { key: 'cedula',    label: 'Cédula de Identidad',    icon: 'card-outline' },
  { key: 'licencia',  label: 'Licencia de Conducir',   icon: 'document-text-outline' },
  { key: 'matricula', label: 'Matrícula del Vehículo', icon: 'car-outline' },
  { key: 'soat',      label: 'SOAT (Seguro)',           icon: 'shield-checkmark-outline' },
] as const;

type DocKey = typeof DOCS[number]['key'];

export function DriverRegisterScreen({ navigation }: any) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — Datos personales
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');

  // Step 2 — Vehículo
  const [brand,  setBrand]  = useState('');
  const [model,  setModel]  = useState('');
  const [year,   setYear]   = useState('');
  const [plate,  setPlate]  = useState('');

  // Documentos
  const [docs, setDocs] = useState<Partial<Record<DocKey, string>>>({});
  const [loading, setLoading] = useState(false);

  // ── Seleccionar imagen de documento ────────────────────────────────────────
  const pickDoc = async (key: DocKey) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir documentos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDocs(prev => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  const takePhoto = async (key: DocKey) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDocs(prev => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  const showDocOptions = (key: DocKey) => {
    Alert.alert('Subir documento', 'Elige una opción', [
      { text: 'Cámara', onPress: () => takePhoto(key) },
      { text: 'Galería', onPress: () => pickDoc(key) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // ── Validaciones por paso ──────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!firstName || !lastName || !email || !phone || !password) {
      Alert.alert('Campos requeridos', 'Completa todos los datos personales');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña corta', 'Mínimo 8 caracteres');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!brand || !model || !year || !plate) {
      Alert.alert('Datos del vehículo', 'Completa todos los datos del vehículo');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const missingDocs = DOCS.filter(d => !docs[d.key]);
    if (missingDocs.length > 0) {
      Alert.alert('Documentos faltantes', `Sube: ${missingDocs.map(d => d.label).join(', ')}`);
      return false;
    }
    return true;
  };

  // ── Registro final ─────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    try {
      // 1. Crear cuenta
      const { data } = await axios.post(`${API_BASE}/auth/register`, {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        password,
        phone,
        roles: ['driver'],
      });
      const token = data.token ?? data.access_token;
      await AsyncStorage.setItem('driver_token', token);

      // 2. Subir documentos al endpoint de documentos
      const docTypes = Object.keys(docs) as Array<keyof typeof docs>;
      const uploadErrors: string[] = [];

      await Promise.allSettled(
        docTypes
          .filter(key => docs[key] !== null)
          .map(async (key) => {
            try {
              const formData = new FormData();
              const uri = docs[key] as string;
              const filename = `${key}.jpg`;
              formData.append('document', { uri, type: 'image/jpeg', name: filename } as any);
              formData.append('type', key);
              await axios.post(`${API_BASE}/drivers/me/documents`, formData, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data',
                },
              });
            } catch {
              uploadErrors.push(key);
            }
          })
      );

      // 3. Cargar datos del conductor en el store
      await useDriverStore.getState().loadToken();

      if (uploadErrors.length > 0) {
        Alert.alert(
          'Cuenta creada',
          `Tu cuenta fue creada. Algunos documentos no pudieron subirse (${uploadErrors.join(', ')}). Puedes subirlos más tarde en Mis Documentos.`
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <TouchableOpacity style={styles.back} onPress={() => step === 1 ? navigation.goBack() : setStep((step - 1) as 1 | 2 | 3)}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>GOING</Text>
          </View>
        </View>

        <View style={styles.roleBadge}>
          <Ionicons name="car" size={14} color={YELLOW} />
          <Text style={styles.roleText}>Registro como Conductor</Text>
        </View>

        {/* Progress steps */}
        <View style={styles.steps}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= 1 && styles.stepNumActive]}>1</Text>
            </View>
            <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Datos{'\n'}personales</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= 2 && styles.stepNumActive]}>2</Text>
            </View>
            <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Vehículo</Text>
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= 3 && styles.stepNumActive]}>3</Text>
            </View>
            <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Documentos</Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* ── PASO 1: Datos personales ── */}
          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Datos Personales</Text>

              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Nombre" placeholderTextColor="#9CA3AF"
                  value={firstName} onChangeText={setFirstName} editable={!loading} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Apellido" placeholderTextColor="#9CA3AF"
                  value={lastName} onChangeText={setLastName} editable={!loading} />
              </View>

              <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#9CA3AF"
                value={email} onChangeText={setEmail} keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false} editable={!loading} />

              <TextInput style={styles.input} placeholder="Teléfono (ej: +593987654321)" placeholderTextColor="#9CA3AF"
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!loading} />

              <TextInput style={styles.input} placeholder="Contraseña (mín. 8 caracteres)" placeholderTextColor="#9CA3AF"
                value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />

              <TouchableOpacity style={styles.button} onPress={() => { if (validateStep1()) setStep(2); }}>
                <Text style={styles.buttonText}>Continuar →</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text></Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── PASO 2: Vehículo ── */}
          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Datos del Vehículo</Text>

              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Marca" placeholderTextColor="#9CA3AF"
                  value={brand} onChangeText={setBrand} editable={!loading} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Modelo" placeholderTextColor="#9CA3AF"
                  value={model} onChangeText={setModel} editable={!loading} />
              </View>

              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Año (ej: 2020)" placeholderTextColor="#9CA3AF"
                  value={year} onChangeText={setYear} keyboardType="numeric" editable={!loading} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Placa (ej: ABC-1234)" placeholderTextColor="#9CA3AF"
                  value={plate} onChangeText={t => setPlate(t.toUpperCase())} autoCapitalize="characters" editable={!loading} />
              </View>

              <TouchableOpacity style={styles.button} onPress={() => { if (validateStep2()) setStep(3); }}>
                <Text style={styles.buttonText}>Continuar →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── PASO 3: Documentos ── */}
          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>Documentos Requeridos</Text>
              <Text style={styles.docHint}>
                Sube una foto clara de cada documento. Todos son obligatorios para activar tu cuenta como conductor.
              </Text>

              {DOCS.map((doc) => {
                const uploaded = !!docs[doc.key];
                return (
                  <TouchableOpacity
                    key={doc.key}
                    style={[styles.docCard, uploaded && styles.docCardDone]}
                    onPress={() => showDocOptions(doc.key)}
                    disabled={loading}
                  >
                    <View style={[styles.docIcon, uploaded && styles.docIconDone]}>
                      <Ionicons name={doc.icon as any} size={22} color={uploaded ? YELLOW : '#999'} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={[styles.docLabel, uploaded && styles.docLabelDone]}>{doc.label}</Text>
                      <Text style={styles.docStatus}>
                        {uploaded ? '✓ Documento cargado' : 'Toca para subir foto o PDF'}
                      </Text>
                    </View>
                    {uploaded
                      ? <Ionicons name="checkmark-circle" size={22} color={YELLOW} />
                      : <Ionicons name="cloud-upload-outline" size={22} color="#666" />
                    }
                  </TouchableOpacity>
                );
              })}

              {/* Progreso de documentos */}
              <View style={styles.docProgressRow}>
                {DOCS.map((doc) => (
                  <View
                    key={doc.key}
                    style={[styles.docProgressDot, docs[doc.key] && styles.docProgressDotDone]}
                  />
                ))}
                <Text style={styles.docProgressLabel}>
                  {Object.keys(docs).length} / {DOCS.length} documentos
                </Text>
              </View>

              {/* Preview de imágenes subidas */}
              {Object.keys(docs).length > 0 && (
                <View style={styles.previewRow}>
                  {(Object.entries(docs) as [DocKey, string][]).map(([key, uri]) => (
                    <TouchableOpacity key={key} onPress={() => showDocOptions(key)} style={styles.previewWrap}>
                      <Image source={{ uri }} style={styles.previewImg} />
                      <TouchableOpacity
                        style={styles.previewRemove}
                        onPress={() => setDocs(prev => { const n = { ...prev }; delete n[key]; return n; })}
                      >
                        <Ionicons name="close-circle" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={NAVY} />
                  : <Text style={styles.buttonText}>Crear Cuenta de Conductor</Text>
                }
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Tu cuenta será revisada en las próximas 24–48 horas. Recibirás una notificación cuando esté activa.
              </Text>
            </>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ff4c41' },
  content: { padding: 24, paddingTop: 55, paddingBottom: 40 },
  back: { position: 'absolute', top: 14, left: 4, padding: 8, zIndex: 10 },

  logoArea: { alignItems: 'center', marginBottom: 12 },
  logoBox: {
    backgroundColor: YELLOW,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoText: { fontSize: 28, fontWeight: '900', color: '#ff4c41', letterSpacing: 4 },

  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: 'rgba(255,205,0,0.15)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,205,0,0.3)',
  },
  roleText: { fontWeight: '600', fontSize: 13, color: YELLOW },

  // Progress steps
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: YELLOW },
  stepNum: { fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  stepNumActive: { color: '#0033A0' },
  stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 70 },
  stepLabelActive: { color: YELLOW, fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 6, marginBottom: 18 },
  stepLineActive: { backgroundColor: YELLOW },

  form: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },

  sectionTitle: { fontWeight: '700', fontSize: 16, color: BLACK, marginBottom: 14, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
    backgroundColor: '#F9FAFB', fontSize: 15, color: '#111827',
  },

  // Document cards
  docHint: { fontSize: 12, color: '#aaa', marginBottom: 14 },
  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, marginBottom: 10, backgroundColor: '#F9FAFB',
  },
  docCardDone: { borderColor: YELLOW, backgroundColor: 'rgba(255,205,0,0.08)' },
  docIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
  },
  docIconDone: { backgroundColor: 'rgba(255,205,0,0.2)' },
  docInfo: { flex: 1 },
  docLabel: { fontWeight: '600', fontSize: 14, color: BLACK, marginBottom: 2 },
  docLabelDone: { color: '#0033A0' },
  docStatus: { fontSize: 12, color: '#aaa' },

  // Doc progress indicator
  docProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    marginTop: 4,
  },
  docProgressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  docProgressDotDone: {
    backgroundColor: YELLOW,
  },
  docProgressLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },

  // Image previews
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  previewWrap: { position: 'relative' },
  previewImg: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#eee' },
  previewRemove: { position: 'absolute', top: -6, right: -6 },

  button: {
    backgroundColor: YELLOW, padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 10, marginBottom: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontWeight: '900', color: '#0033A0', fontSize: 16 },
  link: { color: '#888', textAlign: 'center', fontSize: 14 },
  linkBold: { fontWeight: '600', color: BLACK },
  disclaimer: {
    fontSize: 12, color: '#aaa',
    textAlign: 'center', lineHeight: 18, marginTop: 4,
  },
});
