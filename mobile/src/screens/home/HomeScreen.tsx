import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

const SERVICES = [
  {
    icon: 'car',
    label: 'Transporte',
    color: '#0033A0',
    bg: '#EEF2FF',
    tab: 'Search',
  },
  {
    icon: 'bed',
    label: 'Alojamiento',
    color: '#059669',
    bg: '#ECFDF5',
    tab: 'Search',
  },
  {
    icon: 'ticket',
    label: 'Experiencias',
    color: '#D97706',
    bg: '#FFFBEB',
    tab: 'Search',
  },
  {
    icon: 'map',
    label: 'Tours',
    color: '#7C3AED',
    bg: '#F5F3FF',
    tab: 'Search',
  },
  {
    icon: 'cube',
    label: 'Envíos',
    color: '#DC2626',
    bg: '#FEF2F2',
    tab: 'Search',
  },
  {
    icon: 'calendar',
    label: 'Mis Reservas',
    color: '#0891B2',
    bg: '#ECFEFF',
    tab: 'Bookings',
  },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hola, {user?.firstName || 'Usuario'} 👋
          </Text>
          <Text style={styles.headerSub}>¿A dónde vamos hoy?</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]?.toUpperCase()}
            {user?.lastName?.[0]?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Ionicons name="location" size={24} color="#fff" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.bannerTitle}>Going Ecuador</Text>
          <Text style={styles.bannerSub}>
            Transporte, hospedaje y más en un solo lugar
          </Text>
        </View>
      </View>

      {/* Services grid */}
      <Text style={styles.sectionTitle}>Servicios</Text>
      <View style={styles.grid}>
        {SERVICES.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.card}
            onPress={() => navigation.navigate(s.tab)}
          >
            <View style={[styles.iconBg, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon as any} size={28} color={s.color} />
            </View>
            <Text style={styles.cardLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub: { fontSize: 14, color: '#666', marginTop: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0033A0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  banner: {
    marginHorizontal: 20,
    backgroundColor: '#0033A0',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  card: {
    width: '30%',
    margin: '1.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
