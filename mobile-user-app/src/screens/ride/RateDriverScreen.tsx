/**
 * RateDriverScreen — Calificación post-viaje (Mockup #15).
 *
 * Flujo:
 *  1. Summary del viaje (fare/distancia/duración) — sutil en card top
 *  2. Driver avatar + name + "¿Cómo estuvo tu viaje?"
 *  3. Thumbs Bueno / Mejorable
 *  4. Tags contextuales (6 positivos / 6 negativos según sentimiento)
 *  5. Propina $1/$3/$5 (solo thumbsUp) — labels emocionales
 *  6. Comentario opcional 300 chars
 *  7. Si thumbsDown: link discreto "Reportar problema grave" → SosScreen
 *  8. Submit POST /rides/:id/rate
 *
 * Theme adaptativo light + dark. Brand navy + yellow + colores semánticos
 * (success thumbs-up, error thumbs-down).
 *
 * REFIT 2026-05-23:
 *   - Theme adaptativo (antes hardcoded GOING_BLUE/YELLOW/GREEN/RED)
 *   - Propina $1/$3/$5 (matches mockup #15, antes $1/$2/$5)
 *   - Fix payload bug: passengerName usaba user.name (no existe en store)
 *     → cambiado a firstName + lastName
 *   - Link "Reportar problema grave" si thumbsDown → SosScreen con context
 *   - Header simplificado, summary mueve a card sutil arriba (matches mockup)
 *
 * TODOs declarados:
 *   - Wire backend "auto-review" si rating ≤ 2 — flag para ops priorice
 *     el driver review queue (transport-service necesita endpoint)
 *   - Custom tip amount — hoy solo presets, futuro: input para monto libre
 *   - Verificación cobro real de propina — hoy el monto va al payload pero
 *     no hay flow de cobro adicional (asume método previo soporta tip add-on)
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, ScrollView, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { api } from '../../services/api';
import { useAuthStore } from '@store/useAuthStore';
import { hapticLight, hapticSuccess, hapticHeavy } from '../../utils/haptics';
import { useTheme, type ThemeTokens } from '../../theme';

// ── Params ────────────────────────────────────────────────────────────────────
export type RateDriverParams = {
  rideId:           string;
  driverId:         string;
  driverName:       string;
  fare?:            number;
  distanceKm?:      number;
  durationSeconds?: number;
  paymentMethod?:   'cash' | 'card' | 'wallet' | 'datafast' | 'deuna' | string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ── Tags ──────────────────────────────────────────────────────────────────────
type Tag = { id: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

const POSITIVE_TAGS: Tag[] = [
  { id: 'puntual',  label: 'Puntual',           icon: 'time-outline'              },
  { id: 'amable',   label: 'Amable',            icon: 'happy-outline'             },
  { id: 'limpio',   label: 'Vehículo limpio',   icon: 'sparkles-outline'          },
  { id: 'seguro',   label: 'Conducción segura', icon: 'shield-checkmark-outline'  },
  { id: 'ruta',     label: 'Buena ruta',        icon: 'navigate-outline'          },
  { id: 'musica',   label: 'Buena música',      icon: 'musical-notes-outline'     },
];

const NEGATIVE_TAGS: Tag[] = [
  { id: 'tarde',    label: 'Llegó tarde',        icon: 'time-outline'              },
  { id: 'grosero',  label: 'Trato brusco',       icon: 'sad-outline'               },
  { id: 'sucio',    label: 'Vehículo sucio',     icon: 'warning-outline'           },
  { id: 'inseguro', label: 'Conducción insegura',icon: 'alert-circle-outline'      },
  { id: 'mal_ruta', label: 'Ruta incorrecta',    icon: 'close-circle-outline'      },
  { id: 'cobro',    label: 'Problema con cobro', icon: 'cash-outline'              },
];

const METHOD_LABEL: Record<string, string> = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  wallet:   'Wallet',
  datafast: 'Datafast',
  deuna:    'De Una',
};

const TIP_AMOUNTS: ReadonlyArray<{ amount: 1 | 3 | 5; label: string; emoji: string }> = [
  { amount: 1, label: 'Café',     emoji: '☕' },
  { amount: 3, label: 'Gracias',  emoji: '🙏' },
  { amount: 5, label: 'Excelente', emoji: '⭐' },
];

// ─────────────────────────────────────────────────────────────────────────────
export function RateDriverScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<{ params: RateDriverParams }, 'params'>>();
  const { user } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const { rideId, driverId, driverName, fare, distanceKm, durationSeconds, paymentMethod } = route.params;

  const [thumbsUp,     setThumbsUp]     = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment,      setComment]      = useState('');
  const [tip,          setTip]          = useState<0 | 1 | 3 | 5>(0);
  const [submitting,   setSubmitting]   = useState(false);

  const activeTags = thumbsUp === true ? POSITIVE_TAGS : thumbsUp === false ? NEGATIVE_TAGS : [];
  const driverFirstName = driverName.split(' ')[0];
  const driverInitials = useMemo(
    () => driverName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    [driverName],
  );

  const formatDuration = (secs?: number) => {
    if (!secs) return null;
    const m = Math.round(secs / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`;
  };

  // ── Handlers ──────────────────────────────────────────────
  const handleThumb = useCallback((up: boolean) => {
    hapticLight();
    setThumbsUp(prev => prev === up ? null : up);
    setSelectedTags([]);
    if (!up) setTip(0); // reset tip si bajamos a thumbs-down
  }, []);

  const toggleTag = useCallback((id: string) => {
    hapticLight();
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id],
    );
  }, []);

  const handleTip = useCallback((amount: 0 | 1 | 3 | 5) => {
    hapticLight();
    setTip(prev => prev === amount ? 0 : amount);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `¡Acabo de viajar con Going App! 🚗 ${driverName} fue un excelente conductor. Descarga la app en goingec.com`,
        title: 'Going App Ecuador',
      });
    } catch { /* canceled */ }
  }, [driverName]);

  // Reportar problema grave → SosScreen con context del viaje. El SOS le
  // permite al usuario llamar al 911, notificar contactos, o alertar a
  // ops Going App con priority RED.
  const handleReportSerious = useCallback(() => {
    hapticHeavy();
    (navigation.navigate as any)('Sos', {
      rideId,
      driverName,
      // No tenemos plate/phone/coords acá — el ride ya terminó. SOS aplica
      // a "incidente reportado post-viaje" (acoso, mal trato grave, etc.)
    });
  }, [navigation, rideId, driverName]);

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (thumbsUp === null) {
      Alert.alert('Calificación requerida', 'Selecciona 👍 o 👎 para continuar.');
      return;
    }
    setSubmitting(true);

    const rating = thumbsUp ? 5 : 1;
    // FIX: usar firstName + lastName del store (antes era user.name que no existe)
    const passengerName = user
      ? `${(user as any).firstName ?? ''} ${(user as any).lastName ?? ''}`.trim() || undefined
      : undefined;

    const payload = {
      driverId,
      rating,
      thumbsUp,
      tags:           selectedTags,
      comment:        comment.trim() || undefined,
      tip:            tip > 0 ? tip : undefined,
      passengerName,
      // Flag para que el backend priorice review por ops si negativo
      requiresReview: !thumbsUp,
    };

    try {
      await api.post(`/rides/${rideId}/rate`, payload);
      hapticSuccess();
    } catch (err: any) {
      console.warn('Rating HTTP error:', err?.message);
      // No bloqueamos UI — el pasajero ya viajó y la mayor parte de la
      // calificación se persiste eventualmente con backoff del cliente HTTP.
    }

    const tipMsg = tip > 0 ? ` Le dejaste $${tip} de propina a ${driverFirstName} 🙌` : '';
    Alert.alert(
      '¡Gracias por calificar!',
      `Tu opinión ayuda a mejorar la experiencia.${tipMsg}`,
      [
        ...(thumbsUp ? [{ text: 'Compartir', onPress: handleShare }] : []),
        { text: 'Listo', onPress: () => navigation.goBack() },
      ],
    );
    setSubmitting(false);
  }, [thumbsUp, driverId, selectedTags, comment, tip, user, rideId, driverFirstName, handleShare, navigation]);

  const durationLabel = formatDuration(durationSeconds);

  // ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header simple — solo "Omitir" */}
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Summary del viaje (card sutil arriba) ─────────────── */}
        <View style={styles.summaryCard}>
          {fare != null && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${fare.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>
                {paymentMethod ? METHOD_LABEL[paymentMethod] ?? 'Total' : 'Total'}
              </Text>
            </View>
          )}
          {distanceKm != null && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{distanceKm.toFixed(1)} km</Text>
                <Text style={styles.summaryLabel}>Distancia</Text>
              </View>
            </>
          )}
          {durationLabel && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{durationLabel}</Text>
                <Text style={styles.summaryLabel}>Duración</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Conductor ─────────────────────────────────────────── */}
        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitials}>{driverInitials}</Text>
          </View>
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.driverSubtitle}>¿Cómo estuvo tu viaje?</Text>
        </View>

        {/* ── Thumbs ────────────────────────────────────────────── */}
        <View style={styles.thumbsRow}>
          <TouchableOpacity
            style={[
              styles.thumbBtn,
              thumbsUp === true  && styles.thumbBtnUpActive,
              thumbsUp === false && styles.thumbBtnInactive,
            ]}
            onPress={() => handleThumb(true)}
            activeOpacity={0.8}
            accessibilityLabel="Calificación positiva"
          >
            <Ionicons
              name={thumbsUp === true ? 'thumbs-up' : 'thumbs-up-outline'}
              size={38}
              color={thumbsUp === true ? '#fff' : tokens.success}
            />
            <Text style={[styles.thumbLabel, thumbsUp === true && styles.thumbLabelActive]}>
              Bueno
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.thumbBtn,
              thumbsUp === false && styles.thumbBtnDownActive,
              thumbsUp === true  && styles.thumbBtnInactive,
            ]}
            onPress={() => handleThumb(false)}
            activeOpacity={0.8}
            accessibilityLabel="Calificación negativa"
          >
            <Ionicons
              name={thumbsUp === false ? 'thumbs-down' : 'thumbs-down-outline'}
              size={38}
              color={thumbsUp === false ? '#fff' : tokens.error}
            />
            <Text style={[styles.thumbLabel, thumbsUp === false && styles.thumbLabelActive]}>
              Mejorable
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tags ──────────────────────────────────────────────── */}
        {thumbsUp !== null && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>
              {thumbsUp ? '¿Qué te gustó?' : '¿Qué falló?'}
            </Text>
            <View style={styles.tagsGrid}>
              {activeTags.map(tag => {
                const selected    = selectedTags.includes(tag.id);
                const activeColor = thumbsUp ? tokens.brandNavy : tokens.error;
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagBtn,
                      selected && { backgroundColor: activeColor, borderColor: activeColor },
                    ]}
                    onPress={() => toggleTag(tag.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={tag.icon}
                      size={14}
                      color={selected ? tokens.textOnNavy : activeColor}
                    />
                    <Text style={[
                      styles.tagText,
                      { color: selected ? tokens.textOnNavy : activeColor },
                    ]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Propina (solo thumbsUp) ──────────────────────────── */}
        {thumbsUp === true && (
          <View style={styles.tipSection}>
            <Text style={styles.sectionTitle}>Propina al conductor</Text>
            <Text style={styles.tipSubtitle}>
              100% va directo a {driverFirstName} · sin comisión Going App
            </Text>
            <View style={styles.tipRow}>
              {TIP_AMOUNTS.map(t => (
                <TouchableOpacity
                  key={t.amount}
                  style={[styles.tipBtn, tip === t.amount && styles.tipBtnActive]}
                  onPress={() => handleTip(t.amount)}
                  activeOpacity={0.8}
                  accessibilityLabel={`Propina ${t.amount} dólares`}
                >
                  <Text style={[styles.tipAmount, tip === t.amount && styles.tipAmountActive]}>
                    ${t.amount}
                  </Text>
                  <Text style={[styles.tipLabel, tip === t.amount && styles.tipLabelActive]}>
                    {t.label} {t.emoji}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Comentario ────────────────────────────────────────── */}
        {thumbsUp !== null && (
          <View style={styles.commentSection}>
            <TextInput
              style={styles.commentInput}
              placeholder={thumbsUp ? '¿Algo más que quieras destacar?' : '¿Qué pasó?'}
              placeholderTextColor={tokens.textTertiary}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comment.length}/300</Text>
          </View>
        )}

        {/* ── Reportar problema grave (solo thumbsDown) ────────── */}
        {thumbsUp === false && (
          <TouchableOpacity
            style={styles.reportSeriousBtn}
            onPress={handleReportSerious}
            activeOpacity={0.7}
            accessibilityLabel="Reportar problema grave: acoso, mal trato, agresión"
          >
            <Ionicons name="warning" size={18} color={tokens.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reportSeriousTitle}>Reportar problema grave</Text>
              <Text style={styles.reportSeriousSub}>
                Acoso, agresión, vehículo en mal estado u otra situación urgente
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tokens.error} />
          </TouchableOpacity>
        )}

        {/* ── Submit ────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, thumbsUp === null && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={thumbsUp === null || submitting}
            activeOpacity={0.88}
            accessibilityLabel="Enviar calificación"
          >
            {submitting ? (
              <ActivityIndicator color={tokens.textOnNavy} />
            ) : (
              <Text style={[styles.submitText, thumbsUp === null && styles.submitTextDisabled]}>
                Enviar calificación
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // ── Header ─────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: 54, paddingHorizontal: 20, paddingBottom: 12,
      backgroundColor: t.bg,
    },
    skipText: {
      fontSize: 14, fontWeight: '700',
      color: t.textTertiary,
    },

    body: { paddingBottom: 48 },

    // ── Summary (card sutil top) ───────────────────────────
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: t.bgLayer,
      marginHorizontal: 20,
      borderRadius: 14,
      paddingVertical: 14, paddingHorizontal: 8,
      borderWidth: 1, borderColor: t.glassBorder,
      marginBottom: 24,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: {
      fontSize: 16, fontWeight: '900',
      color: t.brandNavy, letterSpacing: -0.3,
    },
    summaryLabel: {
      fontSize: 10, fontWeight: '600',
      color: t.textTertiary,
      marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    summaryDivider: {
      width: 1, alignSelf: 'stretch',
      backgroundColor: t.border, marginVertical: 4,
    },

    // ── Driver ─────────────────────────────────────────────
    driverSection: {
      alignItems: 'center', paddingBottom: 24,
    },
    driverAvatar: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: t.brandYellow,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 12,
      shadowColor: t.brandYellowDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    driverInitials: {
      color: t.textOnYellow,
      fontWeight: '900', fontSize: 24, letterSpacing: 0.5,
    },
    driverName: {
      fontSize: 18, fontWeight: '900',
      color: t.textPrimary, letterSpacing: -0.3,
    },
    driverSubtitle: {
      fontSize: 13, color: t.textSecondary,
      marginTop: 4, fontWeight: '600',
    },

    // ── Thumbs ─────────────────────────────────────────────
    thumbsRow: {
      flexDirection: 'row', gap: 12,
      paddingHorizontal: 20, marginBottom: 24,
    },
    thumbBtn: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingVertical: 22, borderRadius: 16,
      borderWidth: 2, borderColor: t.border,
      backgroundColor: t.bgLayer, gap: 8,
    },
    thumbBtnUpActive: {
      backgroundColor: t.success, borderColor: t.success,
    },
    thumbBtnDownActive: {
      backgroundColor: t.error, borderColor: t.error,
    },
    thumbBtnInactive: { opacity: 0.4 },
    thumbLabel: {
      fontSize: 13, fontWeight: '800', color: t.textPrimary,
    },
    thumbLabelActive: { color: '#fff' },

    // ── Section title (compartido tags/tip) ────────────────
    sectionTitle: {
      fontSize: 13, fontWeight: '800',
      color: t.textPrimary, marginBottom: 10,
    },

    // ── Tags ───────────────────────────────────────────────
    tagsSection: { paddingHorizontal: 20, marginBottom: 20 },
    tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
      backgroundColor: t.glass,
      borderWidth: 1.5, borderColor: t.glassBorder,
    },
    tagText: { fontSize: 12, fontWeight: '700' },

    // ── Propina ────────────────────────────────────────────
    tipSection: { paddingHorizontal: 20, marginBottom: 20 },
    tipSubtitle: {
      fontSize: 11, color: t.textTertiary,
      marginBottom: 10, marginTop: -4,
    },
    tipRow: { flexDirection: 'row', gap: 10 },
    tipBtn: {
      flex: 1, alignItems: 'center',
      paddingVertical: 14, borderRadius: 14,
      borderWidth: 1.5, borderColor: t.border,
      backgroundColor: t.bgLayer,
    },
    tipBtnActive: {
      backgroundColor: t.brandYellow,
      borderColor: t.brandYellow,
    },
    tipAmount: {
      fontSize: 20, fontWeight: '900',
      color: t.textPrimary, marginBottom: 2,
      letterSpacing: -0.5,
    },
    tipAmountActive: { color: t.textOnYellow },
    tipLabel: {
      fontSize: 11, fontWeight: '700', color: t.textSecondary,
    },
    tipLabelActive: { color: t.textOnYellow },

    // ── Comentario ─────────────────────────────────────────
    commentSection: { paddingHorizontal: 20, marginBottom: 14 },
    commentInput: {
      borderWidth: 1.5, borderColor: t.border,
      borderRadius: 14, padding: 14,
      fontSize: 14, color: t.textPrimary,
      backgroundColor: t.bgLayer,
      minHeight: 80,
    },
    charCount: {
      textAlign: 'right', fontSize: 11,
      color: t.textTertiary, marginTop: 4,
    },

    // ── Reportar problema grave ────────────────────────────
    reportSeriousBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: `${t.error}10`,
      borderWidth: 1.5, borderColor: `${t.error}40`,
      borderRadius: 14, padding: 14,
      marginHorizontal: 20, marginBottom: 16,
    },
    reportSeriousTitle: {
      fontSize: 13, fontWeight: '800', color: t.error,
    },
    reportSeriousSub: {
      fontSize: 11, color: t.textTertiary,
      marginTop: 2, lineHeight: 15,
    },

    // ── Footer ─────────────────────────────────────────────
    footer: { paddingHorizontal: 20, paddingBottom: 12 },
    submitBtn: {
      paddingVertical: 16, borderRadius: 14,
      alignItems: 'center',
      backgroundColor: t.brandNavy,
      shadowColor: t.brandNavyDark,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    },
    submitBtnDisabled: {
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      shadowOpacity: 0, elevation: 0,
    },
    submitText: {
      color: t.textOnNavy,
      fontSize: 15, fontWeight: '900', letterSpacing: 0.3,
    },
    submitTextDisabled: { color: t.textTertiary },
  });
}
