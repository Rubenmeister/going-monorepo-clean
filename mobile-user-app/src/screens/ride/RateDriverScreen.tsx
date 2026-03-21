import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';

export type RateDriverParams = {
  rideId: string;
  driverId: string;
  driverName: string;
};

const RATING_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

const QUICK_TAGS = [
  { id: 'puntual',    label: 'Puntual',           icon: 'time-outline' },
  { id: 'amable',     label: 'Amable',            icon: 'happy-outline' },
  { id: 'limpio',     label: 'Vehículo limpio',   icon: 'sparkles-outline' },
  { id: 'seguro',     label: 'Conducción segura', icon: 'shield-checkmark-outline' },
  { id: 'ruta',       label: 'Buena ruta',        icon: 'navigate-outline' },
  { id: 'musica',     label: 'Buena música',      icon: 'musical-notes-outline' },
];

export function RateDriverScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RateDriverParams }, 'params'>>();
  const { rideId, driverId, driverName } = route.params;
  const { user } = useAuthStore();

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (id: string) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona una calificación con estrellas.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/transport/${rideId}/rate`, {
        userId: user?.id,
        driverId,
        rating,
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

  const handleSkip = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Califica tu viaje</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

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

      {/* Stars */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={44}
              color={star <= rating ? GOING_YELLOW : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
      )}

      {/* Quick tags */}
      {rating > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.tagsTitle}>¿Qué te gustó?</Text>
          <View style={styles.tagsGrid}>
            {QUICK_TAGS.map(tag => {
              const selected = selectedTags.includes(tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tagBtn, selected && styles.tagBtnSelected]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <Ionicons
                    name={tag.icon as any}
                    size={16}
                    color={selected ? '#fff' : GOING_BLUE}
                  />
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Comment */}
      {rating > 0 && (
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

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Enviar calificación</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: GOING_BLUE,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  skipText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  // Driver
  driverSection: { alignItems: 'center', paddingVertical: 24 },
  driverAvatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: GOING_BLUE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  driverInitials: { color: '#fff', fontWeight: '800', fontSize: 24 },
  driverName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  driverSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  // Stars
  starsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8,
  },
  ratingLabel: {
    textAlign: 'center', fontSize: 15, fontWeight: '700', color: GOING_BLUE, marginBottom: 16,
  },

  // Tags
  tagsSection: { paddingHorizontal: 20, marginBottom: 16 },
  tagsTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  tagBtnSelected: {
    backgroundColor: GOING_BLUE, borderColor: GOING_BLUE,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: GOING_BLUE },
  tagTextSelected: { color: '#fff' },

  // Comment
  commentSection: { paddingHorizontal: 20, marginBottom: 16 },
  commentInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    padding: 14, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
    minHeight: 80,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 36, marginTop: 'auto' },
  submitBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: GOING_BLUE,
  },
  submitBtnDisabled: { backgroundColor: '#D1D5DB' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
