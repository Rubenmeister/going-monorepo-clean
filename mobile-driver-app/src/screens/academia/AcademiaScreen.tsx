import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOING_RED    = '#ff4c41';
const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';

// ── Módulos de capacitación ────────────────────────────────────────────────
interface Module {
  id: string;
  title: string;
  desc: string;
  duration: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lessons: { title: string; duration: string; completed: boolean }[];
  certificate: boolean;
}

const MODULES: Module[] = [
  {
    id: 'm1',
    title: 'Bienvenida a Going',
    desc: 'Cómo funciona la plataforma, tus derechos y responsabilidades.',
    duration: '20 min',
    icon: 'rocket-outline',
    color: GOING_RED,
    certificate: false,
    lessons: [
      { title: 'Qué es Going y cómo ganas', duration: '5 min', completed: true },
      { title: 'Tu panel de conductor',      duration: '5 min', completed: true },
      { title: 'Tarifas y comisiones',        duration: '5 min', completed: false },
      { title: 'Pagos y retiros',             duration: '5 min', completed: false },
    ],
  },
  {
    id: 'm2',
    title: 'Seguridad Vial',
    desc: 'Normas de tránsito, manejo defensivo y protocolo en ruta.',
    duration: '35 min',
    icon: 'shield-checkmark-outline',
    color: '#059669',
    certificate: true,
    lessons: [
      { title: 'Manejo defensivo básico',        duration: '10 min', completed: false },
      { title: 'Señalización y límites de vel.', duration: '8 min',  completed: false },
      { title: 'Qué hacer en un accidente',      duration: '10 min', completed: false },
      { title: 'Revisión diaria del vehículo',   duration: '7 min',  completed: false },
    ],
  },
  {
    id: 'm3',
    title: 'Servicio al Cliente',
    desc: 'Cómo dar una experiencia 5 estrellas y manejar situaciones difíciles.',
    duration: '25 min',
    icon: 'star-outline',
    color: '#F59E0B',
    certificate: true,
    lessons: [
      { title: 'Primera impresión y puntualidad', duration: '6 min', completed: false },
      { title: 'Comunicación con el pasajero',    duration: '7 min', completed: false },
      { title: 'Manejo de quejas y conflictos',   duration: '6 min', completed: false },
      { title: 'Cómo subir tu calificación',      duration: '6 min', completed: false },
    ],
  },
  {
    id: 'm4',
    title: 'Documentación Legal',
    desc: 'Requisitos de operación, licencias y normativa de transporte en Ecuador.',
    duration: '30 min',
    icon: 'document-text-outline',
    color: GOING_BLUE,
    certificate: true,
    lessons: [
      { title: 'Licencias requeridas por tipo de vehículo', duration: '8 min',  completed: false },
      { title: 'SOAT y pólizas de seguro',                  duration: '7 min',  completed: false },
      { title: 'Revisión vehicular ANT',                    duration: '8 min',  completed: false },
      { title: 'Infracciones y sanciones',                  duration: '7 min',  completed: false },
    ],
  },
  {
    id: 'm5',
    title: 'Maximiza tus Ganancias',
    desc: 'Horarios pico, zonas de alta demanda y estrategias para ganar más.',
    duration: '20 min',
    icon: 'trending-up-outline',
    color: '#7C3AED',
    certificate: false,
    lessons: [
      { title: 'Horarios de mayor demanda',     duration: '5 min', completed: false },
      { title: 'Zonas calientes en Ecuador',    duration: '5 min', completed: false },
      { title: 'Bonos y promociones Going',     duration: '5 min', completed: false },
      { title: 'Gestión de gastos y vehículo',  duration: '5 min', completed: false },
    ],
  },
];

// ── Recursos adicionales ───────────────────────────────────────────────────
const RESOURCES = [
  { id: 'r1', title: 'Manual del Conductor Going',  icon: 'document-outline' as keyof typeof Ionicons.glyphMap, url: 'https://goingapp.ec/manual-conductor' },
  { id: 'r2', title: 'Canal de WhatsApp Academia',  icon: 'logo-whatsapp'    as keyof typeof Ionicons.glyphMap, url: 'https://wa.me/593999000000' },
  { id: 'r3', title: 'Comunidad Going Conductores', icon: 'people-outline'   as keyof typeof Ionicons.glyphMap, url: 'https://goingapp.ec/comunidad' },
  { id: 'r4', title: 'Preguntas frecuentes',        icon: 'help-circle-outline' as keyof typeof Ionicons.glyphMap, url: 'https://goingapp.ec/faq-conductor' },
];

export function AcademiaScreen() {
  const [expandedModule, setExpandedModule] = useState<string | null>('m1');

  const totalLessons  = MODULES.flatMap(m => m.lessons).length;
  const doneLessons   = MODULES.flatMap(m => m.lessons).filter(l => l.completed).length;
  const progress      = Math.round((doneLessons / totalLessons) * 100);

  const handleOpenResource = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No se puede abrir', 'Enlace no disponible en este momento.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── HERO ── */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>GOING</Text>
          <Text style={styles.heroTitle}>Academia</Text>
          <Text style={styles.heroSub}>Capacítate y conduce mejor</Text>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeIcon}>🎓</Text>
        </View>
      </View>

      {/* ── PROGRESO GLOBAL ── */}
      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={styles.progressTitle}>Tu progreso</Text>
          <Text style={styles.progressPct}>{progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` as any }]} />
        </View>
        <Text style={styles.progressSub}>{doneLessons} de {totalLessons} lecciones completadas</Text>
      </View>

      {/* ── MÓDULOS ── */}
      <Text style={styles.sectionTitle}>Módulos de capacitación</Text>

      {MODULES.map((mod) => {
        const isExpanded = expandedModule === mod.id;
        const modDone    = mod.lessons.filter(l => l.completed).length;
        const modTotal   = mod.lessons.length;
        const modPct     = Math.round((modDone / modTotal) * 100);

        return (
          <View key={mod.id} style={styles.moduleCard}>
            {/* Header tappable */}
            <TouchableOpacity
              style={styles.moduleHeader}
              onPress={() => setExpandedModule(isExpanded ? null : mod.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.moduleIconBg, { backgroundColor: `${mod.color}18` }]}>
                <Ionicons name={mod.icon} size={22} color={mod.color} />
              </View>
              <View style={styles.moduleHeaderInfo}>
                <View style={styles.moduleHeaderTop}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  {mod.certificate && (
                    <View style={styles.certBadge}>
                      <Ionicons name="ribbon-outline" size={10} color={GOING_YELLOW} />
                      <Text style={styles.certBadgeText}>Cert.</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.moduleDuration}>
                  <Ionicons name="time-outline" size={11} color="#9CA3AF" /> {mod.duration}
                  {'  '}
                  <Text style={{ color: mod.color, fontWeight: '700' }}>{modPct}%</Text>
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {/* Progress bar del módulo */}
            <View style={styles.modProgressBg}>
              <View style={[styles.modProgressFill, { width: `${modPct}%` as any, backgroundColor: mod.color }]} />
            </View>

            {/* Lecciones expandidas */}
            {isExpanded && (
              <View style={styles.lessonList}>
                <Text style={styles.moduleDesc}>{mod.desc}</Text>
                {mod.lessons.map((lesson, i) => (
                  <TouchableOpacity key={i} style={styles.lessonRow} activeOpacity={0.7}>
                    <View style={[
                      styles.lessonCheck,
                      lesson.completed && { backgroundColor: '#059669', borderColor: '#059669' },
                    ]}>
                      {lesson.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={[
                      styles.lessonTitle,
                      lesson.completed && styles.lessonDone,
                    ]}>
                      {lesson.title}
                    </Text>
                    <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                    <Ionicons name="play-circle-outline" size={20} color={mod.color} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* ── RECURSOS ── */}
      <Text style={styles.sectionTitle}>Recursos y comunidad</Text>
      <View style={styles.resourcesGrid}>
        {RESOURCES.map((res) => (
          <TouchableOpacity
            key={res.id}
            style={styles.resourceCard}
            onPress={() => handleOpenResource(res.url)}
          >
            <Ionicons name={res.icon} size={24} color={GOING_BLUE} />
            <Text style={styles.resourceLabel}>{res.title}</Text>
            <Ionicons name="arrow-forward-circle-outline" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CTA completar ── */}
      <View style={styles.ctaBanner}>
        <Text style={styles.ctaTitle}>🏆 ¡Completa la Academia!</Text>
        <Text style={styles.ctaSub}>
          Los conductores certificados reciben un{' '}
          <Text style={{ fontWeight: '800', color: GOING_RED }}>badge de confianza</Text>
          {' '}en su perfil y acceso a viajes premium.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content:   { padding: 16, paddingBottom: 40 },

  // Hero
  hero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: GOING_BLUE, borderRadius: 20, padding: 20, marginBottom: 16,
  },
  heroLeft:  {},
  heroLabel: { fontSize: 10, fontWeight: '800', color: GOING_YELLOW, letterSpacing: 2 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#fff', lineHeight: 32 },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroBadgeIcon: { fontSize: 32 },

  // Progress global
  progressCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  progressTop:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  progressPct:   { fontSize: 14, fontWeight: '800', color: GOING_BLUE },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: GOING_BLUE },
  progressSub:   { fontSize: 11, color: '#9CA3AF', marginTop: 6 },

  // Section title
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 10, letterSpacing: 0.3 },

  // Module card
  moduleCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  moduleHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  moduleIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  moduleHeaderInfo: { flex: 1 },
  moduleHeaderTop:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  moduleTitle:      { fontSize: 14, fontWeight: '700', color: '#1F2937', flex: 1 },
  moduleDuration:   { fontSize: 11, color: '#9CA3AF' },
  certBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: GOING_BLUE, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  certBadgeText: { fontSize: 9, fontWeight: '800', color: GOING_YELLOW },
  modProgressBg:   { height: 3, backgroundColor: '#F3F4F6', marginHorizontal: 0 },
  modProgressFill: { height: 3 },

  // Lessons
  lessonList:  { padding: 14, paddingTop: 4 },
  moduleDesc:  { fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  lessonCheck: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  lessonTitle:    { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },
  lessonDone:     { color: '#9CA3AF', textDecorationLine: 'line-through' },
  lessonDuration: { fontSize: 11, color: '#9CA3AF', marginRight: 4 },

  // Resources
  resourcesGrid: { gap: 10, marginBottom: 20 },
  resourceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  resourceLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },

  // CTA
  ctaBanner: {
    borderRadius: 16, padding: 18,
    backgroundColor: GOING_BLUE,
  },
  ctaTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 6 },
  ctaSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
});
