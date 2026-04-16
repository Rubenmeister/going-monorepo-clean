/**
 * EnviosScreen
 * Flujo de creación de envíos + lista de envíos activos/pasados.
 * Conectado a POST /parcels y GET /parcels/my
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useAuthStore } from '@store/useAuthStore';
import { api } from '@services/api';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const RED   = '#C0392B';
const GREEN = '#27AE60';
const DARK  = '#1A1A2E';
const GRAY  = '#7F8C8D';
const BG    = '#F7F8FA';

type ParcelType = 'sobre' | 'paquete' | 'maleta';
type ParcelStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

interface Parcel {
  id: string;
  type: ParcelType;
  origin: { address: string };
  destination: { address: string };
  recipientName: string;
  recipientPhone: string;
  status: ParcelStatus;
  createdAt: string;
  estimatedPrice?: number;
}

const PARCEL_TYPES: { key: ParcelType; label: string; icon: string; desc: string }[] = [
  { key: 'sobre',   label: 'Sobre',    icon: '✉️',  desc: 'Documentos, cartas' },
  { key: 'paquete', label: 'Paquete',  icon: '📦',  desc: 'Objetos hasta 10 kg' },
  { key: 'maleta',  label: 'Maleta',   icon: '🧳',  desc: 'Equipaje y bultos' },
];

const STATUS_INFO: Record<ParcelStatus, { label: string; color: string; icon: string }> = {
  pending:    { label: 'Buscando conductor', color: GRAY,  icon: 'time-outline' },
  assigned:   { label: 'Conductor asignado', color: '#2980B9', icon: 'person-outline' },
  picked_up:  { label: 'Recogido',           color: '#8E44AD', icon: 'checkmark-outline' },
  in_transit: { label: 'En camino',          color: '#E67E22', icon: 'car-outline' },
  delivered:  { label: 'Entregado',          color: GREEN, icon: 'checkmark-circle-outline' },
  cancelled:  { label: 'Cancelado',          color: RED,   icon: 'close-circle-outline' },
};

export function EnviosScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();

  const [tab, setTab]           = useState<'nuevo' | 'activos' | 'historial'>('nuevo');
  const [parcelType, setType]   = useState<ParcelType>('paquete');
  const [origin, setOrigin]     = useState('');
  const [destination, setDest]  = useState('');
  const [recipient, setRecip]   = useState('');
  const [phone, setPhone]       = useState('');
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [parcels, setParcels]   = useState<Parcel[]>([]);
  const [refreshing, setRefresh]= useState(false);

  const loadParcels = useCallback(async () => {
    try {
      const { data } = await api.get('/parcels/my');
      setParcels(data?.parcels ?? data ?? []);
    } catch {
      // silently fail — show empty state
    }
  }, []);

  useEffect(() => {
    loadParcels();
  }, [loadParcels]);

  const handleCreate = async () => {
    if (!origin.trim() || !destination.trim() || !recipient.trim() || !phone.trim()) {
      Alert.alert('Campos requeridos', 'Completa todos los campos para crear el envío.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/parcels', {
        userId:       user?.id,
        type:         parcelType,
        origin:       { address: origin.trim() },
        destination:  { address: destination.trim() },
        recipientName:  recipient.trim(),
        recipientPhone: phone.trim(),
        notes:        notes.trim() || undefined,
      });
      Alert.alert('¡Envío creado!', 'Estamos buscando un conductor disponible para tu envío.', [
        { text: 'Ver seguimiento', onPress: () => navigation.navigate('EnvioTracking', { parcelId: data.id ?? data.parcelId }) },
        { text: 'OK' },
      ]);
      // Reset form
      setOrigin(''); setDest(''); setRecip(''); setPhone(''); setNotes('');
      loadParcels();
      setTab('activos');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo crear el envío. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const active    = parcels.filter(p => !['delivered','cancelled'].includes(p.status));
  const history   = parcels.filter(p =>  ['delivered','cancelled'].includes(p.status));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Envíos</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['nuevo', 'activos', 'historial'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'nuevo' ? 'Nuevo' : t === 'activos' ? `Activos${active.length ? ` (${active.length})` : ''}` : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TAB: NUEVO ENVÍO ── */}
      {tab === 'nuevo' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

          {/* Tipo de envío */}
          <Text style={styles.sectionTitle}>¿Qué vas a enviar?</Text>
          <View style={styles.typeRow}>
            {PARCEL_TYPES.map(pt => (
              <TouchableOpacity
                key={pt.key}
                style={[styles.typeCard, parcelType === pt.key && styles.typeCardActive]}
                onPress={() => setType(pt.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.typeIcon}>{pt.icon}</Text>
                <Text style={[styles.typeName, parcelType === pt.key && { color: RED }]}>{pt.label}</Text>
                <Text style={styles.typeDesc}>{pt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Direcciones */}
          <Text style={styles.sectionTitle}>Ruta</Text>
          <View style={styles.card}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: GREEN }]} />
              <TextInput
                style={styles.routeInput}
                placeholder="Dirección de recogida"
                placeholderTextColor="#aaa"
                value={origin}
                onChangeText={setOrigin}
              />
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: RED }]} />
              <TextInput
                style={styles.routeInput}
                placeholder="Dirección de entrega"
                placeholderTextColor="#aaa"
                value={destination}
                onChangeText={setDest}
              />
            </View>
          </View>

          {/* Destinatario */}
          <Text style={styles.sectionTitle}>Destinatario</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.inputField}
              placeholder="Nombre completo"
              placeholderTextColor="#aaa"
              value={recipient}
              onChangeText={setRecip}
            />
            <View style={styles.inputDivider} />
            <TextInput
              style={styles.inputField}
              placeholder="Teléfono (ej. 0991234567)"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <View style={styles.inputDivider} />
            <TextInput
              style={[styles.inputField, { minHeight: 60 }]}
              placeholder="Notas adicionales (opcional)"
              placeholderTextColor="#aaa"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Aviso contenido prohibido */}
          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={16} color={RED} />
            <Text style={styles.warningText}>
              Prohibido enviar: sustancias ilegales, armas, dinero en efectivo, explosivos o artículos peligrosos.
            </Text>
          </View>

          <TouchableOpacity style={[styles.btnCreate, loading && { opacity: 0.7 }]} onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnCreateText}>Solicitar envío →</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── TAB: ACTIVOS ── */}
      {tab === 'activos' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefresh(true); await loadParcels(); setRefresh(false); }} tintColor={RED} />}
        >
          {active.length === 0
            ? <EmptyState icon="cube-outline" text="No tienes envíos activos" />
            : active.map(p => <ParcelCard key={p.id} parcel={p} onPress={() => navigation.navigate('EnvioTracking', { parcelId: p.id })} />)
          }
        </ScrollView>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === 'historial' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefresh(true); await loadParcels(); setRefresh(false); }} tintColor={RED} />}
        >
          {history.length === 0
            ? <EmptyState icon="time-outline" text="No tienes envíos anteriores" />
            : history.map(p => <ParcelCard key={p.id} parcel={p} onPress={() => navigation.navigate('EnvioTracking', { parcelId: p.id })} />)
          }
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ParcelCard({ parcel, onPress }: { parcel: Parcel; onPress: () => void }) {
  const info = STATUS_INFO[parcel.status];
  return (
    <TouchableOpacity style={styles.parcelCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.parcelIcon, { backgroundColor: `${info.color}18` }]}>
        <Ionicons name={info.icon as any} size={22} color={info.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.parcelDest} numberOfLines={1}>{parcel.destination.address}</Text>
        <Text style={styles.parcelSub}>Para: {parcel.recipientName}</Text>
        <View style={[styles.statusPill, { backgroundColor: `${info.color}18` }]}>
          <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

function EmptyState({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:52, paddingBottom:12, paddingHorizontal:16, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  backBtn: { width:36, height:36, alignItems:'center', justifyContent:'center' },
  headerTitle: { fontSize:17, fontWeight:'800', color:DARK },

  tabs: { flexDirection:'row', backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  tab: { flex:1, paddingVertical:12, alignItems:'center' },
  tabActive: { borderBottomWidth:2, borderBottomColor:RED },
  tabText: { fontSize:13, color:GRAY, fontWeight:'600' },
  tabTextActive: { color:RED, fontWeight:'800' },

  sectionTitle: { fontSize:12, fontWeight:'800', color:DARK, marginBottom:8, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 },

  typeRow: { flexDirection:'row', gap:8, marginBottom:16 },
  typeCard: { flex:1, backgroundColor:'#fff', borderWidth:1.5, borderColor:'#E8EAED', borderRadius:12, padding:10, alignItems:'center', gap:3 },
  typeCardActive: { borderColor:RED, backgroundColor:'rgba(192,57,43,0.05)' },
  typeIcon: { fontSize:22 },
  typeName: { fontSize:11, fontWeight:'700', color:DARK },
  typeDesc: { fontSize:8, color:GRAY, textAlign:'center' },

  card: { backgroundColor:'#fff', borderRadius:14, padding:12, marginBottom:16 },
  routeRow: { flexDirection:'row', alignItems:'center', gap:10 },
  routeDot: { width:10, height:10, borderRadius:5, flexShrink:0 },
  routeInput: { flex:1, fontSize:13, color:DARK, paddingVertical:8 },
  routeDivider: { height:1, backgroundColor:'#F3F4F6', marginVertical:4, marginLeft:20 },
  inputField: { fontSize:13, color:DARK, paddingVertical:10 },
  inputDivider: { height:1, backgroundColor:'#F3F4F6', marginVertical:2 },

  warning: { flexDirection:'row', gap:8, alignItems:'flex-start', backgroundColor:'rgba(192,57,43,0.06)', borderWidth:1, borderColor:'rgba(192,57,43,0.2)', borderRadius:12, padding:10, marginBottom:16 },
  warningText: { flex:1, fontSize:11, color:RED, lineHeight:16 },

  btnCreate: { backgroundColor:RED, borderRadius:14, paddingVertical:14, alignItems:'center', marginBottom:32 },
  btnCreateText: { color:'#fff', fontSize:15, fontWeight:'800' },

  parcelCard: { backgroundColor:'#fff', borderRadius:14, padding:12, flexDirection:'row', alignItems:'center', gap:12, marginBottom:8 },
  parcelIcon: { width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center', flexShrink:0 },
  parcelDest: { fontSize:13, fontWeight:'700', color:DARK, marginBottom:2 },
  parcelSub: { fontSize:11, color:GRAY, marginBottom:4 },
  statusPill: { alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:2, borderRadius:20 },
  statusText: { fontSize:10, fontWeight:'700' },

  empty: { alignItems:'center', paddingVertical:48, gap:12 },
  emptyText: { fontSize:14, color:'#D1D5DB', fontWeight:'600' },
});
