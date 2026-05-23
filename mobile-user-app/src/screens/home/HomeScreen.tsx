/**
 * HomeScreen — Going Ecuador
 *
 * Dashboard limpio (mockup #5 canónico): greeting + 3 cards de productos
 * core (Compartido / Privado / Envíos) + sugerencias rápidas (rutas
 * recientes y destacadas opcionales).
 *
 * REFACTOR 2026-05-23 (task #45):
 *   Antes: monolito de 1322 líneas que combinaba dashboard + map + cities
 *          picker + zones + booking sheet + 30 states.
 *   Ahora: ~280 líneas. Catalog (cities/zones/routes/pricing/vehicles)
 *          extraído a src/catalog/. Map vive en LocationPickerScreen
 *          (acceso vía SharedRideBooking → LocationPicker).
 *
 * Theme: ADAPTATIVO light + dark. Brand navy + yellow accents.
 *
 * NAVIGATION desde cada card:
 *   Compartido → SharedRideBooking (route ya existente, abre flow completo)
 *   Privado    → PrivateRideBooking
 *   Envíos     → Envios
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/useAuthStore';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useTheme, type ThemeTokens } from '../../theme';
import {
  loadRecentRoutes,
  type RecentRoute,
} from '../../catalog';
import { analyticsScreen, analyticsFeaturedRouteSelected } from '../../utils/analytics';
import { hapticLight } from '../../utils/haptics';

type Nav = NativeStackNavigationProp<MainStackParamList>;

/** Saludo según hora local del device. */
function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** 3 productos core que se muestran en el home — orden fijo. */
type ProductCard = {
  id: 'compartido' | 'privado' | 'envios';
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  popular?: boolean;
  navigate: (nav: Nav) => void;
};

const PRODUCTS: ProductCard[] = [
  {
    id: 'compartido',
    title: 'Viaje Compartido',
    subtitle: 'Paga solo tu asiento',
    icon: 'people',
    popular: true,
    navigate: (nav) => nav.navigate('SharedRideBooking', {}),
  },
  {
    id: 'privado',
    title: 'Viaje Privado',
    subtitle: 'Vehículo exclusivo',
    icon: 'car-sport',
    navigate: (nav) => nav.navigate('PrivateRideBooking', {}),
  },
  {
    id: 'envios',
    title: 'Envíos',
    subtitle: 'De punto a punto',
    icon: 'cube',
    navigate: (nav) => nav.navigate('Envios'),
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);
  useEffect(() => {
    loadRecentRoutes().then(setRecentRoutes);
    analyticsScreen('Home');
  }, []);

  const greeting = useMemo(timeOfDayGreeting, []);
  const firstName = user?.firstName ?? 'viajero';

  const handleProductTap = useCallback((product: ProductCard) => {
    hapticLight();
    product.navigate(navigation);
  }, [navigation]);

  const handleRecentTap = useCallback((r: RecentRoute) => {
    hapticLight();
    analyticsFeaturedRouteSelected(`${r.origin} → ${r.destination}`);
    if (r.tripMode === 'compartido') {
      navigation.navigate('SharedRideBooking', { originStop: r.origin });
    } else {
      navigation.navigate('PrivateRideBooking', {});
    }
  }, [navigation]);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent backgroundColor="transparent"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar: logo + menu ─────────────────────────────── */}
        <View style={styles.topBar}>
          <Image
            source={
              isDark
                ? require('../../../assets/going-logo-horizontal-white.png')
                : require('../../../assets/going-logo-horizontal-white.png')
            }
            style={[styles.logo, !isDark && { tintColor: tokens.textPrimary }]}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('Profile' as never)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Abrir menú de perfil"
          >
            <Ionicons name="menu" size={24} color={tokens.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Greeting ─────────────────────────────────────────── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingLine}>
            {greeting},
          </Text>
          <Text style={styles.greetingName}>
            {firstName} <Text style={styles.wave}>👋</Text>
          </Text>
          <Text style={styles.greetingSub}>¿A dónde vamos hoy?</Text>
        </View>

        {/* ── 3 PRODUCT CARDS ──────────────────────────────────── */}
        <View style={styles.cardsBlock}>
          {PRODUCTS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.productCard, p.popular && styles.productCardPopular]}
              onPress={() => handleProductTap(p)}
              activeOpacity={0.85}
              accessibilityLabel={`${p.title}: ${p.subtitle}`}
            >
              {p.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              )}
              <View style={styles.productCardIcon}>
                <Ionicons name={p.icon} size={28} color={tokens.brandNavy} />
              </View>
              <View style={styles.productCardInfo}>
                <Text style={styles.productCardTitle}>{p.title}</Text>
                <Text style={styles.productCardSub}>{p.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={tokens.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Mis Viajes Recientes (si hay) ─────────────────────── */}
        {recentRoutes.length > 0 && (
          <View style={styles.recentBlock}>
            <Text style={styles.sectionTitle}>Tus viajes recientes</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentRoutes.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.recentCard}
                  onPress={() => handleRecentTap(r)}
                  activeOpacity={0.85}
                >
                  <View style={styles.recentCardHeader}>
                    <Ionicons
                      name={r.tripMode === 'compartido' ? 'people' : 'car-sport'}
                      size={14}
                      color={tokens.brandNavy}
                    />
                    <Text style={styles.recentCardMode}>
                      {r.tripMode === 'compartido' ? 'Compartido' : 'Privado'}
                    </Text>
                  </View>
                  <Text style={styles.recentCardRoute} numberOfLines={2}>
                    {r.origin} → {r.destination}
                  </Text>
                  <Text style={styles.recentCardPrice}>${r.price.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Espacio inferior para safe area / tab bar */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    scroll: {
      paddingTop: 48,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
    },
    logo: { width: 110, height: 36 },
    menuBtn: {
      width: 40, height: 40,
      borderRadius: 12,
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      alignItems: 'center', justifyContent: 'center',
    },

    // ── Greeting ───────────────────────────────────────────
    greetingBlock: { marginBottom: 28 },
    greetingLine: {
      fontSize: 14,
      color: t.textSecondary,
      fontWeight: '600',
    },
    greetingName: {
      fontSize: 28,
      fontWeight: '900',
      color: t.textPrimary,
      letterSpacing: -0.5,
      marginTop: 2,
    },
    wave: { fontSize: 24 },
    greetingSub: {
      fontSize: 14,
      color: t.textTertiary,
      marginTop: 8,
    },

    // ── Product cards ──────────────────────────────────────
    cardsBlock: { gap: 12 },
    productCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: t.bgLayer,
      borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 18,
      paddingVertical: 18, paddingHorizontal: 16,
      // Sombra sutil (más visible en dark)
      shadowColor: t.brandNavyDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.4 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      position: 'relative',
    },
    productCardPopular: {
      borderColor: t.brandYellow,
      borderWidth: 1.5,
    },
    popularBadge: {
      position: 'absolute',
      top: -8, right: 12,
      backgroundColor: t.brandYellow,
      borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 2,
    },
    popularBadgeText: {
      fontSize: 9, fontWeight: '900',
      color: t.textOnYellow,
      letterSpacing: 1,
    },
    productCardIcon: {
      width: 52, height: 52,
      borderRadius: 14,
      backgroundColor: `${t.brandNavy}12`,
      alignItems: 'center', justifyContent: 'center',
    },
    productCardInfo: { flex: 1 },
    productCardTitle: {
      fontSize: 16, fontWeight: '800',
      color: t.textPrimary,
      letterSpacing: -0.2,
    },
    productCardSub: {
      fontSize: 12, fontWeight: '500',
      color: t.textTertiary,
      marginTop: 2,
    },

    // ── Recent routes ──────────────────────────────────────
    recentBlock: { marginTop: 32 },
    sectionTitle: {
      fontSize: 13, fontWeight: '800',
      color: t.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    recentScroll: { gap: 10, paddingRight: 10 },
    recentCard: {
      width: 180,
      backgroundColor: t.bgLayer,
      borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 14,
      padding: 14,
    },
    recentCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    recentCardMode: {
      fontSize: 10, fontWeight: '800',
      color: t.brandNavy,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    recentCardRoute: {
      fontSize: 13, fontWeight: '700',
      color: t.textPrimary,
      marginTop: 8,
      lineHeight: 18,
    },
    recentCardPrice: {
      fontSize: 16, fontWeight: '900',
      color: t.textPrimary,
      marginTop: 8,
      letterSpacing: -0.3,
    },
  });
}
