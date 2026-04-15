/**
 * SplashScreen — Going Ecuador
 * Fiel al diseño Stitch: https://stitch.withgoogle.com/projects/12141521556713894233
 *
 * SETUP:
 *   • Foto de fondo: mobile-user-app/assets/splash-bg.png
 *   • Sonido de escape: mobile-user-app/assets/sounds/splash-rev.wav
 *     Reemplaza el WAV placeholder con tu archivo real de audio
 *
 * Animaciones (replica logo-born / fade-in-up / pulse-glow del HTML):
 *   1. Glow pulsante detrás del logo (4s loop)
 *   2. Logo "born": scale 0.3+rotate(-10°) → scale 1.1 → scale 1
 *   3. "Nos movemos contigo": fade-in-up (delay 1.2s)
 *   4. "EST. MMXXVI": fade-in-up (delay 1.8s)
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  ImageBackground,
  Text,
} from 'react-native';
// expo-av removed — splash runs without sound

const { width, height } = Dimensions.get('window');

// ── Tokens del diseño Stitch ───────────────────────────────
const BG          = '#0a0f1d';   // background
const ON_BG       = '#faf8ff';   // on-background
const PRIMARY     = '#b71416';   // primary (glow)
const VIBRANT_RED = '#FF2D2D';   // vibrant-red (logo drop-shadow)

interface Props { onFinish: () => void; appMode?: 'viajero' | 'conductor'; }

export default function SplashScreen({ onFinish, appMode = 'conductor' }: Props) {

  const [bgLoaded, setBgLoaded] = useState(false);
  const soundRef = useRef<{ unloadAsync?: () => void } | null>(null);

  // ── Animated values ───────────────────────────────────────
  // Logo born: scale 0.3 → 1.15 → 1  +  rotate -10° → 0°
  const logoScale  = useRef(new Animated.Value(0.3)).current;
  const logoOp     = useRef(new Animated.Value(0)).current;
  const logoRot    = useRef(new Animated.Value(-10)).current;   // grados

  // Glow pulse (continuo, atrás del logo)
  const glowOp     = useRef(new Animated.Value(0.4)).current;
  const glowScale  = useRef(new Animated.Value(0.8)).current;

  // Tagline "Nos movemos contigo" — delay 1.2s
  const tagOp      = useRef(new Animated.Value(0)).current;
  const tagY       = useRef(new Animated.Value(20)).current;

  // Bottom "EST. MMXXVI" — delay 1.8s
  const stampOp    = useRef(new Animated.Value(0)).current;
  const stampY     = useRef(new Animated.Value(20)).current;

  // Exit fade-out
  const exitOp     = useRef(new Animated.Value(1)).current;

  // Sonido de splash deshabilitado (expo-av eliminado del build)
  useEffect(() => {
    return () => { soundRef.current?.unloadAsync?.(); };
  }, []);

  useEffect(() => {
    // ── Pulse-glow continuo (4s ease-in-out infinite) ─────
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowOp,    { toValue: 0.7,  duration: 2000, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1.2,  duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowOp,    { toValue: 0.4,  duration: 2000, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 0.8,  duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // ── Secuencia principal ───────────────────────────────
    Animated.sequence([

      // Logo born (1.8s, cubic-bezier aproximado con spring)
      Animated.parallel([
        Animated.timing(logoOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(logoRot, {
          toValue: 0, duration: 1800,
          useNativeDriver: true,
        }),
        // Fase 1: escala rápida hasta overshoot 1.15
        Animated.sequence([
          Animated.spring(logoScale, {
            toValue: 1.15,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
          // Fase 2: settle a 1
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Tagline fade-in-up (delay 1.2s desde inicio → ~0.4s tras logo)
      Animated.delay(0),
      Animated.parallel([
        Animated.timing(tagOp, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(tagY,  { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),

      // EST. MMXXVI fade-in-up (delay 0.6s adicional)
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(stampOp, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(stampY,  { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),

      // Hold
      Animated.delay(900),

      // Fade out
      Animated.timing(exitOp, { toValue: 0, duration: 500, useNativeDriver: true }),

    ]).start(() => onFinish());
  }, []);

  const logoRotDeg = logoRot.interpolate({
    inputRange: [-10, 0],
    outputRange: ['-10deg', '0deg'],
  });

  // ── Render ────────────────────────────────────────────────
  const content = (
    <>
      {/* Cinematic vignette overlay */}
      <View style={styles.vignette} pointerEvents="none" />
      <View style={styles.overlayMult} pointerEvents="none" />

      {/* ─── Logo + tagline ─────────────────────────────── */}
      <View style={styles.center}>

        {/* Glow pulsante detrás del logo */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              opacity: glowOp,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Logo born */}
        <Animated.View
          style={{
            opacity: logoOp,
            transform: [
              { scale: logoScale },
              { rotate: logoRotDeg },
            ],
          }}
        >
          {/* Logo color: G rojo + "Going" negro — igual que screenshot Stitch */}
          <Image
            source={require('../../../assets/going-logo-splash.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* "Nos movemos contigo" */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: tagOp,
              transform: [{ translateY: tagY }],
            },
          ]}
        >
          Nos movemos contigo
        </Animated.Text>

        {/* Badge sutil: VIAJERO / CONDUCTOR */}
        <Animated.Text
          style={[
            styles.appBadge,
            { opacity: tagOp, transform: [{ translateY: tagY }] },
          ]}
        >
          {appMode === 'conductor' ? '· CONDUCTOR ·' : '· VIAJERO ·'}
        </Animated.Text>

      </View>

      {/* ─── EST. MMXXVI ────────────────────────────────── */}
      <Animated.View
        style={[
          styles.bottomStamp,
          { opacity: stampOp, transform: [{ translateY: stampY }] },
        ]}
      >
        {/* Línea con degradado rojo */}
        <View style={styles.stampLine}>
          <View style={styles.stampLineFull} />
          {/* Gradiente simulado con Views */}
          <View style={[StyleSheet.absoluteFill, styles.stampLineGrad]} />
        </View>
        {/* Stamp */}
        <View style={styles.estRow}>
          <View style={styles.estDash} />
          <Text style={styles.estText}>EST. MMXXVI</Text>
          <View style={styles.estDash} />
        </View>
      </Animated.View>

      {/* ─── Corner accents ─────────────────────────────── */}
      <View style={[styles.corner, styles.topLeft]}  pointerEvents="none" />
      <View style={[styles.corner, styles.botRight]} pointerEvents="none" />
    </>
  );

  return (
    <Animated.View style={[styles.root, { opacity: exitOp }]}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

      {/* Intentar cargar foto — si falla, usa fondo oscuro puro */}
      <ImageBackground
        source={require('../../../assets/splash-bg.png')}
        style={styles.bg}
        imageStyle={styles.bgImg}
        onLoad={() => setBgLoaded(true)}
        onError={() => { /* fondo oscuro del root */}}
      >
        {content}
      </ImageBackground>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, width, height,
    backgroundColor: BG,
    overflow: 'hidden',
  },
  bg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImg: {
    // scale-110 opacity-70 brightness-110 (Stitch spec)
    transform: [{ scale: 1.10 }],
    opacity: 0.70,
  },

  // Cinematic vignette: radial-gradient center transparent → BG/60%
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Aproximación con sombra interna (box-shadow no existe en RN)
    // Se usa una View con opacidad en los bordes
  },
  overlayMult: {
    ...StyleSheet.absoluteFillObject,
    // bg-background/10 mix-blend-multiply
    backgroundColor: 'rgba(10,15,29,0.28)',
  },

  // Cuatro "cuñas" de vignette en las esquinas
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow: bg-primary/20 blur-[80px] animate-pulse-glow
  glow: {
    position: 'absolute',
    width: 300, height: 300,
    borderRadius: 150,
    backgroundColor: PRIMARY,
    // Blur aproximado con sombra
    shadowColor: VIBRANT_RED,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 80,
    elevation: 30,
  },

  // Logo horizontal blanco — sin fondo
  logo: {
    width: width * 0.42,
    height: width * 0.44,
    shadowColor: VIBRANT_RED,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 30,
  },

  // Tagline
  tagline: {
    marginTop: 24,
    fontSize: 11,
    color: ON_BG,
    fontWeight: '800',
    letterSpacing: 5.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Badge sutil VIAJERO / CONDUCTOR
  appBadge: {
    marginTop: 12,
    fontSize: 9,
    color: 'rgba(250,248,255,0.35)',
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },

  // Bottom stamp
  bottomStamp: {
    position: 'absolute',
    bottom: 64,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,  // gap-6 → 24px aprox. pero reducido por espacio
  },
  stampLine: {
    width: 96, height: 1,
    overflow: 'hidden',
  },
  stampLineFull: {
    flex: 1, height: 1,
    backgroundColor: 'rgba(250,248,255,0.20)',
  },
  stampLineGrad: {
    // bg-gradient-to-r from-transparent via-vibrant-red/60 to-transparent
    // Simulado con View central
    left: '25%', right: '25%',
    backgroundColor: 'rgba(255,45,45,0.60)',
  },
  estRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  estDash: {
    width: 24, height: 1,
    backgroundColor: 'rgba(250,248,255,0.10)',
  },
  estText: {
    fontSize: 9,
    color: 'rgba(250,248,255,0.40)',
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },

  // Corner accents (top-left y bottom-right — igual que Stitch)
  corner: {
    position: 'absolute',
    width: 48, height: 48,
    opacity: 0.20,
  },
  topLeft: {
    top: 48, left: 48,
    borderTopWidth: 1, borderLeftWidth: 1,
    borderColor: ON_BG,
  },
  botRight: {
    bottom: 48, right: 48,
    borderBottomWidth: 1, borderRightWidth: 1,
    borderColor: ON_BG,
  },
});
