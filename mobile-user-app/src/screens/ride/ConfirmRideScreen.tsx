/**
 * ConfirmRideScreen — Confirmación y Pago de Viaje
 *
 * Pantalla unificada para Compartido y Privado.
 * Flujo:
 *  1. Resumen del viaje (ruta, hora, vehículo)
 *  2. Selección de asiento (solo Compartido: trasero/delantero +$3)
 *  3. Método de pago: Tarjeta (Datafast) / QR DeUna / Efectivo
 *  4. Desglose de precio
 *  5. Confirmar y pagar → navega a ActiveRide o espera confirmación
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { transportAPI } from '../../services/api';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../utils/haptics';

// ── Colores ───────────────────────────────────────────────────────────────────
const NAVY    = '#0033A0';
const YELLOW  = '#FFCD00';
const GREEN   = '#059669';
const RED     = '#C0101A';
const PURPLE  = '#7C3AED';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type ConfirmRideParams = {
  type:           'compartido' | 'privado';
  tripId?:        string;
  origin:         string;
  destination:    string;
  departureTime?: string;
  date?:          string;
  vehicle:        string;
  vehicleId?:     string;
  pricePerSeat?:  number;   // Compartido
  totalPrice?:    number;   // Privado
  frontSeat?:     boolean;
  zone?:          string;
  category?:      string;
  capacity?:      number;
};

type PaymentMethod = 'card' | 'qr' | 'cash';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// ── Métodos de pago ───────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id:    'card' as PaymentMethod,
    label: 'Tarjeta de crédito / débito',
    sub:   'Visa · Mastercard · Amex · Diners',
    icon:  'card-outline',
    color: NAVY,
    bg:    '#EFF6FF',
  },
  {
    id:    'qr' as PaymentMethod,
    label: 'Transferencia QR',
    sub:   'De Una · PayPhone · Banco Pichincha',
    icon:  'qr-code-outline',
    color: PURPLE,
    bg:    '#F5F3FF',
  },
  {
    id:    'cash' as PaymentMethod,
    label: 'Efectivo',
    sub:   'Pagas directamente al conductor',
    icon:  'cash-outline',
    color: GREEN,
    bg:    '#F0FDF4',
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export function ConfirmRideScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<RouteProp<{ params: ConfirmRideParams }, 'params'>>();
  const { user }   = useAuthStore();
  const params     = route.params;

  const isCompartido = params.type === 'compartido';

  const [frontSeat,    setFrontSeat]    = useState(params.frontSeat ?? false);
  const [payMethod,    setPayMethod]    = useState<PaymentMethod>('card');
  const [loading,      setLoading]      = useState(false);

  // ── Cálculo de precio ──────────────────────────────────────────────────────
  const basePrice  = isCompartido
    ? (params.pricePerSeat ?? 10) + (frontSeat ? 3 : 0)
    : (params.totalPrice ?? 30);

  // IVA: transporte de pasajeros está exento en Ecuador (Art. 56 LRTI)
  // Aplica 0% IVA — se envía como BASE0 a Datafast
  const ivaAmount   = 0;
  const totalAmount = basePrice;

  const dateLabel = params.date
    ? new Date(params.date).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Hoy';

  // ── Confirmar reserva ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    hapticMedium();

    if (payMethod === 'card') {
      await handleCardPayment();
    } else if (payMethod === 'qr') {
      await handleQrPayment();
    } else {
      await handleCashBooking();
    }
  };

  // Pago con tarjeta — Datafast Dataweb (WebView)
  const handleCardPayment = async () => {
    setLoading(true);
    try {
      const txnId = `going_${Date.now()}_${user?.id?.slice(-6) ?? 'anon'}`;

      const { data } = await transportAPI.post('/payments/initiate', {
        paymentMethod:    'card',
        amountUsd:        totalAmount,
        transactionId:    txnId,
        description:      `Viaje ${params.type} · ${params.origin} → ${params.destination}`,
        returnUrl:        'goingapp://payment/result',
        userId:           user?.id,
        customerFirstName: user?.firstName,
        customerLastName:  user?.lastName,
        customerEmail:     user?.email,
      });

      // Abrir Datafast en el navegador del sistema (más seguro, sin dependencia WebView)
      const url = data?.redirectUrl ?? data?.checkoutUrl;
      if (url) {
        await Linking.openURL(url);
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err: any) {
      hapticError();
      Alert.alert('Error', `No se pudo iniciar el pago: ${err.message ?? 'Intenta de nuevo'}`);
    } finally {
      setLoading(false);
    }
  };

  // Pago QR — De Una
  const handleQrPayment = async () => {
    setLoading(true);
    try {
      const txnId = `going_${Date.now()}`;
      const { data } = await transportAPI.post('/payments/initiate', {
        paymentMethod: 'transfer',
        amountUsd:     totalAmount,
        transactionId: txnId,
        description:   `Viaje Going · ${params.origin} → ${params.destination}`,
        returnUrl:     'goingapp://payment/result',
        userId:        user?.id,
      });

      if (data?.qrUrl || data?.redirectUrl) {
        await Linking.openURL(data.qrUrl ?? data.redirectUrl);
      } else {
        Alert.alert('QR generado', 'Escanea el código QR de tu app De Una para pagar.');
      }
    } catch {
      hapticError();
      Alert.alert('Error', 'No se pudo generar el QR. Intenta con otro método.');
    } finally {
      setLoading(false);
    }
  };

  // Reserva en efectivo — no pasa por pasarela
  const handleCashBooking = async () => {
    setLoading(true);
    try {
      await transportAPI.post('/rides/request', {
        userId:       user?.id,
        origin:       { address: params.origin },
        destination:  { address: params.destination },
        vehicleType:  params.vehicleId ?? 'suv',
        tripMode:     params.type,
        price:        { amount: totalAmount, currency: 'USD' },
        paymentMethod: 'cash',
        scheduledAt:  params.date,
        departureTime: params.departureTime,
      });

      hapticSuccess();
      Alert.alert(
        '¡Reserva confirmada! 🎉',
        `Tu viaje de ${params.origin} a ${params.destination} está reservado.\n\nPaga $${totalAmount.toFixed(2)} en efectivo al conductor.`,
        [{ text: 'Ver mis viajes', onPress: () => navigation.navigate('Historial' as any) }]
      );
    } catch {
      hapticError();
      Alert.alert('Error', 'No se pudo completar la reserva. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Datafast se abre en WebBrowser del sistema — no se necesita WebView modal

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar viaje</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Resumen del viaje ─────────────────────────────────────────── */}
        <View style={styles.tripCard}>
          <View style={styles.tripCardHeader}>
            <Text style={styles.tripCardTitle}>Resumen del viaje</Text>
            <View style={[styles.typeBadge, isCompartido ? styles.badgeShared : styles.badgePrivate]}>
              <Text style={[styles.typeBadgeText, isCompartido ? { color: NAVY } : { color: '#fff' }]}>
                {isCompartido ? '🤝 Compartido' : '🔒 Privado'}
              </Text>
            </View>
          </View>

          {/* Ruta */}
          <View style={styles.routeSection}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: NAVY }]} />
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
              <View style={[styles.routeDot, { backgroundColor: '#E5E7EB', borderWidth: 2, borderColor: '#9CA3AF' }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>DESTINO</Text>
                <Text style={styles.routeCity}>{params.destination}</Text>
                <Text style={styles.routeDate}>{dateLabel}</Text>
              </View>
            </View>
          </View>

          {/* Detalles */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="car-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{params.vehicle}</Text>
            </View>
            {params.category && (
              <View style={styles.detailItem}>
                <Ionicons name="diamond-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>{params.category}</Text>
              </View>
            )}
            {isCompartido && params.pricePerSeat && (
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>1 asiento</Text>
              </View>
            )}
            {!isCompartido && params.capacity && (
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>Hasta {params.capacity} pax</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Selección de asiento (solo Compartido) ───────────────────── */}
        {isCompartido && (
          <View style={styles.section}>
            <Text style={styles.secTitle}>ELIGE TU ASIENTO</Text>
            <View style={styles.seatRow}>
              <TouchableOpacity
                style={[styles.seatOpt, !frontSeat && styles.seatOptActive]}
                onPress={() => { setFrontSeat(false); hapticLight(); }}
              >
                {!frontSeat && <View style={styles.seatCheck}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                <Text style={styles.seatIcon}>💺</Text>
                <Text style={[styles.seatName, !frontSeat && { color: NAVY }]}>Trasero</Text>
                <Text style={styles.seatPrice}>Precio base</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.seatOpt, frontSeat && styles.seatOptActive]}
                onPress={() => { setFrontSeat(true); hapticLight(); }}
              >
                {frontSeat && <View style={styles.seatCheck}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                <Text style={styles.seatIcon}>🪑</Text>
                <Text style={[styles.seatName, frontSeat && { color: NAVY }]}>Delantero</Text>
                <Text style={[styles.seatPrice, frontSeat && { color: NAVY, fontWeight: '700' }]}>+$3.00</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Método de pago ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>MÉTODO DE PAGO</Text>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.payCard, payMethod === m.id && { borderColor: m.color, backgroundColor: m.bg }]}
              onPress={() => { setPayMethod(m.id); hapticLight(); }}
              activeOpacity={0.85}
            >
              <View style={[styles.payIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon as any} size={22} color={m.color} />
              </View>
              <View style={styles.payInfo}>
                <Text style={[styles.payLabel, payMethod === m.id && { color: m.color }]}>{m.label}</Text>
                <Text style={styles.paySub}>{m.sub}</Text>
              </View>
              <View style={[styles.payRadio, payMethod === m.id && { borderColor: m.color }]}>
                {payMethod === m.id && <View style={[styles.payDot, { backgroundColor: m.color }]} />}
              </View>
            </TouchableOpacity>
          ))}
          {payMethod === 'cash' && (
            <View style={styles.cashNote}>
              <Ionicons name="information-circle-outline" size={14} color="#92400E" />
              <Text style={styles.cashNoteText}>
                El conductor confirmará el pago en efectivo al finalizar el viaje.
              </Text>
            </View>
          )}
        </View>

        {/* ── Desglose de precio ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>DESGLOSE DE PRECIO</Text>
          <View style={styles.priceBox}>
            {isCompartido ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLbl}>Asiento {frontSeat ? 'delantero' : 'trasero'}</Text>
                  <Text style={styles.priceVal}>${(params.pricePerSeat ?? 10).toFixed(2)}</Text>
                </View>
                {frontSeat && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLbl}>Asiento delantero</Text>
                    <Text style={styles.priceVal}>+$3.00</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.priceLbl}>{params.vehicle} ({params.capacity} pax)</Text>
                <Text style={styles.priceVal}>${(params.totalPrice ?? 30).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLbl}>IVA (exento · transporte)</Text>
              <Text style={[styles.priceVal, { color: GREEN }]}>$0.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLbl}>Servicio Going</Text>
              <Text style={[styles.priceVal, { color: GREEN }]}>incluido</Text>
            </View>
            <View style={styles.priceTotalRow}>
              <Text style={styles.priceTotalLbl}>
                {isCompartido ? 'Total por persona' : 'Total vehículo completo'}
              </Text>
              <Text style={styles.priceTotalVal}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ── Promo regreso ─────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.returnPromo} activeOpacity={0.85}>
          <Text style={{ fontSize: 20 }}>🔄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.returnTitle}>¿Reservas el regreso?</Text>
            <Text style={styles.returnSub}>Gana +50 Going Points en tu vuelta</Text>
          </View>
          <View style={styles.pointsBadge}><Text style={styles.pointsText}>+50 pts</Text></View>
        </TouchableOpacity>

        {/* Nota legal */}
        <Text style={styles.legalNote}>
          Al confirmar aceptas los Términos y Condiciones de Going Ecuador.
          El pago se procesa de forma segura con certificación PCI-DSS.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── BOTÓN CONFIRMAR ──────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View>
                <Text style={styles.confirmBtnText}>
                  {payMethod === 'cash' ? 'Confirmar reserva' : `Pagar $${totalAmount.toFixed(2)}`}
                </Text>
                <Text style={styles.confirmBtnSub}>
                  {payMethod === 'card' ? '🔒 Pago seguro Datafast'
                    : payMethod === 'qr' ? '📱 Pago QR De Una'
                    : '💵 Pago en efectivo al conductor'}
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={26} color={YELLOW} />
            </>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },

  // Header
  header: {
    backgroundColor: NAVY, paddingTop: 52,
    paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },

  // Scroll
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  secTitle: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  // Trip card
  tripCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 18,
    padding: 16, borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  tripCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  tripCardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  typeBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeShared: { backgroundColor: '#EFF6FF' },
  badgePrivate: { backgroundColor: NAVY },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },

  routeSection: { marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5 },
  routeCity: { fontSize: 16, fontWeight: '900', color: '#111827', marginTop: 1 },
  routeDate: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  routeLine: { width: 2, height: 20, backgroundColor: '#BFDBFE', marginLeft: 4, marginVertical: 4 },
  timeBadge: {
    backgroundColor: NAVY, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  timeBadgeText: { fontSize: 13, fontWeight: '900', color: '#fff' },

  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  detailText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  // Seat selection
  seatRow: { flexDirection: 'row', gap: 10 },
  seatOpt: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 2, borderColor: '#E5E7EB',
    position: 'relative',
  },
  seatOptActive: { borderColor: NAVY, backgroundColor: '#EFF6FF' },
  seatCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
  },
  seatIcon: { fontSize: 26 },
  seatName: { fontSize: 13, fontWeight: '900', color: '#374151' },
  seatPrice: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  // Payment methods
  payCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  payIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  payInfo: { flex: 1 },
  payLabel: { fontSize: 14, fontWeight: '800', color: '#111827' },
  paySub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  payRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  payDot: { width: 10, height: 10, borderRadius: 5 },
  cashNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  cashNoteText: { flex: 1, fontSize: 11, color: '#92400E', lineHeight: 16 },

  // Price box
  priceBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLbl: { fontSize: 13, color: '#6B7280' },
  priceVal: { fontSize: 13, fontWeight: '700', color: '#111827' },
  priceTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  priceTotalLbl: { fontSize: 14, fontWeight: '800', color: '#111827' },
  priceTotalVal: { fontSize: 24, fontWeight: '900', color: NAVY },

  // Return promo
  returnPromo: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#F0FDF4', borderRadius: 14, borderWidth: 1.5, borderColor: '#BBF7D0',
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  returnTitle: { fontSize: 13, fontWeight: '900', color: '#065F46' },
  returnSub: { fontSize: 10, color: '#059669', marginTop: 2 },
  pointsBadge: { backgroundColor: '#059669', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pointsText: { fontSize: 9, fontWeight: '900', color: '#fff' },

  // Legal
  legalNote: {
    marginHorizontal: 16, marginTop: 12,
    fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 15,
  },

  // Footer
  footer: {
    padding: 16, paddingBottom: 32, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  confirmBtn: {
    backgroundColor: NAVY, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 12, elevation: 6,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },
  confirmBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // WebView
  wvContainer: { flex: 1, backgroundColor: '#fff' },
  wvHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  wvTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: NAVY },
  wvSecure: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  wvSecureText: { fontSize: 11, fontWeight: '700', color: GREEN },
});
