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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const GOING_GREEN  = '#16a34a';
const GOING_RED    = '#ef4444';

export type RateDriverParams = {
  rideId: string;
  driverId: string;
  driverName: string;
};

// Tags positivos (pulgar arriba)
const POSITIVE_TAGS = [
  { id: 'puntual',    label: 'Puntual',              icon: 'time-outline' },
  { id: 'amable',     label: 'Amable',               icon: 'happy-outline' },
  { id: 'limpio',     label: 'Vehículo limpio',      icon: 'sparkles-outline' },
  { id: 'seguro',     label: 'Conducción segura',    icon: 'shield-checkmark-outline' },
  { id: 'ruta',       label: 'Buena ruta',           icon: 'navigate-outline' },
  { id: 'musica',     label: 'Buena música',         icon: 'musical-notes-outline' },
];

// Tags negativos (pulgar abajo)
const NEGATIVE_TAGS = [
  { id: 'tarde',      label: 'Llegó tarde',          icon: 'time-outline' },
  { id: 'grosero',    label: 'Trato brusco',         icon: 'sad-outline' },
  { id: 'sucio',      label: 'Vehículo sucio',       icon: 'warning-outline' },
  { id: 'inseguro',   label: 'Conducción insegura',  icon: 'alert-circle-outline' },
  { id: 'mal_ruta',   label: 'Ruta incorrecta',      icon: 'close-circle-outline' },
  { id: 'cobro',      label: 'Problema con cobro',   icon: 'cash-outline' },
];

export function RateDriverScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RateDriverParams }, 'params'>>();
  const { rideId, driverId, driverName } = route.params;
  const { user } = useAuthStore();

  // null = sin selección, true = thumbs up, false = thumbs down
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeTags = thumbsUp === true ? POSITIVE_TAGS : thumbsUp === false ? NEGATIVE_TAGS : [];

  const handleThumb = (up: boolean) => {
    if (thumbsUp === up) {
      // deseleccionar
      setThumbsUp(null);
    } else {
      setThumbsUp(up);
    }
    setSelectedTags([]);
  };

  const toggleTag = (id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (thumbsUp === null) {
      Alert.alert('Calificación requerida', 'Por favor selecciona 👍 o 👎 para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      // Convertimos thumbs a rating numérico: 5 = thumbs up, 1 = thumbs down
      const rating = thumbsUp ? 5 : 1;
      await api.post(`/transport/${rideId}/rate`, {
        userId: user?.id,
        driverId,
        rating,
        thumbsUp,
        tags: selectedTags,
        comment: comment.trim() || undefined,
      });
      Alert.alert('¡Gracias!', 'Tu calificación ha sido enviada.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo enviar la calificación. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Califica tu viaje</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Driver info */}
        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitials}>
              {driverName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.driverSubtitle}>¿Cómo estuvo tu viaje?</Text>
        </View>

        {/* Thumbs up / down */}
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
              size={40}
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
              size={40}
              color={thumbsUp === false ? '#fff' : GOING_RED}
            />
            <Text style={[styles.thumbLabel, thumbsUp === false && { color: '#fff' }]}>
              Mejorable
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tags */}
        {thumbsUp !== null && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>
              {thumbsUp ? '¿Qué te gustó?' : '¿Qué falló?'}
            </Text>
            <View style={styles.tagsGrid}>
              {activeTags.map(tag => {
                const selected = selectedTags.includes(tag.id);
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
                      size={15}
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

        {/* Comentario */}
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

        {/* Enviar */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, thumbsUp === null && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={thumbsUp === null || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Enviar calificación</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: GOING_BLUE,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  skipText:    { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  body: { paddingBottom: 40 },

  driverSection: { alignItems: 'center', paddingVertical: 28 },
  driverAvatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: GOING_BLUE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  driverInitials: { color: '#fff', fontWeight: '800', fontSize: 24 },
  driverName:     { fontSize: 18, fontWeight: '700', color: '#111827' },
  driverSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  // Thumbs
  thumbsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
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
  thumbBtnInactive:   { opacity: 0.45 },
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

  // Comentario
  commentSection: { paddingHorizontal: 20, marginBottom: 20 },
  commentInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    padding: 14, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
    minHeight: 80,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  footer: { paddingHorizontal: 20, paddingBottom: 36 },
  submitBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: GOING_BLUE,
  },
  submitBtnDisabled: { backgroundColor: '#D1D5DB' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
