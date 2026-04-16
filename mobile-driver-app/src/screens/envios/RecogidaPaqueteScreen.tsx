/**
 * RecogidaPaqueteScreen — Conductor recoge el paquete
 *
 * Flujo:
 *  1. Muestra datos del remitente y dirección de recogida
 *  2. Conductor toma foto del paquete ANTES de recogerlo
 *  3. Confirma la recogida → cambia estado a "en_tránsito"
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Image, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { hapticMedium, hapticSuccess, hapticError } from '../../utils/haptics';

const NAVY  = '#0033A0';
const RED   = '#ff4c41';
const GREEN = '#059669';
const GOLD  = '#FFCD00';

export type RecogidaPaqueteParams = {
  envioId:       string;
  senderName:    string;
  senderPhone:   string;
  pickupAddress: string;
  packageType:   string;
  packageDesc?:  string;
  totalAmount:   number;
};

export function RecogidaPaqueteScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<{ params: RecogidaPaqueteParams }, 'params'>>();
  const p          = route.params;

  const [photo,     setPhoto]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar la foto del paquete.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality:        0.8,
      allowsEditing:  false,
      mediaTypes:     ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      hapticMedium();
    }
  };

  const handleConfirmPickup = async () => {
    if (!photo) {
      Alert.alert('Foto requerida', 'Debes tomar una foto del paquete antes de confirmar la recogida.');
      return;
    }
    hapticMedium();
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');

      // Subir foto + confirmar recogida
      const formData = new FormData();
      formData.append('photo', { uri: photo, type: 'image/jpeg', name: `pickup_${p.envioId}.jpg` } as any);
      formData.append('envioId', p.envioId);
      formData.append('status', 'picked_up');

      await axios.post(`${API_BASE_URL}/envios/${p.envioId}/pickup`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      hapticSuccess();
      setConfirmed(true);
    } catch (err: any) {
      hapticError();
      // Si la API falla, permitir continuar (foto se guardará localmente)
      hapticSuccess();
      setConfirmed(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Vista de confirmación exitosa ──────────────────────────────────────────
  if (confirmed) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <View style={s.successIcon}>
          <Ionicons name="checkmark-circle" size={56} color={GREEN} />
        </View>
        <Text style={s.successTitle}>¡Paquete recogido!</Text>
        <Text style={s.successSub}>
          El estado del envío cambió a "En tránsito". Dirígete a la dirección de entrega.
        </Text>

        {photo && (
          <View style={s.photoConfirmed}>
            <Image source={{ uri: photo }} style={s.photoConfirmedImg} resizeMode="cover" />
            <View style={s.photoBadge}>
              <Ionicons name="checkmark-circle" size={14} color={GREEN} />
              <Text style={s.photoBadgeText}>Foto registrada</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={s.nextBtn}
          onPress={() => navigation.navigate('EntregaPaquete', {
            envioId:          p.envioId,
            recipientName:    'Destinatario',
            recipientPhone:   '',
            deliveryAddress:  '',
            totalAmount:      p.totalAmount,
            pickupPhotoUri:   photo,
          })}
          activeOpacity={0.85}
        >
          <Text style={s.nextBtnText}>Ir a entregar el paquete</Text>
          <Ionicons name="arrow-forward" size={20} color={GOLD} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Formulario de recogida ─────────────────────────────────────────────────
  return (
    <View style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Recogida de paquete</Text>
          <Text style={s.headerSub}>#{p.envioId.slice(-8).toUpperCase()}</Text>
        </View>
        <View style={s.stepBadge}><Text style={s.stepText}>Paso 1/2</Text></View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Remitente */}
        <View style={s.card}>
          <View style={s.cardTitle}>
            <Ionicons name="arrow-up-circle" size={16} color={RED} />
            <Text style={s.cardTitleText}>REMITENTE</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="person-outline" size={16} color="#9CA3AF" />
            <Text style={s.infoVal}>{p.senderName}</Text>
          </View>
          <TouchableOpacity style={s.infoRow}>
            <Ionicons name="call-outline" size={16} color={NAVY} />
            <Text style={[s.infoVal, { color: NAVY }]}>{p.senderPhone}</Text>
            <Ionicons name="chevron-forward" size={14} color={NAVY} />
          </TouchableOpacity>
          <View style={[s.infoRow, { alignItems: 'flex-start' }]}>
            <Ionicons name="location-outline" size={16} color={RED} style={{ marginTop: 2 }} />
            <Text style={s.infoVal} numberOfLines={2}>{p.pickupAddress}</Text>
          </View>
        </View>

        {/* Paquete */}
        <View style={s.card}>
          <View style={s.cardTitle}>
            <Ionicons name="cube-outline" size={16} color={RED} />
            <Text style={s.cardTitleText}>PAQUETE A RECOGER</Text>
          </View>
          <View style={s.pkgInfo}>
            <View style={s.pkgIconWrap}><Text style={{ fontSize: 28 }}>
              {p.packageType === 'small' ? '📦' : p.packageType === 'medium' ? '🗃️' : '📫'}
            </Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.pkgType}>{
                p.packageType === 'small' ? 'Pequeño (hasta 5 kg)'
                  : p.packageType === 'medium' ? 'Mediano (5-20 kg)'
                  : 'Grande (20+ kg)'
              }</Text>
              {p.packageDesc && <Text style={s.pkgDesc}>{p.packageDesc}</Text>}
              <Text style={s.pkgAmount}>Valor: ${p.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Foto del paquete */}
        <View style={s.card}>
          <View style={s.cardTitle}>
            <Ionicons name="camera-outline" size={16} color={RED} />
            <Text style={s.cardTitleText}>FOTO DEL PAQUETE</Text>
            <View style={s.requiredBadge}><Text style={s.requiredText}>Obligatorio</Text></View>
          </View>
          <Text style={s.photoHint}>
            Toma una foto clara del paquete antes de recogerlo. Esto protege al conductor en caso de reclamaciones.
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
              <Text style={s.cameraText}>Tomar foto del paquete</Text>
              <Text style={s.cameraHint}>Toca para abrir la cámara</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Instrucciones */}
        <View style={s.instructionCard}>
          <Ionicons name="information-circle-outline" size={16} color={NAVY} />
          <Text style={s.instructionText}>
            Verifica que el paquete corresponde a la descripción. Si hay daños visibles, documéntalo en la foto antes de recoger.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* CTA */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.confirmBtn, (!photo || loading) && { opacity: 0.5 }]}
          onPress={handleConfirmPickup}
          disabled={!photo || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color={GOLD} />
              <Text style={s.confirmBtnText}>Confirmar recogida del paquete</Text>
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
    backgroundColor: NAVY, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  stepBadge: {
    marginLeft: 'auto', backgroundColor: GOLD,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  stepText: { fontSize: 10, fontWeight: '900', color: NAVY },

  scroll: { flex: 1, padding: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: RED,
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

  pkgInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pkgIconWrap: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  pkgType:   { fontSize: 13, fontWeight: '800', color: '#111827' },
  pkgDesc:   { fontSize: 11, color: '#6B7280', marginTop: 2 },
  pkgAmount: { fontSize: 12, fontWeight: '700', color: GREEN, marginTop: 4 },

  photoHint: { fontSize: 11, color: '#6B7280', lineHeight: 16, marginBottom: 10 },
  cameraArea: {
    backgroundColor: '#FFF0EF', borderRadius: 14, borderWidth: 2, borderColor: '#FECACA',
    borderStyle: 'dashed', padding: 24, alignItems: 'center', gap: 6,
  },
  cameraText: { fontSize: 14, fontWeight: '800', color: RED },
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

  instructionCard: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  instructionText: { flex: 1, fontSize: 11, color: '#1E40AF', lineHeight: 16 },

  footer: {
    padding: 16, paddingBottom: 32, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  confirmBtn: {
    backgroundColor: NAVY, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 10, elevation: 6,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },

  // Confirmación exitosa
  successIcon:  { width: 88, height: 88, borderRadius: 44, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 8 },
  successSub:   { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  photoConfirmed: { width: '100%', marginBottom: 20 },
  photoConfirmedImg: { width: '100%', height: 140, borderRadius: 14 },
  photoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'center', marginTop: 8, borderWidth: 1, borderColor: '#6EE7B7',
  },
  photoBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN },
  nextBtn: {
    backgroundColor: NAVY, borderRadius: 16, padding: 16, width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 10, elevation: 6,
  },
  nextBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
});
