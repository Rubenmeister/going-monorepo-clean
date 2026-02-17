import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>¿Qué quieres hacer?</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚗 Transporte</Text>
          <Text style={styles.cardDescription}>Solicita un viaje</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Alojamiento</Text>
          <Text style={styles.cardDescription}>Busca hospedaje</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎭 Experiencias</Text>
          <Text style={styles.cardDescription}>Descubre actividades</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎫 Tours</Text>
          <Text style={styles.cardDescription}>Explora lugares</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0033A0',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
  },
});
