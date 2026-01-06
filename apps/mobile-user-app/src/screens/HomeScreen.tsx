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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhotoCarousel, CarouselItem } from '../components/PhotoCarousel';

// Image assets - ESM imports for Vite web compatibility
import goingLogoHorizontal from '../assets/logo_horizontal.png';

import { 
  Menu, 
  User, 
  CreditCard, 
  MessageCircle, 
  Home as HomeIcon, 
  Map as MapIcon, 
  Star, 
  Shield, 
  LogOut,
  Package,
  Plus,
  Users as UsersIcon,
  Navigation
} from 'lucide-react-native';

// Design tokens
const COLORS = {
  goingRed: '#FF4E43',
  white: '#FFFFFF',
  black: '#1A1A1A',
  lightGray: '#F3F4F6',
  gray: '#4B5563', // Darker gray for better contrast
  border: '#E5E7EB',
  mapBg: '#E8E4D9',
  glassWhite: 'rgba(255, 255, 255, 0.92)', // More opaque for legibility
  glassBorder: 'rgba(255, 255, 255, 1)',
  blue: '#0EA5E9',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 40; // Full width minus padding

// Ecuador photo carousel data
const ECUADOR_PHOTOS: CarouselItem[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1599144342502-8d7693d20a0a?q=80&w=600',
    title: 'Quito Histórico',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1594142404563-64cccaf5a10f?q=80&w=600',
    title: 'El Panecillo',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1589139265076-7ca67098e9a6?q=80&w=600',
    title: 'Cuenca Colonial',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1627993074041-5975acb879ec?q=80&w=600',
    title: 'Islas Galápagos',
  },
];


export function HomeScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [originCity, setOriginCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'none' | 'viaje' | 'envios'>('none');
  
  // Shipping form states
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [shipmentOriginCity, setShipmentOriginCity] = useState('');
  const [shipmentOriginAddress, setShipmentOriginAddress] = useState('');
  const [shipmentDestCity, setShipmentDestCity] = useState('');
  const [shipmentDestAddress, setShipmentDestAddress] = useState('');
  
  // Shipping Integrated State
  const [activeService] = useState<'viaje' | 'envio'>('viaje');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const incrementPassengers = () => {
    if (passengers < 6) setPassengers(passengers + 1);
  };

  const handleSearchDrivers = () => {
    console.log('Searching drivers...', { originAddress, destinationAddress, passengers, activeService });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Menu size={24} color={COLORS.black} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image source={goingLogoHorizontal as any} style={styles.headerLogo} resizeMode="contain" />
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Perfil', 'Acceso rápido al perfil')}>
            <User size={24} color={COLORS.black} />
          </TouchableOpacity>
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
              {/* Sidebar Header - Clean Minimalist */}
              <View style={styles.sidebarHeader}>
                <Image source={goingLogoHorizontal as any} style={styles.sidebarLogo} resizeMode="contain" />
                <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
                  <Plus size={24} color={COLORS.black} style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              </View>

              {/* User Section */}
              <View style={styles.userSection}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>U</Text>
                </View>
                <View>
                  <Text style={styles.userName}>Andrés Mendoza</Text>
                  <Text style={styles.userLevel}>Nivel Diamante 💎</Text>
                </View>
              </View>

              {/* Menu Items */}
              <View style={styles.menuSection}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation?.navigate('Profile'); }}>
                  <User size={20} color={COLORS.gray} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Mi Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <CreditCard size={20} color={COLORS.gray} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Pagos y Billetera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setIsSidebarOpen(false); navigation?.navigate('Chat'); }}>
                  <MessageCircle size={20} color={COLORS.gray} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Soporte 24/7</Text>
                </TouchableOpacity>
              </View>

              {/* Going Services */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Servicios Going</Text>
                <TouchableOpacity style={styles.menuItem}>
                  <HomeIcon size={20} color={COLORS.gray} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Anfitriones</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <MapIcon size={20} color={COLORS.gray} style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Tours</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Star size={20} color={COLORS.gray} style={styles.menuItemIcon} />
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
                  <MapIcon size={20} color={COLORS.gray} style={styles.menuItemIcon} />
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
                  <Shield size={20} color={COLORS.goingRed} style={styles.menuItemIcon} />
                  <Text style={[styles.menuItemText, styles.emergencyText]}>AUXILIO / SOS</Text>
                </TouchableOpacity>
              </View>

              {/* Logout */}
              <View style={styles.menuSection}>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate('Landing')}>
                  <LogOut size={20} color={COLORS.goingRed} style={styles.menuItemIcon} />
                  <Text style={[styles.menuItemText, { color: COLORS.goingRed }]}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.contentScroll} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Main Action Buttons - Always visible at top */}
          <View style={styles.mainActionsContainer}>
            {/* Pedir Viaje Button */}
            <TouchableOpacity 
              style={[
                styles.mainActionButton, 
                { backgroundColor: activeMode === 'viaje' ? COLORS.goingRed : COLORS.white }
              ]}
              onPress={() => setActiveMode(activeMode === 'viaje' ? 'none' : 'viaje')}
            >
              <Navigation size={24} color={activeMode === 'viaje' ? COLORS.white : COLORS.goingRed} />
              <Text style={[
                styles.mainActionText, 
                { color: activeMode === 'viaje' ? COLORS.white : COLORS.black }
              ]}>PEDIR VIAJE</Text>
            </TouchableOpacity>

            {/* Envíos Going Button */}
            <TouchableOpacity 
              style={[
                styles.mainActionButton, 
                { backgroundColor: activeMode === 'envios' ? COLORS.black : COLORS.white }
              ]}
              onPress={() => setActiveMode(activeMode === 'envios' ? 'none' : 'envios')}
            >
              <Package size={24} color={activeMode === 'envios' ? COLORS.white : COLORS.black} />
              <Text style={[
                styles.mainActionText, 
                { color: activeMode === 'envios' ? COLORS.white : COLORS.black }
              ]}>ENVÍOS GOING</Text>
            </TouchableOpacity>
          </View>

          {/* Trip Form - Expanded when activeMode === 'viaje' */}
          {activeMode === 'viaje' && (
            <View style={styles.expandedFormCard}>
              <Text style={styles.formTitle}>¿A DÓNDE VAMOS HOY?</Text>
              
              {/* Origin Section */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>ORIGEN</Text>
                <View style={styles.formInputRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginRight: 8 }]}
                    placeholder="Ciudad"
                    placeholderTextColor="#9CA3AF"
                    value={originCity}
                    onChangeText={setOriginCity}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 2 }]}
                    placeholder="Dirección"
                    placeholderTextColor="#9CA3AF"
                    value={originAddress}
                    onChangeText={setOriginAddress}
                  />
                </View>
              </View>

              {/* Destination Section */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>DESTINO</Text>
                <View style={styles.formInputRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginRight: 8 }]}
                    placeholder="Ciudad"
                    placeholderTextColor="#9CA3AF"
                    value={destinationCity}
                    onChangeText={setDestinationCity}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 2 }]}
                    placeholder="Dirección"
                    placeholderTextColor="#9CA3AF"
                    value={destinationAddress}
                    onChangeText={setDestinationAddress}
                  />
                </View>
              </View>

              {/* Passengers and DateTime */}
              <View style={styles.formInputRow}>
                <TouchableOpacity 
                  style={[styles.formPill, { flex: 1, marginRight: 8 }]}
                  onPress={incrementPassengers}
                >
                  <UsersIcon size={16} color={COLORS.goingRed} />
                  <Text style={styles.formPillText}>{passengers} Pasajeros</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.formPill, { flex: 1 }]}>
                  <Star size={16} color={COLORS.goingRed} />
                  <Text style={styles.formPillText}>Hoy, Ahora</Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSearchDrivers}
              >
                <Navigation size={18} color={COLORS.white} />
                <Text style={styles.submitButtonText}>BUSCAR CONDUCTORES</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Envíos Form - Expanded when activeMode === 'envios' */}
          {activeMode === 'envios' && (
            <View style={styles.expandedFormCard}>
              <Text style={styles.formTitle}>ENVÍO DE PAQUETES</Text>
              
              {/* Origin Section */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>ORIGEN DEL ENVÍO</Text>
                <View style={styles.formInputRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginRight: 8 }]}
                    placeholder="Ciudad"
                    placeholderTextColor="#9CA3AF"
                    value={shipmentOriginCity}
                    onChangeText={setShipmentOriginCity}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 2 }]}
                    placeholder="Dirección"
                    placeholderTextColor="#9CA3AF"
                    value={shipmentOriginAddress}
                    onChangeText={setShipmentOriginAddress}
                  />
                </View>
              </View>

              {/* Destination Section */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>DESTINO DEL ENVÍO</Text>
                <View style={styles.formInputRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginRight: 8 }]}
                    placeholder="Ciudad"
                    placeholderTextColor="#9CA3AF"
                    value={shipmentDestCity}
                    onChangeText={setShipmentDestCity}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 2 }]}
                    placeholder="Dirección"
                    placeholderTextColor="#9CA3AF"
                    value={shipmentDestAddress}
                    onChangeText={setShipmentDestAddress}
                  />
                </View>
              </View>

              {/* Sender Info */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>QUIEN ENVÍA</Text>
                <View style={styles.formInputRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginRight: 8 }]}
                    placeholder="Nombre"
                    placeholderTextColor="#9CA3AF"
                    value={senderName}
                    onChangeText={setSenderName}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 1 }]}
                    placeholder="Teléfono"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={senderPhone}
                    onChangeText={setSenderPhone}
                  />
                </View>
              </View>

              {/* Receiver Info */}
              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>QUIEN RECIBE</Text>
                <View style={styles.formInputRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginRight: 8 }]}
                    placeholder="Nombre"
                    placeholderTextColor="#9CA3AF"
                    value={receiverName}
                    onChangeText={setReceiverName}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 1 }]}
                    placeholder="Teléfono"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={receiverPhone}
                    onChangeText={setReceiverPhone}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: COLORS.black }]}
                onPress={() => Alert.alert('Envío', 'Buscando transportista...')}
              >
                <Package size={18} color={COLORS.white} />
                <Text style={styles.submitButtonText}>SOLICITAR ENVÍO</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Secondary Services Row */}
          <View style={styles.secondaryServicesContainer}>
            <TouchableOpacity style={styles.secondaryServiceItem} onPress={() => Alert.alert('Hospedaje', 'Próximamente')}>
              <View style={[styles.secondaryServiceIcon, { backgroundColor: '#F0FDF4' }]}>
                <HomeIcon size={20} color="#22C55E" />
              </View>
              <Text style={styles.secondaryServiceLabel}>Hospedaje</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryServiceItem} onPress={() => Alert.alert('Tours', 'Próximamente')}>
              <View style={[styles.secondaryServiceIcon, { backgroundColor: '#FFF7ED' }]}>
                <MapIcon size={20} color="#F97316" />
              </View>
              <Text style={styles.secondaryServiceLabel}>Tours</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryServiceItem} onPress={() => Alert.alert('Experiencias', 'Próximamente')}>
              <View style={[styles.secondaryServiceIcon, { backgroundColor: '#F5F3FF' }]}>
                <Star size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.secondaryServiceLabel}>Experiencias</Text>
            </TouchableOpacity>
          </View>

          {/* Photo Carousel */}
          <View style={styles.carouselSection}>
            <Text style={styles.galleryTitle}>EXPLORA ECUADOR</Text>
            <PhotoCarousel
              items={ECUADOR_PHOTOS}
              autoPlay={true}
              autoPlayInterval={5000}
              showIndicators={true}
              showOverlay={true}
              aspectRatio={3.5}
              indicatorActiveColor={COLORS.black}
              indicatorInactiveColor="#D1D5DB"
              onItemPress={(item) => Alert.alert('Destino', `Descubre ${item.title}`)}
            />
          </View>


          {/* Legal Footer */}
          <View style={styles.homeLegalFooter}>
            <TouchableOpacity onPress={() => Alert.alert('Condiciones de Viaje')}>
              <Text style={styles.legalLinkText}>Condiciones de Viaje</Text>
            </TouchableOpacity>
            <View style={styles.legalSeparator} />
            <TouchableOpacity onPress={() => Alert.alert('Condiciones de Envíos')}>
              <Text style={styles.legalLinkText}>Condiciones de Envíos</Text>
            </TouchableOpacity>
          </View>
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
  headerLogo: {
    width: 100,
    height: 35,
  },
  menuButton: {
    padding: 8,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: COLORS.white,
    zIndex: 101,
  },
  sidebarHeader: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 20,
  },
  sidebarLogo: {
    width: 160,
    height: 60,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.goingRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  userLevel: {
    fontSize: 10,
    color: COLORS.goingRed,
    fontWeight: 'bold',
  },
  menuSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gray,
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '500',
  },
  emergencyMenuItem: {
    backgroundColor: 'rgba(255,77,77,0.05)',
  },
  emergencyText: {
    color: COLORS.goingRed,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 15,
  },
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
  contentContainer: {
    flex: 1,
    marginTop: 100,
  },
  contentScroll: {
    flex: 1,
  },
  gallerySection: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  galleryTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 12,
    letterSpacing: 2,
  },
  galleryList: {
    gap: 16,
    paddingRight: 40,
  },
  galleryCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  galleryLocation: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.goingRed,
  },
  unifiedServiceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    marginHorizontal: 12,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },

  compactCategoryTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  dualInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  compactInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 38,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  compactInputIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  compactInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.black,
    padding: 0,
  },
  quickConfigRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  configPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  configPillText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '600',
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  tripBtn: {
    backgroundColor: COLORS.goingRed,
  },
  pkgBtn: {
    backgroundColor: '#0EA5E9',
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  miniServicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  miniServiceItem: {
    alignItems: 'center',
    gap: 4,
  },
  miniIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray,
  },
  homeLegalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  legalLinkText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 12,
  },
  // Carousel styles
  carouselSection: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  carouselList: {
    gap: 16,
    paddingRight: 40,
  },
  carouselCard: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  carouselLocation: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  indicatorActive: {
    backgroundColor: COLORS.black,
    width: 24,
  },
  indicatorEnvios: {
    backgroundColor: '#FFB3B3',
  },
  indicatorEnviosActive: {
    backgroundColor: COLORS.goingRed,
    width: 24,
  },
  // Envíos promotional card styles
  enviosPromoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.goingRed,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enviosPromoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  enviosPromoText: {
    flex: 1,
  },
  enviosPromoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  enviosPromoSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  // Envíos card styles
  enviosCard: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  enviosContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  enviosTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.black,
    marginTop: 12,
    letterSpacing: 2,
  },
  enviosSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    marginBottom: 16,
  },
  enviosOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  enviosOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  enviosOptionActive: {
    backgroundColor: COLORS.goingRed,
    borderColor: COLORS.goingRed,
  },
  enviosOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
  },
  enviosOptionTextActive: {
    color: COLORS.white,
  },
  enviosWeightInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  enviosWeightText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    minWidth: 24,
    textAlign: 'center',
    padding: 0,
  },
  enviosWeightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
  },
  enviosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  enviosButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
  // New styles for restructured layout
  mainActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  mainActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainActionText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  expandedFormCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 14,
  },
  formSectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gray,
    letterSpacing: 1,
    marginBottom: 8,
  },
  formInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  formPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.goingRed,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  secondaryServicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryServiceItem: {
    alignItems: 'center',
    gap: 8,
  },
  secondaryServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryServiceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
});

export default HomeScreen;

