import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, FlatList, StatusBar,
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

const { width, height } = Dimensions.get('window');

const GOING_RED    = '#ff4c41';
const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';

const ONBOARDING_KEY = 'going_onboarding_done';

// ── Slides ─────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    bg: GOING_RED,
    icon: 'car-sport' as const,
    iconBg: 'rgba(255,255,255,0.2)',
    emoji: '🚙',
    title: 'Viaja seguro\npor todo Ecuador',
    subtitle: 'Transporte compartido o privado entre ciudades. Precio fijo desde el inicio, sin sorpresas.',
    stat: '50+ ciudades conectadas',
    statIcon: 'location' as const,
  },
  {
    id: '2',
    bg: GOING_BLUE,
    icon: 'people' as const,
    iconBg: 'rgba(255,205,0,0.25)',
    emoji: '👥',
    title: 'Comparte el viaje,\ndivide el costo',
    subtitle: 'En modo compartido viajan hasta 5 personas y cada uno paga solo su asiento.',
    stat: 'Desde $3 por trayecto',
    statIcon: 'cash' as const,
  },
  {
    id: '3',
    bg: '#1a1a2e',
    icon: 'navigate' as const,
    iconBg: `${GOING_RED}30`,
    emoji: '📍',
    title: 'Tracking en\ntiempo real',
    subtitle: 'Sigue tu viaje en el mapa y comparte tu ruta con tus contactos de confianza.',
    stat: 'GPS en tiempo real',
    statIcon: 'shield-checkmark' as const,
  },
  {
    id: '4',
    bg: '#065f46',
    icon: 'diamond' as const,
    iconBg: 'rgba(255,255,255,0.15)',
    emoji: '⭐',
    title: 'Tu viaje,\ntu experiencia',
    subtitle: 'Elige entre Confort, Premium o tarifas Empresa. Conductores verificados y calificados.',
    stat: '4.9★ calificación promedio',
    statIcon: 'star' as const,
  },
];

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Analytics: track onboarding start
  useEffect(() => { analyticsOnboardingStart(); }, []);

  // Animaciones de entrada por slide
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next });
      setCurrentIndex(next);
      animateIn();
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

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={[styles.slide, { backgroundColor: item.bg, width }]}>

      {/* Círculo decorativo fondo */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Icono principal */}
      <Animated.View style={[
        styles.iconContainer,
        { backgroundColor: item.iconBg },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
        <Text style={styles.iconEmoji}>{item.emoji}</Text>
      </Animated.View>

      {/* Textos */}
      <Animated.View style={[
        styles.textBlock,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

        {/* Stat pill */}
        <View style={styles.statPill}>
          <Ionicons name={item.statIcon} size={14} color={item.bg} />
          <Text style={[styles.statText, { color: item.bg }]}>{item.stat}</Text>
        </View>
      </Animated.View>
    </View>
  );

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      />

      {/* Bottom overlay */}
      <View style={[styles.bottomBar, { backgroundColor: currentSlide.bg }]}>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
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
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipText}>Omitir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={18} color={GOING_BLUE} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.lastBtns}>
              <TouchableOpacity style={styles.loginBtn} onPress={handleSkip}>
                <Text style={styles.loginBtnText}>Ya tengo cuenta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.registerBtn} onPress={handleGetStarted}>
                <Text style={styles.registerBtnText}>Comenzar gratis</Text>
                <Ionicons name="rocket" size={16} color="#fff" />
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
  container: { flex: 1 },

  // Slide
  slide: {
    flex: 1, height, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 80,
  },
  bgCircle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80, right: -80,
  },
  bgCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 140, left: -60,
  },

  // Icon
  iconContainer: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 40,
  },
  iconEmoji: { fontSize: 64 },

  // Text block
  textBlock: { alignItems: 'center', gap: 12 },
  slideTitle: {
    fontSize: 30, fontWeight: '900', color: '#fff',
    textAlign: 'center', lineHeight: 36,
  },
  slideSubtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 22,
  },

  // Stat pill
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, marginTop: 8,
  },
  statText: { fontSize: 13, fontWeight: '800' },

  // Bottom bar
  bottomBar: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },

  // Buttons
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  skipText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },
  nextBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 14, borderRadius: 14,
  },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: GOING_BLUE },

  // Last slide buttons
  lastBtns: { flex: 1, gap: 12 },
  loginBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  loginBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: GOING_RED, paddingVertical: 16, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
