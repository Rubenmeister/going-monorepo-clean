/**
 * SplashScreen — Going App Ecuador
 * Fiel al diseño Stitch: https://stitch.withgoogle.com/projects/12141521556713894233
 *
 * Comportamiento:
 *   • Animación de ~2.8s (logo born → tagline+stamp en paralelo → fade-out)
 *   • Tap-to-skip: cualquier toque acelera el fade-out (UX para repeat-users)
 *   • Versión + build en esquina inferior izquierda (útil para soporte)
 *
 * Assets:
 *   • Foto de fondo: mobile-user-app/assets/splash-bg.png
 *
 * NOTA: el sonido de splash (splash-rev.wav) fue removido cuando se quitó
 * expo-av del build. Si se quiere reintroducir, usar expo-audio (no expo-av).
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  useWindowDimensions,
  StatusBar,
  Image,
  ImageBackground,
  Text,
  Pressable,
} from 'react-native';
import Constants from 'expo-constants';

// ── Tokens del diseño Stitch ───────────────────────────────
const BG          = '#0a0f1d';   // background
const ON_BG       = '#faf8ff';   // on-background
const VIBRANT_RED = '#FF2D2D';   // vibrant-red (logo drop-shadow)

// Versión leída del expo-config inyectado al bundle.
const APP_VERSION  = Constants.expoConfig?.version || '';
const BUILD_NUMBER =
  Constants.expoConfig?.android?.versionCode ??
  (Constants.expoConfig as any)?.ios?.buildNumber ??
  '';

interface Props { onFinish: () => void; appMode?: 'viajero' | 'conductor'; }

export default function SplashScreen({ onFinish, appMode = 'viajero' }: Props) {
  const { width } = useWindowDimensions();
  const finishedRef = useRef(false);

  // ── Animated values ───────────────────────────────────────
  // Logo born: scale 0.3 → 1.15 → 1  +  rotate -10° → 0°
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOp    = useRef(new Animated.Value(0)).current;
  const logoRot   = useRef(new Animated.Value(-10)).current;   // grados

  // Tagline "Nos movemos contigo" + stamp en paralelo (antes secuencial)
  const tagOp     = useRef(new Animated.Value(0)).current;
  const tagY      = useRef(new Animated.Value(20)).current;
  const stampOp   = useRef(new Animated.Value(0)).current;
  const stampY    = useRef(new Animated.Value(20)).current;

  // Exit fade-out
  const exitOp    = useRef(new Animated.Value(1)).current;

  /**
   * finishOnce: garantiza que `onFinish()` solo se llame una vez aunque
   * el usuario toque la pantalla en medio de la animación final.
   */
  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    Animated.timing(exitOp, { toValue: 0, duration: 250, useNativeDriver: true })
      .start(() => onFinish());
  }, [exitOp, onFinish]);

  useEffect(() => {
    // ── Secuencia principal (~2.8s total, antes ~5.3s) ────────
    // Fase 1: logo born (1.2s, antes 1.8s)
    // Fase 2: tagline + stamp EN PARALELO (0.9s, antes secuencial 1.1s)
    // Fase 3: hold corto (0.4s, antes 0.9s)
    // Fase 4: fade-out (0.3s, antes 0.5s)
    Animated.sequence([
      // Logo born
      Animated.parallel([
        Animated.timing(logoOp,  { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(logoRot, { toValue: 0, duration: 1200, useNativeDriver: true }),
        Animated.sequence([
          Animated.spring(logoScale, {
            toValue: 1.15, friction: 4, tension: 60, useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1, friction: 6, tension: 80, useNativeDriver: true,
          }),
        ]),
      ]),

      // Tagline + stamp en paralelo — antes corrían secuenciales con delay
      Animated.parallel([
        Animated.timing(tagOp,   { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(tagY,    { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(150),
          Animated.parallel([
            Animated.timing(stampOp, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(stampY,  { toValue: 0, duration: 700, useNativeDriver: true }),
          ]),
        ]),
      ]),

      // Hold
      Animated.delay(400),

      // Fade out (más rápido que antes)
      Animated.timing(exitOp, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish();
      }
    });
  }, []);

  const logoRotDeg = logoRot.interpolate({
    inputRange: [-10, 0],
    outputRange: ['-10deg', '0deg'],
  });

  // ── Render ────────────────────────────────────────────────
  const content = (
    <>
      {/* Cinematic vignette overlay */}
      <View style={styles.overlayMult} pointerEvents="none" />

      {/* ─── Logo + tagline ─────────────────────────────── */}
      <View style={styles.center}>

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
          <Image
            source={require('../../../assets/going-logo-splash.png')}
            style={[styles.logo, { width: width * 0.42, height: width * 0.44 }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* "Nos movemos contigo" */}
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: tagOp, transform: [{ translateY: tagY }] },
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
        <View style={styles.stampLine}>
          <View style={styles.stampLineFull} />
          <View style={[StyleSheet.absoluteFill, styles.stampLineGrad]} />
        </View>
        <View style={styles.estRow}>
          <View style={styles.estDash} />
          <Text style={styles.estText}>EST. MMXXVI</Text>
          <View style={styles.estDash} />
        </View>
      </Animated.View>

      {/* ─── Corner accents ─────────────────────────────── */}
      <View style={[styles.corner, styles.topLeft]}  pointerEvents="none" />
      <View style={[styles.corner, styles.botRight]} pointerEvents="none" />

      {/* ─── Version stamp (esquina inferior izquierda) ──────
        Discreto pero leíble. Útil para soporte: el cliente reporta un bug
        y se le pide capturar el splash para identificar exactamente qué
        build tiene instalado. Aparece junto con el stamp principal. */}
      {APP_VERSION ? (
        <Animated.Text style={[styles.versionStamp, { opacity: stampOp }]}>
          v{APP_VERSION}{BUILD_NUMBER ? ` (${BUILD_NUMBER})` : ''}
        </Animated.Text>
      ) : null}
    </>
  );

  return (
    <Pressable
      style={styles.pressableRoot}
      onPress={finishOnce}
      accessibilityRole="button"
      accessibilityLabel="Saltar pantalla de inicio"
    >
      <Animated.View style={[styles.root, { opacity: exitOp }]}>
        <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

        {/* Intentar cargar foto — si falla, usa fondo oscuro puro */}
        <ImageBackground
          source={require('../../../assets/splash-bg.png')}
          style={styles.bg}
          imageStyle={styles.bgImg}
        >
          {content}
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  pressableRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    overflow: 'hidden',
  },
  bg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImg: {
    // scale-110 opacity-70 (Stitch spec)
    transform: [{ scale: 1.10 }],
    opacity: 0.70,
  },

  overlayMult: {
    ...StyleSheet.absoluteFillObject,
    // bg-background/10 mix-blend-multiply
    backgroundColor: 'rgba(10,15,29,0.28)',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo horizontal — sin fondo. Dimensiones inyectadas en el JSX desde
  // useWindowDimensions (responde a rotación / split-screen).
  logo: {
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
    gap: 12,
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

  // Version + build en esquina inferior izquierda. Anclada al lado opuesto
  // del corner accent botRight para no chocar visualmente.
  versionStamp: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    fontSize: 9,
    color: 'rgba(250,248,255,0.28)',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
