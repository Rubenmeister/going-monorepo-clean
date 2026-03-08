import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Nav = NativeStackNavigationProp<DriverMainStackParamList, 'RideRequest'>;
type Route = RouteProp<DriverMainStackParamList, 'RideRequest'>;

export function RideRequestScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const {
    rideId,
    passengerName: passenger,
    origin,
    destination,
    amount,
  } = params as any;
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const respond = async (accept: boolean) => {
    if (accept) setIsAccepting(true);
    else setIsRejecting(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      await axios.patch(
        `${
          process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
        }/api/transport/rides/${rideId}/respond`,
        { accept },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (accept) {
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

  return (
    <View style={styles.container}>
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
