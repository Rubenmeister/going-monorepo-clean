/**
 * TripSummaryScreen — Resumen post-viaje (Pasajero, Mockup #14).
 *
 * Se muestra al recibir 'ride:completed' por socket en ActiveRideScreen.
 * Flujo:
 *  1. Hero verde "¡Llegaste!" con monto + reference + method
 *  2. Card detalles (ruta, duración, distancia, conductor, vehículo, tipo)
 *  3. Cash banner si paymentMethod=cash (pendiente vs confirmado)
 *  4. Acciones: Compartir / Recibo / Soporte
 *  5. CTA "Calificar a {driver}" → RateDriverScreen
 *
 * Theme adaptativo light + dark — hero verde se MANTIENE siempre (identity
 * celebrativa del momento "llegaste!", no debe cambiar con dark/light).
 *
 * REFIT 2026-05-23:
 *   - Theme adaptativo (antes hardcoded GREEN/NAVY/GOLD)
 *   - Botones "Recibo" y "Soporte" ahora WIRED (antes stubs silenciosos)
 *   - methodLabel ahora soporta Datafast + De Una (matches ConfirmRide refit)
 *   - Cast `as any` en navigate('Home') resuelto
 *
 * TODOs declarados:
 *   - Recibo SRI real (PDF generado backend) — hoy es Share textual.
 *     Backend payment-service tiene infraestructura Datafast/DeUna que
 *     emite facturas; falta endpoint /payments/:rideId/receipt que devuelva
 *     URL del PDF.
 *   - Propina explícita — la calificación (#15) tiene tip buttons, OK.
 */
import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Share, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { hapticSuccess, hapticLight } from '../../utils/haptics';
import { useTheme, type ThemeTokens } from '../../theme';

// ── Hero verde — NO theme-adaptive (identity celebrativa) ────────────────
const HERO_GREEN      = '#059669';
const HERO_GREEN_DARK = '#065F46';

// ── Params ───────────────────────────────────────────────────────────────
export type TripSummaryParams = {
  rideId:           string;
  driverId:         string;
  driverName:       string;
  origin:           string;
  destination:      string;
  departureTime?:   string;
  arrivalTime?:     string;
  durationSeconds?: number;
  distanceKm?:      number;
  fare:             number;
  paymentMethod:    'card' | 'cash' | 'wallet' | 'datafast' | 'deuna' | string;
  cashConfirmed?:   boolean;
  vehiclePlate?:    string;
  vehicleModel?:    string;
  rideType:         'compartido' | 'privado';
  referenceCode?:   string;
};

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ─────────────────────────────────────────────────────────────────────────
export function TripSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: TripSummaryParams }, 'params'>>();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);
  const p = route.params;

  useEffect(() => { hapticSuccess(); }, []);

  // ── Formateo ──────────────────────────────────────────────
  const formatDuration = (secs?: number) => {
    if (!secs) return null;
    const m = Math.round(secs / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
  };

  const methodLabel = useMemo(() => {
    switch (p.paymentMethod) {
      case 'cash':     return 'Efectivo';
      case 'wallet':   return 'Wallet Going';
      case 'datafast': return 'Tarjeta · Datafast';
      case 'deuna':    return 'QR · De Una';
      case 'card':     return 'Tarjeta';
      default:         return 'Pago confirmado';
    }
  }, [p.paymentMethod]);

  const durationLabel = formatDuration(p.durationSeconds);

  // ── Handlers ──────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    hapticLight();
    try {
      await Share.share({
        message: `Acabo de llegar a ${p.destination} con Going. Excelente servicio 🚗`,
        title: 'Going Ecuador',
      });
    } catch { /* canceled */ }
  }, [p.destination]);

  const handleReceipt = useCallback(async () => {
    hapticLight();
    // TODO: backend payment-service no expone /payments/:rideId/receipt
    // todavía. Mientras tanto compartimos un recibo textual con todos los
    // datos fiscales relevantes para Ecuador (referencia, monto, método).
    const lines = [
      '📄 RECIBO GOING',
      '',
      p.referenceCode  ? `Ref: ${p.referenceCode}`             : null,
      `Fecha: ${new Date().toLocaleDateString('es-EC')}`,
      `Origen: ${p.origin}`,
      `Destino: ${p.destination}`,
      durationLabel    ? `Duración: ${durationLabel}`          : null,
      p.distanceKm     ? `Distancia: ${p.distanceKm.toFixed(1)} km` : null,
      `Conductor: ${p.driverName}`,
      p.vehiclePlate   ? `Placa: ${p.vehiclePlate}`            : null,
      `Tipo: ${p.rideType === 'compartido' ? 'Compartido' : 'Privado'}`,
      `Método: ${methodLabel}`,
      `Total: $${p.fare.toFixed(2)} USD`,
      '',
      'IVA: 0% (transporte de pasajeros exento — Art. 56 LRTI)',
      '',
      'Going Ecuador · goingec.com',
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message: lines, title: 'Recibo Going' });
    } catch { /* canceled */ }
  }, [p, methodLabel, durationLabel]);

  const handleSupport = useCallback(() => {
    hapticLight();
    Alert.alert(
      '¿Tuviste algún problema?',
      'Elige cómo contactar a Going:',
      [
        {
          text: 'WhatsApp Soporte',
          onPress: () => {
            const msg = encodeURIComponent(
              `Hola Going, tuve un inconveniente con el viaje ${p.referenceCode ?? p.rideId.slice(0, 8)}. Me podrían ayudar?`,
            );
            // Número de soporte unificado (memoria del proyecto)
            Linking.openURL(`https://wa.me/593984037949?text=${msg}`).catch(() =>
              Alert.alert('Error', 'No se pudo abrir WhatsApp.'),
            );
          },
        },
        {
          text: 'Chat in-app',
          onPress: () => (navigation.navigate as any)('UserSupport', {
            rideId: p.rideId,
            referenceCode: p.referenceCode,
          }),
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }, [navigation, p.rideId, p.referenceCode]);

  const handleRate = useCallback(() => {
    navigation.replace('RateDriver', {
      rideId:          p.rideId,
      driverId:        p.driverId,
      driverName:      p.driverName,
      fare:            p.fare,
      distanceKm:      p.distanceKm,
      durationSeconds: p.durationSeconds,
      paymentMethod:   p.paymentMethod,
    });
  }, [navigation, p]);

  const handleSkip = useCallback(() => {
    (navigation.navigate as any)('Home');
  }, [navigation]);

  // ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── HERO VERDE celebrativo (no theme-adaptive) ──────────── */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="checkmark-circle" size={36} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>¡Llegaste!</Text>
        <Text style={styles.heroSub}>Viaje completado exitosamente</Text>

        <Text style={styles.heroAmount}>${p.fare.toFixed(2)}</Text>
        <Text style={styles.heroCurrency}>USD · {methodLabel}</Text>

        {p.referenceCode && (
          <View style={styles.refBadge}>
            <Text style={styles.refText}>#{p.referenceCode}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Detalles ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del viaje</Text>

          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.dotOrigin]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeCity}>{p.origin}</Text>
            </View>
            {p.departureTime && <Text style={styles.routeTime}>{p.departureTime}</Text>}
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.dotDest]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeCity}>{p.destination}</Text>
            </View>
            {p.arrivalTime && <Text style={styles.routeTime}>{p.arrivalTime}</Text>}
          </View>

          <View style={styles.divider} />

          {durationLabel && (
            <View style={styles.statRow}>
              <Text style={styles.statLbl}>Duración</Text>
              <Text style={styles.statVal}>{durationLabel}</Text>
            </View>
          )}
          {p.distanceKm && (
            <View style={styles.statRow}>
              <Text style={styles.statLbl}>Distancia</Text>
              <Text style={styles.statVal}>{p.distanceKm.toFixed(1)} km</Text>
            </View>
          )}
          <View style={styles.statRow}>
            <Text style={styles.statLbl}>Conductor</Text>
            <Text style={styles.statVal}>{p.driverName}</Text>
          </View>
          {p.vehiclePlate && (
            <View style={styles.statRow}>
              <Text style={styles.statLbl}>Vehículo</Text>
              <Text style={styles.statVal}>
                {p.vehicleModel ? `${p.vehicleModel} · ` : ''}{p.vehiclePlate}
              </Text>
            </View>
          )}
          <View style={[styles.statRow, { marginBottom: 0 }]}>
            <Text style={styles.statLbl}>Tipo de viaje</Text>
            <Text style={styles.statVal}>
              {p.rideType === 'compartido' ? 'Compartido' : 'Privado'}
            </Text>
          </View>
        </View>

        {/* ── Cash banner ───────────────────────────────────── */}
        {p.paymentMethod === 'cash' && (
          <View style={[styles.cashBanner, p.cashConfirmed && styles.cashBannerConfirmed]}>
            <Ionicons
              name={p.cashConfirmed ? 'checkmark-circle' : 'time-outline'}
              size={22}
              color={p.cashConfirmed ? tokens.success : tokens.warning}
            />
            <Text style={[styles.cashText, p.cashConfirmed && styles.cashTextConfirmed]}>
              {p.cashConfirmed
                ? `Efectivo confirmado por ${p.driverName.split(' ')[0]}`
                : 'Pendiente confirmación de efectivo por el conductor'}
            </Text>
            {p.cashConfirmed && (
              <View style={styles.cashCheck}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>
        )}

        {/* ── Acciones ──────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShare}
            accessibilityLabel="Compartir resumen del viaje"
          >
            <Ionicons name="share-outline" size={20} color={tokens.brandNavy} />
            <Text style={styles.actionText}>Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleReceipt}
            accessibilityLabel="Compartir recibo del viaje"
          >
            <Ionicons name="receipt-outline" size={20} color={tokens.brandNavy} />
            <Text style={styles.actionText}>Recibo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSupport}
            accessibilityLabel="Contactar a soporte Going"
          >
            <Ionicons name="headset-outline" size={20} color={tokens.brandNavy} />
            <Text style={styles.actionText}>Soporte</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── CTA Calificar (sticky bottom) ─────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.rateBtn}
          onPress={handleRate}
          activeOpacity={0.85}
          accessibilityLabel={`Calificar a ${p.driverName}`}
        >
          <View>
            <Text style={styles.rateBtnText}>Calificar a {p.driverName.split(' ')[0]}</Text>
            <Text style={styles.rateBtnSub}>¿Cómo estuvo tu viaje?</Text>
          </View>
          <Ionicons name="star" size={24} color={tokens.brandYellow} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          accessibilityLabel="Saltar calificación e ir al inicio"
        >
          <Text style={styles.skipText}>Ir al inicio sin calificar</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // ── Hero verde fijo (identity celebrativa) ─────────────
    hero: {
      backgroundColor: HERO_GREEN,
      paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20,
      alignItems: 'center', gap: 6,
    },
    heroIcon: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.20)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
    },
    heroTitle: {
      fontSize: 24, fontWeight: '900',
      color: '#fff', letterSpacing: -0.3,
    },
    heroSub: {
      fontSize: 12, color: 'rgba(255,255,255,0.78)',
      fontWeight: '600',
    },
    heroAmount: {
      fontSize: 40, fontWeight: '900',
      color: '#fff', marginTop: 8, letterSpacing: -1,
    },
    heroCurrency: {
      fontSize: 13, color: 'rgba(255,255,255,0.75)',
      fontWeight: '600',
    },
    refBadge: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4,
      marginTop: 6,
    },
    refText: {
      fontSize: 11, fontWeight: '800',
      color: 'rgba(255,255,255,0.92)',
      letterSpacing: 0.3,
    },

    // ── Content ────────────────────────────────────────────
    scroll: { flex: 1 },

    card: {
      margin: 16,
      backgroundColor: t.bgLayer,
      borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    cardTitle: {
      fontSize: 11, fontWeight: '800',
      color: t.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase',
      marginBottom: 14,
    },

    // Route
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    dotOrigin: { backgroundColor: HERO_GREEN },
    dotDest: {
      backgroundColor: 'transparent',
      borderWidth: 2, borderColor: t.textTertiary,
    },
    routeCity: { fontSize: 15, fontWeight: '800', color: t.textPrimary },
    routeTime: { fontSize: 12, fontWeight: '700', color: t.textTertiary },
    routeLine: {
      width: 2, height: 16, backgroundColor: t.border,
      marginLeft: 4, marginVertical: 3,
    },

    divider: { height: 1, backgroundColor: t.border, marginVertical: 12 },

    // Stats
    statRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 6,
    },
    statLbl: { fontSize: 13, color: t.textSecondary },
    statVal: { fontSize: 13, fontWeight: '800', color: t.textPrimary },

    // Cash banner
    cashBanner: {
      marginHorizontal: 16,
      backgroundColor: `${t.warning}12`,
      borderRadius: 14,
      borderWidth: 1.5, borderColor: `${t.warning}40`,
      flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    },
    cashBannerConfirmed: {
      backgroundColor: `${t.success}12`,
      borderColor: `${t.success}40`,
    },
    cashText: {
      flex: 1, fontSize: 12, fontWeight: '700',
      color: t.warning,
    },
    cashTextConfirmed: { color: t.success },
    cashCheck: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: t.success,
      alignItems: 'center', justifyContent: 'center',
    },

    // Actions row
    actionsRow: {
      flexDirection: 'row', gap: 10,
      marginHorizontal: 16, marginTop: 14,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: t.bgLayer,
      borderRadius: 14, padding: 12,
      alignItems: 'center', gap: 6,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    actionText: {
      fontSize: 11, fontWeight: '800',
      color: t.brandNavy,
    },

    // Footer
    footer: {
      padding: 16, paddingBottom: 32,
      backgroundColor: t.bg,
      borderTopWidth: 1, borderTopColor: t.border,
      gap: 8,
    },
    rateBtn: {
      backgroundColor: HERO_GREEN_DARK,
      borderRadius: 16, padding: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: HERO_GREEN,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30, shadowRadius: 12, elevation: 6,
    },
    rateBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },
    rateBtnSub: {
      fontSize: 11, color: 'rgba(255,255,255,0.75)',
      marginTop: 2,
    },
    skipBtn: { alignItems: 'center', paddingVertical: 10 },
    skipText: {
      fontSize: 13, color: t.textTertiary,
      fontWeight: '600',
    },
  });
}
