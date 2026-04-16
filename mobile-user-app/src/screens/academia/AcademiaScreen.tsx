import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const NAVY = '#0033A0';
const GOLD = '#FFCD00';

const MODULES = [
  { id: 1, icon: '🗺️', title: 'Conoce Ecuador con Going', desc: 'Las 3 rutas principales, destinos y tiempos de viaje.', duration: '5 min', level: 'Básico' },
  { id: 2, icon: '🚗', title: 'Cómo funciona el Viaje Compartido', desc: 'Paradas, asientos, pagos y código OTP del conductor.', duration: '4 min', level: 'Básico' },
  { id: 3, icon: '🔒', title: 'Viaje Privado: tu vehículo, tu horario', desc: 'SUV, VAN y BUS. Cuándo usar cada uno y cómo reservar.', duration: '6 min', level: 'Intermedio' },
  { id: 4, icon: '📦', title: 'Envíos seguros de punto a punto', desc: 'OTP de entrega, foto de confirmación y rastreo GPS.', duration: '4 min', level: 'Básico' },
  { id: 5, icon: '⭐', title: 'Going Rewards: puntos y beneficios', desc: 'Cómo acumular puntos y canjear descuentos y viajes.', duration: '3 min', level: 'Básico' },
  { id: 6, icon: '🆘', title: 'Seguridad: función SOS y emergencias', desc: 'Cómo usar el SOS, compartir tu viaje y el ECU 911.', duration: '3 min', level: 'Básico' },
  { id: 7, icon: '🏔️', title: 'Turismo por la Sierra ecuatoriana', desc: 'Destinos recomendados, volcanes, mercados y más.', duration: '8 min', level: 'Avanzado' },
];

const LEVEL_COLOR: Record<string, string> = { 'Básico': '#059669', 'Intermedio': '#0033A0', 'Avanzado': '#7C3AED' };

export function AcademiaScreen() {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.heroIconWrap}><Text style={{ fontSize: 30 }}>🎓</Text></View>
        <Text style={s.heroTitle}>Academia Going</Text>
        <Text style={s.heroSub}>Aprende a sacarle el máximo provecho a tu app</Text>
        <View style={s.heroStats}>
          <View style={s.heroStat}><Text style={s.heroStatVal}>{MODULES.length}</Text><Text style={s.heroStatLbl}>Módulos</Text></View>
          <View style={s.heroStatDiv} />
          <View style={s.heroStat}><Text style={s.heroStatVal}>33 min</Text><Text style={s.heroStatLbl}>Total</Text></View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.secTitle}>MÓDULOS</Text>
        {MODULES.map(mod => (
          <TouchableOpacity key={mod.id} style={[s.moduleCard, expanded === mod.id && s.moduleCardActive]} onPress={() => setExpanded(expanded === mod.id ? null : mod.id)} activeOpacity={0.85}>
            <View style={s.moduleHeader}>
              <View style={s.moduleIconWrap}><Text style={{ fontSize: 22 }}>{mod.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.moduleTitle}>{mod.title}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <View style={[s.levelBadge, { backgroundColor: `${LEVEL_COLOR[mod.level]}15` }]}>
                    <Text style={[s.levelText, { color: LEVEL_COLOR[mod.level] }]}>{mod.level}</Text>
                  </View>
                  <Text style={s.moduleDuration}>⏱ {mod.duration}</Text>
                </View>
              </View>
              <Ionicons name={expanded === mod.id ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
            </View>
            {expanded === mod.id && (
              <View style={s.moduleExpanded}>
                <Text style={s.moduleDesc}>{mod.desc}</Text>
                <TouchableOpacity style={s.startBtn}>
                  <Text style={s.startBtnText}>Comenzar módulo</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.section}>
        <Text style={s.secTitle}>AYUDA</Text>
        <TouchableOpacity style={s.supportCard} onPress={() => navigation.navigate('UserSupport')}>
          <View style={s.supportIcon}><Ionicons name="headset-outline" size={22} color={NAVY} /></View>
          <View style={{ flex: 1 }}><Text style={s.supportTitle}>Hablar con soporte</Text><Text style={s.supportSub}>Lunes a viernes · 09:00–18:00</Text></View>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </TouchableOpacity>
        <TouchableOpacity style={s.supportCard} onPress={() => Linking.openURL('https://goingec.com')}>
          <View style={s.supportIcon}><Ionicons name="globe-outline" size={22} color={NAVY} /></View>
          <View style={{ flex: 1 }}><Text style={s.supportTitle}>Centro de ayuda web</Text><Text style={s.supportSub}>goingec.com</Text></View>
          <Ionicons name="open-outline" size={16} color="#D1D5DB" />
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  hero: { backgroundColor: NAVY, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20 },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14, padding: 14 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  heroStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 4 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  secTitle: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 },
  moduleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  moduleCardActive: { borderColor: NAVY },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  moduleIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center' },
  moduleTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  levelBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 10, fontWeight: '700' },
  moduleDuration: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  moduleExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  moduleDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 12 },
  startBtn: { backgroundColor: NAVY, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startBtnText: { fontSize: 13, fontWeight: '900', color: '#fff' },
  supportCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  supportIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  supportTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  supportSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
