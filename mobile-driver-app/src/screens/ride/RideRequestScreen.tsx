import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { hapticSuccess, hapticHeavy, hapticWarning } from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import { useDriverStore } from '@store/useDriverStore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNTDOWN_SECONDS = 30;

type Nav = NativeStackNavigationProp<DriverMainStackParamList, 'RideRequest'>;
type Route = RouteProp<DriverMainStackParamList, 'RideRequest'>;

export function RideRequestScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { driver } = useDriverStore();
  const {
    rideId,
    passengerName: passenger,
    origin,
    destination,
    amount,
  } = params as any;
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Start countdown on mount — auto-reject when it hits 0
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: COUNTDOWN_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          navigation.goBack(); // auto-reject
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const respond = async (accept: boolean) => {
    clearTimer();
    if (accept) setIsAccepting(true);
    else setIsRejecting(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const base =
        process.env.EXPO_PUBLIC_API_URL ||
        'https://api.goingec.com';
      if (accept) {
        // PATCH /transport/:tripId/accept
        await axios.patch(
          `${base}/transport/${rideId}/accept`,
          { driverId: driver?.id ?? '' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        navigation.replace('ActiveRide', {
          rideId,
          passengerName: passenger,
          destination,
        });
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.response?.data?.message || 'No se pudo responder a la solicitud.'
      );
      setIsAccepting(false);
      setIsRejecting(false);
    }
  };

  // Interpolate progress width for the bar
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isUrgent = countdown <= 10;

  return (
    <View style={styles.container}>
      {/* Countdown bar */}
      <View style={styles.countdownTrack}>
        <Animated.View
          style={[
            styles.countdownBar,
            { width: progressWidth, backgroundColor: isUrgent ? '#DC2626' : '#FFCD00' },
          ]}
        />
      </View>
      <View style={styles.countdownLabel}>
        <Ionicons
          name="time-outline"
          size={14}
          color={isUrgent ? '#DC2626' : '#6B7280'}
        />
        <Text style={[styles.countdownText, isUrgent && { color: '#DC2626' }]}>
          {countdown}s para responder
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconArea}>
          <View style={styles.iconBg}>
            <Ionicons name="person" size={36} color="#0033A0" />
          </View>
          <Text style={styles.passengerName}>{passenger || 'Pasajero'}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#FFCD00" />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
        </View>

        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={styles.dotOrigin} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Origen</Text>
              <Text style={styles.routeAddr}>
                {origin || 'Ubicación actual'}
              </Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <Ionicons name="location" size={16} color="#FFCD00" />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Destino</Text>
              <Text style={styles.routeAddr}>
                {destination || 'Destino seleccionado'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Ingreso estimado</Text>
          <Text style={styles.amount}>${(amount || 8.5).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => respond(false)}
          disabled={isRejecting || isAccepting}
        >
          {isRejecting ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <>
              <Ionicons name="close-circle" size={22} color="#DC2626" />
              <Text style={styles.rejectText}>Rechazar</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => respond(true)}
          disabled={isAccepting || isRejecting}
        >
          {isAccepting ? (
            <ActivityIndicator color="#0033A0" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#0033A0" />
              <Text style={styles.acceptText}>Aceptar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 0,
  },
  countdownTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
    marginHorizontal: -20,
  },
  countdownBar: {
    height: 5,
  },
  countdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconArea: { alignItems: 'center', marginBottom: 24 },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  passengerName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { color: '#6B7280', fontWeight: '700' },
  route: { marginBottom: 20 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  dotOrigin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0033A0',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  routeLine: {
    height: 20,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  routeAddr: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
  },
  amountLabel: { fontSize: 14, color: '#6B7280' },
  amount: { fontSize: 24, fontWeight: '900', color: '#059669' },
  actions: { flexDirection: 'row', gap: 12 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  rejectText: { color: '#DC2626', fontSize: 15, fontWeight: '800' },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFCD00',
    borderRadius: 14,
    paddingVertical: 16,
  },
  acceptText: { color: '#0033A0', fontSize: 15, fontWeight: '900' },
});
