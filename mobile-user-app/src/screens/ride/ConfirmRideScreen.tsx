/**
 * ConfirmRideScreen — Confirmación y Pago de Viaje (Mockup #9).
 *
 * Pantalla unificada para Compartido y Privado.
 *
 * Flujo:
 *  1. Resumen del viaje (ruta, hora, vehículo, tier, asientos)
 *  2. Selección de asiento (solo Compartido cuando seats=1: trasero/delantero +$3)
 *  3. Método de pago: Efectivo (único activo) · Datafast (próximamente) · DeUna (próximamente)
 *  4. Desglose de precio transparente
 *  5. CTA sticky bottom "Pagar $X.XX"
 *
 * Theme adaptativo light + dark.
 *
 * REFIT 2026-05-23:
 *   - Datafast + DeUna ahora muestran badge "Próximamente" DESHABILITADOS
 *     en lugar de stub silencioso (Alert "próximamente" después del tap)
 *   - Efectivo pre-seleccionado por default (único método funcional hoy)
 *   - Respeta params.seats + params.tier del booking previo
 *   - CTA sticky bottom (antes al final del scroll)
 *   - Theme adaptativo (antes hardcoded NAVY/YELLOW/GREEN/RED/PURPLE)
 *
 * TODO declarado:
 *   - Wire frontend a payment-service Datafast (POST /payments/datafast/session)
 *     + WebBrowser flow + webhook callback. El BACKEND ya lo tiene
 *     implementado (DatafastGateway.ts), falta el frontend pegarse a la API.
 *   - Wire DeUna QR (mismo patrón)
 *   - Cuando wired, remover badge "Próximamente" y el disabled state.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useAuthStore } from '@store/useAuthStore';
import { transportAPI, paymentAPI } from '../../services/api';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../utils/haptics';
import { useTheme, type ThemeTokens } from '../../theme';
import type { Category } from '../../catalog';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type ConfirmRideParams = {
  type:           'compartido' | 'privado';
  tripId?:        string;
  origin:         string;
  originCoords?:  { lat: number; lng: number };
  destination:    string;
  destCoords?:    { lat: number; lng: number };
  departureTime?: string;
  date?:          string;
  vehicle:        string;
  vehicleId?:     string;
  pricePerSeat?:  number;   // Compartido
  totalPrice?:    number;   // Privado (o total Compartido seats × price)
  frontSeat?:     boolean;
  zone?:          string;
  seats?:         number;
  category?:      string;
  tier?:          Category;  // 'confort' | 'premium' | 'empresa'
  categoryId?:    Category;
  capacity?:      number;
  /**
   * IDs FARES normalizados — solo aplica a 'compartido' con tripId set.
   * Necesarios para POST /scheduled-trips/:id/reserve.
   * Vienen del /search response (ScheduledOption.originCity/destCity).
   */
  originCity?:    string;
  destCity?:      string;
};

type PaymentMethodId = 'datafast' | 'deuna' | 'cash';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ── Métodos de pago.
// Wire Datafast + DeUna (task #46 completed 2026-05-23): backend payment-
// service expone POST /payments/ec/intent. Si el gateway no tiene env
// vars configuradas, devuelve 503 y mobile cae automático a Efectivo.
const PAYMENT_METHODS: ReadonlyArray<{
  id:      PaymentMethodId;
  label:   string;
  sub:     string;
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  enabled: boolean;
}> = [
  {
    id:      'cash',
    label:   'Efectivo',
    sub:     'Pagas al conductor cuando termina el viaje',
    icon:    'cash-outline',
    enabled: true,
  },
  {
    id:      'datafast',
    label:   'Tarjeta · Datafast',
    sub:     'Visa · Mastercard · Amex · Diners',
    icon:    'card-outline',
    enabled: false,  // pasarela no integrada → "Próximamente" (efectivo es el default)
  },
  {
    id:      'deuna',
    label:   'QR · De Una',
    sub:     'Transferencia instantánea Banco Pichincha',
    icon:    'qr-code-outline',
    enabled: false,  // pasarela no integrada → "Próximamente" (efectivo es el default)
  },
];

const DEFAULT_PAYMENT: PaymentMethodId = 'cash';

// ── Component ────────────────────────────────────────────────────────────────
export function ConfirmRideScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: ConfirmRideParams }, 'params'>>();
  const { user }   = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const params = route.params;
  const isCompartido = params.type === 'compartido';
  const seats = params.seats ?? 1;
  const tier  = params.tier ?? params.categoryId ?? 'confort';

  // ── State ──────────────────────────────────────────────────
  // frontSeat solo se aplica si compartido + 1 asiento (no se vende delantero
  // a grupos). El booking screen ya lo asegura, pero defensivo.
  const [frontSeat, setFrontSeat] = useState((params.frontSeat ?? false) && isCompartido && seats === 1);
  const [payMethod, setPayMethod] = useState<PaymentMethodId>(DEFAULT_PAYMENT);
  const [loading,   setLoading]   = useState(false);

  // ── Precio ────────────────────────────────────────────────
  // FUENTE DEL PRECIO: el backend (libs/pricing). El mobile NO calcula tarifas
  // localmente. Los flujos que pasan por /search (BookingOptions,
  // ScheduledSeatReservation) traen pricePerSeat/totalPrice ya autoritativos
  // del backend → los mostramos. El flujo legacy (SharedRideBooking) NO trae
  // precio: en ese caso NO inventamos un número; el monto lo confirma el
  // backend al crear el viaje (RideResponseDto.fare) y se muestra recién ahí.
  const clientFare: number | null = isCompartido
    ? (params.pricePerSeat != null ? params.pricePerSeat * seats : null)
    : (params.totalPrice ?? null);

  // Extra de asiento delantero solo si el usuario lo cambia ACÁ y ya teníamos
  // una tarifa del backend para sumarle (sin tarifa base no mostramos número).
  const seatExtra = (clientFare != null && frontSeat && !(params.frontSeat ?? false)) ? 3 : 0;

  // IVA: transporte de pasajeros está exento en Ecuador (Art. 56 LRTI).
  // `null` = todavía no conocemos el monto (lo da el backend al reservar).
  const totalAmount: number | null = clientFare != null ? clientFare + seatExtra : null;
  // Precio que efectivamente devolvió el backend al crear el viaje. Se llena
  // tras requestRide y es el monto autoritativo a cobrar.
  const [confirmedFare, setConfirmedFare] = useState<number | null>(null);
  // Lo que mostramos al usuario: si el backend ya confirmó, ese; si no, el
  // estimado del backend que vino en params; si tampoco, null (= "se confirma").
  const displayAmount: number | null = confirmedFare ?? totalAmount;

  const dateLabel = useMemo(() => {
    if (!params.date || params.date === 'today') return 'Hoy';
    if (params.date === 'tomorrow') return 'Mañana';
    try {
      return new Date(params.date).toLocaleDateString('es-EC', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
    } catch { return 'Hoy'; }
  }, [params.date]);

  const tierLabel = useMemo(() => {
    if (tier === 'premium') return 'Premium';
    if (tier === 'empresa') return 'Empresa';
    return 'Confort';
  }, [tier]);

  // ── Handlers ──────────────────────────────────────────────
  const getOriginCoords = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (params.originCoords) return params.originCoords;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch { return null; }
  }, [params.originCoords]);

  /**
   * Si el booking es 'compartido' con tripId set, reservamos el asiento en
   * el ScheduledTrip ANTES de crear ride/payment. Si falla (sin cupo →
   * 409), abortamos el flow y mostramos error.
   *
   * Si type='privado' o no tiene tripId, retorna ok sin hacer nada.
   *
   * Necesita params.originCity + params.destCity (los pasa BookingOptions
   * desde el response /search).
   */
  const reserveScheduledIfNeeded = useCallback(
    async (): Promise<{ ok: boolean; error?: string }> => {
      if (params.type !== 'compartido' || !params.tripId) {
        return { ok: true };
      }
      if (!params.originCity || !params.destCity) {
        // Sin cities normalizadas no podemos reservar. Quizá vino de un
        // entry-point legacy (SharedRideBookingScreen) que aún no pasa
        // originCity/destCity. Skip + warn — el flujo continúa como
        // ride normal (el backend del scheduled no se decrementa).
        return { ok: true };
      }
      try {
        const res = await transportAPI.reserveScheduledTrip(params.tripId, {
          originCity: params.originCity,
          destCity: params.destCity,
          seats: seats,
          isGroup: seats > 1,
          wantsFrontExclusive: frontSeat,
        });
        // Backend retorna {bookingId, totalPrice, ...}. No es crítico
        // capturar el bookingId aquí — el flow continúa al ride/payment.
        return { ok: true };
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message || 'Error reservando asiento';
        if (status === 409) {
          return { ok: false, error: 'Ya no quedan cupos en ese viaje. Vuelve a buscar opciones.' };
        }
        return { ok: false, error: msg };
      }
    },
    [params.type, params.tripId, params.originCity, params.destCity, seats, frontSeat],
  );

  const handleCashBooking = useCallback(async () => {
    if (!user?.id) {
      hapticError();
      Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para reservar.');
      return;
    }

    setLoading(true);
    try {
      const destCoords = params.destCoords;
      if (!destCoords) {
        Alert.alert(
          'Destino sin ubicación',
          'Vuelve atrás y selecciona el destino en el mapa para continuar.',
        );
        return;
      }

      const originCoords = await getOriginCoords();
      if (!originCoords) {
        Alert.alert(
          'Ubicación requerida',
          'Necesitamos tu ubicación actual para asignar un conductor. Concede permiso de ubicación e intenta de nuevo.',
        );
        return;
      }

      // Reserva del asiento en ScheduledTrip si aplica (Mobile #60 gap A).
      // Si falla (sin cupo), abortamos antes de crear ride.
      const reservation = await reserveScheduledIfNeeded();
      if (!reservation.ok) {
        hapticError();
        Alert.alert('No se pudo reservar', reservation.error ?? 'Intenta de nuevo');
        return;
      }

      const response = await transportAPI.requestRide({
        userId: user.id,
        origin: {
          address:   params.origin,
          latitude:  originCoords.lat,
          longitude: originCoords.lng,
        },
        destination: {
          address:   params.destination,
          latitude:  destCoords.lat,
          longitude: destCoords.lng,
        },
        // El backend calcula y cobra el fare (libs/pricing); este campo no
        // lo fija. Mandamos el estimado del backend si lo tenemos, o 0.
        price: { amount: totalAmount ?? 0, currency: 'USD' },
      });

      hapticSuccess();
      // Aceptamos ambos shapes del response — algunos endpoints devuelven
      // `rideId` (RideResponseDto) y otros `id` (mapper interno del repo).
      const rideData = response.data as {
        rideId?: string; id?: string;
        fare?: { estimatedTotal?: number };
      };
      const rideId = rideData?.rideId || rideData?.id;
      // Monto AUTORITATIVO del backend. Es el precio real a cobrar.
      const backendFare = rideData?.fare?.estimatedTotal ?? null;
      if (backendFare != null) setConfirmedFare(backendFare);
      const finalAmount = backendFare ?? totalAmount;

      if (rideId) {
        navigation.replace('ActiveRide' as never, {
          rideId,
          origin: {
            latitude:  originCoords.lat,
            longitude: originCoords.lng,
            address:   params.origin,
          },
          destination: {
            latitude:  destCoords.lat,
            longitude: destCoords.lng,
            address:   params.destination,
          },
          vehicleType: params.vehicle,
          tripMode:    params.type,
          category:    params.zone ?? '',
          price:       finalAmount ?? undefined,
        } as never);
      } else {
        // Fallback defensivo — backend no devolvió ni rideId ni id.
        // No bloquees al usuario en el mapa: ofrecé 2 salidas claras.
        const payLine = finalAmount != null
          ? `Paga $${finalAmount.toFixed(2)} al terminar el viaje.`
          : 'Going te confirma el monto a pagar al asignar tu conductora o conductor.';
        Alert.alert(
          '¡Reserva confirmada!',
          `Tu viaje de ${params.origin} a ${params.destination} está reservado.\n\n${payLine}`,
          [
            { text: 'Cerrar', style: 'cancel', onPress: () => navigation.goBack() },
            { text: 'Ver mis viajes', onPress: () => (navigation.navigate as any)('Historial') },
          ],
        );
      }
    } catch (err: any) {
      hapticError();
      const msg = err?.response?.data?.message || err?.message || 'Intenta de nuevo.';
      Alert.alert('Error', `No se pudo completar la reserva: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [user, params, totalAmount, getOriginCoords, navigation]);

  /**
   * Crea el ride + intent de pago digital. Flujo:
   *   1. Reservar el ride en transport-service (mismo flujo que cash)
   *   2. Crear payment intent en payment-service (POST /payments/ec/intent)
   *   3. Abrir el checkoutUrl (Datafast) o paymentLink (DeUna) con Linking
   *   4. Después de pagar, el webhook confirma y mobile pollea / push notif
   *
   * Si el gateway no está configurado (503), Alert con opción de cambiar
   * a Efectivo en lugar de bloquear al usuario.
   */
  const handleDigitalPayment = useCallback(async (
    method: 'datafast' | 'deuna',
  ) => {
    if (!user?.id) {
      hapticError();
      Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para reservar.');
      return;
    }
    if (!params.destCoords) {
      Alert.alert(
        'Destino sin ubicación',
        'Vuelve atrás y selecciona el destino en el mapa para continuar.',
      );
      return;
    }
    const originCoords = await getOriginCoords();
    if (!originCoords) {
      Alert.alert(
        'Ubicación requerida',
        'Necesitamos tu ubicación actual. Concede permiso de ubicación e intenta de nuevo.',
      );
      return;
    }

    setLoading(true);
    try {
      // 0. Reserva del asiento en ScheduledTrip si aplica (gap A).
      //    Antes de crear payment intent — si no hay cupo, abortamos.
      const reservation = await reserveScheduledIfNeeded();
      if (!reservation.ok) {
        hapticError();
        Alert.alert('No se pudo reservar', reservation.error ?? 'Intenta de nuevo');
        return;
      }

      // 1. Reservar ride. El backend devuelve el fare autoritativo (libs/pricing).
      const rideResp = await transportAPI.requestRide({
        userId: user.id,
        origin: {
          address:   params.origin,
          latitude:  originCoords.lat,
          longitude: originCoords.lng,
        },
        destination: {
          address:   params.destination,
          latitude:  params.destCoords.lat,
          longitude: params.destCoords.lng,
        },
        // El backend calcula y cobra el fare; este campo no lo fija.
        price: { amount: totalAmount ?? 0, currency: 'USD' },
      });
      const rideData = rideResp.data as {
        rideId?: string;
        fare?: { estimatedTotal?: number };
      };
      const rideId = rideData?.rideId;
      if (!rideId) {
        throw new Error('Reserva creada pero sin rideId — revisa más tarde.');
      }
      // Monto a cobrar = el que computó el backend (autoritativo). Si no vino,
      // caemos al estimado del backend que traíamos en params.
      const backendFare = rideData?.fare?.estimatedTotal ?? null;
      if (backendFare != null) setConfirmedFare(backendFare);
      const chargeAmount = backendFare ?? totalAmount;
      if (chargeAmount == null) {
        throw new Error('No pudimos obtener el monto a cobrar. Probá con pago en efectivo.');
      }

      // 2. Crear intent digital por el monto autoritativo del backend.
      const intentResp = await paymentAPI.createEcuadorIntent({
        method,
        amount: chargeAmount,
        metadata: { tripId: rideId, userId: user.id },
      });
      const { checkoutUrl, paymentLink } = intentResp.data;
      const url = method === 'datafast' ? checkoutUrl : paymentLink;
      if (!url) {
        throw new Error(`Backend no devolvió URL para ${method}`);
      }

      hapticSuccess();

      // 3. Abrir checkout/QR link. Para Datafast es el OPPWA hosted checkout
      //    (carrito web). Para DeUna es el paymentLink (QR o link de pago).
      //    TODO: cuando integremos expo-web-browser y deep links, el flow
      //    será modal in-app + auto-return on completion.
      const opened = await Linking.canOpenURL(url);
      if (opened) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'No se pudo abrir el pago',
          `URL: ${url}\n\nCopiala y abrila en tu navegador, o paga en efectivo.`,
        );
        return;
      }

      // 4. Mientras el webhook confirma, navegar al ride activo. El
      //    ActiveRide socket recibirá ride:payment_confirmed cuando llegue.
      navigation.replace('ActiveRide' as never, {
        rideId,
        origin: {
          latitude:  originCoords.lat,
          longitude: originCoords.lng,
          address:   params.origin,
        },
        destination: {
          latitude:  params.destCoords!.lat,
          longitude: params.destCoords!.lng,
          address:   params.destination,
        },
        vehicleType: params.vehicle,
        tripMode:    params.type,
        category:    params.zone ?? '',
        price:       chargeAmount,
        paymentMethod: method,
      } as never);
    } catch (err: any) {
      hapticError();
      const status = err?.response?.status;
      if (status === 503) {
        // Gateway no configurado — sugerir efectivo
        Alert.alert(
          'Pago digital no disponible',
          `${method === 'datafast' ? 'Datafast' : 'De Una'} está temporalmente no disponible. ¿Reservar con pago en efectivo?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Pagar en efectivo',
              onPress: () => {
                setPayMethod('cash');
                handleCashBooking();
              },
            },
          ],
        );
        return;
      }
      const msg = err?.response?.data?.message || err?.message || 'Intenta de nuevo.';
      Alert.alert('Error', `No se pudo completar la reserva: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [user, params, totalAmount, getOriginCoords, navigation, handleCashBooking]);

  const handleConfirm = useCallback(() => {
    hapticMedium();
    if (payMethod === 'cash') {
      handleCashBooking();
    } else if (payMethod === 'datafast' || payMethod === 'deuna') {
      handleDigitalPayment(payMethod);
    } else {
      hapticError();
      Alert.alert('Método desconocido', `Método ${payMethod} no soportado.`);
    }
  }, [payMethod, handleCashBooking, handleDigitalPayment]);

  const handleSelectPayment = useCallback((id: PaymentMethodId) => {
    const method = PAYMENT_METHODS.find(m => m.id === id);
    if (!method?.enabled) {
      hapticError();
      // No mostramos Alert pesado — el badge "Próximamente" ya comunica visualmente
      return;
    }
    setPayMethod(id);
    hapticLight();
  }, []);

  // ── Render ────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={tokens.textOnNavy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar viaje</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Resumen del viaje ───────────────────────────────── */}
        <View style={styles.tripCard}>
          <View style={styles.tripCardHeader}>
            <Text style={styles.tripCardTitle}>Resumen del viaje</Text>
            <View style={[styles.typeBadge, isCompartido ? styles.badgeShared : styles.badgePrivate]}>
              <Text style={[styles.typeBadgeText, isCompartido ? styles.badgeSharedText : styles.badgePrivateText]}>
                {isCompartido ? 'Compartido' : 'Privado'}
              </Text>
            </View>
          </View>

          {/* Ruta */}
          <View style={styles.routeSection}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: tokens.brandNavy }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>ORIGEN</Text>
                <Text style={styles.routeCity}>{params.origin}</Text>
              </View>
              {params.departureTime && (
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>{params.departureTime}</Text>
                </View>
              )}
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.routeDotDest]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>DESTINO</Text>
                <Text style={styles.routeCity}>{params.destination}</Text>
                <Text style={styles.routeDate}>{dateLabel}</Text>
              </View>
            </View>
          </View>

          {/* Detalles meta */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="car-sport-outline" size={14} color={tokens.textTertiary} />
              <Text style={styles.detailText}>{params.vehicle}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name={tier === 'premium' ? 'diamond-outline' : tier === 'empresa' ? 'business-outline' : 'shield-checkmark-outline'}
                size={14}
                color={tokens.textTertiary}
              />
              <Text style={styles.detailText}>{tierLabel}</Text>
            </View>
            {isCompartido ? (
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={14} color={tokens.textTertiary} />
                <Text style={styles.detailText}>{seats} asiento{seats !== 1 ? 's' : ''}</Text>
              </View>
            ) : params.capacity ? (
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={14} color={tokens.textTertiary} />
                <Text style={styles.detailText}>Hasta {params.capacity} pax</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Asiento (Compartido + 1 asiento solamente) ──────── */}
        {isCompartido && seats === 1 && (
          <View style={styles.section}>
            <Text style={styles.secTitle}>Selección de asiento</Text>
            <View style={styles.seatRow}>
              <TouchableOpacity
                style={[styles.seatOpt, !frontSeat && styles.seatOptActive]}
                onPress={() => { setFrontSeat(false); hapticLight(); }}
                activeOpacity={0.85}
              >
                {!frontSeat && (
                  <View style={styles.seatCheck}>
                    <Ionicons name="checkmark" size={11} color={tokens.textOnNavy} />
                  </View>
                )}
                <Ionicons name="person-outline" size={26} color={!frontSeat ? tokens.brandNavy : tokens.textTertiary} />
                <Text style={[styles.seatName, !frontSeat && styles.seatNameActive]}>Trasero</Text>
                <Text style={styles.seatPrice}>Precio base</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.seatOpt, frontSeat && styles.seatOptActive]}
                onPress={() => { setFrontSeat(true); hapticLight(); }}
                activeOpacity={0.85}
              >
                {frontSeat && (
                  <View style={styles.seatCheck}>
                    <Ionicons name="checkmark" size={11} color={tokens.textOnNavy} />
                  </View>
                )}
                <Ionicons name="star-outline" size={26} color={frontSeat ? tokens.brandNavy : tokens.textTertiary} />
                <Text style={[styles.seatName, frontSeat && styles.seatNameActive]}>Delantero</Text>
                <Text style={[styles.seatPrice, frontSeat && styles.seatPriceActive]}>+$3.00</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Método de pago ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Método de pago</Text>
          {PAYMENT_METHODS.map(m => {
            const active = payMethod === m.id;
            const dim    = !m.enabled;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.payCard,
                  active && styles.payCardActive,
                  dim && styles.payCardDim,
                ]}
                onPress={() => handleSelectPayment(m.id)}
                activeOpacity={dim ? 1 : 0.85}
              >
                <View style={[styles.payIcon, active && styles.payIconActive]}>
                  <Ionicons
                    name={m.icon}
                    size={22}
                    color={dim ? tokens.textTertiary : active ? tokens.brandNavy : tokens.textPrimary}
                  />
                </View>
                <View style={styles.payInfo}>
                  <View style={styles.payTitleRow}>
                    <Text style={[styles.payLabel, dim && styles.payLabelDim]}>{m.label}</Text>
                    {!m.enabled && (
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonBadgeText}>Próximamente</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.paySub, dim && styles.paySubDim]}>{m.sub}</Text>
                </View>
                <View style={[styles.payRadio, active && styles.payRadioActive]}>
                  {active && <View style={styles.payDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
          {payMethod === 'cash' && (
            <View style={styles.cashNote}>
              <Ionicons name="information-circle-outline" size={14} color={tokens.warning} />
              <Text style={styles.cashNoteText}>
                El conductor confirmará el pago en efectivo al finalizar el viaje.
              </Text>
            </View>
          )}
        </View>

        {/* ── Desglose de precio ──────────────────────────────── */}
        {/* El monto sale del backend (libs/pricing). Si todavía no lo
            conocemos (flujo sin cotización previa), mostramos el aviso de
            que Going lo confirma — nunca un número inventado localmente. */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Precio</Text>
          <View style={styles.priceBox}>
            {displayAmount != null ? (
              <>
                {isCompartido && params.pricePerSeat != null ? (
                  <>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLbl}>Asiento ({tierLabel})</Text>
                      <Text style={styles.priceVal}>${params.pricePerSeat.toFixed(2)}</Text>
                    </View>
                    {seats > 1 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLbl}>× {seats} asientos</Text>
                        <Text style={styles.priceVal}>${(params.pricePerSeat * seats).toFixed(2)}</Text>
                      </View>
                    )}
                    {frontSeat && seats === 1 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLbl}>Asiento delantero</Text>
                        <Text style={styles.priceVal}>+$3.00</Text>
                      </View>
                    )}
                  </>
                ) : !isCompartido && params.totalPrice != null ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLbl}>Vehículo {params.vehicle} ({tierLabel})</Text>
                    <Text style={styles.priceVal}>${params.totalPrice.toFixed(2)}</Text>
                  </View>
                ) : null}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLbl}>IVA</Text>
                  <Text style={[styles.priceVal, { color: tokens.success }]}>exento</Text>
                </View>
                <View style={[styles.priceRow, styles.priceTotalRow]}>
                  <Text style={styles.priceTotalLbl}>Total</Text>
                  <Text style={styles.priceTotalVal}>${displayAmount.toFixed(2)}</Text>
                </View>
                <Text style={styles.priceNote}>
                  Transporte de pasajeros exento de IVA (Art. 56 LRTI).
                </Text>
              </>
            ) : (
              <Text style={styles.priceNote}>
                Going calcula el monto exacto al confirmar tu viaje, según ruta,
                horario y tipo de servicio. Vas a ver el total antes de pagar.
              </Text>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── CTA sticky bottom ────────────────────────────────── */}
      <View style={styles.ctaBar}>
        <View style={styles.ctaTotal}>
          <Text style={styles.ctaTotalLabel}>A pagar</Text>
          {displayAmount != null ? (
            <Text style={styles.ctaTotalValue}>${displayAmount.toFixed(2)}</Text>
          ) : (
            <Text style={styles.ctaTotalHint}>Lo confirma Going</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color={tokens.textOnYellow} />
          ) : (
            <>
              <Text style={styles.ctaBtnText}>
                {payMethod === 'cash' ? 'Reservar' : `Pagar`}
              </Text>
              <Ionicons name="lock-closed" size={14} color={tokens.textOnYellow} />
            </>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // Header
    header: {
      backgroundColor: t.brandNavy,
      paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      fontSize: 17, fontWeight: '900',
      color: t.textOnNavy,
      letterSpacing: -0.2,
    },

    // Scroll
    scroll: { flex: 1 },

    // Trip summary card
    tripCard: {
      marginHorizontal: 16, marginTop: 16,
      backgroundColor: t.bgLayer,
      borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    tripCardHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 14,
    },
    tripCardTitle: { fontSize: 13, fontWeight: '900', color: t.textPrimary, letterSpacing: -0.2 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeShared: { backgroundColor: t.brandYellow },
    badgeSharedText: { color: t.textOnYellow, fontWeight: '900' },
    badgePrivate: { backgroundColor: t.brandNavy },
    badgePrivateText: { color: t.textOnNavy, fontWeight: '900' },
    typeBadgeText: { fontSize: 10, letterSpacing: 0.5 },

    // Route
    routeSection: { gap: 4 },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    routeDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    routeDotDest: {
      backgroundColor: 'transparent',
      borderWidth: 2, borderColor: t.textTertiary,
    },
    routeInfo: { flex: 1 },
    routeLabel: { fontSize: 9, color: t.textTertiary, fontWeight: '700', letterSpacing: 0.5 },
    routeCity: { fontSize: 14, fontWeight: '800', color: t.textPrimary, marginTop: 1 },
    routeDate: { fontSize: 11, color: t.textTertiary, marginTop: 2, textTransform: 'capitalize' },
    routeLine: {
      width: 2, height: 18, backgroundColor: t.border, marginLeft: 4,
    },
    timeBadge: {
      backgroundColor: `${t.brandNavy}14`,
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    },
    timeBadgeText: { fontSize: 12, fontWeight: '900', color: t.brandNavy },

    // Details meta
    detailsRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 14,
      marginTop: 16, paddingTop: 14,
      borderTopWidth: 1, borderTopColor: t.border,
    },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { fontSize: 12, color: t.textSecondary, fontWeight: '600' },

    // Section common
    section: { paddingHorizontal: 16, paddingTop: 22 },
    secTitle: {
      fontSize: 11, fontWeight: '800', color: t.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
    },

    // Seat row
    seatRow: { flexDirection: 'row', gap: 10 },
    seatOpt: {
      flex: 1,
      backgroundColor: t.bgLayer, borderRadius: 14, padding: 14,
      alignItems: 'center', gap: 6,
      borderWidth: 2, borderColor: t.border,
      position: 'relative',
    },
    seatOptActive: {
      borderColor: t.brandNavy,
      backgroundColor: `${t.brandNavy}08`,
    },
    seatCheck: {
      position: 'absolute', top: 8, right: 8,
      width: 18, height: 18, borderRadius: 9,
      backgroundColor: t.brandNavy,
      alignItems: 'center', justifyContent: 'center',
    },
    seatName: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    seatNameActive: { color: t.brandNavy },
    seatPrice: { fontSize: 11, color: t.textTertiary, fontWeight: '600' },
    seatPriceActive: { color: t.brandNavy, fontWeight: '800' },

    // Payment card
    payCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: t.bgLayer,
      borderWidth: 1.5, borderColor: t.border,
      borderRadius: 14, padding: 14, marginBottom: 10,
    },
    payCardActive: {
      borderColor: t.brandNavy,
      backgroundColor: `${t.brandNavy}08`,
    },
    payCardDim: { opacity: 0.6 },
    payIcon: {
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: t.glass,
      alignItems: 'center', justifyContent: 'center',
    },
    payIconActive: { backgroundColor: `${t.brandNavy}14` },
    payInfo: { flex: 1 },
    payTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    payLabel: { fontSize: 14, fontWeight: '800', color: t.textPrimary },
    payLabelDim: { color: t.textSecondary },
    paySub: { fontSize: 11, color: t.textTertiary, marginTop: 2 },
    paySubDim: {},
    soonBadge: {
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    },
    soonBadgeText: {
      fontSize: 9, fontWeight: '800',
      color: t.textTertiary, letterSpacing: 0.3,
    },
    payRadio: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2, borderColor: t.border,
      alignItems: 'center', justifyContent: 'center',
    },
    payRadioActive: { borderColor: t.brandNavy },
    payDot: {
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: t.brandNavy,
    },
    cashNote: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 6,
      backgroundColor: `${t.warning}10`,
      borderRadius: 10, padding: 10, marginTop: 4,
    },
    cashNoteText: {
      flex: 1, fontSize: 11,
      color: t.textSecondary, lineHeight: 16,
    },

    // Price box
    priceBox: {
      backgroundColor: t.bgLayer, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: t.border,
    },
    priceRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 8,
    },
    priceLbl: { fontSize: 12, color: t.textSecondary },
    priceVal: { fontSize: 13, fontWeight: '800', color: t.textPrimary },
    priceTotalRow: {
      paddingTop: 12, marginTop: 4,
      borderTopWidth: 1, borderTopColor: t.border, marginBottom: 0,
    },
    priceTotalLbl: { fontSize: 14, fontWeight: '900', color: t.textPrimary },
    priceTotalVal: { fontSize: 22, fontWeight: '900', color: t.brandNavy, letterSpacing: -0.5 },
    priceNote: {
      fontSize: 10, color: t.textTertiary,
      marginTop: 10, fontStyle: 'italic', lineHeight: 14,
    },

    // CTA sticky bottom
    ctaBar: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
      backgroundColor: t.bg,
      borderTopWidth: 1, borderTopColor: t.border,
    },
    ctaTotal: { flex: 1 },
    ctaTotalLabel: {
      fontSize: 10, fontWeight: '700', color: t.textTertiary,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    ctaTotalValue: {
      fontSize: 22, fontWeight: '900', color: t.textPrimary,
      marginTop: 2, letterSpacing: -0.5,
    },
    ctaTotalHint: {
      fontSize: 13, fontWeight: '700', color: t.textSecondary,
      marginTop: 2,
    },
    ctaBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: t.brandYellow,
      paddingHorizontal: 22, paddingVertical: 14,
      borderRadius: 14,
      shadowColor: t.brandYellowDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    },
    ctaBtnText: {
      fontSize: 15, fontWeight: '900',
      color: t.textOnYellow, letterSpacing: 0.3,
    },
  });
}
