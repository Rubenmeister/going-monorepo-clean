/**
 * OnboardingScreen — Going Ecuador
 *
 * 3 PRODUCTOS BÁSICOS:
 *   1. Compartido — SUV interurbano, hasta 7 pasajeros
 *   2. Privado    — SUV / SUV Premium, hasta 4 pasajeros
 *   3. Envíos     — paquete en SUV mismo día
 *
 * Tiers (display brand): Confort | Premium
 *
 * Theme: ADAPTATIVO (light + dark) — usa useTheme() del provider raíz.
 * Tokens semánticos para que ambos modos funcionen sin tocar lógica de
 * componentes. La foto se ve bien en ambos modos porque siempre tiene
 * overlay oscuro para legibilidad del eyebrow/icon flotante.
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  useWindowDimensions, Animated, FlatList, StatusBar, Image,
  type ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import {
  analyticsOnboardingStart,
  analyticsOnboardingFinish,
  analyticsOnboardingSkip,
} from '../../utils/analytics';
import { useTheme, type ThemeTokens } from '../../theme';

const ONBOARDING_KEY = 'going_onboarding_done';

// ── Slides: 3 productos core ───────────────────────────────────────────────
type Slide = {
  id: 'compartido' | 'privado' | 'envios';
  photo: any;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  eyebrow: string;
  headline: string;
  subtitle: string;
  tiers?: Array<{ name: 'Confort' | 'Premium'; subline: string }>;
  // (decisión de marca 2026-05-23 rev): Premium en lugar de Lujo.
  stat: { value: string; label: string };
};

const SLIDES: Slide[] = [
  {
    id: 'compartido',
    photo: require('../../../assets/2.suvxl.jpg'),
    icon: 'people',
    eyebrow: 'Producto · 01',
    headline: 'Comparte.\nDivide. Ahorra.',
    subtitle: 'Hasta 7 pasajeros en SUV. Paga solo tu asiento. Conecta las ciudades del Ecuador con vecinos de viaje.',
    tiers: [
      { name: 'Confort', subline: 'SUV estándar' },
      { name: 'Premium',    subline: 'SUV de gama alta' },
    ],
    stat: { value: '50+', label: 'ciudades conectadas' },
  },
  {
    id: 'privado',
    photo: require('../../../assets/suv premium.jpg'),
    icon: 'car-sport',
    eyebrow: 'Producto · 02',
    headline: 'Tu SUV.\nTu espacio.',
    subtitle: 'Hasta 4 pasajeros. Conductor verificado, precio fijo desde el inicio, sin sorpresas.',
    tiers: [
      { name: 'Confort', subline: 'SUV estándar' },
      { name: 'Premium',    subline: 'Gama alta + amenities' },
    ],
    stat: { value: '6 min', label: 'tiempo promedio de llegada' },
  },
  {
    id: 'envios',
    photo: require('../../../assets/entrega.png'),
    icon: 'cube',
    eyebrow: 'Producto · 03',
    headline: 'Tu paquete.\nMismo día.',
    subtitle: 'Envío entre ciudades en SUV o SUV XL. Tracking en tiempo real, llega antes del fin del día.',
    stat: { value: '< 24h', label: 'entre ciudades principales' },
  },
];

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { width, height } = useWindowDimensions();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => { analyticsOnboardingStart(); }, []);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = async () => {
    analyticsOnboardingSkip(currentIndex);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Login');
  };

  const handleGetStarted = async () => {
    analyticsOnboardingFinish();
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Register');
  };

  const isLast = currentIndex === SLIDES.length - 1;

  // ── Logo brand: blanco sobre dark, negro sobre light ─────
  const logoSource = isDark
    ? require('../../../assets/going-logo-white.png')
    : require('../../../assets/going-logo-white.png'); // TODO: cuando exista going-logo-dark.png, usar ese acá. Por ahora blanco siempre (legible en ambos modos gracias al overlay oscuro sobre la foto).

  // ── Render de slide ────────────────────────────────────────
  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      {/* Photo backdrop — top 55%. SIEMPRE tiene overlay oscuro para
          legibilidad del eyebrow/icon flotantes, sin importar el theme. */}
      <View style={[styles.photoWrap, { height: height * 0.55 }]}>
        <Image source={item.photo} style={styles.photo} resizeMode="cover" />

        {/* Stacked dark gradient simulado */}
        <View pointerEvents="none" style={[styles.photoOverlay, styles.photoOverlayTop]} />
        <View pointerEvents="none" style={[styles.photoOverlay, styles.photoOverlayMid]} />
        <View pointerEvents="none" style={[styles.photoOverlay, styles.photoOverlayBot]} />

        {/* HUD corners neon — solo decoración */}
        <View pointerEvents="none" style={[styles.hudCorner, styles.hudTopLeft]} />
        <View pointerEvents="none" style={[styles.hudCorner, styles.hudTopRight]} />

        {/* Eyebrow chip */}
        <View style={styles.eyebrowChip}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>{item.eyebrow}</Text>
        </View>

        {/* Icon glow */}
        <View style={styles.iconBadge}>
          <View style={styles.iconBadgeGlow} />
          <Ionicons name={item.icon} size={26} color={tokens.neonCyan} />
        </View>
      </View>

      {/* Glass card */}
      <View style={[styles.card, { minHeight: height * 0.42 }]}>
        <View style={styles.cardBorderTop} />

        <Text style={styles.headline}>{item.headline}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>

        {item.tiers && (
          <View style={styles.tierRow}>
            {item.tiers.map((t) => (
              <View
                key={t.name}
                style={[
                  styles.tierBadge,
                  t.name === 'Premium' && styles.tierBadgePremium,
                ]}
              >
                <View style={styles.tierLabelRow}>
                  {t.name === 'Premium' && (
                    <Ionicons name="diamond" size={11} color={tokens.premiumBorder} />
                  )}
                  <Text
                    style={[
                      styles.tierName,
                      t.name === 'Premium' && styles.tierNamePremium,
                    ]}
                  >
                    {t.name}
                  </Text>
                </View>
                <Text style={styles.tierSubline}>{t.subline}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stat */}
        <View style={styles.statRow}>
          <View style={styles.statBar} />
          <View style={styles.statTexts}>
            <Text style={styles.statValue}>{item.stat.value}</Text>
            <Text style={styles.statLabel}>{item.stat.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Logo Going — siempre blanco porque vive sobre la foto con overlay oscuro */}
      <View style={styles.logoOverlay} pointerEvents="none">
        <Image
          source={logoSource}
          style={styles.onboardingLogo}
          resizeMode="contain"
        />
      </View>

      {/* Slides con swipe HABILITADO */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: false,
            listener: (e: any) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              if (idx !== currentIndex) setCurrentIndex(idx);
            },
          }
        )}
        scrollEventThrottle={16}
      />

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        <View style={styles.btnRow}>
          {!isLast ? (
            <>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
                accessibilityLabel="Omitir y entrar a iniciar sesión"
              >
                <Text style={styles.skipText}>Omitir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={handleNext}
                accessibilityLabel="Siguiente"
              >
                <Text style={styles.nextBtnText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={18} color={tokens.textInverse} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.lastBtns}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleSkip}
                accessibilityLabel="Ya tengo cuenta"
              >
                <Text style={styles.loginBtnText}>Ya tengo cuenta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.registerBtn}
                onPress={handleGetStarted}
                accessibilityLabel="Comenzar y crear cuenta"
              >
                <Text style={styles.registerBtnText}>Comenzar</Text>
                <Ionicons name="arrow-forward" size={16} color={tokens.textInverse} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };

// ─────────────────────────────────────────────────────────────
// Styles factory — recibe tokens del theme actual + flag isDark.
// Memoizado en el componente con useMemo([tokens, isDark]).
// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    logoOverlay: {
      position: 'absolute',
      top: 48,
      left: 20,
      zIndex: 10,
    },
    onboardingLogo: {
      width: 100,
      height: 40,
    },

    slide: { flex: 1, backgroundColor: t.bg },

    // ── Photo backdrop ──────────────────────────────────────
    photoWrap: {
      width: '100%',
      backgroundColor: t.bgLayer,
      overflow: 'hidden',
      position: 'relative',
    },
    photo: { width: '100%', height: '100%' },

    // Overlay siempre con tono oscuro para legibilidad del eyebrow/icon,
    // sin importar el modo del theme (las fotos en sí son a color natural).
    photoOverlay: { position: 'absolute', left: 0, right: 0 },
    photoOverlayTop: {
      top: 0, height: 80,
      backgroundColor: 'rgba(10,14,26,0.55)',
    },
    photoOverlayMid: {
      bottom: 90, height: 120,
      backgroundColor: 'rgba(10,14,26,0.45)',
    },
    // Hard cut al color del card — fusión sin gradient
    photoOverlayBot: {
      bottom: 0, height: 90,
      backgroundColor: t.bg,
    },

    hudCorner: {
      position: 'absolute',
      width: 28, height: 28,
      borderColor: t.neonCyan,
      opacity: isDark ? 0.55 : 0.75,
    },
    hudTopLeft: {
      top: 110, left: 20,
      borderTopWidth: 1.5, borderLeftWidth: 1.5,
    },
    hudTopRight: {
      top: 110, right: 20,
      borderTopWidth: 1.5, borderRightWidth: 1.5,
    },

    eyebrowChip: {
      position: 'absolute',
      top: 110, left: '50%',
      transform: [{ translateX: -52 }],
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(0,0,0,0.45)',  // siempre dark — sobre foto
      borderWidth: 1, borderColor: `${t.neonCyan}55`,
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 999,
    },
    eyebrowDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: t.neonCyan,
    },
    eyebrowText: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      color: t.neonCyan, textTransform: 'uppercase',
    },

    iconBadge: {
      position: 'absolute',
      bottom: 110, left: 24,
      width: 56, height: 56,
      borderRadius: 16,
      backgroundColor: 'rgba(10,14,26,0.85)',  // siempre dark sobre la foto
      borderWidth: 1, borderColor: `${t.neonCyan}66`,
      alignItems: 'center', justifyContent: 'center',
    },
    iconBadgeGlow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
      backgroundColor: `${t.neonCyan}10`,
    },

    // ── Glass card ─────────────────────────────────────────
    card: {
      flex: 1,
      backgroundColor: t.bg,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 160,
    },
    cardBorderTop: {
      position: 'absolute',
      top: 0, left: '20%', right: '20%',
      height: 1,
      backgroundColor: `${t.neonCyan}55`,
    },

    headline: {
      fontSize: 32, fontWeight: '900',
      color: t.textPrimary,
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14, lineHeight: 21,
      color: t.textSecondary,
      marginTop: 12,
    },

    tierRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },
    tierBadge: {
      flex: 1,
      backgroundColor: t.confortBg,
      borderWidth: 1,
      borderColor: t.confortBorder,
      borderRadius: 12,
      paddingHorizontal: 12, paddingVertical: 10,
    },
    tierBadgePremium: {
      borderColor: t.premiumBorder,
      backgroundColor: t.premiumBg,
    },
    tierLabelRow: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    tierName: {
      fontSize: 13, fontWeight: '800',
      color: t.textPrimary,
      letterSpacing: 0.5,
    },
    tierNamePremium: {
      color: t.premiumText,
    },
    tierSubline: {
      fontSize: 10, fontWeight: '500',
      color: t.textTertiary,
      marginTop: 2,
    },

    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 24,
    },
    statBar: {
      width: 3, height: 40,
      backgroundColor: t.neonCyan,
      borderRadius: 2,
    },
    statTexts: { flex: 1 },
    statValue: {
      fontSize: 22, fontWeight: '900',
      color: t.textPrimary,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 11, fontWeight: '500',
      color: t.textTertiary,
      textTransform: 'lowercase',
      marginTop: 2,
    },

    // ── Bottom bar ─────────────────────────────────────────
    bottomBar: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36,
      backgroundColor: t.bg,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 20,
    },
    dot: {
      height: 6,
      borderRadius: 3,
      backgroundColor: t.neonCyan,
    },

    btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    skipBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    skipText: {
      color: t.textTertiary,
      fontSize: 14, fontWeight: '600',
      letterSpacing: 0.3,
    },
    nextBtn: {
      flex: 2, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: t.neonCyan,
      paddingVertical: 16, borderRadius: 14,
      shadowColor: t.neonCyan,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, shadowRadius: 12,
      elevation: 6,
    },
    nextBtnText: {
      fontSize: 15, fontWeight: '900',
      color: t.textInverse,
      letterSpacing: 0.3,
    },

    lastBtns: { flex: 1, gap: 12 },
    loginBtn: {
      paddingVertical: 14, borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: t.glassBorder,
    },
    loginBtnText: {
      color: t.textSecondary,
      fontSize: 14, fontWeight: '700',
    },
    registerBtn: {
      flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: t.neonCyan,
      paddingVertical: 16, borderRadius: 14,
      shadowColor: t.neonCyan,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, shadowRadius: 12,
      elevation: 6,
    },
    registerBtnText: {
      color: t.textInverse,
      fontSize: 16, fontWeight: '900',
      letterSpacing: 0.3,
    },
  });
}
