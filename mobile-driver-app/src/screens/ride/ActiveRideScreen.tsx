import React, { Fragment, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import { hapticMedium } from '../../utils/haptics';
import { resolveCallSession, startPSTNCall } from '../../utils/agoraCall';
import type { CallSession } from '../../utils/agoraCall';
import { InCallOverlay } from '../../components/InCallOverlay';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSPORT_WS =
  process.env.EXPO_PUBLIC_TRANSPORT_WS_URL ||
  'https://transport-service-780842550857.us-central1.run.app';

type Route = RouteProp<DriverMainStackParamList, 'ActiveRide'>;

const STEPS = ['Camino al pasajero', 'Pasajero a bordo', 'Viaje completado'];

const PAYMENT_LABELS: Record<string, string> = {
  cash:   'Efectivo',
  card:   'Tarjeta',
  wallet: 'Going Credits',
};
const PAYMENT_ICONS: Record<string, string> = {
  cash:   'cash-outline',
  card:   'card-outline',
  wallet: 'wallet-outline',
};

export function ActiveRideScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const { rideId, passengerName, destination, paymentMethod = 'card', fare = 0 } = params;
  const mapRef    = useRef<MapboxGL.MapView>(null);
  const socketRef = useRef<Socket | null>(null);
  const [driverLoc, setDriverLoc] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [step, setStep]               = useState(0);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const rideStartTimestamp = useRef<number | null>(null);

  const handleCallPassenger = async () => {
    if (callLoading) return;
    hapticMedium();
    setCallLoading(true);
    try {
      const session = await resolveCallSession(rideId);
      if (!session) {
        Alert.alert('Sin conexión', 'No se pudo establecer la llamada. Intenta de nuevo.');
        return;
      }
      if (session.type === 'agora') {
        setCallSession(session);
      } else {
        startPSTNCall(session.proxyNumber!);
      }
    } catch {
      Alert.alert('Error', 'No se pudo obtener el número del pasajero.');
    } finally {
      setCallLoading(false);
    }
  };

  // ─── WebSocket: conectar al transport-service y unirse a la sala del viaje ─
  useEffect(() => {
    let socketInstance: Socket | null = null;

    AsyncStorage.getItem('driver_token').then((token) => {
      socketInstance = io(`${TRANSPORT_WS}/rides`, {
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
      });
      socketRef.current = socketInstance;

      socketInstance.on('connect', () => {
        socketInstance?.emit('join:ride', { rideId });
      });
    });

    return () => {
      socketInstance?.disconnect();
      socketRef.current = null;
    };
  }, [rideId]);

  // ─── GPS: observar posición y emitir al servidor cada 5 s / 10 m ──────────
  useEffect(() => {
    let mounted = true;
    const sub = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (loc) => {
        if (!mounted) return;
        const { latitude, longitude, heading, speed } = loc.coords;
        setDriverLoc({ latitude, longitude });

        // Emitir posición al pasajero vía WebSocket
        socketRef.current?.emit('driver:location', {
          rideId,
          lat: latitude,
          lng: longitude,
          heading: heading ?? undefined,
          speed:   speed   ?? undefined,
        });
      }
    );
    return () => {
      mounted = false;
      sub.then((s) => s.remove());
    };
  }, []);

  const completeRide = (cashConfirmed = false) => {
    // distanceKm: usa la distancia real calculada desde la ruta GPS si está disponible,
    // o el valor del parámetro si lo proveyó el backend al aceptar el viaje.
    // durationSeconds: tiempo real desde que se inició el viaje (step 1).
    const distKm  = (fare && fare > 0) ? fare / 2.5 : 5; // estimado provisional
    const durSecs = Math.round((Date.now() - (rideStartTimestamp.current ?? Date.now())) / 1000) || 900;
    socketRef.current?.emit('driver:completed', {
      rideId,
      distanceKm:      distKm,
      durationSeconds: durSecs,
      // cashConfirmed se envía como metadata informativa; el backend actualmente lo ignora.
      // Se deberá agregar manejo en ride-events.gateway cuando se implemente el endpoint de ganancias.
      ...(cashConfirmed && { cashConfirmed: true }),
    });
    Alert.alert(
      '¡Viaje completado! 🎉',
      cashConfirmed
        ? `Efectivo confirmado · $${fare.toFixed(2)}\n¡Excelente trabajo! Los pasajeros pueden calificarte ahora.`
        : `¡Excelente trabajo! Los pasajeros pueden calificarte ahora.`,
      [
        {
          text: 'Ver mis ganancias',
          onPress: () => (navigation as any).navigate('Wallet'),
        },
        {
          text: 'Nuevo viaje',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const confirmCashAndComplete = () => {
    Alert.alert(
      '💵 Confirmar cobro en efectivo',
      `¿Recibiste $${fare.toFixed(2)} en efectivo del pasajero?`,
      [
        { text: 'No recibí el pago', style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Pago pendiente',
              'Contacta al soporte de Going si el pasajero se negó a pagar.',
              [{ text: 'Entendido' }]
            ),
        },
        {
          text: `Sí, recibí $${fare.toFixed(2)}`,
          onPress: () => {
            setCashConfirmed(true);
            completeRide();
          },
        },
      ]
    );
  };

  const advance = () => {
    hapticMedium();
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      if (step === 0) socketRef.current?.emit('driver:arrived', { rideId });
      if (step === 1) {
        rideStartTimestamp.current = Date.now();
        socketRef.current?.emit('driver:started', { rideId });
      }
    } else {
      // Último paso — verificar pago en efectivo
      if (paymentMethod === 'cash') {
        confirmCashAndComplete();
      } else {
        completeRide();
      }
    }
  };

  return (
    <Fragment>
    <View style={styles.container}>
      <MapboxGL.MapView ref={mapRef} style={styles.map}>
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={[-78.4678, -0.1807]}
          animationMode="none"
        />
        <MapboxGL.UserLocation visible={true} />
      </MapboxGL.MapView>

      <View style={styles.infoPanel}>
        {/* Step progress */}
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                {i < step && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text
                style={[styles.stepText, i === step && styles.stepTextActive]}
              >
                {s}
              </Text>
            </View>
          ))}
        </View>

        {/* Passenger info */}
        <View style={styles.passengerRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#0033A0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passengerName}>
              {passengerName || 'Pasajero'}
            </Text>
            <Text style={styles.destination} numberOfLines={1}>
              → {destination}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.callBtn, callLoading && { opacity: 0.5 }]}
            onPress={handleCallPassenger}
            disabled={callLoading}
          >
            <Ionicons name={callLoading ? 'hourglass-outline' : 'call-outline'} size={20} color="#0033A0" />
          </TouchableOpacity>
        </View>

        {/* Badge de pago */}
        <View style={[
          styles.paymentBadge,
          paymentMethod === 'cash' && styles.paymentBadgeCash,
        ]}>
          <Ionicons
            name={PAYMENT_ICONS[paymentMethod] as any}
            size={16}
            color={paymentMethod === 'cash' ? '#065F46' : '#1E3A8A'}
          />
          <Text style={[
            styles.paymentLabel,
            paymentMethod === 'cash' && styles.paymentLabelCash,
          ]}>
            {PAYMENT_LABELS[paymentMethod]}
          </Text>
          {fare > 0 && (
            <Text style={[
              styles.paymentFare,
              paymentMethod === 'cash' && styles.paymentLabelCash,
            ]}>
              · ${fare.toFixed(2)}
            </Text>
          )}
          {paymentMethod === 'cash' && (
            <Text style={styles.paymentCashNote}>— Cobra al llegar</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            step === STEPS.length - 1 && styles.nextBtnDone,
          ]}
          onPress={advance}
        >
          <Text style={styles.nextBtnText}>
            {step < STEPS.length - 1 ? STEPS[step + 1] : 'Finalizar viaje'}
          </Text>
          <Ionicons
            name={
              step < STEPS.length - 1 ? 'arrow-forward' : 'checkmark-circle'
            }
            size={20}
            color="#0033A0"
          />
        </TouchableOpacity>
      </View>
    </View>

    {callSession?.type === 'agora' && (
      <InCallOverlay
        session={callSession}
        otherPersonName={passengerName || 'Pasajero'}
        onCallEnd={() => setCallSession(null)}
      />
    )}
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotActive: { backgroundColor: '#0033A0', borderColor: '#0033A0' },
  stepText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
  },
  stepTextActive: { color: '#0033A0', fontWeight: '800' },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  destination: { fontSize: 12, color: '#6B7280', marginTop: 2, maxWidth: 200 },
  callBtn: {
    marginLeft: 'auto',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
  },
  nextBtn: {
    backgroundColor: '#FFCD00',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnDone: { backgroundColor: '#D1FAE5' },
  nextBtnText: { color: '#0033A0', fontSize: 15, fontWeight: '900' },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  paymentBadgeCash: {
    backgroundColor: '#D1FAE5',
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  paymentLabelCash: {
    color: '#065F46',
  },
  paymentFare: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  paymentCashNote: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 2,
  },
});
