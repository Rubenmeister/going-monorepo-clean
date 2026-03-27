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
import { Ionicons } from '@expo/vector-icons';
import { paymentAPI } from '../../services/api';

const GOING_RED  = '#ff4c41';
const GOING_BLUE = '#0033A0';

interface PaymentScreenProps {
  route: {
    params: {
      amount: number;       // en dólares (e.g. 15.00)
      currency?: string;    // siempre 'USD' para Ecuador
      bookingId?: string;
      rideId?: string;
      description?: string;
    };
  };
}

export default function PaymentScreen({ route }: PaymentScreenProps) {
  const { amount, bookingId, rideId, description } = route.params;
  const [loading, setLoading]           = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'datafast' | 'cash'>('datafast');

  const displayAmount = `$${amount.toFixed(2)}`;

  // ── Pago con DATAFAST (pasarela oficial Ecuador) ──────────────────────────
  const handleDatafast = async () => {
    setLoading(true);
    try {
      const response = await paymentAPI.createPaymentIntent({
        amount: Math.round(amount * 100), // centavos
        currency: 'USD',
        provider: 'datafast',
        referenceId: bookingId ?? rideId,
      });

      const checkoutUrl: string =
        response.data?.redirectUrl ?? response.data?.clientSecret;

      if (!checkoutUrl) throw new Error('No se recibió URL de pago.');

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

  // ── Pago en efectivo ──────────────────────────────────────────────────────
  const handleCash = () => {
    Alert.alert(
      'Pago en efectivo',
      `Paga $${amount.toFixed(2)} directamente a tu conductor al finalizar el viaje.`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  const handlePay = () => {
    if (selectedMethod === 'datafast') {
      handleDatafast();
    } else {
      handleCash();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={32} color={GOING_BLUE} />
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

      {/* DATAFAST */}
      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'datafast' && styles.methodCardSelected]}
        onPress={() => setSelectedMethod('datafast')}
        activeOpacity={0.8}
      >
        <View style={styles.methodLeft}>
          <View style={[styles.methodBadge, { backgroundColor: '#1a3a6b' }]}>
            <Text style={styles.methodBadgeText}>DF</Text>
          </View>
          <View>
            <Text style={styles.methodName}>Tarjeta de crédito / débito</Text>
            <Text style={styles.methodDesc}>
              Visa · Mastercard · Diners · American Express
            </Text>
          </View>
        </View>
        <View style={[styles.radio, selectedMethod === 'datafast' && styles.radioSelected]}>
          {selectedMethod === 'datafast' && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>

      {/* Efectivo */}
      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'cash' && styles.methodCardSelected]}
        onPress={() => setSelectedMethod('cash')}
        activeOpacity={0.8}
      >
        <View style={styles.methodLeft}>
          <View style={[styles.methodBadge, { backgroundColor: '#059669' }]}>
            <Ionicons name="cash-outline" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.methodName}>Efectivo</Text>
            <Text style={styles.methodDesc}>Pago directo al conductor</Text>
          </View>
        </View>
        <View style={[styles.radio, selectedMethod === 'cash' && styles.radioSelected]}>
          {selectedMethod === 'cash' && <View style={styles.radioDot} />}
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
            <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.payBtnText}>
              {selectedMethod === 'cash' ? `Pagar en efectivo` : `Pagar ${displayAmount}`}
            </Text>
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
  methodBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
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
    marginBottom: 8,
  },
});
