import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/apiClient';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        const data = await apiClient.getBookingsByUser(user.id);
        setBookings(data);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0033A0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mis Reservas</Text>

      {bookings.length === 0 ? (
        <Text style={styles.noBookings}>Aún no tienes reservas</Text>
      ) : (
        bookings.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.cardTitle}>{booking.serviceType}</Text>
              <View style={[styles.status, { backgroundColor: getStatusColor(booking.status) }]}>
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>

            <Text style={styles.price}>${booking.totalPrice.amount}</Text>

            <View style={styles.details}>
              <Text style={styles.detailLabel}>Fecha de inicio:</Text>
              <Text style={styles.detailValue}>
                {new Date(booking.startDate).toLocaleDateString('es-ES')}
              </Text>

              {booking.endDate && (
                <>
                  <Text style={styles.detailLabel}>Fecha de fin:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(booking.endDate).toLocaleDateString('es-ES')}
                  </Text>
                </>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function getStatusColor(status: string) {
  const colors: any = {
    pending: '#FFC107',
    confirmed: '#4CAF50',
    cancelled: '#F44336',
    completed: '#2196F3',
  };
  return colors[status] || '#999';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0033A0',
    marginBottom: 15,
  },
  noBookings: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0033A0',
    marginBottom: 12,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
