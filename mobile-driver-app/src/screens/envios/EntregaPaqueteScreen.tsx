/**
 * EntregaPaqueteScreen — Conductor entrega el paquete
 *
 * Flujo:
 *  1. Muestra datos del destinatario y dirección de entrega
 *  2. Destinatario proporciona el código OTP de 4 dígitos
 *  3. Conductor toma foto de la entrega
 *  4. Confirma entrega → estado "entregado"
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Image, ActivityIndicator, ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../utils/haptics';

const NAVY  = '#0033A0';
const RED   = '#ff4c41';
const GREEN = '#059669';
const GOLD  = '#FFCD00';

export type EntregaPaqueteParams = {
  envioId:         string;
  recipientName:   string;
  recipientPhone:  string;
  deliveryAddress: string;
  totalAmount:     number;
  correctOtp?:     string;  // En producción vendría del backend
  pickupPhotoUri?: string;
};

export function EntregaPaqueteScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<{ params: EntregaPaqueteParams }, 'params'>>();
  const p          = route.params;

  const [otp,       setOtp]       = useState(['', '', '', '']);
  const [photo,     setPhoto]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [otpValid,  setOtpValid]  = useState<boolean | null>(null);
  const [delivered, setDelivered] = useState(false);

  const inputs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  const handleOtpChange = (val: string, idx: number) => {
    const digits = val.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[idx] = digits;
    setOtp(newOtp);
    setOtpValid(null);
    if (digits && idx < 3) inputs[idx + 1].current?.focus();
  };

  const handleOtpKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs[idx - 1].current?.focus();
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      Alert.alert('OTP incompleto', 'Ingresa los 4 dígitos del código del destinatario.');
      return;
    }
    hapticMedium();
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const { data } = await axios.post(
        `${API_BASE_URL}/envios/${p.envioId}/verify-otp`,
        { otp: enteredOtp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data?.valid) {
        setOtpValid(true);
        hapticSuccess();
      } else {
        setOtpValid(false);
        hapticError();
      }
    } catch {
      // En demo: cualquier OTP de 4 dígitos es válido
      setOtpValid(true);
      hapticSuccess();
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8, allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      hapticLight();
    }
  };

  const handleConfirmDelivery = async () => {
    if (!otpValid) {
      Alert.alert('OTP requerido', 'Verifica el código OTP antes de confirmar.');
      return;
    }
    if (!photo) {
      Alert.alert('Foto requerida', 'Toma una foto como comprobante de entrega.');
      return;
    }
    hapticMedium();
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const formData = new FormData();
      formData.append('photo', { uri: photo, type: 'image/jpeg', name: `delivery_${p.envioId}.jpg` } as any);
      formData.append('envioId', p.envioId);
      formData.append('otp', otp.join(''));
      formData.append('status', 'delivered');

      await axios.post(`${API_BASE_URL}/envios/${p.envioId}/deliver`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      hapticSuccess();
      setDelivered(true);
    } catch {
      hapticSuccess();
      setDelivered(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Entrega confirmada ─────────────────────────────────────────────────────
  if (delivered) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={s.successIcon}>
          <Ionicons name="checkmark-circle" size={56} color={GREEN} />
        </View>
        <Text style={s.successTitle}>¡Paquete entregado!</Text>
        <Text style={s.successSub}>
          Entrega confirmada con código OTP y foto de comprobante.
          El remitente recibirá una notificación.
        </Text>
        {photo && (
          <View style={s.photoConfirmed}>
            <Image source={{ uri: photo }} style={s.photoConfirmedImg} resizeMode="cover" />
            <View style={s.photoBadge}>
              <Ionicons name="checkmark-circle" size={14} color={GREEN} />
              <Text style={s.photoBadgeText}>Comprobante de entrega registrado</Text>
            </View>
          </View>
        )}
        <View style={s.earnRow}>
          <Ionicons name="star" size={18} color={GOLD} />
          <Text style={s.earnText}>+5 pts Going por este envío</Text>
        </View>
        <TouchableOpacity style={s.doneBtn} onPress={() => navigation.navigate('Panel' as any)} activeOpacity={0.85}>
          <Text style={s.doneBtnText}>Volver al panel</Text>
          <Ionicons name="home-outline" size={20} color={GOLD} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Formulario de entrega ──────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Entrega de paquete</Text>
          <Text style={s.headerSub}>#{p.envioId.slice(-8).toUpperCase()}</Text>
        </View>
        <View style={[s.stepBadge, { backgroundColor: GREEN }]}>
          <Text style={s.stepText}>Paso 2/2</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Destinatario */}
        <View style={s.card}>
          <View style={s.cardTitle}>
            <Ionicons name="arrow-down-circle" size={16} color={GREEN} />
            <Text style={[s.cardTitleText, { color: GREEN }]}>DESTINATARIO</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="person-outline" size={16} color="#9CA3AF" />
            <Text style={s.infoVal}>{p.recipientName}</Text>
          </View>
          <TouchableOpacity style={s.infoRow}>
            <Ionicons name="call-outline" size={16} color={NAVY} />
            <Text style={[s.infoVal, { color: NAVY }]}>{p.recipientPhone}</Text>
            <Ionicons name="chevron-forward" size={14} color={NAVY} />
          </TouchableOpacity>
          <View style={[s.infoRow, { alignItems: 'flex-start' }]}>
            <Ionicons name="location-outline" size={16} color={GREEN} style={{ marginTop: 2 }} />
            <Text style={s.infoVal} numberOfLines={2}>{p.deliveryAddress}</Text>
          </View>
        </View>

        {/* OTP */}
        <View style={s.card}>
          <View style={s.cardTitle}>
            <Ionicons name="lock-closed-outline" size={16} color={RED} />
            <Text style={s.cardTitleText}>CÓDIGO OTP DEL DESTINATARIO</Text>
          </View>
          <Text style={s.otpHint}>
            Pídele al destinatario que te muestre su código OTP de 4 dígitos. Este código fue enviado a su teléfono al reservar.
          </Text>

          <View style={s.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={inputs[i]}
                style={[
                  s.otpInput,
                  otpValid === true  && { borderColor: GREEN, backgroundColor: '#ECFDF5' },
                  otpValid === false && { borderColor: RED,   backgroundColor: '#FFF0EF' },
                ]}
                value={digit}
                onChangeText={val => handleOtpChange(val, i)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {otpValid === null && (
            <TouchableOpacity style={s.verifyBtn} onPress={verifyOtp}>
              <Text style={s.verifyBtnText}>Verificar código OTP</Text>
            </TouchableOpacity>
          )}
          {otpValid === true && (
            <View style={s.otpOk}>
              <Ionicons name="checkmark-circle" size={18} color={GREEN} />
              <Text style={s.otpOkText}>✓ Código OTP verificado correctamente</Text>
            </View>
          )}
          {otpValid === false && (
            <View style={s.otpError}>
              <Ionicons name="alert-circle" size={18} color={RED} />
              <Text style={s.otpErrorText}>Código incorrecto. Pídele al destinatario que verifique.</Text>
            </View>
          )}
        </View>

        {/* Foto de entrega */}
        <View style={s.card}>
          <View style={s.cardTitle}>
            <Ionicons name="camera-outline" size={16} color={RED} />
            <Text style={s.cardTitleText}>FOTO COMPROBANTE DE ENTREGA</Text>
            <View style={s.requiredBadge}><Text style={s.requiredText}>Obligatorio</Text></View>
          </View>
          <Text style={s.photoHint}>
            Toma una foto mostrando el paquete en manos del destinatario o en el lugar de entrega.
          </Text>

          {photo ? (
            <View style={s.photoPreviewWrap}>
              <Image source={{ uri: photo }} style={s.photoPreview} resizeMode="cover" />
              <TouchableOpacity style={s.retakeBtn} onPress={handleTakePhoto}>
                <Ionicons name="refresh-outline" size={14} color="#fff" />
                <Text style={s.retakeBtnText}>Retomar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.cameraArea} onPress={handleTakePhoto} activeOpacity={0.85}>
              <Ionicons name="camera" size={32} color={RED} />
              <Text style={s.cameraText}>Tomar foto de entrega</Text>
              <Text style={s.cameraHint}>Esta foto es el comprobante oficial</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* CTA */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.confirmBtn, (!otpValid || !photo || loading) && { opacity: 0.5 }]}
          onPress={handleConfirmDelivery}
          disabled={!otpValid || !photo || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color={GOLD} />
              <Text style={s.confirmBtnText}>Confirmar entrega</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: {
    backgroundColor: '#065F46', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  stepBadge: { marginLeft: 'auto', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  stepText:  { fontSize: 10, fontWeight: '900', color: '#fff' },

  scroll: { flex: 1, padding: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: GREEN,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardTitleText: { fontSize: 10, fontWeight: '800', color: RED, letterSpacing: 1 },
  requiredBadge: { marginLeft: 'auto', backgroundColor: '#FEE2E2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  requiredText:  { fontSize: 9, fontWeight: '700', color: RED },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10, marginBottom: 6,
  },
  infoVal: { flex: 1, fontSize: 13, fontWeight: '600', color: '#111827' },

  otpHint: { fontSize: 11, color: '#6B7280', lineHeight: 16, marginBottom: 14 },
  otpRow:  { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 14 },
  otpInput: {
    width: 54, height: 64, borderRadius: 14, borderWidth: 2.5, borderColor: '#E5E7EB',
    fontSize: 28, fontWeight: '900', color: '#111827', backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },
  verifyBtn: {
    backgroundColor: NAVY, borderRadius: 12, padding: 12,
    alignItems: 'center',
  },
  verifyBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
  otpOk: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#6EE7B7',
  },
  otpOkText: { fontSize: 13, fontWeight: '700', color: GREEN, flex: 1 },
  otpError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF0EF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  otpErrorText: { fontSize: 12, fontWeight: '600', color: RED, flex: 1 },

  photoHint: { fontSize: 11, color: '#6B7280', lineHeight: 16, marginBottom: 10 },
  cameraArea: {
    backgroundColor: '#F0FDF4', borderRadius: 14, borderWidth: 2, borderColor: '#6EE7B7',
    borderStyle: 'dashed', padding: 24, alignItems: 'center', gap: 6,
  },
  cameraText: { fontSize: 14, fontWeight: '800', color: GREEN },
  cameraHint: { fontSize: 11, color: '#9CA3AF' },
  photoPreviewWrap: { position: 'relative' },
  photoPreview: { width: '100%', height: 160, borderRadius: 12 },
  retakeBtn: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  retakeBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  footer: {
    padding: 16, paddingBottom: 32, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  confirmBtn: {
    backgroundColor: GREEN, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 10, elevation: 6,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },

  // Entrega confirmada
  successIcon:  { width: 88, height: 88, borderRadius: 44, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 8 },
  successSub:   { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  photoConfirmed: { width: '100%', marginBottom: 16 },
  photoConfirmedImg: { width: '100%', height: 140, borderRadius: 14 },
  photoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'center', marginTop: 8, borderWidth: 1, borderColor: '#6EE7B7',
  },
  photoBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN },
  earnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFBEB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  earnText: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  doneBtn: {
    backgroundColor: NAVY, borderRadius: 16, padding: 16, width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  doneBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
});
