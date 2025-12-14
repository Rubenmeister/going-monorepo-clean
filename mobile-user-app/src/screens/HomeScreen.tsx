import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  ScrollView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ESM import for logo
import goingLogoHorizontal from '../assets/logo_horizontal.png';
import ecuadorMap from '../assets/ecuador_map.png';

// Design tokens
const COLORS = {
  goingRed: '#FF4D4D',
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#F5F5F5',
  gray: '#6B7280',
  border: '#E5E5E5',
  mapBg: '#E8E4D9',
};

interface HomeScreenProps {
  navigation?: any;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [originAddress, setOriginAddress] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<'shared' | 'private'>('private');
  const [tripDate, setTripDate] = useState('');
  const [tripTime, setTripTime] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const incrementPassengers = () => {
    if (passengers < 6) setPassengers(passengers + 1);
  };

  const decrementPassengers = () => {
    if (passengers > 1) setPassengers(passengers - 1);
  };

  // Simulated fare calculation
  const calculateFare = () => {
    if (originAddress && destinationAddress) {
      // Simulated fare based on trip type and passengers
      const baseRate = tripType === 'private' ? 15 : 8;
      const passengerRate = passengers * 2;
      const fare = baseRate + passengerRate + Math.random() * 10;
      setEstimatedFare(Math.round(fare * 100) / 100);
    }
  };

  const handleSearchDrivers = () => {
    calculateFare();
    console.log('Searching drivers...', { originAddress, originCity, destinationAddress, destinationCity, passengers, tripType, tripDate, tripTime });
  };

  return (
    <View style={styles.container}>
      {/* Map Container with Red Border */}
      <View style={styles.mapContainer}>
        <Image 
          source={{ uri: ecuadorMap }} 
          style={styles.mapBackground} 
          resizeMode="cover"
        />
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Image source={{ uri: goingLogoHorizontal }} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.langText}>ES</Text>
        </View>
      </SafeAreaView>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <TouchableOpacity 
          style={styles.sidebarOverlay} 
          activeOpacity={1} 
          onPress={toggleSidebar}
        >
          <View style={styles.sidebar}>
            <TouchableOpacity onPress={(e) => e.stopPropagation()}>
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <Image source={{ uri: goingLogoHorizontal }} style={styles.sidebarLogo} resizeMode="contain" />
                <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* User Section */}
              <View style={styles.userSection}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>U</Text>
                </View>
                <Text style={styles.userName}>Usuario</Text>
              </View>

              {/* Menu Items */}
              <View style={styles.menuSection}>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemIcon}>👤</Text>
                  <Text style={styles.menuItemText}>Mi Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemIcon}>👛</Text>
                  <Text style={styles.menuItemText}>Mi Cuenta</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemIcon}>💳</Text>
                  <Text style={styles.menuItemText}>Pagos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation?.navigate('Chat'); }}>
                  <Text style={styles.menuItemIcon}>💬</Text>
                  <Text style={styles.menuItemText}>Chat con Conductor</Text>
                </TouchableOpacity>
              </View>

              {/* Going Services */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Servicios Going</Text>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemIcon}>🏠</Text>
                  <Text style={styles.menuItemText}>Anfitriones</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemIcon}>🗺️</Text>
                  <Text style={styles.menuItemText}>Tours</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={styles.menuItemIcon}>⭐</Text>
                  <Text style={styles.menuItemText}>Experiencias Locales</Text>
                </TouchableOpacity>
              </View>

              {/* Trip History */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Historial de Viajes</Text>
                
                {/* Sample Trip 1 */}
                <TouchableOpacity style={styles.tripHistoryItem}>
                  <View style={styles.tripHistoryHeader}>
                    <Text style={styles.tripHistoryDate}>12 Dic 2024</Text>
                    <Text style={styles.tripHistoryPrice}>$18.50</Text>
                  </View>
                  <Text style={styles.tripHistoryRoute}>Quito → Guayaquil</Text>
                  <Text style={styles.tripHistoryType}>Viaje Compartido • 2 pasajeros</Text>
                </TouchableOpacity>

                {/* Sample Trip 2 */}
                <TouchableOpacity style={styles.tripHistoryItem}>
                  <View style={styles.tripHistoryHeader}>
                    <Text style={styles.tripHistoryDate}>5 Dic 2024</Text>
                    <Text style={styles.tripHistoryPrice}>$25.00</Text>
                  </View>
                  <Text style={styles.tripHistoryRoute}>Cuenca → Quito</Text>
                  <Text style={styles.tripHistoryType}>Viaje Privado • 1 pasajero</Text>
                </TouchableOpacity>

                {/* Sample Trip 3 */}
                <TouchableOpacity style={styles.tripHistoryItem}>
                  <View style={styles.tripHistoryHeader}>
                    <Text style={styles.tripHistoryDate}>28 Nov 2024</Text>
                    <Text style={styles.tripHistoryPrice}>$12.75</Text>
                  </View>
                  <Text style={styles.tripHistoryRoute}>Guayaquil → Cuenca</Text>
                  <Text style={styles.tripHistoryType}>Viaje Compartido • 3 pasajeros</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.viewAllTrips}>
                  <Text style={styles.viewAllTripsText}>Ver todos los viajes →</Text>
                </TouchableOpacity>
              </View>

              {/* Emergency Section */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Seguridad</Text>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    Alert.alert(
                      '📍 Compartir Ubicación',
                      'Tu ubicación será compartida con tus contactos de confianza.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Compartir', onPress: () => Alert.alert('Éxito', 'Ubicación compartida con tus contactos de confianza.') }
                      ]
                    );
                  }}
                >
                  <Text style={styles.menuItemIcon}>📍</Text>
                  <Text style={styles.menuItemText}>Compartir Ubicación</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.menuItem, styles.emergencyMenuItem]}
                  onPress={() => {
                    Alert.alert(
                      '🚨 AUXILIO - SOS',
                      '¿Estás en una situación de emergencia?\n\nSe notificará a los servicios de emergencia y a tu contacto de confianza.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: '📞 Llamar al 911',
                          style: 'destructive',
                          onPress: () => Alert.alert('Emergencia', 'Conectando con servicios de emergencia...') 
                        },
                        {
                          text: '📍 Enviar ubicación',
                          onPress: () => Alert.alert('Ubicación enviada', 'Tu ubicación ha sido enviada a emergencias y contactos de confianza.')
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.menuItemIcon}>🆘</Text>
                  <Text style={[styles.menuItemText, styles.emergencyText]}>AUXILIO / SOS</Text>
                </TouchableOpacity>
              </View>

              {/* Logout */}
              <View style={styles.menuSection}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate('Landing')}>
                  <Text style={styles.menuItemIcon}>🚪</Text>
                  <Text style={[styles.menuItemText, { color: COLORS.goingRed }]}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Trip Configuration Card */}
      <View style={styles.tripCard}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Text style={styles.cardTitle}>¿A dónde vamos?</Text>
          <Text style={styles.cardSubtitle}>Configura tu viaje</Text>

          {/* Origin */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>ORIGEN</Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputIcon, styles.originIcon]}>
                <View style={styles.originDot} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Dirección"
                placeholderTextColor={COLORS.gray}
                value={originAddress}
                onChangeText={setOriginAddress}
              />
            </View>
            <View style={[styles.inputRow, styles.cityInputRow]}>
              <TextInput
                style={styles.input}
                placeholder="Ciudad"
                placeholderTextColor={COLORS.gray}
                value={originCity}
                onChangeText={setOriginCity}
              />
            </View>
          </View>

          {/* Destination */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>DESTINO</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIcon}>
                <View style={styles.destinationDot} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Dirección"
                placeholderTextColor={COLORS.gray}
                value={destinationAddress}
                onChangeText={setDestinationAddress}
              />
            </View>
            <View style={[styles.inputRow, styles.cityInputRow]}>
              <TextInput
                style={styles.input}
                placeholder="Ciudad"
                placeholderTextColor={COLORS.gray}
                value={destinationCity}
                onChangeText={setDestinationCity}
              />
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeSection}>
              <Text style={styles.inputLabel}>FECHA</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.dateTimeInput]}
                  placeholder="dd/mm/aaaa"
                  placeholderTextColor={COLORS.gray}
                  value={tripDate}
                  onChangeText={setTripDate}
                />
              </View>
            </View>
            <View style={styles.dateTimeSection}>
              <Text style={styles.inputLabel}>HORA</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.dateTimeInput]}
                  placeholder="00:00"
                  placeholderTextColor={COLORS.gray}
                  value={tripTime}
                  onChangeText={setTripTime}
                />
              </View>
            </View>
          </View>

          {/* Passengers */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>PASAJEROS</Text>
            <View style={styles.passengersRow}>
              <Text style={styles.passengersLabel}>Número de personas</Text>
              <View style={styles.passengersControls}>
                <TouchableOpacity 
                  style={styles.passengerButton}
                  onPress={decrementPassengers}
                >
                  <Text style={styles.passengerButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.passengerCount}>{passengers}</Text>
                <TouchableOpacity 
                  style={styles.passengerButton}
                  onPress={incrementPassengers}
                >
                  <Text style={styles.passengerButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Trip Type */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>TIPO DE VIAJE</Text>
            <View style={styles.tripTypeRow}>
              <TouchableOpacity 
                style={[
                  styles.tripTypeCard,
                  tripType === 'shared' && styles.tripTypeCardActive
                ]}
                onPress={() => setTripType('shared')}
              >
                <Text style={styles.tripTypeIcon}>👥</Text>
                <Text style={[
                  styles.tripTypeTitle,
                  tripType === 'shared' && styles.tripTypeTitleActive
                ]}>Compartido</Text>
                <Text style={styles.tripTypeDesc}>Ahorra viajando con otros</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.tripTypeCard,
                  tripType === 'private' && styles.tripTypeCardActive
                ]}
                onPress={() => setTripType('private')}
              >
                <Text style={styles.tripTypeIcon}>👤</Text>
                <Text style={[
                  styles.tripTypeTitle,
                  tripType === 'private' && styles.tripTypeTitleActive
                ]}>Privado</Text>
                <Text style={styles.tripTypeDesc}>Viaje exclusivo para ti</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Estimated Fare Display */}
          {estimatedFare && (
            <View style={styles.fareContainer}>
              <Text style={styles.fareLabel}>Tarifa Estimada</Text>
              <Text style={styles.farePrice}>${estimatedFare.toFixed(2)} USD</Text>
              <Text style={styles.fareNote}>*El precio final puede variar</Text>
            </View>
          )}

          {/* Going Services Quick Access */}
          <View style={styles.servicesSection}>
            <Text style={styles.servicesTitle}>Más servicios Going</Text>
            <View style={styles.servicesRow}>
              <TouchableOpacity style={styles.serviceItem}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFE5E5' }]}>
                  <Text style={styles.serviceIconEmoji}>🏠</Text>
                </View>
                <Text style={styles.serviceLabel}>Anfitriones</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem}>
                <View style={[styles.serviceIcon, { backgroundColor: '#E5F3FF' }]}>
                  <Text style={styles.serviceIconEmoji}>🗺️</Text>
                </View>
                <Text style={styles.serviceLabel}>Tours</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.serviceItem}>
                <View style={[styles.serviceIcon, { backgroundColor: '#FFF5E5' }]}>
                  <Text style={styles.serviceIconEmoji}>⭐</Text>
                </View>
                <Text style={styles.serviceLabel}>Experiencias</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearchDrivers}
          >
            <Text style={styles.searchButtonText}>Buscar Conductores →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.mapBg,
  },
  mapContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.goingRed,
    overflow: 'hidden',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholderText: {
    fontSize: 48,
    color: '#D1D5DB',
    fontWeight: 'bold',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.goingRed,
    fontStyle: 'italic',
  },
  headerLogo: {
    width: 100,
    height: 35,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  tripCard: {
    position: 'absolute',
    top: 80,
    left: '25%',
    right: '25%',
    bottom: 30,
    width: '50%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  cityInputRow: {
    marginTop: 6,
    marginLeft: 36,
  },
  inputIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  originIcon: {},
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: COLORS.goingRed,
    backgroundColor: COLORS.white,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.black,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    paddingVertical: 0,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateTimeSection: {
    flex: 1,
  },
  dateTimeInput: {
    textAlign: 'center',
  },
  passengersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  passengersLabel: {
    fontSize: 16,
    color: COLORS.black,
  },
  passengersControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  passengerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerButtonText: {
    fontSize: 20,
    color: COLORS.black,
    lineHeight: 22,
  },
  passengerCount: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    minWidth: 24,
    textAlign: 'center',
  },
  tripTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tripTypeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tripTypeCardActive: {
    borderColor: COLORS.goingRed,
    borderWidth: 2,
  },
  tripTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  tripTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  tripTypeTitleActive: {
    color: COLORS.goingRed,
  },
  tripTypeDesc: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
  },
  // Going Services Quick Access Styles
  servicesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  servicesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  serviceItem: {
    alignItems: 'center',
    width: 80,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceIconEmoji: {
    fontSize: 24,
  },
  serviceLabel: {
    fontSize: 11,
    color: COLORS.black,
    textAlign: 'center',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: COLORS.goingRed,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Fare estimation styles
  fareContainer: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  fareLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  farePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.goingRed,
  },
  fareNote: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Sidebar styles
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: COLORS.black,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sidebarLogo: {
    width: 100,
    height: 35,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.gray,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.lightGray,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.goingRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  menuSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
  // Emergency styles
  emergencyMenuItem: {
    backgroundColor: 'rgba(255, 78, 67, 0.1)',
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 8,
  },
  emergencyText: {
    color: COLORS.goingRed,
    fontWeight: 'bold',
  },
  // Trip History styles
  tripHistoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tripHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripHistoryDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  tripHistoryPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.goingRed,
  },
  tripHistoryRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  tripHistoryType: {
    fontSize: 11,
    color: COLORS.gray,
  },
  viewAllTrips: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  viewAllTripsText: {
    fontSize: 14,
    color: COLORS.goingRed,
    fontWeight: '600',
  },
});

export default HomeScreen;
