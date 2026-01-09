import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { User, Bell, Zap, TrendingUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import andeanPattern from '../assets/andean_pattern.png';
import ecuadorBg from '../assets/ecuador_landscape_bg.png';

// Design tokens - Driver Dark Mode Premium
const COLORS = {
  goingRed: '#FF4E43',
  goingYellow: '#F5A623',
  dark: '#0D0D0D',
  charcoal: '#1A1A1A',
  greenOnline: '#48BB78',
  grayOffline: '#374151',
  white: '#FFFFFF',
  glassWhite: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export function HomeScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const [isOnline, setIsOnline] = useState(false);

  const toggleStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      !isOnline ? '¡Conectado!' : 'Desconectado',
      !isOnline ? 'Ahora estás recibiendo solicitudes de viaje.' : 'Has finalizado tu turno. ¡Buen trabajo!'
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Premium Dark Map Background */}
      <Image source={ecuadorBg as any} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.mapOverlay} />
      <Image source={andeanPattern as any} style={styles.backgroundPattern} resizeMode="repeat" />
      
      <View style={styles.mapTextContainer}>
        <Text style={styles.mapText}>ECUADOR EN MOVIMIENTO</Text>
        <View style={[styles.mapMarker, { top: '40%', left: '30%' }]} />
        <View style={[styles.mapMarker, { top: '60%', left: '70%' }]} />
      </View>

      {/* 2. Top Bar - Premium Glass */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation?.navigate('Profile')}>
          <User color="white" size={22} />
        </TouchableOpacity>
        <View style={styles.earningsCapsule}>
          <Text style={styles.earningsLabel}>HOY</Text>
          <Text style={styles.earningsValue}>$150.00</Text>
          <View style={styles.earningsGlow} />
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Bell color="white" size={22} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* 3. Bottom Action Sheet - Premium Glass */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.greenOnline : COLORS.grayOffline }]} />
          <Text style={styles.statusText}>
            {isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}
          </Text>
        </View>

        {/* 4. The "GO" Pill Button - Premium */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.goButton, isOnline ? styles.goButtonOffline : styles.goButtonOnline]}
            onPress={toggleStatus}
            activeOpacity={0.85}
          >
            <Zap size={24} color={COLORS.white} style={{ marginRight: 12 }} />
            <Text style={styles.goText}>
              {isOnline ? 'FINALIZAR TURNO' : 'INICIAR TURNO'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.taglineText}>ECUADOR EN MOVIMIENTO 🇪🇨</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <TrendingUp size={18} color={COLORS.goingYellow} style={{ marginBottom: 4 }} />
            <Text style={styles.statValue}>4.91</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <TrendingUp size={18} color={COLORS.greenOnline} style={{ marginBottom: 4 }} />
            <Text style={styles.statValue}>97%</Text>
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
    backgroundColor: COLORS.dark,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  mapTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    color: 'rgba(255,255,255,0.08)',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 10,
  },
  mapMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.goingRed,
    shadowColor: COLORS.goingRed,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.glassWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  earningsCapsule: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.greenOnline,
    position: 'relative',
  },
  earningsGlow: {
    position: 'absolute',
    top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(72, 187, 120, 0.3)',
  },
  earningsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },
  earningsValue: {
    color: COLORS.greenOnline,
    fontSize: 26,
    fontWeight: '900',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.charcoal,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 48,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 28,
    backgroundColor: COLORS.glassWhite,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 28,
    alignItems: 'center',
  },
  goButton: {
    width: '100%',
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  goButtonOnline: {
    backgroundColor: COLORS.goingRed,
    shadowColor: COLORS.goingRed,
  },
  goButtonOffline: {
    backgroundColor: COLORS.grayOffline,
    shadowColor: '#000',
  },
  goText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
  },
  taglineText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.glassBorder,
  },
});
