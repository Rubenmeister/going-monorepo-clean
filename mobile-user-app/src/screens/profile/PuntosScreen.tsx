/**
 * PuntosScreen — Going Rewards (Mockup #17).
 *
 * Estructura:
 *   - Hero navy con back btn + título + tarjeta puntos + progress
 *   - Levels strip (4 tiers, current destacado)
 *   - Cómo ganar (6 reglas)
 *   - Qué puedes canjear (4 beneficios — canje stub TODO)
 *
 * Theme adaptativo. Hero navy mantiene identity.
 *
 * REFIT 2026-05-23:
 *   - Theme tokens (antes hardcoded NAVY/GOLD/GREEN)
 *   - Puntos reales del user store (antes `userPoints = 0` hardcoded)
 *   - LEVELS extraídos a catalog/rewards.ts (single source of truth)
 *     consistente con ProfileScreen #16 — antes había 4 niveles acá vs
 *     3 en Profile (bug detectado, ahora alineados a 4 tiers canónicos)
 *   - Canje de beneficios ahora con visual de "disponible" vs "te faltan
 *     X pts" — antes todos seleccionables sin validar
 *
 * TODO declarado:
 *   - Endpoint backend /users/me/rewards (puntos, canjes, bonos activos)
 *   - Flujo de canje real (transport-service POST /rewards/redeem)
 *   - Historial de canjes
 */
import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useAuthStore } from '@store/useAuthStore';
import {
  REWARDS_LEVELS,
  HOW_TO_EARN,
  BENEFITS,
  tierFromPoints,
  type Benefit,
} from '../../catalog';
import { useTheme, type ThemeTokens } from '../../theme';
import { hapticLight } from '../../utils/haptics';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function PuntosScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  // Puntos reales del user. TODO: endpoint /users/me/rewards autoritativo.
  const userPoints = (user as any)?.points ?? 0;
  const { current: currentLevel, next: nextLevel, progress } = tierFromPoints(userPoints);

  // ── Handler: intentar canjear beneficio ───────────────────
  const handleRedeem = useCallback((b: Benefit) => {
    hapticLight();
    if (userPoints < b.pts) {
      Alert.alert(
        'Puntos insuficientes',
        `Necesitas ${b.pts - userPoints} pts más para canjear "${b.label}". Sigue viajando para sumar puntos.`,
      );
      return;
    }
    Alert.alert(
      'Canjear beneficio',
      `¿Confirmas el canje de ${b.pts} pts por "${b.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Canjear',
          style: 'default',
          onPress: () => {
            // TODO: POST /rewards/redeem con benefit.id → backend descuenta
            // pts y agrega bono activo al user (aplica al próximo viaje).
            Alert.alert(
              'Próximamente',
              'El canje real se habilitará cuando el backend exponga el endpoint /rewards/redeem.',
            );
          },
        },
      ],
    );
  }, [userPoints]);

  // Accent color por benefit
  const accentColor = (a: Benefit['accent']) => {
    switch (a) {
      case 'success': return tokens.success;
      case 'warning': return tokens.warning;
      case 'red':     return tokens.brandRed;
      case 'purple':  return '#7C3AED';
      case 'navy':
      default:        return tokens.brandNavy;
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={tokens.textOnNavy} />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Going Rewards</Text>
        <Text style={styles.heroSub}>Viaja, acumula, canjea</Text>

        {/* Card de puntos + tier actual */}
        <View style={styles.pointsCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointsLabel}>TUS PUNTOS</Text>
            <Text style={styles.pointsValue}>{userPoints.toLocaleString('es-EC')}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelIcon}>{currentLevel.icon}</Text>
            <Text style={styles.levelName}>{currentLevel.name}</Text>
          </View>
        </View>

        {/* Progress al siguiente tier */}
        {nextLevel && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {(nextLevel.min - userPoints).toLocaleString('es-EC')} pts para llegar a {nextLevel.name} {nextLevel.icon}
            </Text>
          </View>
        )}
        {!nextLevel && (
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              ¡Eres {currentLevel.name}! Nivel máximo alcanzado. 🎉
            </Text>
          </View>
        )}
      </View>

      {/* ── NIVELES ────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Niveles</Text>
        <View style={styles.levelsRow}>
          {REWARDS_LEVELS.map(l => {
            const isCurrent = currentLevel.id === l.id;
            return (
              <View
                key={l.id}
                style={[styles.levelCard, isCurrent && styles.levelCardActive]}
              >
                <Text style={styles.levelCardIcon}>{l.icon}</Text>
                <Text style={[styles.levelCardName, isCurrent && styles.levelCardNameActive]}>
                  {l.name}
                </Text>
                <Text style={styles.levelCardPts}>
                  {l.min === 0 ? '0' : `${l.min.toLocaleString('es-EC')}+`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── CÓMO GANAR ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Cómo ganar puntos</Text>
        <View style={styles.card}>
          {HOW_TO_EARN.map((item, i) => {
            const isLast = i === HOW_TO_EARN.length - 1;
            return (
              <View key={item.id} style={[styles.earnRow, !isLast && styles.earnBorder]}>
                <View style={styles.earnIcon}>
                  <Ionicons name={item.icon} size={16} color={tokens.brandNavy} />
                </View>
                <Text style={styles.earnLabel}>{item.label}</Text>
                <Text style={styles.earnPts}>+{item.pts}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── BENEFICIOS ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Qué puedes canjear</Text>
        {BENEFITS.map(b => {
          const canRedeem = userPoints >= b.pts;
          const ac = accentColor(b.accent);
          return (
            <TouchableOpacity
              key={b.id}
              style={[styles.benefitCard, !canRedeem && styles.benefitCardLocked]}
              onPress={() => handleRedeem(b)}
              activeOpacity={0.85}
              accessibilityLabel={`Canjear ${b.label} por ${b.pts} puntos`}
            >
              <View style={[styles.benefitIcon, { backgroundColor: `${ac}14` }]}>
                <Ionicons
                  name={canRedeem ? b.icon : 'lock-closed-outline'}
                  size={20}
                  color={canRedeem ? ac : tokens.textTertiary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.benefitLabel, !canRedeem && styles.benefitLabelLocked]}>
                  {b.label}
                </Text>
                {!canRedeem && (
                  <Text style={styles.benefitMissing}>
                    Te faltan {(b.pts - userPoints).toLocaleString('es-EC')} pts
                  </Text>
                )}
              </View>
              <View style={[styles.benefitPts, canRedeem && styles.benefitPtsAvailable]}>
                <Text style={[
                  styles.benefitPtsText,
                  canRedeem && styles.benefitPtsTextAvailable,
                ]}>
                  {b.pts} pts
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // ── Hero ───────────────────────────────────────────────
    hero: {
      backgroundColor: t.brandNavyDark,
      paddingTop: 52, paddingHorizontal: 20, paddingBottom: 24,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 24, fontWeight: '900',
      color: t.textOnNavy, marginBottom: 2, letterSpacing: -0.3,
    },
    heroSub: {
      fontSize: 13, color: 'rgba(255,255,255,0.65)',
      marginBottom: 20, fontWeight: '600',
    },

    pointsCard: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 18, padding: 18,
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    },
    pointsLabel: {
      fontSize: 10, fontWeight: '900',
      color: t.brandYellow, letterSpacing: 1.5, marginBottom: 4,
    },
    pointsValue: {
      fontSize: 40, fontWeight: '900',
      color: t.textOnNavy, letterSpacing: -1,
    },
    levelBadge: { alignItems: 'center', gap: 4 },
    levelIcon: { fontSize: 28 },
    levelName: {
      fontSize: 13, fontWeight: '900',
      color: t.brandYellow, letterSpacing: 0.3,
    },

    progressSection: { marginTop: 16 },
    progressBar: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 3, overflow: 'hidden', marginBottom: 6,
    },
    progressFill: {
      height: '100%',
      backgroundColor: t.brandYellow,
      borderRadius: 3,
    },
    progressText: {
      fontSize: 11, color: 'rgba(255,255,255,0.7)',
      textAlign: 'center', fontWeight: '600',
    },

    // ── Section common ─────────────────────────────────────
    section: { paddingHorizontal: 16, paddingTop: 20 },
    secTitle: {
      fontSize: 11, fontWeight: '800',
      color: t.textTertiary,
      letterSpacing: 1.2, textTransform: 'uppercase',
      marginBottom: 10, marginLeft: 4,
    },

    // ── Levels strip ───────────────────────────────────────
    levelsRow: { flexDirection: 'row', gap: 8 },
    levelCard: {
      flex: 1,
      backgroundColor: t.bgLayer,
      borderRadius: 14, padding: 10,
      alignItems: 'center', gap: 4,
      borderWidth: 2, borderColor: t.border,
    },
    levelCardActive: {
      borderColor: t.brandNavy,
      backgroundColor: `${t.brandNavy}08`,
    },
    levelCardIcon: { fontSize: 22 },
    levelCardName: {
      fontSize: 10, fontWeight: '800',
      color: t.textSecondary,
    },
    levelCardNameActive: { color: t.brandNavy },
    levelCardPts: {
      fontSize: 9, color: t.textTertiary, fontWeight: '700',
    },

    // ── Cómo ganar card ────────────────────────────────────
    card: {
      backgroundColor: t.bgLayer,
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: t.glassBorder,
    },
    earnRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 14,
    },
    earnBorder: {
      borderBottomWidth: 1, borderBottomColor: t.border,
    },
    earnIcon: {
      width: 32, height: 32, borderRadius: 10,
      backgroundColor: `${t.brandNavy}12`,
      alignItems: 'center', justifyContent: 'center',
    },
    earnLabel: {
      flex: 1, fontSize: 13,
      color: t.textPrimary, fontWeight: '600',
    },
    earnPts: {
      fontSize: 14, fontWeight: '900',
      color: t.warning,
    },

    // ── Beneficios ────────────────────────────────────────
    benefitCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 14, padding: 14,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginBottom: 8,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    benefitCardLocked: { opacity: 0.6 },
    benefitIcon: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
    },
    benefitLabel: {
      fontSize: 13, color: t.textPrimary, fontWeight: '700',
    },
    benefitLabelLocked: { color: t.textSecondary },
    benefitMissing: {
      fontSize: 11, color: t.textTertiary,
      marginTop: 2, fontWeight: '600',
    },
    benefitPts: {
      backgroundColor: t.glass,
      borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    benefitPtsAvailable: {
      backgroundColor: `${t.brandYellow}25`,
      borderColor: t.brandYellow,
    },
    benefitPtsText: {
      fontSize: 11, fontWeight: '900',
      color: t.textTertiary, letterSpacing: 0.3,
    },
    benefitPtsTextAvailable: { color: t.brandYellowDark },
  });
}
