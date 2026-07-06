/**
 * BookingOptionsScreen — UI unificada del buscador de viajes
 *
 * Consume POST /search del transport-service (UnifiedSearchUseCase) y
 * presenta en una sola pantalla:
 *   - onDemandOptions    → ride-hailing inmediato (urbano, interurbano privado,
 *                          aeropuerto)
 *   - scheduledOptions   → carpooling (cupos en viajes programados)
 *   - alternativeSchedules → fallback proactivo cuando no hay cupo en el
 *                            horario exacto pedido
 *
 * Reemplaza progresivamente a SharedRideBookingScreen + PrivateRideBookingScreen,
 * que tienen pricing hardcoded client-side y catálogos divergentes. El nuevo
 * flujo confía en el backend para clasificación de ruta + precio + cupos.
 *
 * Params: pickup + destination obligatorios. Si no llegan, mostrá CTA para abrir
 * LocationPicker antes (caller responsibility — esta screen NO maneja el picker).
 *
 * Fase 1 (este commit): renderizar resultados + log de tap por opción.
 * Fase 2 (próximo commit): on tap → navegar a ConfirmRide o a una nueva pantalla
 * de reserva de asiento según onDemand vs scheduled.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useTheme, type ThemeTokens } from '../../theme';
import { hapticLight } from '../../utils/haptics';
import {
  transportAPI,
  type SearchRideResponse,
  type OnDemandOption,
  type ScheduledOption,
  type AlternativeSchedule,
} from '../../services/api';
import {
  buildConfirmRideFromOnDemand,
  buildSeatReservationParams,
} from './booking-options.builders';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export type BookingOptionsParams = {
  pickup: { latitude: number; longitude: number; address?: string };
  destination: { latitude: number; longitude: number; address?: string };
  /** 'immediate' (default) o 'scheduled'. Si scheduled, scheduledDateTime es
   *  obligatorio (la screen valida y muestra error si no llega). */
  temporalPreference?: 'immediate' | 'scheduled';
  /** ISO 8601. Requerido cuando temporalPreference='scheduled'. */
  scheduledDateTime?: string;
  /** Hint de vehículo cuando el caller ya tiene una preferencia. */
  vehicleType?: 'suv' | 'suv_xl' | 'van' | 'van_xl' | 'minibus' | 'bus';
};

export function BookingOptionsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<{ params: BookingOptionsParams }, 'params'>>();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const { pickup, destination, temporalPreference, scheduledDateTime, vehicleType } =
    route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchRideResponse | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transportAPI.searchUnified({
        pickup: { lat: pickup.latitude, lng: pickup.longitude, address: pickup.address },
        destination: {
          lat: destination.latitude,
          lng: destination.longitude,
          address: destination.address,
        },
        temporalPreference,
        scheduledDateTime,
        vehicleType,
      });
      setData(res.data);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response
          ?.data?.message ??
        (err as { message?: string })?.message ??
        'No se pudieron cargar las opciones de viaje';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [pickup, destination, temporalPreference, scheduledDateTime, vehicleType]);

  useEffect(() => {
    void fetchOptions();
  }, [fetchOptions]);

  /**
   * Fase 2: tap en opción on-demand → navega a ConfirmRide con todos los
   * datos necesarios. ConfirmRide se encarga del flow de payment + create
   * booking. El usuario puede ajustar paymentMethod ahí.
   */
  const handleOnDemand = useCallback(
    (opt: OnDemandOption) => {
      hapticLight();
      navigation.navigate(
        'ConfirmRide',
        buildConfirmRideFromOnDemand(opt, pickup, destination),
      );
    },
    [navigation, pickup, destination],
  );

  /**
   * Fase 2: tap en opción scheduled (carpool) → navega a la pantalla
   * intermedia ScheduledSeatReservationScreen para escoger # asientos +
   * frontSeat. Esa pantalla luego navega a ConfirmRide con los datos
   * normalizados, y ConfirmRide invoca POST /scheduled-trips/:id/reserve
   * antes del payment.
   */
  const handleScheduled = useCallback(
    (opt: ScheduledOption | AlternativeSchedule) => {
      hapticLight();
      navigation.navigate(
        'ScheduledSeatReservation',
        buildSeatReservationParams(opt, pickup, destination),
      );
    },
    [navigation, pickup, destination],
  );

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={tokens.brandNavy} />
        <Text style={styles.loadingText}>Buscando opciones…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={tokens.error} />
        <Text style={styles.errorTitle}>No pudimos buscar</Text>
        <Text style={styles.errorMsg}>{error ?? 'Respuesta vacía del servidor'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchOptions}>
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.linkBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { route: r, onDemandOptions, scheduledOptions, alternativeSchedules, notices } = data;
  const hasScheduled = (scheduledOptions?.length ?? 0) > 0;
  const hasAlternatives = (alternativeSchedules?.length ?? 0) > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header con ruta */}
      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <Ionicons name="ellipse" size={10} color={tokens.success} />
          <Text style={styles.routeLabel} numberOfLines={1}>
            {r.originLabel ?? pickup.address ?? 'Origen'}
          </Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeRow}>
          <Ionicons name="location" size={12} color={tokens.error} />
          <Text style={styles.routeLabel} numberOfLines={1}>
            {r.destinationLabel ?? destination.address ?? 'Destino'}
          </Text>
        </View>
        <View style={styles.routeMetaRow}>
          <Text style={styles.routeMeta}>
            {r.distanceKm.toFixed(1)} km · {r.estimatedDurationMinutes} min
          </Text>
          {r.isAirportCorridor && (
            <View style={styles.airportPill}>
              <Text style={styles.airportPillText}>aeropuerto</Text>
            </View>
          )}
          {r.isIntercity && !r.isAirportCorridor && (
            <View style={styles.airportPill}>
              <Text style={styles.airportPillText}>interurbano</Text>
            </View>
          )}
        </View>
      </View>

      {/* Notices */}
      {notices?.length > 0 && (
        <View style={styles.noticesCard}>
          {notices.map((n, i) => (
            <View key={i} style={styles.noticeRow}>
              <Ionicons name="information-circle-outline" size={16} color={tokens.brandYellow} />
              <Text style={styles.noticeText}>{n}</Text>
            </View>
          ))}
        </View>
      )}

      {/* On-demand options (ride-hailing) */}
      {onDemandOptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibles ahora</Text>
          {onDemandOptions.map((opt, idx) => (
            <TouchableOpacity
              key={`onDemand-${idx}`}
              style={styles.optionCard}
              onPress={() => handleOnDemand(opt)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={opt.serviceType === 'urban_ride' ? 'car-sport' : 'car'}
                  size={28}
                  color={tokens.brandNavy}
                />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>{opt.label}</Text>
                <Text style={styles.optionDesc} numberOfLines={2}>
                  {opt.description}
                </Text>
                <Text style={styles.optionEta}>ETA: {opt.estimatedEtaMinutes} min</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionPrice}>${opt.price.toFixed(2)}</Text>
                <Text style={styles.optionCurrency}>{opt.currency}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Scheduled options (carpool) */}
      {hasScheduled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cupos en viajes compartidos</Text>
          {scheduledOptions!.map((opt) => (
            <TouchableOpacity
              key={`scheduled-${opt.scheduledTripId}`}
              style={styles.optionCard}
              onPress={() => handleScheduled(opt)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="people" size={28} color={tokens.brandYellow} />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>{opt.routeLabel}</Text>
                <Text style={styles.optionDesc}>
                  Sale: {new Date(opt.departureTime).toLocaleString('es-EC', {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.optionEta}>
                  {opt.availableSeats} cupo{opt.availableSeats !== 1 ? 's' : ''} disponible
                  {opt.availableSeats !== 1 ? 's' : ''}
                  {opt.vehicleModel ? ` · ${opt.vehicleModel}` : ''}
                </Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionPrice}>${opt.pricePerSeat.toFixed(2)}</Text>
                <Text style={styles.optionCurrency}>por asiento</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Alternative schedules (fallback) */}
      {!hasScheduled && hasAlternatives && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sugerencias cercanas</Text>
          <Text style={styles.sectionSub}>
            No hay cupo en tu horario exacto. Estos viajes salen cerca:
          </Text>
          {alternativeSchedules!.map((opt) => (
            <TouchableOpacity
              key={`alt-${opt.scheduledTripId}`}
              style={[styles.optionCard, styles.optionCardAlt]}
              onPress={() => handleScheduled(opt)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="time" size={28} color={tokens.textSecondary} />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>{opt.routeLabel}</Text>
                <Text style={styles.optionDesc}>
                  {new Date(opt.departureTime).toLocaleString('es-EC', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.optionEta}>
                  {opt.availableSeats} cupo{opt.availableSeats !== 1 ? 's' : ''} ·{' '}
                  {opt.recommendationReason === 'same_day_different_time'
                    ? 'mismo día'
                    : 'día cercano'}
                </Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionPrice}>${opt.pricePerSeat.toFixed(2)}</Text>
                <Text style={styles.optionCurrency}>por asiento</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty state */}
      {onDemandOptions.length === 0 && !hasScheduled && !hasAlternatives && (
        <View style={styles.emptyCard}>
          <Ionicons name="map-outline" size={48} color={tokens.textSecondary} />
          <Text style={styles.emptyTitle}>Sin opciones disponibles</Text>
          <Text style={styles.emptyMsg}>
            No encontramos viajes para esta ruta y horario. Prueba con otro destino o
            cambia la fecha.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 32,
    },
    centerContainer: {
      flex: 1,
      backgroundColor: t.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: t.textSecondary,
    },
    errorTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: '600',
      color: t.textPrimary,
    },
    errorMsg: {
      marginTop: 8,
      fontSize: 14,
      color: t.textSecondary,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: t.brandNavy,
      borderRadius: 8,
    },
    retryBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    linkBtn: {
      marginTop: 12,
      padding: 8,
    },
    linkBtnText: {
      color: t.brandYellow,
      fontSize: 14,
    },
    // Route card
    routeCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: t.border,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    routeLabel: {
      flex: 1,
      fontSize: 14,
      color: t.textPrimary,
      fontWeight: '500',
    },
    routeDivider: {
      width: 1,
      height: 12,
      backgroundColor: t.border,
      marginLeft: 4,
      marginVertical: 4,
    },
    routeMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    routeMeta: {
      flex: 1,
      fontSize: 12,
      color: t.textSecondary,
    },
    airportPill: {
      backgroundColor: t.brandNavy,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    airportPillText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    // Notices
    noticesCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 10,
      padding: 10,
      marginBottom: 14,
      gap: 6,
    },
    noticeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 16,
    },
    // Sections
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 10,
    },
    sectionSub: {
      fontSize: 13,
      color: t.textSecondary,
      marginBottom: 10,
      marginTop: -4,
    },
    // Option card
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.bgLayer,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: isDark ? 1 : 0,
      borderColor: t.border,
    },
    optionCardAlt: {
      opacity: 0.85,
    },
    optionLeft: {
      width: 44,
      alignItems: 'center',
    },
    optionBody: {
      flex: 1,
      paddingHorizontal: 10,
    },
    optionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: t.textPrimary,
    },
    optionDesc: {
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 2,
    },
    optionEta: {
      fontSize: 11,
      color: t.textTertiary,
      marginTop: 4,
    },
    optionRight: {
      alignItems: 'flex-end',
      minWidth: 70,
    },
    optionPrice: {
      fontSize: 17,
      fontWeight: '700',
      color: t.brandNavy,
    },
    optionCurrency: {
      fontSize: 10,
      color: t.textTertiary,
      marginTop: 2,
    },
    // Empty
    emptyCard: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: t.bgLayer,
      borderRadius: 12,
      marginTop: 20,
    },
    emptyTitle: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
    },
    emptyMsg: {
      marginTop: 8,
      fontSize: 13,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}
