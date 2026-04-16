/**
 * EnvioTrackingScreen
 * Tracking en tiempo real de un envío.
 * Conectado a GET /parcels/:id y polling cada 15 s (hasta que lleguemos a WebSocket de parcels).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { api } from '@services/api';

export type EnvioTrackingParams = { parcelId: string };

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'EnvioTracking'>;

const RED   = '#C0392B';
const GREEN = '#27AE60';
const DARK  = '#1A1A2E';
const GRAY  = '#7F8C8D';

type Step = { key: string; label: string; icon: string };
const STEPS: Step[] = [
  { key: 'pending',    label: 'Solicitado',  icon: 'time-outline' },
  { key: 'assigned',   label: 'Asignado',    icon: 'person-outline' },
  { key: 'picked_up',  label: 'Recogido',    icon: 'cube-outline' },
  { key: 'in_transit', label: 'En camino',   icon: 'car-outline' },
  { key: 'delivered',  label: 'Entregado',   icon: 'checkmark-circle-outline' },
];

const ORDER = ['pending','assigned','picked_up','in_transit','delivered'];

export function EnvioTrackingScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { parcelId } = params;

  const [parcel, setParcel]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const intervalRef             = useRef<ReturnType<typeof setInterval>>();

  const fetchParcel = useCallback(async () => {
    try {
      // Try specific parcel endpoint first, fallback to list
      const { data } = await api.get(`/parcels/${parcelId}`).catch(() => api.get('/parcels/my'));
      const found = Array.isArray(data)
        ? (data.find((p: any) => p.id === parcelId) ?? data[0])
        : (data?.parcels?.find((p: any) => p.id === parcelId) ?? data);
      setParcel(found ?? null);
    } catch {
      // keep showing last state
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    fetchParcel();
    // Poll every 15 s while not delivered/cancelled
    intervalRef.current = setInterval(() => {
      if (!['delivered','cancelled'].includes(parcel?.status)) fetchParcel();
    }, 15_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchParcel]);

  const stepIndex = parcel ? ORDER.indexOf(parcel.status) : 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={RED} />
        <Text style={{ color: GRAY, marginTop: 12 }}>Cargando seguimiento...</Text>
      </View>
    );
  }

  if (!parcel) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
        <Text style={{ color: GRAY, marginTop: 12 }}>Envío no encontrado</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: RED, fontWeight: '700' }}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDelivered  = parcel.status === 'delivered';
  const isCancelled  = parcel.status === 'cancelled';

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguimiento</Text>
        <TouchableOpacity onPress={fetchParcel} style={styles.backBtn}>
          <Ionicons name="refresh-outline" size={22} color={RED} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Estado principal */}
        <View style={[styles.statusBanner, isDelivered && { backgroundColor: `${GREEN}15`, borderColor: `${GREEN}40` }, isCancelled && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <Ionicons
            name={isDelivered ? 'checkmark-circle' : isCancelled ? 'close-circle' : 'car-outline'}
            size={32}
            color={isDelivered ? GREEN : isCancelled ? RED : '#E67E22'}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {isDelivered ? '¡Entregado!' : isCancelled ? 'Cancelado' : 'En camino'}
            </Text>
            <Text style={styles.statusSub}>
              #{parcelId.slice(-8).toUpperCase()}
            </Text>
          </View>
          {!isDelivered && !isCancelled && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          )}
        </View>

        {/* Progress steps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progreso del envío</Text>
          <View style={styles.steps}>
            {STEPS.map((step, i) => {
              const done    = i <= stepIndex;
              const current = i === stepIndex;
              const isLast  = i === STEPS.length - 1;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepDot, done && styles.stepDotDone, current && !isDelivered && styles.stepDotCurrent]}>
                      <Ionicons
                        name={done ? 'checkmark' : step.icon as any}
                        size={12}
                        color={done || current ? '#fff' : '#ccc'}
                      />
                    </View>
                    {!isLast && <View style={[styles.stepLine, done && { backgroundColor: GREEN }]} />}
                  </View>
                  <Text style={[styles.stepLabel, done && { color: DARK, fontWeight: '700' }, current && { color: GREEN }]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Detalles del envío */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles</Text>
          <InfoRow label="Origen"       value={parcel.origin?.address ?? '—'} />
          <InfoRow label="Destino"      value={parcel.destination?.address ?? '—'} />
          <InfoRow label="Para"         value={parcel.recipientName ?? '—'} />
          <InfoRow label="Teléfono"     value={parcel.recipientPhone ?? '—'} />
          {parcel.estimatedPrice && (
            <InfoRow label="Precio estimado" value={`$${parcel.estimatedPrice.toFixed(2)}`} />
          )}
        </View>

        {/* Conductor (si asignado) */}
        {parcel.driver && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Conductor asignado</Text>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Text style={{ fontSize: 20 }}>👨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{parcel.driver.name ?? 'Conductor'}</Text>
                <Text style={styles.driverSub}>{parcel.driver.plate ?? ''}</Text>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Alert.alert('Llamar', `¿Llamar al conductor ${parcel.driver.name}?`)}
              >
                <Ionicons name="call-outline" size={18} color={GREEN} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Acciones */}
        {!isDelivered && !isCancelled && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() =>
              Alert.alert('Cancelar envío', '¿Estás seguro? Esta acción no se puede deshacer.', [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Cancelar envío',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.patch(`/parcels/${parcelId}/cancel`);
                      fetchParcel();
                    } catch {
                      Alert.alert('Error', 'No se pudo cancelar el envío.');
                    }
                  },
                },
              ])
            }
          >
            <Ionicons name="close-circle-outline" size={16} color={RED} />
            <Text style={styles.cancelBtnText}>Cancelar envío</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.refreshNote}>
          Actualización automática cada 15 segundos · Toca 🔄 para refrescar ahora
        </Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#F7F8FA' },

  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:52, paddingBottom:12, paddingHorizontal:16, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  backBtn: { width:36, height:36, alignItems:'center', justifyContent:'center' },
  headerTitle: { fontSize:17, fontWeight:'800', color:DARK },

  statusBanner: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'rgba(230,126,34,0.1)', borderWidth:1, borderColor:'rgba(230,126,34,0.3)', borderRadius:16, padding:14, marginBottom:12 },
  statusTitle: { fontSize:15, fontWeight:'800', color:DARK },
  statusSub:   { fontSize:11, color:GRAY, marginTop:2 },
  livePill:    { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(192,57,43,0.1)', paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  liveDot:     { width:6, height:6, borderRadius:3, backgroundColor:RED },
  liveText:    { fontSize:8, fontWeight:'800', color:RED },

  card: { backgroundColor:'#fff', borderRadius:16, padding:14, marginBottom:12 },
  cardTitle: { fontSize:12, fontWeight:'800', color:DARK, textTransform:'uppercase', letterSpacing:0.5, marginBottom:12 },

  steps: { gap:0 },
  stepRow:  { flexDirection:'row', alignItems:'flex-start', gap:10, minHeight:40 },
  stepLeft: { alignItems:'center', width:24 },
  stepDot:  { width:24, height:24, borderRadius:12, backgroundColor:'#E8EAED', alignItems:'center', justifyContent:'center' },
  stepDotDone:    { backgroundColor:GREEN },
  stepDotCurrent: { backgroundColor:RED },
  stepLine: { width:2, flex:1, backgroundColor:'#E8EAED', marginVertical:2, minHeight:16 },
  stepLabel: { fontSize:13, color:GRAY, paddingTop:4, flex:1 },

  infoRow:   { flexDirection:'row', paddingVertical:6, borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  infoLabel: { fontSize:12, color:GRAY, width:110 },
  infoValue: { fontSize:12, color:DARK, fontWeight:'600', flex:1 },

  driverRow:    { flexDirection:'row', alignItems:'center', gap:12 },
  driverAvatar: { width:44, height:44, borderRadius:22, backgroundColor:'#F3F4F6', alignItems:'center', justifyContent:'center' },
  driverName:   { fontSize:14, fontWeight:'700', color:DARK },
  driverSub:    { fontSize:11, color:GRAY },
  callBtn:      { width:40, height:40, borderRadius:20, backgroundColor:`${GREEN}15`, alignItems:'center', justifyContent:'center' },

  cancelBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, borderWidth:1, borderColor:'#FECACA', backgroundColor:'#FEF2F2', borderRadius:12, paddingVertical:12, marginBottom:8 },
  cancelBtnText: { color:RED, fontWeight:'700', fontSize:13 },

  refreshNote: { textAlign:'center', fontSize:11, color:'#D1D5DB', marginBottom:24 },
});
