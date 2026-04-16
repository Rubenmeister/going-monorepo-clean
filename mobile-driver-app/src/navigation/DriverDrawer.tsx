/**
 * DriverDrawer — Sidebar del conductor
 *
 * Items: Perfil, Mis Viajes, Wallet, Documentos, Calificaciones, Academia Going
 * Cabecera NAVY con logo blanco y datos del conductor
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { type DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '@store/useDriverStore';

const NAVY   = '#0033A0';
const YELLOW = '#FFCD00';
const WHITE  = '#FFFFFF';
const GRAY   = '#6B7280';
const BG     = '#F7F8FA';
const DARK   = '#111827';

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  screen: string;
  badge?: number;
  danger?: boolean;
};

const MAIN_ITEMS: MenuItem[] = [
  { icon: 'car-outline',              label: 'Panel principal',    screen: 'Tabs' },
  { icon: 'time-outline',             label: 'Mis Viajes',         screen: 'TripHistory' },
  { icon: 'wallet-outline',           label: 'Wallet',             screen: 'Wallet' },
];

const DRIVER_ITEMS: MenuItem[] = [
  { icon: 'document-text-outline',    label: 'Mis Documentos',     screen: 'Documents' },
  { icon: 'star-outline',             label: 'Calificaciones',     screen: 'Ratings' },
  { icon: 'school-outline',           label: 'Academia Going',     screen: 'Academia' },
];

const ACCOUNT_ITEMS: MenuItem[] = [
  { icon: 'person-outline',           label: 'Mi Perfil',          screen: 'Profile' },
  { icon: 'help-circle-outline',      label: 'Soporte Going',      screen: 'Support' },
];

export function DriverDrawer(props: DrawerContentComponentProps) {
  const { driver } = useDriverStore();
  const { navigation } = props;

  const navigate = (screen: string) => {
    navigation.closeDrawer();
    if (screen === 'Tabs') {
      (navigation as any).navigate('Tabs');
    } else if (screen === 'Profile') {
      (navigation as any).navigate('Tabs', { screen: 'Profile' });
    } else {
      (navigation as any).navigate(screen);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          navigation.closeDrawer();
          useDriverStore.getState().logout?.();
        },
      },
    ]);
  };

  const initials = driver
    ? `${driver.firstName?.[0] ?? ''}${driver.lastName?.[0] ?? ''}`.toUpperCase()
    : 'CO';
  const fullName = driver
    ? `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim()
    : 'Conductor';
  const rating = (driver as any)?.rating ?? 4.9;

  const renderItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.screen}
      style={[styles.menuItem, item.danger && styles.menuItemDanger]}
      onPress={() => navigate(item.screen)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={item.danger ? '#DC2626' : NAVY}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuLabel, item.danger && { color: '#DC2626' }]}>
        {item.label}
      </Text>
      {item.badge != null && item.badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Logo text */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>GOING</Text>
          </View>
          <View style={styles.conductorBadge}>
            <Ionicons name="car" size={10} color={NAVY} />
            <Text style={styles.conductorText}>CONDUCTOR</Text>
          </View>
        </View>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{driver?.email ?? ''}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color={YELLOW} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.ratingLabel}> · Conductor verificado</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Menu ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.sectionLabel}>Principal</Text>
        {MAIN_ITEMS.map(renderItem)}

        <Text style={styles.sectionLabel}>Mi actividad</Text>
        {DRIVER_ITEMS.map(renderItem)}

        <Text style={styles.sectionLabel}>Cuenta</Text>
        {ACCOUNT_ITEMS.map(renderItem)}
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },

  // Header
  header: {
    backgroundColor: NAVY,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  logoBox: {
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: NAVY,
    letterSpacing: 3,
  },
  conductorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  conductorText: {
    fontSize: 8,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: NAVY },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '800', color: WHITE },
  userEmail: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: YELLOW,
    marginLeft: 3,
  },
  ratingLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  // Scroll
  scroll: { flex: 1, backgroundColor: BG },

  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: GRAY,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 3,
    borderRadius: 12,
  },
  menuItemDanger: { backgroundColor: '#FEF2F2' },
  menuIcon: { marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: DARK },

  badge: {
    backgroundColor: NAVY,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginRight: 6,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: WHITE },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 12,
    backgroundColor: WHITE,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
});
