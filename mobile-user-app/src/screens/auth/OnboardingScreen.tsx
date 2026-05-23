/**
 * OnboardingScreen — Going Ecuador
 *
 * Reorientado a los 3 PRODUCTOS BÁSICOS de la empresa:
 *   1. Compartido — SUV interurbano, hasta 7 pasajeros, paga solo tu asiento
 *   2. Privado    — SUV/SUV-Lujo, hasta 4 pasajeros, precio fijo
 *   3. Envíos     — paquete en SUV mismo día entre ciudades
 *
 * Tiers simplificados (decisión de marca 2026-05-23):
 *   - Confort  → SUV estándar (Toyota Prius, Hyundai Santa Fe, etc.)
 *   - Lujo     → gama alta (premium / XL)
 *
 * Aesthetic: dark + glass + neon. Inspirado en el mockup del producto:
 * fondo negro profundo, cards con backdrop translúcido + borde sutil,
 * acentos cyan/azul vibrantes, gradientes simulados con Views apiladas
 * (no usamos expo-linear-gradient para no agregar deps).
 *
 * Asset por slide:
 *   - Compartido: 2.suvxl.jpg   (SUV grande compartido)
 *   - Privado:    suv premium.jpg (SUV elegante)
 *   - Envíos:     entrega.png   (paquete + conductor)
 */
import React, { useEffect, useRef, useState } from 'react';
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

// ── Tokens del design system "tech-noir" ─────────────────────
const COLORS = {
  bg:            '#0a0e1a',  // deep midnight blue
  bgLayer:       '#0f1424',  // panel layer
  glass:         'rgba(255,255,255,0.06)',
  glassBorder:   'rgba(255,255,255,0.10)',

  textPrimary:   '#ffffff',
  textSecondary: 'rgba(255,255,255,0.72)',
  textTertiary:  'rgba(255,255,255,0.42)',

  // Acentos neon
  neonCyan:      '#00d4ff',
  neonBlue:      '#3b82f6',
  neonPurple:    '#a855f7',

  // Tier badges
  confortBorder: 'rgba(255,255,255,0.25)',
  lujoBorder:    '#FFD700',  // gold accent para Lujo
  lujoTextDim:   'rgba(255,215,0,0.85)',

  // Brand red (logo, CTA secundario)
  brandRed:      '#ff4c41',
};

const ONBOARDING_KEY = 'going_onboarding_done';

// ── Slides: 3 productos core ───────────────────────────────────────────────
type Slide = {
  id: 'compartido' | 'privado' | 'envios';
  photo: any;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  eyebrow: string;                // pequeña categoría arriba del titulo
  headline: string;               // título grande (puede incluir \n)
  subtitle: string;
  tiers?: Array<{ name: 'Confort' | 'Lujo'; subline: string }>;
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
      { name: 'Lujo',    subline: 'SUV de gama alta' },
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
      { name: 'Lujo',    subline: 'Gama alta + amenities' },
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

  // ── Render de slide ────────────────────────────────────────
  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      {/* Photo backdrop — top 55% del slide */}
      <View style={[styles.photoWrap, { height: height * 0.55 }]}>
        <Image source={item.photo} style={styles.photo} resizeMode="cover" />

        {/* Stacked dark gradient (simulado con 3 Views de alpha distinta).
            Sin expo-linear-gradient: usamos 3 overlays que crean el efecto
            de degradado transparente-arriba → negro-abajo. */}
        <View pointerEvents="none" style={[styles.photoOverlay, styles.photoOverlayTop]} />
        <View pointerEvents="none" style={[styles.photoOverlay, styles.photoOverlayMid]} />
        <View pointerEvents="none" style={[styles.photoOverlay, styles.photoOverlayBot]} />

        {/* Tech grid corners (esquinas con líneas neon, vibe HUD) */}
        <View pointerEvents="none" style={[styles.hudCorner, styles.hudTopLeft]} />
        <View pointerEvents="none" style={[styles.hudCorner, styles.hudTopRight]} />

        {/* Eyebrow flotante sobre la foto */}
        <View style={styles.eyebrowChip}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>{item.eyebrow}</Text>
        </View>

        {/* Icon glow en bottom-left de la foto */}
        <View style={styles.iconBadge}>
          <View style={styles.iconBadgeGlow} />
          <Ionicons name={item.icon} size={26} color={COLORS.neonCyan} />
        </View>
      </View>

      {/* Glass card — bottom 45% del slide */}
      <View style={[styles.card, { minHeight: height * 0.42 }]}>
        <View style={styles.cardBorderTop} />

        <Text style={styles.headline}>{item.headline}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>

        {/* Tier badges si aplica (Compartido y Privado tienen tiers) */}
        {item.tiers && (
          <View style={styles.tierRow}>
            {item.tiers.map((t) => (
              <View
                key={t.name}
                style={[
                  styles.tierBadge,
                  t.name === 'Lujo' && styles.tierBadgeLujo,
                ]}
              >
                <View style={styles.tierLabelRow}>
                  {t.name === 'Lujo' && (
                    <Ionicons name="diamond" size={11} color={COLORS.lujoBorder} />
                  )}
                  <Text
                    style={[
                      styles.tierName,
                      t.name === 'Lujo' && styles.tierNameLujo,
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

        {/* Stat highlight */}
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Logo Going — fijo arriba-izquierda */}
      <View style={styles.logoOverlay} pointerEvents="none">
        <Image
          source={require('../../../assets/going-logo-white.png')}
          style={styles.onboardingLogo}
          resizeMode="contain"
        />
      </View>

      {/* Slides con swipe HABILITADO (antes scrollEnabled=false) */}
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

      {/* Bottom bar absoluto (sobre el slide). Glass + acciones. */}
      <View style={styles.bottomBar}>
        {/* Indicador animado (pill que se estira sobre el slide activo) */}
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

        {/* Botones */}
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
                <Ionicons name="arrow-forward" size={18} color="#0a0e1a" />
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
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export { ONBOARDING_KEY };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Logo overlay (encima de las slides)
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

  // Slide
  slide: { flex: 1, backgroundColor: COLORS.bg },

  // ── Photo backdrop ──────────────────────────────────────
  photoWrap: {
    width: '100%',
    backgroundColor: COLORS.bgLayer,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },

  // Stacked dark gradient simulado (no expo-linear-gradient).
  // 3 capas con distinto alpha y altura crean el efecto suave.
  photoOverlay: { position: 'absolute', left: 0, right: 0 },
  photoOverlayTop: {
    top: 0, height: 80,
    backgroundColor: 'rgba(10,14,26,0.55)',  // top vignette para legibilidad del logo
  },
  photoOverlayMid: {
    bottom: 90, height: 120,
    backgroundColor: 'rgba(10,14,26,0.45)',
  },
  photoOverlayBot: {
    bottom: 0, height: 90,
    backgroundColor: COLORS.bg,  // hard cut al color del card para "fusión" sin gradient
  },

  // HUD corners (líneas neon en esquinas top de la foto, vibe tech)
  hudCorner: {
    position: 'absolute',
    width: 28, height: 28,
    borderColor: COLORS.neonCyan,
    opacity: 0.55,
  },
  hudTopLeft: {
    top: 110, left: 20,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
  },
  hudTopRight: {
    top: 110, right: 20,
    borderTopWidth: 1.5, borderRightWidth: 1.5,
  },

  // Eyebrow chip (Producto · 01)
  eyebrowChip: {
    position: 'absolute',
    top: 110, left: '50%',
    transform: [{ translateX: -52 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,212,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.30)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
  },
  eyebrowDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.neonCyan,
  },
  eyebrowText: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: COLORS.neonCyan, textTransform: 'uppercase',
  },

  // Icon badge en la foto (glow cyan)
  iconBadge: {
    position: 'absolute',
    bottom: 110, left: 24,
    width: 56, height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(10,14,26,0.85)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBadgeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: 'rgba(0,212,255,0.06)',
  },

  // ── Glass card (bottom 45%) ─────────────────────────────
  card: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 160,  // dejar espacio para bottomBar
  },
  cardBorderTop: {
    position: 'absolute',
    top: 0, left: '20%', right: '20%',
    height: 1,
    backgroundColor: 'rgba(0,212,255,0.35)',
  },

  headline: {
    fontSize: 32, fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14, lineHeight: 21,
    color: COLORS.textSecondary,
    marginTop: 12,
  },

  // Tier badges
  tierRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  tierBadge: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.confortBorder,
    borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  tierBadgeLujo: {
    borderColor: COLORS.lujoBorder,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  tierLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  tierName: {
    fontSize: 13, fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  tierNameLujo: {
    color: COLORS.lujoTextDim,
  },
  tierSubline: {
    fontSize: 10, fontWeight: '500',
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Stat row
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  statBar: {
    width: 3, height: 40,
    backgroundColor: COLORS.neonCyan,
    borderRadius: 2,
  },
  statTexts: { flex: 1 },
  statValue: {
    fontSize: 22, fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11, fontWeight: '500',
    color: COLORS.textTertiary,
    textTransform: 'lowercase',
    marginTop: 2,
  },

  // ── Bottom bar absoluto ───────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36,
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.neonCyan,
  },

  // Buttons
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  skipText: {
    color: COLORS.textTertiary,
    fontSize: 14, fontWeight: '600',
    letterSpacing: 0.3,
  },
  nextBtn: {
    flex: 2, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.neonCyan,
    paddingVertical: 16, borderRadius: 14,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 6,
  },
  nextBtnText: {
    fontSize: 15, fontWeight: '900',
    color: COLORS.bg,  // texto oscuro sobre botón cyan para contraste máximo
    letterSpacing: 0.3,
  },

  // Last slide buttons
  lastBtns: { flex: 1, gap: 12 },
  loginBtn: {
    paddingVertical: 14, borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
  },
  loginBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14, fontWeight: '700',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.neonCyan,
    paddingVertical: 16, borderRadius: 14,
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 6,
  },
  registerBtnText: {
    color: COLORS.bg,
    fontSize: 16, fontWeight: '900',
    letterSpacing: 0.3,
  },
});
