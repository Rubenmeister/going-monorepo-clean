import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { Power, User, CreditCard, Bell, MapPin } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import andeanPattern from '../assets/andean_pattern.png';

const { width, height } = Dimensions.get('window');

export function HomeScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(false);

  const toggleStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      !isOnline ? 'Conectado' : 'Desconectado',
      !isOnline ? 'Ahora puedes recibir viajes.' : 'Has terminado tu sesión.'
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Map Background (Dark Mode) */}
      <View style={styles.mapPlaceholder}>
          <View style={styles.gridOverlay} />
          <Text style={styles.mapText}>ECUADOR EN MOVIMIENTO</Text>
          <View style={[styles.mapMarker, { top: '40%', left: '30%' }]} />
          <View style={[styles.mapMarker, { top: '60%', left: '70%' }]} />
      </View>

      <Image source={{ uri: andeanPattern }} style={styles.backgroundPattern} resizeMode="repeat" />

      {/* 2. Top Bar Items */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton}>
          <User color="white" size={24} />
        </TouchableOpacity>
        <View style={styles.earningsCapsule}>
          <Text style={styles.earningsLabel}>HOY</Text>
          <Text style={styles.earningsValue}>$150.00</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Bell color="white" size={24} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* 3. Bottom Action Sheet */}
      <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#48BB78' : '#6B7280' }]} />
              <Text style={styles.statusText}>
                  {isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}
              </Text>
          </View>

          {/* 4. The "GO" Pill Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.goButton, isOnline ? styles.goButtonOffline : styles.goButtonOnline]}
              onPress={toggleStatus}
              activeOpacity={0.8}
            >
              <Text style={styles.goText}>
                {isOnline ? 'SALIR DE TURNO' : 'INICIAR TURNO'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
                <Text style={styles.statLabel}>Calificación</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>95%</Text>
              <Text style={styles.statLabel}>Aceptación</Text>
            </View>
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  mapText: {
    color: 'rgba(255,255,255,0.1)',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 8,
  },
  mapMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4D4D',
    shadowColor: '#FF4D4D',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  earningsCapsule: {
    backgroundColor: 'black',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#48BB78',
  },
  earningsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  earningsValue: {
    color: '#48BB78',
    fontSize: 24,
    fontWeight: '900',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  goButton: {
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  goButtonOnline: {
    backgroundColor: '#FF4D4D',
    shadowColor: '#FF4D4D',
  },
  goButtonOffline: {
    backgroundColor: '#374151',
    shadowColor: '#000',
  },
  goText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
