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
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useAuthStore } from '@store/useAuthStore';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Editar perfil', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'wallet-outline', label: 'Mi billetera Going', onPress: () => navigation.navigate('Wallet') },
    { icon: 'location-outline', label: 'Mis direcciones', onPress: () => navigation.navigate('SavedAddresses') },
    { icon: 'card-outline', label: 'Métodos de pago', onPress: () => navigation.navigate('PaymentMethods') },
    {
      icon: 'notifications-outline',
      label: 'Notificaciones',
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    { icon: 'shield-outline', label: 'Seguridad', onPress: () => navigation.navigate('Security') },
    {
      icon: 'help-circle-outline',
      label: 'Ayuda y soporte',
      onPress: () => navigation.navigate('UserSupport'),
    },
    {
      icon: 'document-text-outline',
      label: 'Términos y condiciones',
      onPress: () => navigation.navigate('Terms'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.heroSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? `${user.firstName[0]}${user.lastName[0]}` : 'GO'}
          </Text>
        </View>
        <Text style={styles.name}>
          {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Ionicons name="star" size={12} color="#FFCD00" />
          <Text style={styles.badgeText}>Pasajero Going</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map(({ icon, label, onPress }) => (
          <TouchableOpacity
            key={label}
            style={styles.menuItem}
            onPress={onPress}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={icon as any} size={20} color="#0033A0" />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Going v2.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  heroSection: {
    backgroundColor: '#0033A0',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    marginBottom: 20,
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
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#0033A0' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: '#FFCD00', fontSize: 12, fontWeight: '700' },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  version: {
    textAlign: 'center',
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 32,
  },
});
