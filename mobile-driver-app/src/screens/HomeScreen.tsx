import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Power } from 'lucide-react-native';

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
          <Text style={styles.mapText}>Dark Mode Map View</Text>
      </View>

      {/* 2. Earnings Capsule */}
      <View style={styles.earningsContainer}>
          <Text style={styles.earningsValue}>$150.00</Text>
      </View>

      {/* 3. Bottom Action Sheet */}
      <View style={styles.bottomSheet}>
          <View style={styles.statusIndicator}>
              <Text style={styles.statusText}>
                  {isOnline ? 'Estás en línea' : 'Estás desconectado'}
              </Text>
          </View>

          {/* 4. The "GO" Pill Button */}
          <TouchableOpacity 
            style={[styles.goButton, isOnline ? styles.goButtonOffline : styles.goButtonOnline]}
            onPress={toggleStatus}
          >
            <Text style={styles.goText}>
              {isOnline ? 'DESCONECTAR' : 'GO ONLINE'}
            </Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
    borderWidth: 2,
    borderColor: '#000',
  },// Dark background behind map
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#2D3748', // Simulated Dark Map
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    color: '#4A5568',
    fontSize: 18,
    fontWeight: 'bold',
  },
  earningsContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  earningsValue: {
    color: '#48BB78', // Money Green
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#1A202C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 30,
    paddingBottom: 50,
    alignItems: 'center',
  },
  statusIndicator: {
      marginBottom: 20,
  },
  statusText: {
      color: 'white',
      fontSize: 16,
  },
  goButton: {
    width: '100%',
    height: 60,
    borderRadius: 30, // PILL SHAPE
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  goButtonOnline: {
    backgroundColor: '#ff4c41', // Brand Red for Action
  },
  goButtonOffline: {
    backgroundColor: '#4A5568', // Grey for Stop
  },
  goText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900', // Ultra Bold
    letterSpacing: 1,
  },
});
