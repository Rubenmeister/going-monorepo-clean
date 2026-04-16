/**
 * EnviosScreen — Envíos y Encomiendas Going
 *
 * Colores: Rojo Going (#ff4c41) SOLO en bordes, iconos y acentos.
 * Flujo: Form → Tracking → Entrega (foto conductor + OTP)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import MapboxGL from '@rnmapbox/maps';
import { useAuthStore } from '../../store/useAuthStore';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../utils/haptics';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const RED   = '#ff4c41';
const GREEN = '#059669';

const PACKAGE_TYPES = [
  { id: 'small',  label: 'Pequeño', icon: '📦', desc: 'hasta 5 kg', price: 5  },
  { id: 'medium', label: 'Mediano',  icon: '🗃️', desc: '5-20 kg',   price: 8  },
  { id: 'large',  label: 'Grande',   icon: '📫', desc: '20+ kg',    price: 12 },
] as const;

type PackageType = typeof PACKAGE_TYPES[number]['id'];
type ScreenView  = 'form' | 'tracking' | 'delivered';

export function EnviosScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<{ params: any }, 'params'>>();
  const { user }   = useAuthStore();

  const [view,           setView]          = useState<ScreenView>('form');
  const [pkgType,        setPkgType]       = useState<PackageType>('small');
  const [pkgDesc,        setPkgDesc]       = useState('');
  const [pkgPhoto,       setPkgPhoto]      = useState<string | null>(null);
  const [senderAddr,     setSenderAddr]    = useState('');
  const [recipientName,  setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone]= useState('');
  const [recipientAddr,  setRecipientAddr] = useState('');
  const [loading,        setLoading]       = useState(false);
  const [otpCode,        setOtpCode]       = useState('');
  const [trackingRef,    setTrackingRef]   = useState('');

  // Recibir ubicaciones del LocationPicker
  useEffect(() => {
    const src = route.params?.selectedPickup;
    if (src) setSenderAddr(src.address);
  }, [route.params?.selectedPickup]);

  useEffect(() => {
    const dst = route.params?.selectedDelivery;
    if (dst) setRecipientAddr(dst.address);
  }, [route.params?.selectedDelivery]);

  const selectedPkg = PACKAGE_TYPES.find(p => p.id === pkgType)!;
  const totalPrice  = selectedPkg.price;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled) { setPkgPhoto(result.assets[0].uri); hapticLight(); }
  };

  const validate = () => {
    if (!senderAddr)     { Alert.alert('Falta dirección', 'Ingresa la dirección de recogida.'); return false; }
    if (!recipientName)  { Alert.alert('Falta destinatario', 'Ingresa el nombre de quien recibe.'); return false; }
    if (!recipientPhone) { Alert.alert('Falta teléfono', 'Ingresa el teléfono del destinatario.'); return false; }
    if (!recipientAddr)  { Alert.alert('Falta dirección', 'Ingresa la dirección de entrega.'); return false; }
    return true;
  };

  const handleSolicitar = async () => {
    if (!validate()) return;
    hapticMedium(); setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setTrackingRef(`ENV-${Date.now().toString().slice(-8).toUpperCase()}`);
      setOtpCode(Math.floor(1000 + Math.random() * 9000).toString());
      hapticSuccess(); setView('tracking');
    } catch { hapticError(); Alert.alert('Error', 'No se pudo procesar el envío.'); }
    finally { setLoading(false); }
  };

  if (view === 'tracking') return (
    <TrackingView ref_={trackingRef} otpCode={otpCode}
      senderAddr={senderAddr} recipientName={recipientName}
      recipientAddr={recipientAddr} recipientPhone={recipientPhone}
      pkgType={selectedPkg} totalPrice={totalPrice}
      onDelivered={() => setView('delivered')} navigation={navigation} />
  );

  if (view === 'delivered') return (
    <DeliveredView recipientName={recipientName} navigation={navigation} />
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Image source={require('../../../assets/going-logo-envios.png')} style={s.headerLogo} resizeMode="contain" />
          <View style={s.badge}><Ionicons name="cube-outline" size={12} color={RED} /><Text style={s.badgeText}>ENVÍOS</Text></View>
        </View>
        <Text style={s.headerSub}>De punto a punto · Rastreo · Registro de entrega</Text>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

          {/* QUIÉN ENVÍA */}
          <View style={s.card}>
            <View style={s.cardTitle}><Ionicons name="arrow-up-circle-outline" size={15} color={RED} /><Text style={s.cardTitleText}>QUIÉN ENVÍA</Text></View>
            <View style={s.fieldRow}>
              <Ionicons name="person-outline" size={15} color="#9CA3AF" />
              <Text style={s.fieldVal}>{user?.firstName} {user?.lastName}</Text>
              <TouchableOpacity><Text style={s.fieldAction}>Cambiar</Text></TouchableOpacity>
            </View>
            <View style={s.fieldRow}>
              <Ionicons name="call-outline" size={15} color="#9CA3AF" />
              <Text style={s.fieldVal}>{user?.phone ?? '+593 ...'}</Text>
              <View style={s.verifiedBadge}><Ionicons name="checkmark-circle" size={12} color={GREEN} /><Text style={s.verifiedText}>Verificado</Text></View>
            </View>
            <TouchableOpacity style={s.fieldRow} onPress={() => navigation.navigate('LocationPicker', { title: 'Dirección de recogida', mode: 'origin', accentColor: RED, returnScreen: 'Envios', paramKey: 'selectedPickup' })}>
              <Ionicons name="location-outline" size={15} color={RED} />
              <Text style={senderAddr ? s.fieldVal : s.fieldPh} numberOfLines={1}>{senderAddr || 'Dirección de recogida...'}</Text>
              <Text style={s.fieldAction}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {/* QUIÉN RECIBE */}
          <View style={s.card}>
            <View style={s.cardTitle}><Ionicons name="arrow-down-circle-outline" size={15} color={RED} /><Text style={s.cardTitleText}>QUIÉN RECIBE</Text></View>
            <View style={s.fieldRow}>
              <Ionicons name="person-outline" size={15} color="#9CA3AF" />
              <TextInput style={s.fieldInput} placeholder="Nombre del destinatario" placeholderTextColor="#9CA3AF" value={recipientName} onChangeText={setRecipientName} />
            </View>
            <View style={s.fieldRow}>
              <Ionicons name="call-outline" size={15} color="#9CA3AF" />
              <TextInput style={s.fieldInput} placeholder="Teléfono del destinatario" placeholderTextColor="#9CA3AF" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />
            </View>
            <TouchableOpacity style={s.fieldRow} onPress={() => navigation.navigate('LocationPicker', { title: 'Dirección de entrega', mode: 'destination', accentColor: RED, returnScreen: 'Envios', paramKey: 'selectedDelivery' })}>
              <Ionicons name="location-outline" size={15} color={RED} />
              <Text style={recipientAddr ? s.fieldVal : s.fieldPh} numberOfLines={1}>{recipientAddr || 'Dirección de entrega...'}</Text>
              <Text style={s.fieldAction}>Buscar</Text>
            </TouchableOpacity>
            <View style={s.otpNote}><Ionicons name="lock-closed-outline" size={12} color={RED} /><Text style={s.otpNoteText}>El destinatario confirmará con código OTP al recibir</Text></View>
          </View>

          {/* EL PAQUETE */}
          <View style={s.card}>
            <View style={s.cardTitle}><Ionicons name="cube-outline" size={15} color={RED} /><Text style={s.cardTitleText}>EL PAQUETE</Text></View>
            <View style={s.pkgRow}>
              {PACKAGE_TYPES.map(p => (
                <TouchableOpacity key={p.id} style={[s.pkgCard, pkgType === p.id && s.pkgCardActive]} onPress={() => { setPkgType(p.id); hapticLight(); }}>
                  <Text style={s.pkgIcon}>{p.icon}</Text>
                  <Text style={[s.pkgName, pkgType === p.id && { color: RED }]}>{p.label}</Text>
                  <Text style={s.pkgDesc}>{p.desc}</Text>
                  <Text style={[s.pkgPrice, pkgType === p.id && { color: RED }]}>${p.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.descInput} placeholder="Descripción del contenido (ej: documentos, ropa...)" placeholderTextColor="#9CA3AF" value={pkgDesc} onChangeText={setPkgDesc} multiline maxLength={120} />
            <TouchableOpacity style={s.photoArea} onPress={handlePickPhoto}>
              {pkgPhoto
                ? <Image source={{ uri: pkgPhoto }} style={s.photoPreview} resizeMode="cover" />
                : <><Ionicons name="camera-outline" size={22} color={RED} /><Text style={s.photoText}>Foto del paquete (opcional)</Text><Text style={s.photoHint}>Recomendado para reclamaciones</Text></>
              }
            </TouchableOpacity>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={s.footer}>
          <View><Text style={s.footerLabel}>Estimado</Text><Text style={s.footerPrice}>${totalPrice.toFixed(2)}</Text></View>
          <TouchableOpacity style={[s.ctaBtn, loading && { opacity: 0.7 }]} onPress={handleSolicitar} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Text style={s.ctaBtnText}>Solicitar envío</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function TrackingView({ ref_, otpCode, senderAddr, recipientName, recipientAddr, recipientPhone, pkgType, totalPrice, onDelivered, navigation }: any) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  // Coordenadas de Quito por defecto — en producción vendrían del envío real
  const QUITO: [number, number] = [-78.4678, -0.1807];

  return (
    <View style={s.container}>

      {/* ── MAPA TIEMPO REAL ── */}
      <MapboxGL.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={MapboxGL.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={13}
          centerCoordinate={QUITO}
          animationMode="flyTo"
        />
        <MapboxGL.UserLocation visible />
        {/* Pin origen (rojo) */}
        <MapboxGL.PointAnnotation id="env-origin" coordinate={QUITO}>
          <View style={s.mapPinRed} />
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>

      {/* ── OVERLAY DEGRADADO ── */}
      <View style={s.mapOverlayGrad} pointerEvents="none" />

      {/* ── HEADER FLOTANTE ── */}
      <View style={s.trackFloatHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Image source={require('../../../assets/going-logo-envios.png')} style={s.headerLogo} resizeMode="contain" />
        <Text style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>#{ref_}</Text>
      </View>

      {/* ── STATUS PILL FLOTANTE ── */}
      <View style={s.statusPill}>
        <View style={s.statusDot} />
        <View style={{ flex: 1 }}>
          <Text style={s.statusText}>Conductor recogiendo el paquete</Text>
          <Text style={s.statusEta}>Estimado: ~15 minutos</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={RED} />
      </View>

      {/* ── BOTTOM SHEET ── */}
      <View style={s.trackBottomSheet}>
        <View style={s.trackHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.statusCard}>
          <View style={s.statusDot} />
          <View style={{ flex: 1 }}><Text style={s.statusText}>Conductor recogiendo el paquete</Text><Text style={s.statusEta}>Estimado: ~15 minutos</Text></View>
          <Ionicons name="chevron-forward" size={16} color={RED} />
        </View>
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          <View style={s.partyRow}>
            <View style={[s.partyIcon, { backgroundColor: '#FFF0EF' }]}><Ionicons name="arrow-up-circle" size={20} color={RED} /></View>
            <View style={{ flex: 1 }}><Text style={s.partyLabel}>REMITENTE</Text><Text style={s.partyName}>Remitente</Text><Text style={s.partyAddr} numberOfLines={1}>{senderAddr}</Text></View>
          </View>
          <View style={s.partyDivider} />
          <View style={s.partyRow}>
            <View style={[s.partyIcon, { backgroundColor: '#F0FDF4' }]}><Ionicons name="arrow-down-circle" size={20} color={GREEN} /></View>
            <View style={{ flex: 1 }}><Text style={s.partyLabel}>DESTINATARIO</Text><Text style={s.partyName}>{recipientName}</Text><Text style={s.partyAddr} numberOfLines={1}>{recipientAddr}</Text><Text style={s.partyPhone}>{recipientPhone}</Text></View>
            <View style={s.otpBox}><Text style={s.otpLabel}>Código OTP</Text><Text style={s.otpCode}>{otpCode}</Text></View>
          </View>
        </View>
        <View style={s.card}>
          <View style={s.cardTitle}><Ionicons name="navigate-outline" size={14} color={RED} /><Text style={s.cardTitleText}>RUTA DEL ENVÍO</Text></View>
          <View style={s.routeStep}><View style={[s.routeDot, { backgroundColor: RED }]} /><View><Text style={s.routeAddr} numberOfLines={1}>{senderAddr}</Text><Text style={s.routeTime}>Recogida · Ahora</Text></View></View>
          <View style={s.routeLine} />
          <View style={s.routeStep}><View style={[s.routeDot, { backgroundColor: GREEN }]} /><View><Text style={s.routeAddr} numberOfLines={1}>{recipientAddr}</Text><Text style={s.routeTime}>Entrega estimada · 2h 30min</Text></View></View>
        </View>
        <View style={s.card}>
          <View style={s.cardTitle}><Ionicons name="cube-outline" size={14} color={RED} /><Text style={s.cardTitleText}>PAQUETE · {pkgType.label.toUpperCase()}</Text></View>
          <View style={s.pkgSummaryRow}>
            <Text style={{ fontSize: 26 }}>{pkgType.icon}</Text>
            <View style={{ flex: 1 }}><Text style={s.pkgSummaryName}>{pkgType.label} · {pkgType.desc}</Text><Text style={s.pkgSummaryPrice}>${totalPrice.toFixed(2)}</Text></View>
            <View style={s.paidBadge}><Ionicons name="checkmark-circle" size={14} color={GREEN} /><Text style={s.paidText}>Pagado</Text></View>
          </View>
        </View>
          <View style={{ height: 16 }} />
        </ScrollView>
        <View style={s.trackFooter}>
          <TouchableOpacity style={s.trackCallBtn}><Ionicons name="call-outline" size={18} color={RED} /><Text style={s.trackCallText}>Llamar</Text></TouchableOpacity>
          <TouchableOpacity style={s.trackShareBtn}><Ionicons name="share-outline" size={18} color="#374151" /><Text style={s.trackShareText}>Compartir</Text></TouchableOpacity>
          <TouchableOpacity style={s.trackMapBtn} onPress={onDelivered}><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={s.trackMapText}>Confirmar entrega</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function DeliveredView({ recipientName, navigation }: any) {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#111827" /></TouchableOpacity>
        <Image source={require('../../../assets/going-logo-envios.png')} style={s.headerLogo} resizeMode="contain" />
      </View>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
          <View style={s.deliveredIcon}><Ionicons name="checkmark-circle" size={52} color={GREEN} /></View>
          <Text style={s.deliveredTitle}>¡Paquete entregado!</Text>
          <Text style={s.deliveredSub}>Entregado a {recipientName} · Confirmado con código OTP</Text>
        </View>
        <View style={s.card}>
          <View style={s.cardTitle}><Ionicons name="camera-outline" size={14} color={RED} /><Text style={s.cardTitleText}>FOTO DE ENTREGA</Text></View>
          <Image source={require('../../../assets/entrega.png')} style={s.deliveryPhoto} resizeMode="cover" />
          <Text style={s.deliveryCaption}>Foto tomada por el conductor al momento de la entrega · {new Date().toLocaleString('es-EC')}</Text>
        </View>
        <View style={s.card}>
          <View style={s.cardTitle}><Ionicons name="receipt-outline" size={14} color={RED} /><Text style={s.cardTitleText}>RESUMEN</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryLbl}>Estado</Text><Text style={[s.summaryVal, { color: GREEN }]}>✓ Entregado</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryLbl}>Destinatario</Text><Text style={s.summaryVal}>{recipientName}</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryLbl}>Hora</Text><Text style={s.summaryVal}>{new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</Text></View>
          <View style={s.summaryRow}><Text style={s.summaryLbl}>OTP</Text><Text style={[s.summaryVal, { color: GREEN }]}>✓ Verificado</Text></View>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={[s.ctaBtn, { flex: 1 }]} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
          <Text style={s.ctaBtnText}>Nuevo envío</Text>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 52, paddingBottom: 10, paddingHorizontal: 16, borderBottomWidth: 3, borderBottomColor: RED },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0EF', alignItems: 'center', justifyContent: 'center' },
  headerLogo: { height: 24 },
  badge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0EF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FECACA' },
  badgeText: { fontSize: 9, fontWeight: '900', color: RED },
  headerSub: { fontSize: 10, color: '#9CA3AF', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#fff' },
  scroll: { flex: 1, padding: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#F3F4F6', borderLeftWidth: 4, borderLeftColor: RED, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitleText: { fontSize: 10, fontWeight: '800', color: RED, letterSpacing: 1 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 11, marginBottom: 8, borderWidth: 1.5, borderColor: '#F3F4F6' },
  fieldVal: { flex: 1, fontSize: 13, fontWeight: '600', color: '#111827' },
  fieldPh:  { flex: 1, fontSize: 13, color: '#9CA3AF' },
  fieldAction: { fontSize: 11, fontWeight: '700', color: RED },
  fieldInput: { flex: 1, fontSize: 13, color: '#111827', padding: 0 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedText:  { fontSize: 10, fontWeight: '700', color: GREEN },
  otpNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF0EF', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#FECACA', marginTop: 4 },
  otpNoteText: { flex: 1, fontSize: 10, color: RED, fontWeight: '600' },
  pkgRow:       { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pkgCard:      { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  pkgCardActive:{ borderColor: RED, backgroundColor: '#FFF0EF' },
  pkgIcon:  { fontSize: 22, marginBottom: 4 },
  pkgName:  { fontSize: 11, fontWeight: '800', color: '#374151' },
  pkgDesc:  { fontSize: 9, color: '#9CA3AF', marginTop: 1 },
  pkgPrice: { fontSize: 12, fontWeight: '900', color: '#374151', marginTop: 4 },
  descInput: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 11, borderWidth: 1.5, borderColor: '#F3F4F6', fontSize: 13, color: '#111827', minHeight: 52, textAlignVertical: 'top', marginBottom: 8 },
  photoArea: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 2, borderColor: '#FECACA', borderStyle: 'dashed', padding: 16, alignItems: 'center', gap: 4 },
  photoPreview: { width: '100%', height: 110, borderRadius: 10 },
  photoText: { fontSize: 12, fontWeight: '700', color: RED },
  photoHint: { fontSize: 10, color: '#9CA3AF' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, paddingBottom: 32, borderTopWidth: 2, borderTopColor: '#FEE2E2' },
  footerLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  footerPrice: { fontSize: 26, fontWeight: '900', color: '#111827' },
  ctaBtn: { flex: 1, backgroundColor: RED, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 10, elevation: 6 },
  ctaBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  statusCard: { backgroundColor: '#FFF0EF', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: RED },
  statusText: { fontSize: 13, fontWeight: '800', color: RED },
  statusEta:  { fontSize: 10, color: '#B45309', marginTop: 2 },
  partyRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  partyIcon:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  partyLabel: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
  partyName:  { fontSize: 13, fontWeight: '800', color: '#111827' },
  partyAddr:  { fontSize: 10, color: '#6B7280', marginTop: 1 },
  partyPhone: { fontSize: 10, color: RED, fontWeight: '700', marginTop: 1 },
  partyDivider: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 12 },
  otpBox:  { backgroundColor: '#FFF0EF', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#FECACA' },
  otpLabel:{ fontSize: 8, fontWeight: '800', color: RED },
  otpCode: { fontSize: 18, fontWeight: '900', color: RED },
  routeStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeDot:  { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 3 },
  routeLine: { width: 2, height: 16, backgroundColor: '#FEE2E2', marginLeft: 4, marginVertical: 3 },
  routeAddr: { fontSize: 12, fontWeight: '700', color: '#111827' },
  routeTime: { fontSize: 10, color: '#6B7280', marginTop: 1 },
  pkgSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pkgSummaryName:  { fontSize: 13, fontWeight: '700', color: '#111827' },
  pkgSummaryPrice: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  paidText:  { fontSize: 10, fontWeight: '700', color: GREEN },
  trackFooter: { flexDirection: 'row', gap: 8, backgroundColor: '#fff', padding: 14, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  trackCallBtn:  { flex: 1, backgroundColor: '#FFF0EF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#FECACA' },
  trackCallText: { fontSize: 12, fontWeight: '800', color: RED },
  trackShareBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  trackShareText:{ fontSize: 12, fontWeight: '800', color: '#374151' },
  trackMapBtn:   { flex: 2, backgroundColor: RED, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: RED, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  trackMapText:  { fontSize: 12, fontWeight: '900', color: '#fff' },
  deliveredIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  deliveredTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 4 },
  deliveredSub:   { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  deliveryPhoto:   { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
  deliveryCaption: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  summaryLbl: { fontSize: 12, color: '#6B7280' },
  summaryVal: { fontSize: 12, fontWeight: '700', color: '#111827' },

  // Tracking con mapa
  mapPinRed: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: RED, borderWidth: 2, borderColor: '#fff',
  },
  mapOverlayGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
    // Degradado simulado — en producción usar LinearGradient
    backgroundColor: 'transparent',
  },
  trackFloatHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 52, paddingBottom: 10, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderBottomWidth: 3, borderBottomColor: RED,
  },
  statusPill: {
    position: 'absolute', top: 110, left: 14, right: 14,
    backgroundColor: '#FFF0EF',
    borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#FECACA',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  trackBottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '55%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 8,
  },
  trackHandle: {
    width: 36, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, margin: 10, alignSelf: 'center',
  },
});
