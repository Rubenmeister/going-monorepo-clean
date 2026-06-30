/**
 * DriverScheduleScreen — Registro de rutas y horarios del conductor
 *
 * Flujo:
 *  1. Conductor selecciona su CIUDAD DE ORIGEN (donde vive/sale)
 *  2. Sistema muestra la ruta correspondiente (paradas, NO precios)
 *  3. Conductor elige destino (Quito o Aeropuerto)
 *  4. Selecciona días y hora de salida (IDA)
 *  5. OBLIGATORIO: registra hora de REGRESO ese mismo día
 *  6. Guarda agenda → pasajeros pueden reservar asientos
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { hapticLight, hapticMedium, hapticSuccess } from '../../utils/haptics';

const NAVY  = '#FF4C41';
const GOLD  = '#FFD253';
const GREEN = '#059669';
const RED   = '#FF4C41';

// ── Ciudades de origen y sus rutas ────────────────────────────────────────────
// NOTA: la conductora o el conductor selecciona PARADAS y horarios, NO fija
// tarifa. El precio por tramo lo define la plataforma (backend, libs/pricing)
// para no tener tarifas dispares entre conductores. Por eso acá NO hay precios.
const ORIGIN_CITIES = [
  {
    id: 'riobamba', label: 'Riobamba', province: 'Chimborazo',
    routeId: 'sierra_centro', icon: '🏔️', color: NAVY,
    routeStops: ['Ambato', 'Latacunga', 'Quito', 'Aeropuerto'],
    times: ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '14:00'],
    returnTimes: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
  },
  {
    id: 'ambato', label: 'Ambato', province: 'Tungurahua',
    routeId: 'sierra_centro', icon: '🏔️', color: NAVY,
    routeStops: ['Latacunga', 'Quito', 'Aeropuerto'],
    times: ['05:30', '06:30', '07:00', '08:00', '09:00', '10:00', '14:00', '15:00'],
    returnTimes: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
  },
  {
    id: 'el_carmen', label: 'El Carmen', province: 'Manabí',
    routeId: 'costa_quito', icon: '🌊', color: GREEN,
    routeStops: ['La Concordia', 'Santo Domingo', 'Quito', 'Aeropuerto'],
    times: ['04:00', '05:00', '06:00', '07:00'],
    returnTimes: ['13:00', '14:00', '15:00', '16:00', '17:00'],
  },
  {
    id: 'santo_domingo', label: 'Santo Domingo', province: 'Santo Domingo',
    routeId: 'costa_quito', icon: '🌊', color: GREEN,
    routeStops: ['Quito', 'Aeropuerto'],
    times: ['05:00', '06:00', '07:00', '08:00', '09:00', '14:00', '15:00', '16:00'],
    returnTimes: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  },
  {
    id: 'tulcan', label: 'Tulcán', province: 'Carchi',
    routeId: 'sierra_norte', icon: '🏔️', color: '#7C3AED',
    routeStops: ['Ibarra', 'Otavalo', 'Quito', 'Aeropuerto'],
    times: ['03:00', '04:00', '05:00', '06:00', '07:00', '13:00'],
    returnTimes: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
  },
  {
    id: 'ibarra', label: 'Ibarra', province: 'Imbabura',
    routeId: 'sierra_norte', icon: '🌿', color: '#7C3AED',
    routeStops: ['Otavalo', 'Quito', 'Aeropuerto'],
    times: ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '14:00'],
    returnTimes: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  },
  {
    id: 'otavalo', label: 'Otavalo', province: 'Imbabura',
    routeId: 'sierra_norte', icon: '🌿', color: '#7C3AED',
    routeStops: ['Quito', 'Aeropuerto'],
    times: ['05:30', '06:00', '07:00', '08:00', '09:00', '10:00', '14:00', '15:00'],
    returnTimes: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  },
];

const DAYS = [
  { id: 1, label: 'L', full: 'Lunes' },
  { id: 2, label: 'M', full: 'Martes' },
  { id: 3, label: 'X', full: 'Miércoles' },
  { id: 4, label: 'J', full: 'Jueves' },
  { id: 5, label: 'V', full: 'Viernes' },
  { id: 6, label: 'S', full: 'Sábado' },
  { id: 0, label: 'D', full: 'Domingo' },
];

interface ScheduleSlot {
  originId:    string;
  destination: string;
  days:        number[];
  departTime:  string;
  returnTime:  string;
}

export function DriverScheduleScreen() {
  const navigation = useNavigation<any>();

  // Pasos
  const [step,         setStep]         = useState<1|2|3|4|5>(1);
  const [originId,     setOriginId]     = useState<string | null>(null);
  const [destination,  setDestination]  = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [departTime,   setDepartTime]   = useState<string | null>(null);
  const [returnTime,   setReturnTime]   = useState<string | null>(null);
  const [slots,        setSlots]        = useState<ScheduleSlot[]>([]);
  const [saving,       setSaving]       = useState(false);

  const origin = ORIGIN_CITIES.find(c => c.id === originId);

  useEffect(() => { loadSlots(); }, []);

  const loadSlots = async () => {
    // Fuente de verdad: la agenda guardada en el backend. Fallback a un
    // borrador local si no hay red o el servidor aún no tiene agenda.
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const res = await axios.get(`${API_BASE_URL}/drivers/me/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const serverSlots = res.data?.slots;
      if (Array.isArray(serverSlots) && serverSlots.length) {
        setSlots(serverSlots);
        await AsyncStorage.setItem('driver_schedule', JSON.stringify(serverSlots));
        return;
      }
    } catch { /* sin red o sin agenda en el server → fallback local */ }
    try {
      const saved = await AsyncStorage.getItem('driver_schedule');
      if (saved) setSlots(JSON.parse(saved));
    } catch {}
  };

  const toggleDay = (id: number) => {
    hapticLight();
    setSelectedDays(p => p.includes(id) ? p.filter(d => d !== id) : [...p, id]);
  };

  const addSlot = () => {
    if (!originId || !destination || !selectedDays.length || !departTime || !returnTime) return;
    hapticMedium();
    const slot: ScheduleSlot = {
      originId, destination,
      days: [...selectedDays],
      departTime, returnTime,
    };
    setSlots(p => [...p, slot]);
    // Reset para agregar otro si quiere
    setStep(2);
    setDestination(null);
    setSelectedDays([]);
    setDepartTime(null);
    setReturnTime(null);
  };

  const removeSlot = (idx: number) => {
    Alert.alert('Eliminar horario', '¿Quitar este horario?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setSlots(p => p.filter((_, i) => i !== idx)) },
    ]);
  };

  const saveSchedule = async () => {
    if (!slots.length) { Alert.alert('Sin horarios', 'Agrega al menos un horario.'); return; }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      // El backend espera el shape canónico { routeId, time, days, returnTrip }
      // y filtra por routeId. Enviamos los campos ricos (para mostrar al volver)
      // + los canónicos. El PRECIO no se envía: lo fija la plataforma por tramo
      // (FARES), para no tener precios dispares entre conductores.
      const payload = slots
        .map((s) => {
          const origin = ORIGIN_CITIES.find((c) => c.id === s.originId);
          return {
            ...s,
            routeId: origin?.routeId,
            time: s.departTime,
            returnTrip: !!s.returnTime,
          };
        })
        .filter((s) => !!s.routeId);

      if (!payload.length) {
        throw new Error('No se pudo resolver el corredor de los horarios.');
      }

      await axios.post(`${API_BASE_URL}/drivers/me/schedule`, { slots: payload }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await AsyncStorage.setItem('driver_schedule', JSON.stringify(slots));
      hapticSuccess();
      Alert.alert('¡Agenda guardada! 🎉',
        `${slots.length} horario${slots.length>1?'s':''} registrado${slots.length>1?'s':''}. Los pasajeros ya pueden reservar.`,
        [{ text: 'Perfecto', onPress: () => navigation.goBack() }]
      );
    } catch {
      // Guardamos un borrador local, pero NO mostramos éxito si el server falló.
      await AsyncStorage.setItem('driver_schedule', JSON.stringify(slots));
      Alert.alert(
        'No se pudo guardar',
        'Tu agenda quedó como borrador en este teléfono, pero NO se guardó en el servidor. Revisa tu conexión e intenta de nuevo.',
      );
    } finally { setSaving(false); }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => step > 1 ? setStep((step-1) as any) : navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Mi agenda de rutas</Text>
          <Text style={s.headerSub}>
            {step===1?'¿Desde qué ciudad sales?'
            :step===2?'¿Hasta dónde llevas pasajeros?'
            :step===3?'¿Qué días trabajas?'
            :step===4?'Hora de salida (ida)'
            :'Hora de regreso (obligatorio)'}
          </Text>
        </View>
        {/* Indicador de pasos */}
        <View style={s.stepIndicator}>
          {[1,2,3,4,5].map(n => (
            <View key={n} style={[s.stepDot, step>=n && s.stepDotActive]} />
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── PASO 1: Ciudad de origen ── */}
        {step === 1 && (
          <View>
            <Text style={s.secTitle}>TU CIUDAD DE SALIDA</Text>
            {ORIGIN_CITIES.map(city => (
              <TouchableOpacity
                key={city.id}
                style={[s.cityCard, originId===city.id && {borderColor:city.color,backgroundColor:`${city.color}08`}]}
                onPress={() => { setOriginId(city.id); setStep(2); hapticLight(); }}
              >
                {originId===city.id && <View style={[s.cityCheck,{backgroundColor:city.color}]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                <Text style={s.cityIcon}>{city.icon}</Text>
                <View style={{flex:1}}>
                  <Text style={[s.cityName, originId===city.id && {color:city.color}]}>{city.label}</Text>
                  <Text style={s.cityProv}>{city.province}</Text>
                </View>
                <Text style={s.cityArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── PASO 2: Destino ── */}
        {step === 2 && origin && (
          <View>
            <Text style={s.secTitle}>¿HASTA DÓNDE LLEVAS PASAJEROS?</Text>
            <View style={s.routeInfo}>
              <Text style={s.routeInfoIcon}>{origin.icon}</Text>
              <Text style={s.routeInfoText}>Desde <Text style={{fontWeight:'900'}}>{origin.label}</Text> puedes llegar a:</Text>
            </View>
            {origin.routeStops.map(stop => (
              <TouchableOpacity
                key={stop}
                style={[s.destCard, destination===stop && {borderColor:origin.color,backgroundColor:`${origin.color}08`}]}
                onPress={() => { setDestination(stop); setStep(3); hapticLight(); }}
              >
                {destination===stop && <View style={[s.destCheck,{backgroundColor:origin.color}]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                <View style={{flex:1}}>
                  <Text style={[s.destName, destination===stop && {color:origin.color}]}>
                    {stop === 'Aeropuerto' ? '✈️ Aeropuerto de Quito (Tababela)' : stop}
                  </Text>
                  <Text style={s.destSub}>
                    {stop === 'Aeropuerto' ? 'Aeropuerto Internacional' : `Parada en ruta`}
                  </Text>
                </View>
                <Text style={s.cityArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── PASO 3: Días ── */}
        {step === 3 && (
          <View>
            <Text style={s.secTitle}>¿QUÉ DÍAS TRABAJAS ESTA RUTA?</Text>
            <View style={s.daysRow}>
              {DAYS.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={[s.dayBtn, selectedDays.includes(d.id) && s.dayBtnActive]}
                  onPress={() => toggleDay(d.id)}
                >
                  <Text style={[s.dayBtnText, selectedDays.includes(d.id) && s.dayBtnTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedDays.length > 0 && (
              <Text style={s.daysSelected}>
                {selectedDays.map(id => DAYS.find(d=>d.id===id)?.full).join(' · ')}
              </Text>
            )}
            {selectedDays.length > 0 && (
              <TouchableOpacity style={s.nextBtn} onPress={() => setStep(4)}>
                <Text style={s.nextBtnText}>Continuar →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── PASO 4: Hora de salida ── */}
        {step === 4 && origin && (
          <View>
            <View style={s.routeSummary}>
              <Text style={s.routeSummaryText}>
                {origin.icon} {origin.label} → {destination}
              </Text>
              <Text style={s.routeSummaryDays}>
                {selectedDays.map(id => DAYS.find(d=>d.id===id)?.label).join(' ')}
              </Text>
            </View>
            <Text style={s.secTitle}>HORA DE SALIDA DESDE {origin.label.toUpperCase()}</Text>
            <View style={s.timesGrid}>
              {origin.times.map(t => (
                <TouchableOpacity key={t} style={[s.timeChip, departTime===t && s.timeChipActive]} onPress={() => { setDepartTime(t); hapticLight(); }}>
                  <Text style={[s.timeChipText, departTime===t && s.timeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {departTime && (
              <TouchableOpacity style={s.nextBtn} onPress={() => setStep(5)}>
                <Text style={s.nextBtnText}>Registrar regreso →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── PASO 5: Hora de regreso (OBLIGATORIO) ── */}
        {step === 5 && origin && (
          <View>
            <View style={s.returnHeader}>
              <Ionicons name="swap-horizontal" size={20} color={RED} />
              <Text style={s.returnHeaderText}>Regreso obligatorio</Text>
            </View>
            <Text style={s.returnExplain}>
              Si sales de <Text style={{fontWeight:'900'}}>{origin.label}</Text> a las {departTime}, ¿a qué hora regresas desde Quito/{destination === 'Aeropuerto' ? 'Aeropuerto' : 'destino'}?
            </Text>
            <Text style={s.secTitle}>HORA DE SALIDA PARA EL REGRESO</Text>
            <View style={s.timesGrid}>
              {origin.returnTimes.map(t => (
                <TouchableOpacity key={t} style={[s.timeChip, returnTime===t && {backgroundColor:GREEN,borderColor:GREEN}]} onPress={() => { setReturnTime(t); hapticLight(); }}>
                  <Text style={[s.timeChipText, returnTime===t && s.timeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {returnTime && (
              <View style={s.summaryBox}>
                <Text style={s.summaryTitle}>Resumen del horario</Text>
                <View style={s.summaryRow}><Text style={s.sumLbl}>Ruta</Text><Text style={s.sumVal}>{origin.label} → {destination}</Text></View>
                <View style={s.summaryRow}><Text style={s.sumLbl}>Días</Text><Text style={s.sumVal}>{selectedDays.map(id=>DAYS.find(d=>d.id===id)?.label).join(' ')}</Text></View>
                <View style={s.summaryRow}><Text style={s.sumLbl}>IDA</Text><Text style={s.sumVal}>{departTime} · desde {origin.label}</Text></View>
                <View style={[s.summaryRow,{borderBottomWidth:0}]}><Text style={s.sumLbl}>REGRESO</Text><Text style={s.sumVal}>{returnTime} · desde Quito</Text></View>
              </View>
            )}
            {returnTime && (
              <TouchableOpacity style={s.addBtn} onPress={addSlot}>
                <Ionicons name="add-circle-outline" size={20} color={NAVY} />
                <Text style={s.addBtnText}>Agregar este horario a mi agenda</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── AGENDA REGISTRADA ── */}
        {slots.length > 0 && (
          <View style={{marginTop: 20}}>
            <Text style={s.secTitle}>MI AGENDA REGISTRADA</Text>
            {slots.map((slot, idx) => {
              const orig = ORIGIN_CITIES.find(c => c.id === slot.originId);
              return (
                <View key={idx} style={[s.slotCard, {borderLeftColor: orig?.color ?? NAVY}]}>
                  <View style={s.slotHeader}>
                    <Text style={s.slotIcon}>{orig?.icon}</Text>
                    <View style={{flex:1}}>
                      <Text style={s.slotRoute}>{orig?.label} → {slot.destination}</Text>
                      <Text style={s.slotDays}>{slot.days.map(d=>DAYS.find(x=>x.id===d)?.label).join(' ')} · IDA {slot.departTime} · REG {slot.returnTime}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeSlot(idx)} style={{padding:6}}>
                      <Ionicons name="trash-outline" size={16} color={RED} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={s.addMoreBtn} onPress={() => { setStep(1); setOriginId(null); }}>
              <Ionicons name="add" size={16} color={NAVY} />
              <Text style={s.addMoreText}>Agregar otra ruta</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{height:32}} />
      </ScrollView>

      {slots.length > 0 && (
        <View style={s.footer}>
          <View style={{flex:1}}>
            <Text style={s.footerSlots}>{slots.length} horario{slots.length>1?'s':''} registrado{slots.length>1?'s':''}</Text>
          </View>
          <TouchableOpacity style={[s.saveBtn, saving&&{opacity:0.7}]} onPress={saveSchedule} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <><Text style={s.saveBtnText}>Guardar agenda</Text><Ionicons name="checkmark-circle" size={20} color={GOLD} /></>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { backgroundColor: NAVY, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  stepIndicator: { flexDirection: 'row', gap: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  stepDotActive: { backgroundColor: GOLD },
  scroll: { flex: 1, padding: 14 },
  secTitle: { fontSize: 9, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 },
  cityCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderColor: '#E5E7EB', position: 'relative' },
  cityCheck: { position: 'absolute', top: 9, right: 9, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cityIcon: { fontSize: 22 },
  cityName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cityProv: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  cityArrow: { fontSize: 20, color: '#D1D5DB' },
  routeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 10, marginBottom: 10 },
  routeInfoIcon: { fontSize: 18 },
  routeInfoText: { fontSize: 12, color: '#374151', flex: 1 },
  destCard: { backgroundColor: '#fff', borderRadius: 14, padding: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: '#E5E7EB', position: 'relative' },
  destCheck: { position: 'absolute', top: 9, right: 9, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  destName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  destSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dayBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E5E7EB' },
  dayBtnActive: { backgroundColor: NAVY, borderColor: NAVY },
  dayBtnText: { fontSize: 11, fontWeight: '800', color: '#374151' },
  dayBtnTextActive: { color: '#fff' },
  daysSelected: { fontSize: 11, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' },
  nextBtn: { backgroundColor: NAVY, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 },
  nextBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  timeChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  timeChipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  timeChipTextActive: { color: '#fff' },
  routeSummary: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeSummaryText: { fontSize: 12, fontWeight: '700', color: NAVY },
  routeSummaryDays: { fontSize: 11, fontWeight: '800', color: NAVY },
  returnHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0EF', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#FECACA' },
  returnHeaderText: { fontSize: 13, fontWeight: '900', color: RED },
  returnExplain: { fontSize: 12, color: '#374151', marginBottom: 14, lineHeight: 18 },
  summaryBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  summaryTitle: { fontSize: 11, fontWeight: '800', color: '#374151', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  sumLbl: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  sumVal: { fontSize: 12, fontWeight: '700', color: '#111827' },
  addBtn: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#BFDBFE', marginTop: 12 },
  addBtnText: { fontSize: 13, fontWeight: '800', color: NAVY },
  slotCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 4 },
  slotHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  slotIcon: { fontSize: 20, marginTop: 1 },
  slotRoute: { fontSize: 13, fontWeight: '800', color: '#111827' },
  slotDays: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  addMoreText: { fontSize: 12, fontWeight: '700', color: NAVY },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  footerSlots: { fontSize: 13, fontWeight: '800', color: '#111827' },
  saveBtn: { backgroundColor: NAVY, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { fontSize: 13, fontWeight: '900', color: '#fff' },
});
