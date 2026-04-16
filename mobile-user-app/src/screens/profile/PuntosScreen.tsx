import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const NAVY = '#0033A0';
const GOLD = '#FFCD00';
const GREEN = '#059669';

const LEVELS = [
  { name: 'Explorador',   min: 0,    max: 499,   icon: '🌱', color: '#059669' },
  { name: 'Viajero',      min: 500,  max: 1499,  icon: '🚗', color: '#0033A0' },
  { name: 'Aventurero',   min: 1500, max: 2999,  icon: '⭐', color: '#7C3AED' },
  { name: 'Embajador',    min: 3000, max: 99999, icon: '👑', color: '#D97706' },
];

const BENEFITS = [
  { pts: 100,  label: '$1.00 de descuento en tu próximo viaje', icon: 'car-outline',   color: NAVY },
  { pts: 250,  label: 'Asiento delantero gratis',               icon: 'medal-outline', color: '#7C3AED' },
  { pts: 500,  label: '1 envío gratis (paquete pequeño)',        icon: 'cube-outline',  color: '#ff4c41' },
  { pts: 1000, label: 'Viaje Compartido gratis',                 icon: 'gift-outline',  color: '#D97706' },
];

const HOW_TO_EARN = [
  { label: 'Por cada viaje Compartido',  pts: '+10 pts', icon: 'people-outline'  },
  { label: 'Por cada viaje Privado',     pts: '+20 pts', icon: 'lock-closed-outline' },
  { label: 'Por cada envío',             pts: '+5 pts',  icon: 'cube-outline'    },
  { label: 'Reservar tu regreso',        pts: '+50 pts', icon: 'refresh-outline' },
  { label: 'Calificar un viaje',         pts: '+2 pts',  icon: 'star-outline'    },
  { label: 'Referir un amigo',           pts: '+100 pts',icon: 'person-add-outline' },
];

export function PuntosScreen() {
  const navigation = useNavigation<any>();
  const userPoints = 0;
  const currentLevel = LEVELS.find(l => userPoints >= l.min && userPoints <= l.max) ?? LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel ? (userPoints - currentLevel.min) / (nextLevel.min - currentLevel.min) : 1;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* HERO */}
      <View style={s.hero}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.heroTitle}>Going Rewards</Text>
        <Text style={s.heroSub}>Viaja, acumula, canjea</Text>
        <View style={s.pointsCard}>
          <View>
            <Text style={s.pointsLabel}>TUS PUNTOS</Text>
            <Text style={s.pointsValue}>{userPoints.toLocaleString()}</Text>
          </View>
          <View style={s.levelBadge}>
            <Text style={s.levelIcon}>{currentLevel.icon}</Text>
            <Text style={s.levelName}>{currentLevel.name}</Text>
          </View>
        </View>
        {nextLevel && (
          <View style={s.progressSection}>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={s.progressText}>
              {nextLevel.min - userPoints} pts para llegar a {nextLevel.name} {nextLevel.icon}
            </Text>
          </View>
        )}
      </View>

      {/* NIVELES */}
      <View style={s.section}>
        <Text style={s.secTitle}>NIVELES</Text>
        <View style={s.levelsRow}>
          {LEVELS.map((l, i) => (
            <View key={l.name} style={[s.levelCard, currentLevel.name === l.name && s.levelCardActive]}>
              <Text style={s.levelCardIcon}>{l.icon}</Text>
              <Text style={[s.levelCardName, currentLevel.name === l.name && { color: l.color }]}>{l.name}</Text>
              <Text style={s.levelCardPts}>{l.min === 0 ? '0' : `${l.min}+`}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CÓMO GANAR */}
      <View style={s.section}>
        <Text style={s.secTitle}>CÓMO GANAR PUNTOS</Text>
        <View style={s.card}>
          {HOW_TO_EARN.map((item, i) => (
            <View key={item.label} style={[s.earnRow, i < HOW_TO_EARN.length - 1 && s.earnBorder]}>
              <Ionicons name={item.icon as any} size={18} color={NAVY} />
              <Text style={s.earnLabel}>{item.label}</Text>
              <Text style={s.earnPts}>{item.pts}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* BENEFICIOS */}
      <View style={s.section}>
        <Text style={s.secTitle}>QUÉ PUEDES CANJEAR</Text>
        {BENEFITS.map(b => (
          <TouchableOpacity key={b.label} style={s.benefitCard}>
            <View style={[s.benefitIcon, { backgroundColor: `${b.color}12` }]}>
              <Ionicons name={b.icon as any} size={20} color={b.color} />
            </View>
            <Text style={s.benefitLabel}>{b.label}</Text>
            <View style={s.benefitPts}>
              <Text style={s.benefitPtsText}>{b.pts} pts</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  hero: { backgroundColor: '#1E3A5F', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
  pointsCard: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  pointsLabel: { fontSize: 10, fontWeight: '700', color: GOLD, letterSpacing: 1.5, marginBottom: 4 },
  pointsValue: { fontSize: 40, fontWeight: '900', color: '#fff' },
  levelBadge: { alignItems: 'center', gap: 4 },
  levelIcon: { fontSize: 28 },
  levelName: { fontSize: 13, fontWeight: '800', color: GOLD },
  progressSection: { marginTop: 16 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: GOLD, borderRadius: 3 },
  progressText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  secTitle: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 },
  levelsRow: { flexDirection: 'row', gap: 8 },
  levelCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 10, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: '#E5E7EB' },
  levelCardActive: { borderColor: NAVY, backgroundColor: '#EFF6FF' },
  levelCardIcon: { fontSize: 20 },
  levelCardName: { fontSize: 10, fontWeight: '800', color: '#374151' },
  levelCardPts: { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  earnBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  earnLabel: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  earnPts: { fontSize: 13, fontWeight: '900', color: '#D97706' },
  benefitCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  benefitIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  benefitLabel: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '600' },
  benefitPts: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FDE68A' },
  benefitPtsText: { fontSize: 11, fontWeight: '800', color: '#92400E' },
});
