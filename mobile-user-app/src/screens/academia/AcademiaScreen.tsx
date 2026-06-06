/**
 * AcademiaScreen — Academia Going App (Mockup #21).
 *
 * Tutorial in-app: 7 módulos para aprender a usar Going App (ride sharing,
 * envíos, rewards, seguridad SOS, etc.). Cada módulo es accordion con
 * descripción + botón "Comenzar".
 *
 * Theme adaptativo. Hero navy.
 *
 * REFIT 2026-05-23:
 *   - Theme tokens (antes hardcoded NAVY/GOLD)
 *   - Level colors usan tokens semánticos (success/info/purple)
 *   - Soporte timing "Lunes a viernes 9-18" → "24/7" (matches realidad
 *     del customer-support-service always-on)
 *   - Hero stats reales calculados (modules + sum duration)
 *
 * TODO declarado:
 *   - "Comenzar módulo" sin functionality real — futuro: WebView o
 *     componente in-app que renderice el contenido del módulo (texto + video)
 *   - Progreso por módulo (visto / no visto / completado) — AsyncStorage
 *     persistencia + badge "Nuevo" para los recién agregados
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useTheme, type ThemeTokens } from '../../theme';
import { hapticLight } from '../../utils/haptics';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type Level = 'Básico' | 'Intermedio' | 'Avanzado';

interface AcademyModule {
  id:       number;
  icon:     string;
  title:    string;
  desc:     string;
  duration: string;
  level:    Level;
  /** Minutos numéricos (para calcular total). */
  minutes:  number;
}

const MODULES: AcademyModule[] = [
  { id: 1, icon: '🗺️', title: 'Conoce Ecuador con Going App',           desc: 'Las 3 rutas principales, destinos y tiempos de viaje.',         duration: '5 min', minutes: 5, level: 'Básico'     },
  { id: 2, icon: '🚗', title: 'Cómo funciona el Viaje Compartido',   desc: 'Paradas, asientos, pagos y código OTP del conductor.',          duration: '4 min', minutes: 4, level: 'Básico'     },
  { id: 3, icon: '🔒', title: 'Viaje Privado: tu vehículo, tu horario', desc: 'SUV, VAN y BUS. Cuándo usar cada uno y cómo reservar.',     duration: '6 min', minutes: 6, level: 'Intermedio' },
  { id: 4, icon: '📦', title: 'Envíos seguros de punto a punto',      desc: 'OTP de entrega, foto de confirmación y rastreo GPS.',          duration: '4 min', minutes: 4, level: 'Básico'     },
  { id: 5, icon: '⭐', title: 'Going App Rewards: puntos y beneficios',    desc: 'Cómo acumular puntos y canjear descuentos y viajes.',          duration: '3 min', minutes: 3, level: 'Básico'     },
  { id: 6, icon: '🆘', title: 'Seguridad: función SOS y emergencias',  desc: 'Cómo usar el SOS, compartir tu viaje y el ECU 911.',           duration: '3 min', minutes: 3, level: 'Básico'     },
  { id: 7, icon: '🏔️', title: 'Turismo por la Sierra ecuatoriana',     desc: 'Destinos recomendados, volcanes, mercados y más.',             duration: '8 min', minutes: 8, level: 'Avanzado'   },
];

const TOTAL_MIN = MODULES.reduce((sum, m) => sum + m.minutes, 0);

export function AcademiaScreen() {
  const navigation = useNavigation<Nav>();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [expanded, setExpanded] = useState<number | null>(null);

  const LEVEL_COLOR: Record<Level, string> = useMemo(() => ({
    'Básico':     tokens.success,
    'Intermedio': tokens.brandNavy,
    'Avanzado':   '#7C3AED',   // purple accent (consistent con Profile Empresas)
  }), [tokens]);

  const handleModule = useCallback((mod: AcademyModule) => {
    hapticLight();
    setExpanded(prev => prev === mod.id ? null : mod.id);
  }, []);

  const handleStartModule = useCallback((mod: AcademyModule) => {
    hapticLight();
    Alert.alert(
      `${mod.icon} ${mod.title}`,
      'El contenido interactivo del módulo se habilitará pronto. Mientras tanto, ¿quieres ver el centro de ayuda web?',
      [
        { text: 'Más tarde', style: 'cancel' },
        { text: 'Abrir web', onPress: () => Linking.openURL('https://goingec.com/academia') },
      ],
    );
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={tokens.textOnNavy} />
        </TouchableOpacity>

        <View style={styles.heroIconWrap}>
          <Text style={styles.heroEmoji}>🎓</Text>
        </View>
        <Text style={styles.heroTitle}>Academia Going App</Text>
        <Text style={styles.heroSub}>
          Aprende a sacarle el máximo provecho a tu app
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>{MODULES.length}</Text>
            <Text style={styles.heroStatLbl}>Módulos</Text>
          </View>
          <View style={styles.heroStatDiv} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>{TOTAL_MIN} min</Text>
            <Text style={styles.heroStatLbl}>Total</Text>
          </View>
        </View>
      </View>

      {/* ── Módulos ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Módulos</Text>
        {MODULES.map(mod => {
          const isExpanded = expanded === mod.id;
          const accent = LEVEL_COLOR[mod.level];
          return (
            <TouchableOpacity
              key={mod.id}
              style={[styles.moduleCard, isExpanded && styles.moduleCardActive]}
              onPress={() => handleModule(mod)}
              activeOpacity={0.85}
              accessibilityLabel={`Módulo ${mod.title}, ${mod.level}, ${mod.duration}`}
            >
              <View style={styles.moduleHeader}>
                <View style={styles.moduleIconWrap}>
                  <Text style={styles.moduleIcon}>{mod.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <View style={styles.moduleMetaRow}>
                    <View style={[styles.levelBadge, { backgroundColor: `${accent}15` }]}>
                      <Text style={[styles.levelText, { color: accent }]}>{mod.level}</Text>
                    </View>
                    <Text style={styles.moduleDuration}>⏱ {mod.duration}</Text>
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={tokens.textTertiary}
                />
              </View>

              {isExpanded && (
                <View style={styles.moduleExpanded}>
                  <Text style={styles.moduleDesc}>{mod.desc}</Text>
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => handleStartModule(mod)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.startBtnText}>Comenzar módulo</Text>
                    <Ionicons name="arrow-forward" size={16} color={tokens.textOnNavy} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Ayuda ────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Ayuda</Text>
        <TouchableOpacity
          style={styles.supportCard}
          onPress={() => navigation.navigate('UserSupport')}
          accessibilityLabel="Hablar con soporte Going App"
        >
          <View style={styles.supportIcon}>
            <Ionicons name="headset-outline" size={22} color={tokens.brandNavy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Hablar con soporte</Text>
            <Text style={styles.supportSub}>Disponible 24/7</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={tokens.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportCard}
          onPress={() => Linking.openURL('https://goingec.com')}
          accessibilityLabel="Abrir centro de ayuda web"
        >
          <View style={styles.supportIcon}>
            <Ionicons name="globe-outline" size={22} color={tokens.brandNavy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Centro de ayuda web</Text>
            <Text style={styles.supportSub}>goingec.com</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={tokens.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // Hero
    hero: {
      backgroundColor: t.brandNavy,
      paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
    },
    heroIconWrap: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
    },
    heroEmoji: { fontSize: 32 },
    heroTitle: {
      fontSize: 24, fontWeight: '900',
      color: t.textOnNavy, marginBottom: 4, letterSpacing: -0.3,
    },
    heroSub: {
      fontSize: 13, color: 'rgba(255,255,255,0.7)',
      marginBottom: 20, fontWeight: '600',
    },
    heroStats: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    },
    heroStat: { flex: 1, alignItems: 'center' },
    heroStatVal: {
      fontSize: 18, fontWeight: '900',
      color: t.textOnNavy, letterSpacing: -0.3,
    },
    heroStatLbl: {
      fontSize: 10, color: 'rgba(255,255,255,0.65)',
      marginTop: 2, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    heroStatDiv: {
      width: 1, backgroundColor: 'rgba(255,255,255,0.15)',
      marginVertical: 4,
    },

    // Section
    section: { paddingHorizontal: 16, paddingTop: 20 },
    secTitle: {
      fontSize: 11, fontWeight: '800',
      color: t.textTertiary,
      letterSpacing: 1.2, textTransform: 'uppercase',
      marginBottom: 10, marginLeft: 4,
    },

    // Module card
    moduleCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 16, padding: 14, marginBottom: 10,
      borderWidth: 1.5, borderColor: t.glassBorder,
    },
    moduleCardActive: { borderColor: t.brandNavy },
    moduleHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    moduleIconWrap: {
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: t.glass,
      alignItems: 'center', justifyContent: 'center',
    },
    moduleIcon: { fontSize: 22 },
    moduleTitle: {
      fontSize: 13, fontWeight: '800', color: t.textPrimary,
    },
    moduleMetaRow: {
      flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center',
    },
    levelBadge: {
      borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    },
    levelText: { fontSize: 10, fontWeight: '900' },
    moduleDuration: {
      fontSize: 10, color: t.textTertiary, fontWeight: '600',
    },
    moduleExpanded: {
      marginTop: 12, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: t.border,
    },
    moduleDesc: {
      fontSize: 13, color: t.textSecondary,
      lineHeight: 18, marginBottom: 12,
    },
    startBtn: {
      backgroundColor: t.brandNavy,
      borderRadius: 12, padding: 12,
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 8,
      shadowColor: t.brandNavyDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
    },
    startBtnText: {
      fontSize: 13, fontWeight: '900',
      color: t.textOnNavy, letterSpacing: 0.3,
    },

    // Support card
    supportCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 14, padding: 14,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginBottom: 8,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    supportIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: `${t.brandNavy}14`,
      alignItems: 'center', justifyContent: 'center',
    },
    supportTitle: {
      fontSize: 14, fontWeight: '800', color: t.textPrimary,
    },
    supportSub: {
      fontSize: 11, color: t.textTertiary, marginTop: 2, fontWeight: '600',
    },
  });
}
