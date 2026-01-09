import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Truck, ArrowLeft, Info, MapPin } from 'lucide-react-native';

// ESM import for assets
import andeanPattern from '../assets/andean_pattern.png';
import ecuadorBg from '../assets/ecuador_landscape_bg.png';

const COLORS = {
  goingRed: '#FF4E43',
  goingYellow: '#F5A623',
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#F5F5F5',
  gray: '#6B7280',
  border: '#E5E5E5',
  glassWhite: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

export function LogisticsScreen({ navigation }: { navigation: any }) {
  const [packageType, setPackageType] = useState('STANDARD');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('5');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const calculatePrice = () => {
    if (origin && destination) {
       const base = packageType === 'SOBRES' ? 3 : packageType === 'STANDARD' ? 5 : 8;
       const weightExtra = parseFloat(weight) * 0.5;
       setEstimatedPrice(base + weightExtra);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={ecuadorBg as any} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.backgroundOverlay} />
      <Image source={andeanPattern as any} style={styles.backgroundPattern} resizeMode="repeat" />

      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={COLORS.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LOGÍSTICA / ENVÍOS</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Types - Premium Carousels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿QUÉ VAS A ENVIAR?</Text>
          <View style={styles.typeRow}>
            {['SOBRES', 'STANDARD', 'MEDIANO'].map((type) => (
              <TouchableOpacity 
                key={type}
                style={[styles.typeCard, packageType === type && styles.typeCardActive]}
                onPress={() => setPackageType(type)}
              >
                <Package color={packageType === type ? COLORS.white : COLORS.white} opacity={packageType === type ? 1 : 0.5} size={32} />
                <Text style={[styles.typeText, packageType === type && styles.typeTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Route Info - Glass Card */}
        <View style={[styles.section, styles.glassCard]}>
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MapPin size={14} color={COLORS.goingRed} style={{ marginRight: 6 }} />
              <Text style={styles.label}>PUNTO DE RECOGIDA</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                placeholder="Dirección de origen"
                placeholderTextColor="#9CA3AF"
                value={origin}
                onChangeText={setOrigin}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MapPin size={14} color={COLORS.goingRed} style={{ marginRight: 6 }} />
              <Text style={styles.label}>PUNTO DE ENTREGA</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                placeholder="Dirección de destino"
                placeholderTextColor="#9CA3AF"
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>
        </View>

        {/* Weight and Estimation */}
        <View style={styles.flexRow}>
          <View style={[styles.section, styles.glassCard, { flex: 1, marginRight: 12, marginBottom: 0 }]}>
            <Text style={styles.label}>PESO APROX (KG)</Text>
            <View style={styles.weightSelector}>
              <TextInput 
                  style={styles.weightInput}
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
              />
              <Text style={styles.weightUnit}>KG</Text>
            </View>
          </View>

          <View style={[styles.section, styles.glassCard, { flex: 1, marginBottom: 0, justifyContent: 'center' }]}>
             <TouchableOpacity 
                style={styles.refreshButton}
                onPress={calculatePrice}
              >
                <Text style={styles.refreshButtonText}>COTIZAR</Text>
              </TouchableOpacity>
          </View>
        </View>

        {/* Estimation Display */}
        {estimatedPrice && (
           <View style={styles.fareContainer}>
             <Text style={styles.fareLabel}>Tarifa Estimada</Text>
             <Text style={styles.farePrice}>${estimatedPrice.toFixed(2)}</Text>
             <Text style={styles.fareCurrency}>USD</Text>
           </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Info color="#3B82F6" size={20} />
          <Text style={styles.infoText}>
            Máximo 20kg. Entrega express de 2-4 horas. Incluye seguimiento en tiempo real.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.mainButton}
          onPress={() => Alert.alert('Éxito', 'Buscando el mejor transportista para tu envío...')}
        >
          <Truck color="white" size={24} style={{ marginRight: 12 }} />
          <Text style={styles.mainButtonText}>ENVIAR AHORA</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.goingRed,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
    opacity: 0.88,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
  },
  header: {
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.white,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  flexRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.glassWhite,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  typeCardActive: {
    borderColor: COLORS.goingRed,
    backgroundColor: 'rgba(255, 78, 67, 0.25)',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  typeTextActive: {
    color: COLORS.white,
  },
  glassCard: {
    backgroundColor: COLORS.glassWhite,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  inputWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '500',
  },
  weightSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  weightInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.black,
  },
  weightUnit: {
    fontWeight: '900',
    color: COLORS.gray,
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: COLORS.white,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    fontWeight: '500',
  },
  fareContainer: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.goingYellow,
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.goingYellow,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  farePrice: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
  },
  fareCurrency: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: -4,
  },
  mainButton: {
    backgroundColor: COLORS.goingRed,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.goingRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 60,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
