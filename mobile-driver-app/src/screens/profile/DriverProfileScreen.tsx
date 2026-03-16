import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverMainStackParamList } from '../../navigation/DriverMainNavigator';
import { useDriverStore } from '@store/useDriverStore';

export function DriverProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DriverMainStackParamList>>();
  const { driver, logout } = useDriverStore();

  const handleLogout = () =>
    Alert.alert('Cerrar sesión', '¿Confirmas que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);

  const info = [
    { icon: 'mail-outline', label: 'Correo', value: driver?.email || 'N/A' },
    {
      icon: 'car-outline',
      label: 'Vehículo',
      value: driver?.vehiclePlate || 'N/A',
    },
    {
      icon: 'star-outline',
      label: 'Calificación',
      value: `${driver?.rating?.toFixed(1) || '5.0'} ⭐`,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {driver ? `${driver.firstName[0]}${driver.lastName[0]}` : 'DR'}
          </Text>
        </View>
        <Text style={styles.name}>
          {driver ? `${driver.firstName} ${driver.lastName}` : 'Conductor'}
        </Text>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.verifiedText}>Conductor verificado</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        {info.map(({ icon, label, value }) => (
          <View key={label} style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name={icon as any} size={18} color="#0033A0" />
            </View>
            <View>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.menu}>
        {[
          { icon: 'document-text-outline', label: 'Mis documentos', route: 'Documents' as const },
          { icon: 'star-outline',          label: 'Mis calificaciones', route: 'Ratings' as const },
          { icon: 'help-circle-outline',   label: 'Soporte Going', route: 'Support' as const },
        ].map(({ icon, label, route }) => (
          <TouchableOpacity key={label} style={styles.menuItem} onPress={() => navigation.navigate(route)}>
            <Ionicons
              name={icon as any}
              size={20}
              color="#0033A0"
              style={styles.menuIcon}
            />
            <Text style={styles.menuLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
      <Text style={styles.version}>Going Conductor v2.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: {
    backgroundColor: '#001F6B',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFCD00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#001F6B' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  verifiedText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    marginTop: 2,
  },
  menu: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: { marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: '#D1D5DB', fontSize: 12, margin: 24 },
});
