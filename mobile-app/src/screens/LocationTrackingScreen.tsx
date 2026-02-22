/**
 * Location Tracking Screen
 * Real-time ride tracking and live location updates
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  X,
} from 'react-native-feather';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

interface RideData {
  id: string;
  status: string;
  driverName: string;
  driverRating: number;
  driverPhone: string;
  vehicleInfo: string;
  eta: number;
  currentLat: number;
  currentLon: number;
  destinationLat: number;
  destinationLon: number;
}

export const LocationTrackingScreen: React.FC<{
  rideId?: string;
  onBack?: () => void;
}> = ({ rideId, onBack }) => {
  const [callActive, setCallActive] = useState(false);

  const { data: rideData, isLoading } = useQuery({
    queryKey: ['ride-tracking', rideId],
    queryFn: () => api.get<RideData>(`/api/rides/${rideId}/tracking`),
    enabled: !!rideId,
  });

  const { mutate: cancelRide, isPending: isCanceling } = useMutation({
    mutationFn: () => api.post(`/api/rides/${rideId}/cancel`),
    onSuccess: () => {
      Alert.alert('Ride Cancelled', 'Your ride has been cancelled.');
      onBack?.();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to cancel ride');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  const ride = rideData?.data;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <X width={24} height={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map Placeholder (In production, use react-native-maps) */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <MapPin width={40} height={40} color="#007AFF" />
          <Text style={styles.mapText}>
            Driver arriving in {ride?.eta || '--'} min
          </Text>
        </View>
      </View>

      {/* Driver Info Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {ride?.driverName?.charAt(0) || 'D'}
              </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{ride?.driverName}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ {ride?.driverRating}</Text>
                <Text style={styles.vehicleInfo}> • {ride?.vehicleInfo}</Text>
              </View>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconButton, callActive && styles.iconButtonActive]}
              onPress={() => setCallActive(!callActive)}
            >
              <Phone
                width={20}
                height={20}
                color={callActive ? '#007AFF' : '#666'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MessageCircle width={20} height={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.tripDetails}>
          <View style={styles.tripPoint}>
            <View
              style={[styles.tripIndicator, { backgroundColor: '#4ECDC4' }]}
            />
            <Text style={styles.tripAddress}>Current Location</Text>
          </View>
          <View style={styles.tripLine} />
          <View style={styles.tripPoint}>
            <View
              style={[styles.tripIndicator, { backgroundColor: '#FF6B6B' }]}
            />
            <Text style={styles.tripAddress}>Destination</Text>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => cancelRide()}
          disabled={isCanceling}
        >
          {isCanceling ? (
            <ActivityIndicator color="#FF6B6B" />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Navigation width={16} height={16} color="#007AFF" />
        <Text style={styles.statusText}>Driver is on the way</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  driverCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  tripDetails: {
    marginVertical: 16,
  },
  tripPoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  tripAddress: {
    fontSize: 13,
    color: '#666',
  },
  tripLine: {
    width: 2,
    height: 16,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginVertical: 4,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f7ff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  statusText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
