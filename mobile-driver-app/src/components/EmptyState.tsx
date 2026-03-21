import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const GOING_BLUE   = '#0033A0';
const GOING_RED    = '#ff4c41';
const GOING_YELLOW = '#FFCD00';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
  accentColor?: string;
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  ctaLabel,
  onCta,
  accentColor = GOING_BLUE,
}: EmptyStateProps) {
  const scaleAnim  = useRef(new Animated.Value(0.7)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Float suave infinito
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Círculo de fondo */}
      <View style={[styles.circle, { backgroundColor: `${accentColor}0D` }]} />

      {/* Emoji flotante */}
      <Animated.Text style={[
        styles.emoji,
        { transform: [{ scale: scaleAnim }, { translateY: floatAnim }] },
      ]}>
        {emoji}
      </Animated.Text>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {ctaLabel && onCta && (
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: accentColor }]}
          onPress={onCta}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ── Variantes predefinidas ─────────────────────────────────────────────────

export const EMPTY_STATES = {
  bookings: {
    emoji: '🗺️',
    title: 'Aún no has viajado',
    subtitle: 'Tu primer viaje te está esperando.\nElige una ciudad y solicita ahora.',
    accentColor: GOING_BLUE,
  },
  bookingsFiltered: {
    emoji: '🔍',
    title: 'Sin resultados',
    subtitle: 'No encontramos viajes con ese filtro.\nIntenta con otro estado.',
    accentColor: '#6B7280',
  },
  payments: {
    emoji: '💳',
    title: 'Sin métodos de pago',
    subtitle: 'Agrega una tarjeta o cuenta\npara pagar tus viajes fácilmente.',
    accentColor: GOING_RED,
  },
  tripHistory: {
    emoji: '📋',
    title: 'Sin viajes registrados',
    subtitle: 'Aquí verás el historial completo\nde todos tus servicios.',
    accentColor: GOING_BLUE,
  },
  notifications: {
    emoji: '🔔',
    title: 'Todo al día',
    subtitle: 'No tienes notificaciones pendientes.\nTe avisaremos cuando haya novedades.',
    accentColor: GOING_YELLOW,
  },
  search: {
    emoji: '🏙️',
    title: 'No encontramos esa ruta',
    subtitle: 'Verifica el origen y destino,\no intenta con ciudades cercanas.',
    accentColor: '#F59E0B',
  },
  driverTrips: {
    emoji: '🚗',
    title: 'Sin viajes aún',
    subtitle: 'Conéctate y acepta solicitudes\npara ver tu historial aquí.',
    accentColor: GOING_BLUE,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingVertical: 60,
  },
  circle: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
  },
  emoji: {
    fontSize: 72, marginBottom: 24, textAlign: 'center',
  },
  title: {
    fontSize: 20, fontWeight: '800', color: '#111827',
    textAlign: 'center', marginBottom: 10,
  },
  subtitle: {
    fontSize: 14, color: '#6B7280', textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },
  ctaBtn: {
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
