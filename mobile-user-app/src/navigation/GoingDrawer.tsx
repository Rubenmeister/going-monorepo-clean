/**
 * GoingDrawer — Custom drawer content
 * Side menu con perfil, historial, envíos, puntos, cuenta, SOS, academia
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/useAuthStore';

const RED   = '#C0392B';
const DARK  = '#1A1A2E';
const GRAY  = '#7F8C8D';
const BG    = '#F7F8FA';
const WHITE = '#FFFFFF';

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  screen: string;
  badge?: number;
  danger?: boolean;
};

const MAIN_ITEMS: MenuItem[] = [
  { icon: 'home-outline',         label: 'Inicio',               screen: 'Home' },
  { icon: 'time-outline',         label: 'Historial de viajes',  screen: 'Historial' },
  { icon: 'cube-outline',         label: 'Mis envíos',           screen: 'Envios',  badge: 0 },
  { icon: 'star-outline',         label: 'Mis puntos',           screen: 'Puntos' },
  { icon: 'map-outline',          label: 'Destinos y Tours',     screen: 'Tours' },
  { icon: 'sparkles-outline',     label: 'Experiencias',         screen: 'Experiences' },
  { icon: 'bed-outline',          label: 'Alojamiento',          screen: 'Accommodations' },
];

const ACCOUNT_ITEMS: MenuItem[] = [
  { icon: 'person-outline',       label: 'Mi perfil',            screen: 'EditProfile' },
  { icon: 'card-outline',         label: 'Métodos de pago',      screen: 'PaymentMethods' },
  { icon: 'notifications-outline',label: 'Notificaciones',       screen: 'NotificationSettings' },
  { icon: 'shield-outline',       label: 'Seguridad',            screen: 'Security' },
];

const MORE_ITEMS: MenuItem[] = [
  { icon: 'school-outline',       label: 'Academia Going',       screen: 'Academy' },
  { icon: 'document-text-outline',label: 'Legal y Términos',     screen: 'Terms' },
  { icon: 'help-circle-outline',  label: 'Ayuda y soporte',      screen: 'UserSupport' },
];

export function GoingDrawer(props: DrawerContentComponentProps) {
  const { user, logout } = useAuthStore();
  const { navigation } = props;

  const navigate = (screen: string) => {
    navigation.closeDrawer();
    // Navigate to the screen within the main stack
    (navigation as any).navigate(screen);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => { navigation.closeDrawer(); logout(); } },
    ]);
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'GO';
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Pasajero';

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
        color={item.danger ? RED : DARK}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuLabel, item.danger && { color: RED }]}>
        {item.label}
      </Text>
      {item.badge != null && item.badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ── Header / Profile ── */}
      <View style={styles.header}>
        {/* Logo Going — versión blanca sobre fondo rojo */}
        <Image
          source={require('../../assets/going-logo-horizontal-white.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
            <View style={styles.goldBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.goldText}>Going Gold</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Menu items ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.sectionLabel}>Principal</Text>
        {MAIN_ITEMS.map(renderItem)}

        <Text style={styles.sectionLabel}>Cuenta</Text>
        {ACCOUNT_ITEMS.map(renderItem)}

        <Text style={styles.sectionLabel}>Más</Text>
        {MORE_ITEMS.map(renderItem)}
      </ScrollView>

      {/* ── Footer: SOS + logout ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.sosBtn}
          onPress={() => navigate('Sos')}
          activeOpacity={0.8}
        >
          <Ionicons name="warning-outline" size={20} color={WHITE} />
          <Text style={styles.sosBtnText}>SOS Emergencias</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={RED} />
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
    backgroundColor: RED,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerLogo: {
    width: 150,
    height: 64,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: WHITE },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '800', color: WHITE },
  userEmail: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  goldText: { fontSize: 9, color: '#FFD700', fontWeight: '700' },

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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 3,
    borderRadius: 12,
  },
  menuItemDanger: { backgroundColor: '#FEF2F2' },
  menuIcon: { marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: DARK },

  badge: {
    backgroundColor: RED,
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
    gap: 8,
    backgroundColor: WHITE,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 12,
  },
  sosBtnText: { color: WHITE, fontWeight: '800', fontSize: 13 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  logoutText: { color: RED, fontWeight: '700', fontSize: 13 },
});
