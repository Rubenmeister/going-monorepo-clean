import React, { Fragment, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import { hapticMedium } from '../../utils/haptics';
import { resolveCallSession, startPSTNCall } from '../../utils/agoraCall';
import type { CallSession } from '../../utils/agoraCall';
import { InCallOverlay } from '../../components/InCallOverlay';

type Route = RouteProp<DriverMainStackParamList, 'ActiveRide'>;

const STEPS = ['Camino al pasajero', 'Pasajero a bordo', 'Viaje completado'];

export function ActiveRideScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Route>();
  const { rideId, passengerName, destination } = params;
  const mapRef = useRef<MapView>(null);
  const [driverLoc, setDriverLoc] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [step, setStep]             = useState(0);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [callLoading, setCallLoading] = useState(false);

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
        setDriverLoc({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    );
    return () => {
      mounted = false;
      sub.then((s) => s.remove());
    };
  }, []);

  const advance = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      Alert.alert('Viaje completado', '¡Excelente trabajo!', [
        { text: 'Ver resumen', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <Fragment>
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: -0.1807,
          longitude: -78.4678,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      />

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
          <View>
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
});
