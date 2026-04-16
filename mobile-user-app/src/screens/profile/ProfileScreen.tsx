import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useAuthStore } from '@store/useAuthStore';
import { authAPI } from '@services/api';

const NAVY = '#0033A0';
const GOLD = '#FFCD00';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const MENU_SECTIONS = [
  {
    title: 'MI CUENTA',
    items: [
      { icon: 'person-outline',        label: 'Editar perfil',         screen: 'EditProfile',           color: NAVY },
      { icon: 'location-outline',      label: 'Mis direcciones',       screen: 'SavedAddresses',        color: NAVY },
      { icon: 'card-outline',          label: 'Métodos de pago',       screen: 'PaymentMethods',        color: NAVY },
      { icon: 'wallet-outline',        label: 'Mi billetera Going',    screen: 'Wallet',                color: NAVY },
    ],
  },
  {
    title: 'ACTIVIDAD',
    items: [
      { icon: 'time-outline',          label: 'Historial de viajes',   screen: 'Historial',             color: '#059669' },
      { icon: 'star-outline',          label: 'Mis puntos Going',      screen: 'Puntos',                color: '#D97706' },
      { icon: 'cube-outline',          label: 'Mis envíos',            screen: 'Envios',                color: '#ff4c41' },
      { icon: 'business-outline',      label: 'Going Empresas',        screen: 'Corporate',             color: '#7C3AED' },
    ],
  },
  {
    title: 'CONFIGURACIÓN',
    items: [
      { icon: 'notifications-outline', label: 'Notificaciones',        screen: 'NotificationSettings',  color: NAVY },
      { icon: 'shield-outline',        label: 'Seguridad',             screen: 'Security',              color: NAVY },
      { icon: 'help-circle-outline',   label: 'Ayuda y soporte',       screen: 'UserSupport',           color: NAVY },
      { icon: 'document-text-outline', label: 'Términos y condiciones',screen: 'Terms',                 color: NAVY },
      { icon: 'shield-checkmark-outline',label: 'Política de privacidad',screen: 'Privacy',             color: NAVY },
    ],
  },
];

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout, setUser } = useAuthStore();

  useEffect(() => {
    authAPI.me().then(({ data }) => { if (data && setUser) setUser(data); }).catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}` : 'GO';

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* HERO */}
      <View style={s.hero}>
        <View style={s.heroTop}>
          <Image source={require('../../../assets/going-logo-horizontal-white.png')} style={s.logo} resizeMode="contain" />
        </View>
        <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={s.avatarText}>{initials.toUpperCase()}</Text>
          <View style={s.editBadge}><Ionicons name="pencil" size={10} color={NAVY} /></View>
        </TouchableOpacity>
        <Text style={s.name}>{user ? `${user.firstName} ${user.lastName}` : 'Viajero Going'}</Text>
        <Text style={s.email}>{user?.email ?? ''}</Text>
        <View style={s.levelBadge}>
          <Ionicons name="star" size={11} color={GOLD} />
          <Text style={s.levelText}>Explorador · Nivel 1</Text>
        </View>
      </View>

      {/* STATS */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statVal}>0</Text>
          <Text style={s.statLbl}>Viajes</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal}>0</Text>
          <Text style={s.statLbl}>Puntos</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal}>5.0</Text>
          <Text style={s.statLbl}>Rating</Text>
        </View>
      </View>

      {/* REWARDS CARD */}
      <TouchableOpacity style={s.rewardsCard} onPress={() => navigation.navigate('Puntos')}>
        <View>
          <Text style={s.rewardsLabel}>GOING REWARDS</Text>
          <Text style={s.rewardsPoints}>0 <Text style={s.rewardsPtText}>puntos</Text></Text>
        </View>
        <Ionicons name="medal-outline" size={36} color="rgba(255,255,255,0.30)" />
      </TouchableOpacity>

      {/* MENU SECTIONS */}
      {MENU_SECTIONS.map(section => (
        <View key={section.title} style={s.section}>
          <Text style={s.sectionTitle}>{section.title}</Text>
          <View style={s.sectionCard}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[s.menuItem, i < section.items.length - 1 && s.menuItemBorder]}
                onPress={() => navigation.navigate(item.screen as any)}
                activeOpacity={0.7}
              >
                <View style={[s.menuIcon, { backgroundColor: `${item.color}12` }]}>
                  <Ionicons name={item.icon as any} size={19} color={item.color} />
                </View>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* LOGOUT */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={s.version}>Going Ecuador v2.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  hero: { backgroundColor: NAVY, alignItems: 'center', paddingBottom: 28 },
  heroTop: { width: '100%', alignItems: 'flex-end', paddingTop: 52, paddingRight: 20, paddingBottom: 12 },
  logo: { width: 110, height: 38 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', position: 'relative' },
  avatarText: { fontSize: 30, fontWeight: '900', color: NAVY },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: NAVY },
  name: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  levelText: { fontSize: 12, fontWeight: '700', color: GOLD },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900', color: NAVY },
  statLbl: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
  rewardsCard: { marginHorizontal: 16, marginTop: 14, backgroundColor: '#1E3A5F', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rewardsLabel: { fontSize: 10, fontWeight: '800', color: GOLD, letterSpacing: 1.5, marginBottom: 4 },
  rewardsPoints: { fontSize: 28, fontWeight: '900', color: '#fff' },
  rewardsPtText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 20, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  version: { textAlign: 'center', fontSize: 12, color: '#D1D5DB', marginTop: 16 },
});
