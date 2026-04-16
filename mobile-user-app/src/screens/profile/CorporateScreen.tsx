/**
 * CorporateScreen — Going Empresas
 *
 * Muestra el estado de la cuenta corporativa del usuario.
 * - Si no tiene cuenta: explica beneficios y permite solicitar acceso
 * - Si tiene cuenta: muestra info del plan, saldo corporativo y botón para viaje empresarial
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';

const BENEFITS = [
  { icon: 'diamond-outline',           text: 'Vehículos y conductores de categoría premium' },
  { icon: 'receipt-outline',           text: 'Facturación automática con comprobante SRI' },
  { icon: 'people-outline',            text: 'Panel de administración para tu empresa' },
  { icon: 'pricetag-outline',          text: 'Tarifas corporativas negociadas' },
  { icon: 'shield-checkmark-outline',  text: 'Conductores verificados y con seguro adicional' },
  { icon: 'stats-chart-outline',       text: 'Reportes de gastos mensuales' },
];

export function CorporateScreen() {
  const navigation   = useNavigation();
  const { user }     = useAuthStore();
  const isCorporate  = (user as any)?.corporateAccount?.active === true;
  const corporate    = (user as any)?.corporateAccount;

  const [loading, setLoading] = useState(false);

  const handleRequestAccess = async () => {
    setLoading(true);
    try {
      await api.post('/corporate/request-access', {
        userId:    user?.id,
        email:     user?.email,
        firstName: user?.firstName,
        lastName:  user?.lastName,
      });
      Alert.alert(
        '¡Solicitud enviada!',
        'Nuestro equipo revisará tu solicitud y te contactará en menos de 24 horas.',
        [{ text: 'OK' }]
      );
    } catch {
      // Fallback: abrir WhatsApp con mensaje pre-llenado
      const msg = encodeURIComponent(
        `Hola Going Empresas, me llamo ${user?.firstName ?? ''} ${user?.lastName ?? ''} y quiero solicitar una cuenta corporativa. Mi email: ${user?.email ?? ''}`
      );
      Linking.openURL(`https://wa.me/593XXXXXXXXX?text=${msg}`).catch(() =>
        Alert.alert('Error', 'No se pudo enviar la solicitud. Escríbenos a empresas@goingec.com')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        {/* Logo Going — versión blanca sobre fondo azul */}
        <Image
          source={require('../../../assets/going-logo-horizontal-white.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {isCorporate ? (
          /* ── USUARIO CON CUENTA CORPORATIVA ─────────────────────────── */
          <>
            <View style={styles.activeCard}>
              <View style={styles.activeCardTop}>
                <Ionicons name="business" size={28} color={GOING_YELLOW} />
                <View style={styles.activeCardInfo}>
                  <Text style={styles.activeCardName}>{corporate?.companyName ?? 'Mi empresa'}</Text>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>Cuenta Activa</Text>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.activeCardStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>${corporate?.balance?.toFixed(2) ?? '0.00'}</Text>
                  <Text style={styles.statLabel}>Saldo disponible</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{corporate?.monthlyTrips ?? 0}</Text>
                  <Text style={styles.statLabel}>Viajes este mes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>+30%</Text>
                  <Text style={styles.statLabel}>Nivel premium</Text>
                </View>
              </View>
            </View>

            {/* Solicitar viaje empresarial */}
            <TouchableOpacity
              style={styles.corporateRideBtn}
              onPress={() => navigation.navigate('Home' as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="briefcase-outline" size={20} color={GOING_BLUE} />
              <Text style={styles.corporateRideBtnText}>Solicitar viaje empresarial</Text>
              <Ionicons name="chevron-forward" size={18} color={GOING_BLUE} />
            </TouchableOpacity>

            {/* Abrir panel corporativo web */}
            <TouchableOpacity
              style={styles.portalBtn}
              onPress={() => Linking.openURL('https://corporate.goingec.com')}
              activeOpacity={0.8}
            >
              <Ionicons name="desktop-outline" size={18} color="#374151" />
              <View style={styles.portalBtnInfo}>
                <Text style={styles.portalBtnText}>Panel de administración</Text>
                <Text style={styles.portalBtnSub}>corporate.goingec.com</Text>
              </View>
              <Ionicons name="open-outline" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </>
        ) : (
          /* ── USUARIO SIN CUENTA CORPORATIVA ─────────────────────────── */
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.heroBadge}>
                <Ionicons name="business" size={40} color={GOING_YELLOW} />
              </View>
              <Text style={styles.heroTitle}>Movilidad para tu empresa</Text>
              <Text style={styles.heroSubtitle}>
                Gestiona todos los viajes corporativos de tu equipo desde un solo panel, con facturación automática y vehículos premium.
              </Text>
              <View style={styles.priceTag}>
                <Ionicons name="pricetag-outline" size={14} color={GOING_BLUE} />
                <Text style={styles.priceTagText}>Precio especial corporativo</Text>
              </View>
            </View>

            {/* Beneficios */}
            <Text style={styles.sectionTitle}>¿Qué incluye Going Empresas?</Text>
            {BENEFITS.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={styles.benefitIconBg}>
                  <Ionicons name={b.icon as any} size={18} color={GOING_BLUE} />
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
              onPress={handleRequestAccess}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={GOING_BLUE} />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color={GOING_BLUE} />
                  <Text style={styles.ctaBtnText}>Solicitar acceso corporativo</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.ctaNote}>
              Nuestro equipo te contactará en menos de 24 horas hábiles.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    backgroundColor: GOING_BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerLogo: { width: 100, height: 38 },

  body: { padding: 20, paddingBottom: 48 },

  // ── Activo ────────────────────────────────────────────────────────────
  activeCard: {
    backgroundColor: GOING_BLUE,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: GOING_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  activeCardTop:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  activeCardInfo: { flex: 1 },
  activeCardName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  activeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  activeDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  activeBadgeText:{ fontSize: 12, color: '#4ade80', fontWeight: '600' },
  divider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  activeCardStats:{ flexDirection: 'row', justifyContent: 'space-between' },
  statItem:       { flex: 1, alignItems: 'center' },
  statValue:      { fontSize: 20, fontWeight: '900', color: GOING_YELLOW },
  statLabel:      { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, textAlign: 'center' },
  statDivider:    { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  corporateRideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GOING_YELLOW,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  corporateRideBtnText: { flex: 1, fontSize: 15, fontWeight: '700', color: GOING_BLUE, marginLeft: 10 },

  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  portalBtnInfo:  { flex: 1 },
  portalBtnText:  { fontSize: 14, fontWeight: '600', color: '#374151' },
  portalBtnSub:   { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  // ── Sin cuenta ────────────────────────────────────────────────────────
  hero: { alignItems: 'center', marginBottom: 28, paddingTop: 8 },
  heroBadge: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: GOING_BLUE,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: GOING_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroTitle:    { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginTop: 10, paddingHorizontal: 10 },
  priceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${GOING_YELLOW}30`,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginTop: 14,
  },
  priceTagText: { fontSize: 13, fontWeight: '700', color: GOING_BLUE },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },

  benefitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  benefitIconBg: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: `${GOING_BLUE}12`,
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: GOING_YELLOW,
    borderRadius: 16, paddingVertical: 18,
    marginTop: 20, marginBottom: 12,
    shadowColor: GOING_YELLOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: GOING_BLUE },
  ctaNote:    { textAlign: 'center', fontSize: 12, color: '#9ca3af' },
});
