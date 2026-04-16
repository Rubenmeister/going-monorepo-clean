/**
 * RateDriverScreen — Pantalla de calificación post-viaje
 *
 * Flujo:
 *  1. Muestra resumen del viaje (tarifa, distancia, duración)
 *  2. Thumbs up / down → tags contextuales
 *  3. Propina opcional (solo si thumbsUp)
 *  4. Comentario libre
 *  5. Submit → POST /rides/:rideId/rate + socket passenger:rate_driver
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const GOING_GREEN  = '#16a34a';
const GOING_RED    = '#ef4444';

// ── Params ────────────────────────────────────────────────────────────────────
export type RateDriverParams = {
  rideId:         string;
  driverId:       string;
  driverName:     string;
  // resumen del viaje (opcionales — vienen del evento ride:completed)
  fare?:          number;
  distanceKm?:    number;
  durationSeconds?: number;
  paymentMethod?: 'cash' | 'card' | 'wallet' | string;
};

// ── Tags ──────────────────────────────────────────────────────────────────────
const POSITIVE_TAGS = [
  { id: 'puntual',  label: 'Puntual',           icon: 'time-outline'              },
  { id: 'amable',   label: 'Amable',             icon: 'happy-outline'             },
  { id: 'limpio',   label: 'Vehículo limpio',    icon: 'sparkles-outline'          },
  { id: 'seguro',   label: 'Conducción segura',  icon: 'shield-checkmark-outline'  },
  { id: 'ruta',     label: 'Buena ruta',         icon: 'navigate-outline'          },
  { id: 'musica',   label: 'Buena música',       icon: 'musical-notes-outline'     },
];

const NEGATIVE_TAGS = [
  { id: 'tarde',    label: 'Llegó tarde',        icon: 'time-outline'              },
  { id: 'grosero',  label: 'Trato brusco',       icon: 'sad-outline'               },
  { id: 'sucio',    label: 'Vehículo sucio',     icon: 'warning-outline'           },
  { id: 'inseguro', label: 'Conducción insegura',icon: 'alert-circle-outline'      },
  { id: 'mal_ruta', label: 'Ruta incorrecta',    icon: 'close-circle-outline'      },
  { id: 'cobro',    label: 'Problema con cobro', icon: 'cash-outline'              },
];

const METHOD_LABEL: Record<string, string> = {
  cash:   'Efectivo',
  card:   'Tarjeta',
  wallet: 'Wallet',
};

// ─────────────────────────────────────────────────────────────────────────────

export function RateDriverScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RateDriverParams }, 'params'>>();
  const {
    rideId, driverId, driverName,
    fare, distanceKm, durationSeconds, paymentMethod,
  } = route.params;

  const { user } = useAuthStore();

  const [thumbsUp,    setThumbsUp]    = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment,     setComment]     = useState('');
  const [tip,         setTip]         = useState<0 | 1 | 2 | 5>(0);
  const [submitting,  setSubmitting]  = useState(false);

  const activeTags = thumbsUp === true ? POSITIVE_TAGS : thumbsUp === false ? NEGATIVE_TAGS : [];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDuration = (secs?: number) => {
    if (!secs) return null;
    const m = Math.round(secs / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`;
  };

  const handleThumb = (up: boolean) => {
    hapticLight();
    setThumbsUp(prev => prev === up ? null : up);
    setSelectedTags([]);
  };

  const toggleTag = (id: string) => {
    hapticLight();
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id],
    );
  };

  const handleTip = (amount: 0 | 1 | 2 | 5) => {
    hapticLight();
    setTip(prev => prev === amount ? 0 : amount);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Acabo de viajar con Going! 🚗 ${driverName} fue un excelente conductor. Descarga la app en goingec.com`,
      });
    } catch {}
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (thumbsUp === null) {
      Alert.alert('Calificación requerida', 'Selecciona 👍 o 👎 para continuar.');
      return;
    }
    setSubmitting(true);

    const rating = thumbsUp ? 5 : 1;
    const payload = {
      driverId,
      rating,
      thumbsUp,
      tags:    selectedTags,
      comment: comment.trim() || undefined,
      tip:     tip > 0 ? tip : undefined,
      passengerName: user?.name ?? undefined,
    };

    try {
      // HTTP endpoint (registro persistente)
      await api.post(`/rides/${rideId}/rate`, payload);
      hapticSuccess();
    } catch (err: any) {
      // Si falla el HTTP no bloqueamos — el pasajero ya viajó
      console.warn('Rating HTTP error:', err?.message);
    }

    hapticSuccess();
    const tipMsg = tip > 0 ? ` Le dejaste una propina de $${tip} a ${driverName} 🙌` : '';
    Alert.alert(
      '¡Gracias por calificar!',
      `Tu opinión ayuda a mejorar la experiencia.${tipMsg}`,
      [
        { text: 'Compartir', onPress: handleShare, style: 'default' },
        { text: 'Listo',     onPress: () => navigation.goBack()      },
      ],
    );
    setSubmitting(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const durationLabel = formatDuration(durationSeconds);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Resumen del viaje ─────────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCheck}>
            <Ionicons name="checkmark-circle" size={28} color={GOING_GREEN} />
            <Text style={styles.summaryTitle}>Viaje completado</Text>
          </View>

          <View style={styles.summaryRow}>
            {fare != null && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>${fare.toFixed(2)}</Text>
                <Text style={styles.summaryLabel}>
                  {paymentMethod ? METHOD_LABEL[paymentMethod] ?? paymentMethod : 'Total'}
                </Text>
              </View>
            )}
            {distanceKm != null && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{distanceKm.toFixed(1)} km</Text>
                <Text style={styles.summaryLabel}>Distancia</Text>
              </View>
            )}
            {durationLabel && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{durationLabel}</Text>
                <Text style={styles.summaryLabel}>Duración</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Conductor ─────────────────────────────────────────────────── */}
        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitials}>
              {driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.driverSubtitle}>¿Cómo estuvo tu viaje?</Text>
        </View>

        {/* ── Thumbs up / down ──────────────────────────────────────────── */}
        <View style={styles.thumbsRow}>
          <TouchableOpacity
            style={[
              styles.thumbBtn,
              thumbsUp === true  && styles.thumbBtnUpActive,
              thumbsUp === false && styles.thumbBtnInactive,
            ]}
            onPress={() => handleThumb(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={thumbsUp === true ? 'thumbs-up' : 'thumbs-up-outline'}
              size={38}
              color={thumbsUp === true ? '#fff' : GOING_GREEN}
            />
            <Text style={[styles.thumbLabel, thumbsUp === true && { color: '#fff' }]}>
              Bueno
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.thumbBtn,
              thumbsUp === false && styles.thumbBtnDownActive,
              thumbsUp === true  && styles.thumbBtnInactive,
            ]}
            onPress={() => handleThumb(false)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={thumbsUp === false ? 'thumbs-down' : 'thumbs-down-outline'}
              size={38}
              color={thumbsUp === false ? '#fff' : GOING_RED}
            />
            <Text style={[styles.thumbLabel, thumbsUp === false && { color: '#fff' }]}>
              Mejorable
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tags contextuales ─────────────────────────────────────────── */}
        {thumbsUp !== null && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>
              {thumbsUp ? '¿Qué te gustó?' : '¿Qué falló?'}
            </Text>
            <View style={styles.tagsGrid}>
              {activeTags.map(tag => {
                const selected    = selectedTags.includes(tag.id);
                const activeColor = thumbsUp ? GOING_BLUE : GOING_RED;
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagBtn,
                      selected && { backgroundColor: activeColor, borderColor: activeColor },
                    ]}
                    onPress={() => toggleTag(tag.id)}
                  >
                    <Ionicons
                      name={tag.icon as any}
                      size={14}
                      color={selected ? '#fff' : activeColor}
                    />
                    <Text style={[styles.tagText, { color: selected ? '#fff' : activeColor }]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Propina (solo thumbsUp) ───────────────────────────────────── */}
        {thumbsUp === true && (
          <View style={styles.tipSection}>
            <Text style={styles.tagsTitle}>Propina al conductor</Text>
            <Text style={styles.tipSubtitle}>100% va directo a {driverName.split(' ')[0]}</Text>
            <View style={styles.tipRow}>
              {([1, 2, 5] as const).map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.tipBtn, tip === amount && styles.tipBtnActive]}
                  onPress={() => handleTip(amount)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tipAmount, tip === amount && { color: '#fff' }]}>
                    ${amount}
                  </Text>
                  <Text style={[styles.tipLabel, tip === amount && { color: '#fff' }]}>
                    {amount === 1 ? 'Café ☕' : amount === 2 ? 'Gracias 🙏' : 'Excelente ⭐'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Comentario ────────────────────────────────────────────────── */}
        {thumbsUp !== null && (
          <View style={styles.commentSection}>
            <TextInput
              style={styles.commentInput}
              placeholder="Comentario adicional (opcional)"
              placeholderTextColor="#9CA3AF"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/300</Text>
          </View>
        )}

        {/* ── Botón enviar ──────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, thumbsUp === null && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={thumbsUp === null || submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Enviar calificación</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: GOING_BLUE,
  },
  skipText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

  body: { paddingBottom: 48 },

  // Resumen del viaje
  summaryCard: {
    backgroundColor: GOING_BLUE,
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 4,
  },
  summaryCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  summaryValue: { fontSize: 18, fontWeight: '900', color: GOING_YELLOW },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: '600' },

  // Conductor
  driverSection: { alignItems: 'center', paddingVertical: 24 },
  driverAvatar: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: GOING_BLUE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  driverInitials: { color: '#fff', fontWeight: '800', fontSize: 22 },
  driverName:     { fontSize: 18, fontWeight: '700', color: '#111827' },
  driverSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  // Thumbs
  thumbsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 16,
    paddingHorizontal: 24, marginBottom: 24,
  },
  thumbBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, borderRadius: 16,
    borderWidth: 2, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB', gap: 8,
  },
  thumbBtnUpActive:   { backgroundColor: GOING_GREEN, borderColor: GOING_GREEN },
  thumbBtnDownActive: { backgroundColor: GOING_RED,   borderColor: GOING_RED   },
  thumbBtnInactive:   { opacity: 0.4 },
  thumbLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },

  // Tags
  tagsSection: { paddingHorizontal: 20, marginBottom: 16 },
  tagsTitle:   { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  tagsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  tagText: { fontSize: 12, fontWeight: '600' },

  // Propina
  tipSection:  { paddingHorizontal: 20, marginBottom: 20 },
  tipSubtitle: { fontSize: 11, color: '#9CA3AF', marginBottom: 10 },
  tipRow:      { flexDirection: 'row', gap: 10 },
  tipBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  tipBtnActive: { backgroundColor: GOING_GREEN, borderColor: GOING_GREEN },
  tipAmount:    { fontSize: 18, fontWeight: '800', color: '#374151', marginBottom: 2 },
  tipLabel:     { fontSize: 10, fontWeight: '600', color: '#6B7280' },

  // Comentario
  commentSection: { paddingHorizontal: 20, marginBottom: 20 },
  commentInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    padding: 14, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
    minHeight: 80,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 12 },
  submitBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: GOING_BLUE,
  },
  submitBtnDisabled: { backgroundColor: '#D1D5DB' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
