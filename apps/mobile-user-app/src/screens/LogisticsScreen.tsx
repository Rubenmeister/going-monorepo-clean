import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Truck, ArrowLeft, Info } from 'lucide-react-native';

const COLORS = {
  goingRed: '#FF4E43',
  goingYellow: '#FFD700',
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#F5F5F5',
  gray: '#6B7280',
  border: '#E5E5E5',
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
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={COLORS.black} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LOGÍSTICA / ENVÍOS</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿QUÉ VAS A ENVIAR?</Text>
          <View style={styles.typeRow}>
            {['SOBRES', 'STANDARD', 'MEDIANO'].map((type) => (
              <TouchableOpacity 
                key={type}
                style={[styles.typeCard, packageType === type && styles.typeCardActive]}
                onPress={() => setPackageType(type)}
              >
                <Package color={packageType === type ? COLORS.goingRed : COLORS.gray} size={32} />
                <Text style={[styles.typeText, packageType === type && styles.typeTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PUNTO DE RECOGIDA</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                placeholder="Dirección de origen"
                value={origin}
                onChangeText={setOrigin}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PUNTO DE ENTREGA</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input}
                placeholder="Dirección de destino"
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>
        </View>

        {/* Weight Info */}
        <View style={styles.section}>
           <Text style={styles.label}>PESO APROXIMADO (KG)</Text>
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

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Info color={COLORS.gray} size={20} />
          <Text style={styles.infoText}>
            Máximo 20kg por envío. El tiempo estimado de entrega es de 2 a 4 horas.
          </Text>
        </View>

        {/* Estimation */}
        {estimatedPrice && (
           <View style={styles.fareContainer}>
             <Text style={styles.fareLabel}>Cotización Estimada</Text>
             <Text style={styles.farePrice}>${estimatedPrice.toFixed(2)} USD</Text>
           </View>
        )}

        <TouchableOpacity 
          style={styles.mainButton}
          onPress={calculatePrice}
        >
          <Truck color="white" size={24} style={{ marginRight: 10 }} />
          <Text style={styles.mainButtonText}>PEDIR ENVÍO AHORA</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: 16,
    letterSpacing: 1,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: COLORS.goingRed,
    backgroundColor: COLORS.white,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
    color: COLORS.gray,
  },
  typeTextActive: {
    color: COLORS.goingRed,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: COLORS.black,
  },
  weightSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    width: 120,
    height: 50,
    paddingHorizontal: 16,
  },
  weightInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  weightUnit: {
    fontWeight: '900',
    color: COLORS.gray,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 18,
  },
  fareContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.goingYellow,
  },
  fareLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  farePrice: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.black,
  },
  mainButton: {
    backgroundColor: COLORS.goingRed,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.goingRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 40,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
