import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MapPin, Box, Car } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* 1. Map Placeholder (Background) */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Google Maps View</Text>
      </View>

      {/* 2. Floating "Where to?" Card */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchBar}>
            <Text style={styles.searchTitle}>Where to?</Text>
            <View style={styles.nowContainer}>
                <Text style={styles.nowText}>Now</Text>
            </View>
        </TouchableOpacity>
      </View>

      {/* 3. Service Selection (Ride vs Package) */}
      <View style={styles.servicesContainer}>
        <TouchableOpacity style={[styles.serviceCard, styles.activeService]}>
            <View style={styles.iconCircle}>
                 <Car color="white" size={32} />
            </View>
            <Text style={styles.activeServiceText}>Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.serviceCard}>
            <View style={[styles.iconCircle, styles.inactiveIcon]}>
                 <Box color="black" size={32} />
            </View>
            <Text style={styles.serviceText}>Package</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E2E8F0', // Map color
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    color: '#CBD5E0',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchBar: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 30, // Uber-style rounded pill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    marginLeft: 10,
  },
  nowContainer: {
    backgroundColor: '#EEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  nowText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  servicesContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  serviceCard: {
    width: width * 0.4,
    height: 120,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeService: {
    backgroundColor: 'white',
    borderColor: '#ff4c41', // Brand Red Selection
    borderWidth: 2,
  },
  iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#ff4c41',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
  },
  inactiveIcon: {
      backgroundColor: '#EEE',
  },
  activeServiceText: {
      fontWeight: 'bold',
      fontSize: 16,
      color: 'black',
  },
  serviceText: {
      fontWeight: '500',
      fontSize: 16,
      color: '#718096',
  },
});
