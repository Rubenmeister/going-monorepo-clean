/**
 * OportunisticoScreen — Viaje oportunista (corto) disponible
 *
 * Se muestra cuando el conductor está en una ciudad destino
 * con tiempo libre y aparece un viaje corto disponible.
 *
 * Regla: El PRIMERO en aceptar se lo queda.
 * Timer: 30 segundos. Si no acepta → el viaje va al siguiente.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { hapticHeavy, hapticSuccess, hapticError } from '../../utils/haptics';

const NAVY  = '#0033A0';
const GOLD  = '#FFCD00';
const GREEN = '#059669';
const RED   = '#DC2626';

const TIMER_SECONDS = 30;

export type OportunisticoParams = {
  rideId:        string;
  origin:        string;
  destination:   string;
  distanceKm:    number;
  estimatedFare: number;
  passengerName?: string;
  passengerRating?: number;
};

export function OportunisticoScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<{ params: OportunisticoParams }, 'params'>>();
  const p          = route.params;

  const [timeLeft,  setTimeLeft]  = useState(TIMER_SECONDS);
  const [accepting, setAccepting] = useState(false);
  const [accepted,  setAccepted]  = useState(false);
  const [expired,   setExpired]   = useState(false);

  // Animación del timer circular
  const timerAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Vibrar al llegar la notificación
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);

    // Countdown
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animación del timer
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: TIMER_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    // Pulso en los últimos 10 segundos
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 400, useNativeDriver: true }),
      ])
    );
    const pulseTimeout = setTimeout(() => pulseLoop.start(), (TIMER_SECONDS - 10) * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(pulseTimeout);
      pulseLoop.stop();
    };
  }, []);

  const handleAccept = async () => {
    if (expired || accepted) return;
    hapticHeavy();
    setAccepting(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const { data } = await axios.post(
        `${API_BASE_URL}/rides/${p.rideId}/opportunistic/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.assigned) {
        hapticSuccess();
        setAccepted(true);
      } else {
        // Otro conductor fue más rápido
        hapticError();
        Alert.alert(
          'Otro conductor llegó primero',
          'Este viaje ya fue tomado. ¡Sigue en modo libre para el próximo!',
          [{ text: 'Entendido', onPress: () => navigation.goBack() }]
        );
      }
    } catch {
      hapticError();
      Alert.alert('Error', 'No se pudo aceptar el viaje. Intenta de nuevo.');
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Rechazar viaje',
      '¿Seguro? Si rechazas, el viaje irá al siguiente conductor disponible.',
      [
        { text: 'Cancelar' },
        { text: 'Sí, rechazar', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  // ── Aceptado exitosamente ──────────────────────────────────────────────────
  if (accepted) {
    return (
      <View style={[s.container, s.centerContent]}>
        <View style={s.successIconWrap}>
          <Ionicons name="checkmark-circle" size={64} color={GREEN} />
        </View>
        <Text style={s.successTitle}>¡Es tuyo! 🎉</Text>
        <Text style={s.successSub}>
          Tienes el viaje de {p.origin} → {p.destination}.{'\n'}
          Dirígete al punto de recogida.
        </Text>
        <View style={s.successFare}>
          <Text style={s.successFareLbl}>Ganancia estimada</Text>
          <Text style={s.successFareVal}>${p.estimatedFare.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={s.goBtn}
          onPress={() => navigation.navigate('ActiveRide', {
            rideId:       p.rideId,
            passengerName: p.passengerName ?? 'Pasajero',
            destination:  p.destination,
            paymentMethod:'cash',
            fare:         p.estimatedFare,
          })}
          activeOpacity={0.85}
        >
          <Text style={s.goBtnText}>Iniciar viaje</Text>
          <Ionicons name="arrow-forward" size={22} color={GOLD} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Expirado ───────────────────────────────────────────────────────────────
  if (expired) {
    return (
      <View style={[s.container, s.centerContent]}>
        <Ionicons name="time-outline" size={64} color="#9CA3AF" />
        <Text style={s.expiredTitle}>Tiempo agotado</Text>
        <Text style={s.expiredSub}>El viaje fue asignado a otro conductor.</Text>
        <TouchableOpacity style={s.backBtn2} onPress={() => navigation.goBack()}>
          <Text style={s.backBtn2Text}>Volver al panel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Timer activo ───────────────────────────────────────────────────────────
  const timerColor = timeLeft > 15 ? GREEN : timeLeft > 5 ? '#F59E0B' : RED;
  const timerWidth = timerAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.container}>

      {/* Header urgente */}
      <View style={s.urgentHeader}>
        <View style={s.flashIcon}>
          <Ionicons name="flash" size={24} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.urgentTitle}>⚡ Viaje oportunista disponible</Text>
          <Text style={s.urgentSub}>El primero en aceptar se lo lleva</Text>
        </View>
      </View>

      {/* Timer barra */}
      <View style={s.timerBar}>
        <Animated.View style={[s.timerFill, { width: timerWidth, backgroundColor: timerColor }]} />
      </View>
      <Text style={[s.timerText, { color: timerColor }]}>
        {timeLeft}s restantes
      </Text>

      {/* Info del viaje */}
      <Animated.View style={[s.rideCard, { transform: [{ scale: pulseAnim }] }]}>

        {/* Ruta */}
        <View style={s.routeSection}>
          <View style={s.routeRow}>
            <View style={[s.dot, { backgroundColor: NAVY }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.routeLbl}>ORIGEN</Text>
              <Text style={s.routeCity}>{p.origin}</Text>
            </View>
          </View>
          <View style={s.routeLine} />
          <View style={s.routeRow}>
            <View style={[s.dot, { backgroundColor: GREEN }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.routeLbl}>DESTINO</Text>
              <Text style={s.routeCity}>{p.destination}</Text>
            </View>
          </View>
        </View>

        {/* Métricas */}
        <View style={s.metricsRow}>
          <View style={s.metric}>
            <Ionicons name="navigate-outline" size={18} color={NAVY} />
            <Text style={s.metricVal}>{p.distanceKm.toFixed(1)} km</Text>
            <Text style={s.metricLbl}>Distancia</Text>
          </View>
          <View style={s.metricDiv} />
          <View style={s.metric}>
            <Ionicons name="time-outline" size={18} color={NAVY} />
            <Text style={s.metricVal}>~{Math.round(p.distanceKm / 40 * 60)} min</Text>
            <Text style={s.metricLbl}>Estimado</Text>
          </View>
          <View style={s.metricDiv} />
          <View style={s.metric}>
            <Ionicons name="cash-outline" size={18} color={GREEN} />
            <Text style={[s.metricVal, { color: GREEN }]}>${p.estimatedFare.toFixed(0)}</Text>
            <Text style={s.metricLbl}>Ganancia</Text>
          </View>
        </View>

        {/* Pasajero */}
        {p.passengerName && (
          <View style={s.passengerRow}>
            <View style={s.passengerAvatar}>
              <Text style={s.passengerInitial}>{p.passengerName[0]}</Text>
            </View>
            <Text style={s.passengerName}>{p.passengerName}</Text>
            {p.passengerRating && (
              <View style={s.ratingBadge}>
                <Ionicons name="star" size={11} color={GOLD} />
                <Text style={s.ratingText}>{p.passengerRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Botones */}
      <View style={s.btnsRow}>
        <TouchableOpacity style={s.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={RED} />
          <Text style={s.rejectBtnText}>Rechazar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.acceptBtn, accepting && { opacity: 0.7 }]}
          onPress={handleAccept}
          disabled={accepting}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={s.acceptBtnText}>
            {accepting ? 'Aceptando...' : '¡Acepto el viaje!'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={s.note}>
        Si aceptas, el viaje es tuyo. Si otro conductor acepta primero, se lo lleva.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1d' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 32 },

  urgentHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, paddingTop: 52,
  },
  flashIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,205,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  urgentTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  urgentSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  timerBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20, borderRadius: 3, overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 3 },
  timerText: { textAlign: 'right', marginRight: 20, marginTop: 6, fontSize: 13, fontWeight: '900' },

  rideCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  routeSection: { padding: 16, paddingBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  routeLbl: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5 },
  routeCity: { fontSize: 17, fontWeight: '900', color: '#111827' },
  routeLine: { width: 2, height: 18, backgroundColor: '#BFDBFE', marginLeft: 4, marginVertical: 3 },

  metricsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12,
  },
  metric:    { flex: 1, alignItems: 'center', gap: 3 },
  metricVal: { fontSize: 16, fontWeight: '900', color: NAVY },
  metricLbl: { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },
  metricDiv: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },

  passengerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12,
  },
  passengerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  passengerInitial: { fontSize: 16, fontWeight: '900', color: NAVY },
  passengerName:    { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFBEB', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  ratingText:  { fontSize: 11, fontWeight: '800', color: '#92400E' },

  btnsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 8 },
  rejectBtn: {
    flex: 1, backgroundColor: 'rgba(220,38,38,0.12)', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(220,38,38,0.3)',
  },
  rejectBtnText: { fontSize: 14, fontWeight: '800', color: RED },
  acceptBtn: {
    flex: 2, backgroundColor: GREEN, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  acceptBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  note: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 12, paddingHorizontal: 24 },

  // Éxito
  successIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8 },
  successSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  successFare:  { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24, width: '100%' },
  successFareLbl: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontWeight: '600' },
  successFareVal: { fontSize: 32, fontWeight: '900', color: GOLD },
  goBtn: { backgroundColor: GREEN, borderRadius: 16, padding: 16, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },

  // Expirado
  expiredTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 16, marginBottom: 8 },
  expiredSub:   { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 24 },
  backBtn2: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, paddingHorizontal: 32 },
  backBtn2Text: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
