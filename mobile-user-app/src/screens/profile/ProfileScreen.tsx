/**
 * ProfileScreen — Hub de perfil + cuenta (Mockup #16).
 *
 * Estructura:
 *   - Hero navy con avatar + name + email + level badge
 *   - Stats row (Viajes / Puntos / Rating)
 *   - Going Rewards card (link a #17 Puntos)
 *   - 3 secciones de menú:
 *     · MI CUENTA: Editar, Direcciones, Métodos pago, Wallet
 *     · ACTIVIDAD: Historial, Puntos, Envíos, Empresas (condicional)
 *     · CONFIGURACIÓN: Apariencia, Voz, Notif, Seguridad, Soporte, Legal
 *   - Logout
 *
 * Theme adaptative. Hero navy se MANTIENE (identity del perfil).
 *
 * REFIT 2026-05-23:
 *   - Theme tokens (antes hardcoded NAVY/GOLD)
 *   - Stats reales del user.rideCount/points/rating si vienen del backend
 *     (fallback 0 marcado como TODO endpoint /users/me/stats)
 *   - Level calculado real (Explorador/Viajero/Aventurero según puntos)
 *   - Versión desde Constants.expoConfig (antes "v2.0.0" hardcoded)
 *   - Modal APARIENCIA funcional (Sistema/Claro/Oscuro) — wire al
 *     ThemeProvider.setMode con persistencia AsyncStorage
 *   - Entry VOZ GOING agregada (honest stub — TODO VoiceSettingsScreen)
 *   - Going Empresas condicional: visible solo si user.companyId
 *
 * TODOs declarados:
 *   - Endpoint backend /users/me/stats para rideCount/points/rating reales
 *   - VoiceSettingsScreen con picker Kore/Despina/Charon/Algenib +
 *     persistencia AsyncStorage + sync con customer-support al iniciar voz
 *   - "Vincular empresa" flow si user no tiene companyId
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import Constants from 'expo-constants';
import { useAuthStore } from '@store/useAuthStore';
import { authAPI } from '@services/api';
import { useTheme, type ThemeTokens, type ThemeMode } from '../../theme';
import { hapticLight } from '../../utils/haptics';
import { tierFromPoints } from '../../catalog';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ── Versión de la app desde expo-constants ────────────────────────────────────
const APP_VERSION  = Constants.expoConfig?.version || '';
const BUILD_NUMBER =
  Constants.expoConfig?.android?.versionCode ??
  (Constants.expoConfig as any)?.ios?.buildNumber ??
  '';

type MenuItem = {
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  label:   string;
  /** Si está, navega al route. Si no, dispara onPress. */
  screen?: keyof MainStackParamList | string;
  onPress?: () => void;
  /** Solo se renderiza si esta función devuelve true (default: siempre). */
  visible?: () => boolean;
  /** Color hint del ícono (default: brandNavy). */
  accent?: 'navy' | 'success' | 'warning' | 'red' | 'purple';
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout, setUser } = useAuthStore();
  const { tokens, isDark, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [showAppearance, setShowAppearance] = useState(false);

  // Refrescar perfil al abrir
  useEffect(() => {
    authAPI.me()
      .then(({ data }) => { if (data && setUser) setUser(data); })
      .catch(() => {});
  }, []);

  // Stats: si el backend manda en user, los usamos; sino default 0.
  // TODO: endpoint /users/me/stats explícito con counts agregados.
  const rideCount = (user as any)?.rideCount ?? 0;
  const points    = (user as any)?.points ?? 0;
  const rating    = (user as any)?.rating ?? 5.0;
  // tier viene del catalog canónico (consistente con PuntosScreen #17)
  const { current: tierCurrent, next: tierNext } = tierFromPoints(points);
  const hasCompany = !!(user as any)?.companyId;

  const initials = useMemo(() => {
    if (!user) return 'GO';
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0]  ?? '';
    return `${f}${l}`.toUpperCase() || 'GO';
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  const handleVoiceSettings = useCallback(() => {
    hapticLight();
    Alert.alert(
      'Voz Going — Próximamente',
      'Pronto podrás elegir la voz del asistente Going entre Kore (femenina), Despina (femenina), Charon (masculino) o Algenib (masculino) cuando uses chat o llamada de voz.',
      [{ text: 'OK' }],
    );
  }, []);

  const handleEmpresas = useCallback(() => {
    hapticLight();
    if (hasCompany) {
      navigation.navigate('Corporate');
    } else {
      Alert.alert(
        'Vincular empresa',
        '¿Tu empresa tiene cuenta corporativa Going? Contacta a tu administrador o escribe a empresas@goingec.com para vincular tu correo y acceder a precios B2B.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Contactar', onPress: () => {} }, // TODO: open mailto
        ],
      );
    }
  }, [hasCompany, navigation]);

  // ── Menu sections ──────────────────────────────────────────
  const MENU_SECTIONS: MenuSection[] = useMemo(() => [
    {
      title: 'Mi cuenta',
      items: [
        { icon: 'person-outline',   label: 'Editar perfil',      screen: 'EditProfile',    accent: 'navy' },
        { icon: 'location-outline', label: 'Mis direcciones',    screen: 'SavedAddresses', accent: 'navy' },
        { icon: 'card-outline',     label: 'Métodos de pago',    screen: 'PaymentMethods', accent: 'navy' },
        { icon: 'wallet-outline',   label: 'Mi billetera Going', screen: 'Wallet',         accent: 'navy' },
      ],
    },
    {
      title: 'Actividad',
      items: [
        { icon: 'time-outline',     label: 'Historial de viajes', screen: 'Historial', accent: 'success' },
        { icon: 'star-outline',     label: 'Mis puntos Going',    screen: 'Puntos',    accent: 'warning' },
        { icon: 'cube-outline',     label: 'Mis envíos',          screen: 'Envios',    accent: 'red'     },
        {
          icon: 'business-outline',
          label: hasCompany ? 'Going Empresas' : 'Vincular empresa',
          onPress: handleEmpresas,
          accent: 'purple',
        },
      ],
    },
    {
      title: 'Configuración',
      items: [
        {
          icon: isDark ? 'moon-outline' : 'sunny-outline',
          label: `Apariencia · ${mode === 'system' ? 'Sistema' : mode === 'dark' ? 'Oscuro' : 'Claro'}`,
          onPress: () => { hapticLight(); setShowAppearance(true); },
          accent: 'navy',
        },
        {
          icon: 'mic-outline',
          label: 'Voz Going',
          onPress: handleVoiceSettings,
          accent: 'navy',
        },
        { icon: 'notifications-outline',   label: 'Notificaciones',         screen: 'NotificationSettings', accent: 'navy' },
        { icon: 'shield-outline',          label: 'Seguridad',              screen: 'Security',            accent: 'navy' },
        { icon: 'help-circle-outline',     label: 'Ayuda y soporte',        screen: 'UserSupport',         accent: 'navy' },
        { icon: 'document-text-outline',   label: 'Términos y condiciones', screen: 'Terms',               accent: 'navy' },
        { icon: 'shield-checkmark-outline',label: 'Política de privacidad', screen: 'Privacy',             accent: 'navy' },
      ],
    },
  ], [hasCompany, handleEmpresas, handleVoiceSettings, isDark, mode]);

  // Map accent → token color
  const accentColor = (a?: MenuItem['accent']) => {
    switch (a) {
      case 'success': return tokens.success;
      case 'warning': return tokens.warning;
      case 'red':     return tokens.brandRed;
      case 'purple':  return '#7C3AED';  // Going Empresas — color marcador único
      case 'navy':
      default:        return tokens.brandNavy;
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── HERO NAVY ──────────────────────────────────────── */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.85}
          accessibilityLabel="Editar perfil"
        >
          <Text style={styles.avatarText}>{initials}</Text>
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={10} color={tokens.brandNavy} />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>
          {user ? `${user.firstName} ${user.lastName}` : 'Viajero Going'}
        </Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelIcon}>{tierCurrent.icon}</Text>
          <Text style={styles.levelText}>{tierCurrent.name}</Text>
        </View>
      </View>

      {/* ── STATS ──────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{rideCount}</Text>
          <Text style={styles.statLbl}>Viajes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{points}</Text>
          <Text style={styles.statLbl}>Puntos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{rating.toFixed(1)}</Text>
          <Text style={styles.statLbl}>Rating</Text>
        </View>
      </View>

      {/* ── REWARDS CARD ───────────────────────────────────── */}
      <TouchableOpacity
        style={styles.rewardsCard}
        onPress={() => navigation.navigate('Puntos')}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardsLabel}>GOING REWARDS</Text>
          <Text style={styles.rewardsPoints}>
            {points} <Text style={styles.rewardsPtText}>pts</Text>
          </Text>
          {tierNext && (
            <Text style={styles.rewardsTier}>
              {(tierNext.min - points).toLocaleString('es-EC')} pts para subir a {tierNext.name}
            </Text>
          )}
        </View>
        <Ionicons name="medal-outline" size={36} color="rgba(255,255,255,0.30)" />
      </TouchableOpacity>

      {/* ── MENU SECTIONS ──────────────────────────────────── */}
      {MENU_SECTIONS.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, i) => {
              const isLast = i === section.items.length - 1;
              const ac = accentColor(item.accent);
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                  onPress={() => {
                    if (item.onPress) item.onPress();
                    else if (item.screen) (navigation.navigate as any)(item.screen);
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel={item.label}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${ac}14` }]}>
                    <Ionicons name={item.icon} size={19} color={ac} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={tokens.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* ── LOGOUT ─────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        accessibilityLabel="Cerrar sesión"
      >
        <Ionicons name="log-out-outline" size={18} color={tokens.error} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>
        Going Ecuador {APP_VERSION ? `v${APP_VERSION}` : ''}{BUILD_NUMBER ? ` (${BUILD_NUMBER})` : ''}
      </Text>
      <View style={{ height: 40 }} />

      {/* ── Modal APARIENCIA ───────────────────────────────── */}
      <Modal
        visible={showAppearance}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAppearance(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAppearance(false)}
        >
          <View style={styles.modalSheet}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Apariencia</Text>
              <Text style={styles.modalSub}>
                Cómo se ve la app. Cambia al instante.
              </Text>
              {([
                { id: 'system' as ThemeMode, label: 'Sistema', desc: 'Sigue el modo del dispositivo', icon: 'phone-portrait-outline' as const },
                { id: 'light'  as ThemeMode, label: 'Claro',   desc: 'Fondo blanco, mejor con sol',     icon: 'sunny-outline' as const },
                { id: 'dark'   as ThemeMode, label: 'Oscuro',  desc: 'Fondo negro, menos fatiga',       icon: 'moon-outline' as const },
              ]).map(opt => {
                const active = mode === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.appearOpt, active && styles.appearOptActive]}
                    onPress={async () => {
                      hapticLight();
                      await setMode(opt.id);
                      setShowAppearance(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.appearIcon, active && styles.appearIconActive]}>
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={active ? tokens.textOnNavy : tokens.brandNavy}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appearLbl, active && styles.appearLblActive]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.appearDesc}>{opt.desc}</Text>
                    </View>
                    {active && (
                      <Ionicons name="checkmark-circle" size={22} color={tokens.brandNavy} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // ── HERO navy ──────────────────────────────────────────
    hero: {
      backgroundColor: t.brandNavy,
      alignItems: 'center',
      paddingTop: 60,
      paddingBottom: 28,
      paddingHorizontal: 16,
    },
    avatar: {
      width: 84, height: 84, borderRadius: 42,
      backgroundColor: t.brandYellow,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
      position: 'relative',
    },
    avatarText: {
      fontSize: 30, fontWeight: '900', color: t.textOnYellow,
    },
    editBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: t.brandNavy,
    },
    name: {
      fontSize: 22, fontWeight: '900',
      color: t.textOnNavy, marginBottom: 4, letterSpacing: -0.3,
    },
    email: {
      fontSize: 13, color: 'rgba(255,255,255,0.70)',
      marginBottom: 10,
    },
    levelBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 5,
    },
    levelIcon: { fontSize: 14 },
    levelText: {
      fontSize: 12, fontWeight: '800',
      color: t.brandYellow, letterSpacing: 0.3,
    },

    // ── Stats row (overlaps hero slightly) ─────────────────
    statsRow: {
      flexDirection: 'row',
      backgroundColor: t.bgLayer,
      marginHorizontal: 16, marginTop: -1,
      borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: t.glassBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 8, elevation: 3,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statVal: {
      fontSize: 22, fontWeight: '900',
      color: t.brandNavy, letterSpacing: -0.5,
    },
    statLbl: {
      fontSize: 11, color: t.textTertiary,
      marginTop: 2, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    statDivider: {
      width: 1, backgroundColor: t.border, marginVertical: 4,
    },

    // ── Rewards card ───────────────────────────────────────
    rewardsCard: {
      marginHorizontal: 16, marginTop: 14,
      backgroundColor: t.brandNavyDark,
      borderRadius: 16, padding: 18,
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
    },
    rewardsLabel: {
      fontSize: 10, fontWeight: '900',
      color: t.brandYellow, letterSpacing: 1.5,
      marginBottom: 4,
    },
    rewardsPoints: {
      fontSize: 28, fontWeight: '900',
      color: t.textOnNavy, letterSpacing: -0.5,
    },
    rewardsPtText: {
      fontSize: 14, fontWeight: '700',
      color: 'rgba(255,255,255,0.6)',
    },
    rewardsTier: {
      fontSize: 11, fontWeight: '600',
      color: 'rgba(255,255,255,0.65)',
      marginTop: 4,
    },

    // ── Menu sections ──────────────────────────────────────
    section: { marginTop: 20, paddingHorizontal: 16 },
    sectionTitle: {
      fontSize: 11, fontWeight: '800',
      color: t.textTertiary,
      letterSpacing: 1.2, textTransform: 'uppercase',
      marginBottom: 8, marginLeft: 4,
    },
    sectionCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: t.glassBorder,
    },
    menuItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14, paddingHorizontal: 16, gap: 12,
    },
    menuItemBorder: {
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    menuIcon: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    menuLabel: {
      flex: 1, fontSize: 14, fontWeight: '700',
      color: t.textPrimary,
    },

    // ── Logout ─────────────────────────────────────────────
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 10,
      backgroundColor: `${t.error}10`,
      marginHorizontal: 16, marginTop: 20,
      borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: `${t.error}30`,
    },
    logoutText: {
      fontSize: 14, fontWeight: '800',
      color: t.error,
    },

    version: {
      textAlign: 'center', fontSize: 11,
      color: t.textTertiary, marginTop: 16,
      fontWeight: '600',
    },

    // ── Modal Apariencia ──────────────────────────────────
    modalBackdrop: {
      flex: 1, justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalSheet: {
      backgroundColor: t.bg,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: 36,
    },
    modalHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: t.border,
      alignSelf: 'center', marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20, fontWeight: '900',
      color: t.textPrimary, letterSpacing: -0.3,
    },
    modalSub: {
      fontSize: 13, color: t.textTertiary,
      marginTop: 4, marginBottom: 18,
    },
    appearOpt: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 14, paddingHorizontal: 14,
      borderRadius: 14, marginBottom: 8,
      borderWidth: 1.5, borderColor: t.border,
      backgroundColor: t.bgLayer,
    },
    appearOptActive: {
      borderColor: t.brandNavy,
      backgroundColor: `${t.brandNavy}08`,
    },
    appearIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: t.glass,
      alignItems: 'center', justifyContent: 'center',
    },
    appearIconActive: { backgroundColor: t.brandNavy },
    appearLbl: {
      fontSize: 15, fontWeight: '800',
      color: t.textPrimary,
    },
    appearLblActive: { color: t.brandNavy },
    appearDesc: {
      fontSize: 12, color: t.textTertiary,
      marginTop: 2, fontWeight: '500',
    },
  });
}
