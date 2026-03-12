import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = `${user?.firstName?.[0] ?? ''}${
    user?.lastName?.[0] ?? ''
  }`.toUpperCase();

  const MENU = [
    { icon: 'person-outline', label: 'Datos personales', action: () => {} },
    {
      icon: 'notifications-outline',
      label: 'Notificaciones',
      action: () => {},
    },
    { icon: 'card-outline', label: 'Métodos de pago', action: () => {} },
    { icon: 'shield-outline', label: 'Seguridad', action: () => {} },
    { icon: 'help-circle-outline', label: 'Ayuda y soporte', action: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Avatar */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.roles?.includes('admin') && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Admin</Text>
          </View>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {MENU.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={item.action}
          >
            <Ionicons name={item.icon as any} size={22} color="#0033A0" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* App info */}
      <Text style={styles.version}>Going v1.0.0 — goingec.com</Text>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0033A0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  badge: {
    marginTop: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: '#0033A0', fontWeight: '700', fontSize: 12 },
  menu: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151' },
  version: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },
});
