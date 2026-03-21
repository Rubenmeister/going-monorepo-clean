import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.goingec.com';

interface Document {
  id: string;
  type: 'cedula' | 'licencia' | 'matricula' | 'soat';
  status: 'pending' | 'approved' | 'rejected' | 'missing';
  imageUrl?: string;
  expiresAt?: string;
  rejectedReason?: string;
}

const DOC_CONFIG: Record<string, { label: string; icon: string; description: string }> = {
  cedula:    { label: 'Cédula de Identidad',    icon: 'card-outline',           description: 'Documento de identificación vigente' },
  licencia:  { label: 'Licencia de Conducir',   icon: 'id-card-outline',        description: 'Licencia profesional tipo C o superior' },
  matricula: { label: 'Matrícula del Vehículo',  icon: 'car-outline',            description: 'Matrícula vigente del vehículo registrado' },
  soat:      { label: 'SOAT',                    icon: 'shield-checkmark-outline', description: 'Seguro obligatorio de accidentes de tránsito' },
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Aprobado',    color: '#059669', bg: '#ECFDF5' },
  pending:  { label: 'En revisión', color: '#D97706', bg: '#FFFBEB' },
  rejected: { label: 'Rechazado',   color: '#DC2626', bg: '#FEF2F2' },
  missing:  { label: 'Pendiente',   color: '#6B7280', bg: '#F3F4F6' },
};

export function DocumentsScreen() {
  const navigation = useNavigation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const { data } = await axios.get(`${API_BASE}/drivers/me/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const docs: Document[] = Array.isArray(data) ? data : data?.documents ?? [];

      // Rellenar documentos faltantes
      const types = ['cedula', 'licencia', 'matricula', 'soat'] as const;
      const result = types.map(type => {
        const existing = docs.find(d => d.type === type);
        return existing ?? { id: `new-${type}`, type, status: 'missing' as const };
      });
      setDocuments(result);
    } catch {
      // Si falla, mostrar todos como pendientes
      setDocuments([
        { id: 'new-cedula', type: 'cedula', status: 'missing' },
        { id: 'new-licencia', type: 'licencia', status: 'missing' },
        { id: 'new-matricula', type: 'matricula', status: 'missing' },
        { id: 'new-soat', type: 'soat', status: 'missing' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (docType: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir documentos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (result.canceled) return;

      setUploading(docType);
      const token = await AsyncStorage.getItem('driver_token');
      const formData = new FormData();
      const asset = result.assets[0];
      formData.append('document', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `${docType}.jpg`,
      } as any);
      formData.append('type', docType);

      await axios.post(`${API_BASE}/drivers/me/documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Documento enviado', 'Tu documento está siendo revisado.');
      fetchDocuments();
    } catch {
      Alert.alert('Error', 'No se pudo subir el documento. Intenta de nuevo.');
    } finally {
      setUploading(null);
    }
  };

  const completedCount = documents.filter(d => d.status === 'approved').length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOING_BLUE} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Ionicons name="documents-outline" size={22} color={GOING_BLUE} />
          <Text style={styles.progressTitle}>Documentación</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(completedCount / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedCount}/4 documentos aprobados
        </Text>
      </View>

      {/* Document cards */}
      {documents.map(doc => {
        const config = DOC_CONFIG[doc.type];
        const badge = STATUS_BADGE[doc.status];
        const isUploading = uploading === doc.type;

        return (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docHeader}>
              <View style={styles.docIconWrap}>
                <Ionicons name={config.icon as any} size={22} color={GOING_BLUE} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>{config.label}</Text>
                <Text style={styles.docDesc}>{config.description}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>

            {doc.status === 'rejected' && doc.rejectedReason && (
              <View style={styles.rejectedRow}>
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.rejectedText}>{doc.rejectedReason}</Text>
              </View>
            )}

            {doc.expiresAt && doc.status === 'approved' && (
              <Text style={styles.expiresText}>
                Vence: {new Date(doc.expiresAt).toLocaleDateString('es-EC')}
              </Text>
            )}

            {(doc.status === 'missing' || doc.status === 'rejected') && (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => handleUpload(doc.type)}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                    <Text style={styles.uploadText}>
                      {doc.status === 'rejected' ? 'Subir de nuevo' : 'Subir documento'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Progress
  progressCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  progressBar: {
    height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', marginBottom: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: GOING_BLUE },
  progressText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

  // Document card
  docCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  docDesc: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  rejectedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, padding: 8, borderRadius: 8, backgroundColor: '#FEF2F2',
  },
  rejectedText: { fontSize: 12, color: '#DC2626', flex: 1 },

  expiresText: { fontSize: 12, color: '#6B7280', marginTop: 8, marginLeft: 56 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: GOING_BLUE,
  },
  uploadText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
