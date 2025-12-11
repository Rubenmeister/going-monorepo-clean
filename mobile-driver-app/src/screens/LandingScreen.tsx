import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface LandingScreenProps {
  navigation: any;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Background with Red Curve/Shape (Simulated with View or Image) */}
      <View style={styles.backgroundStrip} />

      <View style={styles.content}>
        {/* Header / Logo */}
        <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Going</Text>
            <Text style={styles.tagline}>Nos movemos contigo</Text>
        </View>

        {/* Hero Image Area */}
        <View style={styles.heroContainer}>
            {/* Placeholder for the SUV Image from reference */}
            <View style={styles.placeholderSUV}>
                <Text style={{color: 'white'}}>SUV Image Placeholder</Text>
            </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
            <TouchableOpacity 
                style={[styles.button, styles.passengerButton]}
                onPress={() => {
                     // In Driver App, Passenger flow might be disabled or switch app
                     navigation.navigate('UserLogin'); 
                }} 
            >
                <Text style={styles.passengerButtonText}>Soy Pasajero</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.button, styles.driverButton]}
                onPress={() => navigation.navigate('Login')} // Default flow for Driver App
            >
                <Text style={styles.driverButtonText}>Soy Conductor</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: '#E3001B', 
    borderBottomRightRadius: 80,
    zIndex: -1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  logoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic', 
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  heroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderSUV: {
    width: width * 0.8,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  passengerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3001B',
  },
  passengerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E3001B',
  },
  driverButton: {
    backgroundColor: '#262626', 
  },
  driverButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
