import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { paymentAPI } from '../../services/api';

const GOING_RED = '#ff4c41'; // Going brand red
const GOING_BLUE = '#0033A0';

interface PaymentScreenProps {
  route: {
    params: {
      amount: number; // in cents (e.g. 1500 = $15.00 COP)
      currency: string; // e.g. 'COP', 'ARS', 'BRL'
      bookingId?: string;
      rideId?: string;
      description?: string;
    };
  };
}

export default function PaymentScreen({ route }: PaymentScreenProps) {
  const { amount, currency, bookingId, rideId, description } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'mp' | 'stripe'>('mp');

  const displayAmount = (amount / 100).toLocaleString('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  /** Mercado Pago checkout — opens MP init_point in browser */
  const handleMercadoPago = async () => {
    setLoading(true);
    try {
      const response = await paymentAPI.createPaymentIntent({
        amount,
        currency,
        provider: 'mercadopago',
        referenceId: bookingId ?? rideId,
      });

      const checkoutUrl: string = response.data?.clientSecret;
      if (!checkoutUrl) throw new Error('No checkout URL returned');

      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir el link de pago.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Intenta de nuevo.';
      Alert.alert('Error de pago', msg);
    } finally {
      setLoading(false);
    }
  };

  /** Stripe checkout (international / USD) */
  const handleStripe = async () => {
    setLoading(true);
    try {
      await paymentAPI.createPaymentIntent({
        amount,
        currency: 'USD',
        provider: 'stripe',
        referenceId: bookingId ?? rideId,
      });
      Alert.alert('Redirigiendo…', 'Abriendo Stripe checkout…');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Intenta de nuevo.';
      Alert.alert('Error de pago', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (selectedMethod === 'mp') {
      handleMercadoPago();
    } else {
      handleStripe();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔒</Text>
        <Text style={styles.title}>Pago Seguro</Text>
        <Text style={styles.subtitle}>Going protege tu transacción</Text>
      </View>

      {/* Amount display */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Total a pagar</Text>
        <Text style={styles.amountValue}>{displayAmount}</Text>
        {description && <Text style={styles.amountDesc}>{description}</Text>}
      </View>

      {/* Payment method selector */}
      <Text style={styles.sectionTitle}>Selecciona tu método de pago</Text>

      <TouchableOpacity
        style={[
          styles.methodCard,
          selectedMethod === 'mp' && styles.methodCardSelected,
        ]}
        onPress={() => setSelectedMethod('mp')}
        activeOpacity={0.8}
      >
        <View style={styles.methodLeft}>
          <View style={styles.mpBadge}>
            <Text style={styles.mpBadgeText}>MP</Text>
          </View>
          <View>
            <Text style={styles.methodName}>Mercado Pago</Text>
            <Text style={styles.methodDesc}>
              PSE · Tarjetas · Efectivo · OXXO · Pix
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.radio,
            selectedMethod === 'mp' && styles.radioSelected,
          ]}
        >
          {selectedMethod === 'mp' && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.methodCard,
          selectedMethod === 'stripe' && styles.methodCardSelected,
        ]}
        onPress={() => setSelectedMethod('stripe')}
        activeOpacity={0.8}
      >
        <View style={styles.methodLeft}>
          <View style={styles.stripeBadge}>
            <Text style={styles.stripeBadgeText}>S</Text>
          </View>
          <View>
            <Text style={styles.methodName}>Stripe (Internacional)</Text>
            <Text style={styles.methodDesc}>Visa · Mastercard · USD</Text>
          </View>
        </View>
        <View
          style={[
            styles.radio,
            selectedMethod === 'stripe' && styles.radioSelected,
          ]}
        >
          {selectedMethod === 'stripe' && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>

      {/* Pay button */}
      <TouchableOpacity
        style={[styles.payBtn, loading && styles.payBtnDisabled]}
        onPress={handlePay}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.lockIcon}>🔐</Text>
            <Text style={styles.payBtnText}>Pagar {displayAmount}</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.securityNote}>
        🔒 Pagos encriptados con TLS · Nunca almacenamos tu tarjeta
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginTop: 10,
  },
  subtitle: { fontSize: 14, color: '#777', marginTop: 4 },
  amountCard: {
    backgroundColor: GOING_BLUE,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: GOING_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  amountValue: { color: '#fff', fontSize: 38, fontWeight: '900', marginTop: 4 },
  amountDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  methodCardSelected: { borderColor: GOING_RED },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mpBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#00B1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  stripeBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#635BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripeBadgeText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  methodName: { fontSize: 15, fontWeight: '700', color: '#111' },
  methodDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: GOING_RED },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOING_RED,
  },
  payBtn: {
    backgroundColor: GOING_RED,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: GOING_RED,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  payBtnDisabled: { opacity: 0.65 },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  securityNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#AAA',
    marginTop: 18,
  },
  headerIcon: { fontSize: 32, marginBottom: 4 },
  lockIcon: { fontSize: 18, marginRight: 6 },
});
