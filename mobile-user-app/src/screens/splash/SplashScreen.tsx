import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const GOING_RED = '#ff4c41'; // Going brand red — alineado con webapp
const BG_COLOR = '#FFFFFF'; // fondo blanco — el logo ya tiene sus colores

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1 — Logo aparece con rebote suave desde escala 0.6 → 1
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 2 — Tagline aparece
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3 — Puntos de carga
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      // 4 — Pausa para que el usuario vea el logo
      Animated.delay(1000),
      // 5 — Fade out suave hacia la app
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <StatusBar backgroundColor={BG_COLOR} barStyle="dark-content" />

      {/* Logo real de Going */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../../../assets/going-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Tagline debajo del logo */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Nos movemos contigo
      </Animated.Text>

      {/* Puntos de carga al fondo */}
      <Animated.View style={[styles.loadingRow, { opacity: dotOpacity }]}>
        <LoadingDots color={GOING_RED} />
      </Animated.View>
    </Animated.View>
  );
}

/** Tres puntos con animación de pulso */
function LoadingDots({ color }: { color: string }) {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      ).start();

    animate(dots[0], 0);
    animate(dots[1], 200);
    animate(dots[2], 400);
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[styles.loadingDot, { opacity: d, backgroundColor: color }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.55, // 55% del ancho de pantalla
    height: width * 0.65, // mantiene proporción del logo vertical
  },
  tagline: {
    fontSize: 13,
    color: '#888',
    letterSpacing: 2,
    marginTop: 8,
    marginBottom: 60,
  },
  loadingRow: {
    position: 'absolute',
    bottom: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
