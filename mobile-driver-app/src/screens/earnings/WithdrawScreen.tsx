import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { DriverMainStackParamList } from '@navigation/DriverMainNavigator';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.goingec.com';

type WithdrawRouteProp = RouteProp<DriverMainStackParamList, 'Withdraw'>;

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const GOING_GREEN = '#10B981';

const MP_WEB_URL = 'https://www.mercadopago.com/activities';

const WITHDRAWAL_METHODS = [
  {
    id: 'mp',
    label: 'Mercado Pago',
    description: 'Transferencia instantánea a tu cuenta MP',
    badge: '💳',
    color: '#00B1EA',
  },
  {
    id: 'bank',
    label: 'Transferencia Bancaria',
    description: 'CBU / CVU — hasta 24 horas hábiles',
    badge: '🏦',
    color: '#374151',
  },
];

export function WithdrawScreen() {
  const route = useRoute<WithdrawRouteProp>();
  const navigation = useNavigation();
  const { availableBalance, currency } = route.params;

  const [amount, setAmount] = useState(String(availableBalance));
  const [method, setMethod] = useState<'mp' | 'bank'>('mp');
  const [loading, setLoading] = useState(false);

  const displayCurrency = currency ?? 'USD';

  const validate = (): boolean => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
      return false;
    }
    if (num > availableBalance) {
      Alert.alert(
        'Saldo insuficiente',
        `Tu saldo disponible es $${availableBalance.toFixed(2)}.`
      );
      return false;
    }
    return true;
  };

  const handleWithdraw = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (method === 'mp') {
        // Open MP web dashboard — driver manages payout from their own MP account
        const supported = await Linking.canOpenURL(MP_WEB_URL);
        if (supported) {
          await Linking.openURL(MP_WEB_URL);
        } else {
          Alert.alert('Error', 'No se pudo abrir Mercado Pago.');
        }
      } else {
        // Real bank transfer via API
        const token = await AsyncStorage.getItem('driver_token');
        await axios.post(
          `${API_BASE}/drivers/me/withdraw`,
          { amount: parseFloat(amount), method: 'bank_transfer', currency: displayCurrency },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert(
          'Transferencia solicitada ✓',
          `Tu retiro de $${parseFloat(amount).toFixed(2)} ${displayCurrency} fue enviado. Llegará en 1–2 días hábiles.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo procesar el retiro. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo disponible</Text>
        <Text style={styles.balanceValue}>
          ${availableBalance.toFixed(2)}{' '}
          <Text style={styles.balanceCurrency}>{displayCurrency}</Text>
        </Text>
      </View>

      {/* Amount input */}
      <Text style={styles.sectionTitle}>¿Cuánto deseas retirar?</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currencySign}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity
          onPress={() => setAmount(String(availableBalance))}
          style={styles.maxBtn}
        >
          <Text style={styles.maxBtnText}>MAX</Text>
        </TouchableOpacity>
      </View>

      {/* Method selector */}
      <Text style={styles.sectionTitle}>Método de retiro</Text>
      {WITHDRAWAL_METHODS.map((m) => (
        <TouchableOpacity
          key={m.id}
          style={[
            styles.methodCard,
            method === m.id && styles.methodCardSelected,
          ]}
          onPress={() => setMethod(m.id as 'mp' | 'bank')}
          activeOpacity={0.8}
        >
          <View style={styles.methodLeft}>
            <View style={[styles.methodBadge, { backgroundColor: m.color }]}>
              <Text style={styles.methodBadgeText}>{m.badge}</Text>
            </View>
            <View>
              <Text style={styles.methodName}>{m.label}</Text>
              <Text style={styles.methodDesc}>{m.description}</Text>
            </View>
          </View>
          <View style={[styles.radio, method === m.id && styles.radioSelected]}>
            {method === m.id && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}

      {/* Withdraw button */}
      <TouchableOpacity
        style={[styles.withdrawBtn, loading && styles.withdrawBtnDisabled]}
        onPress={handleWithdraw}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#111" size="small" />
        ) : (
          <Text style={styles.withdrawBtnText}>
            💸 Retirar ${parseFloat(amount || '0').toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        Los retiros a MP son instantáneos. Transferencias bancarias pueden
        demorar hasta 1 día hábil.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F8F9FA' },
  balanceCard: {
    backgroundColor: GOING_BLUE,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: GOING_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceValue: {
    color: GOING_YELLOW,
    fontSize: 40,
    fontWeight: '900',
    marginTop: 6,
  },
  balanceCurrency: { fontSize: 20, fontWeight: '600' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  currencySign: { fontSize: 22, fontWeight: '700', color: '#374151' },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  maxBtn: {
    backgroundColor: GOING_BLUE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  maxBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
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
  methodCardSelected: { borderColor: GOING_GREEN },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  methodBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBadgeText: { fontSize: 22 },
  methodName: { fontSize: 15, fontWeight: '700', color: '#111' },
  methodDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: GOING_GREEN },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOING_GREEN,
  },
  withdrawBtn: {
    backgroundColor: GOING_YELLOW,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  withdrawBtnDisabled: { opacity: 0.7 },
  withdrawBtnText: { color: GOING_BLUE, fontSize: 17, fontWeight: '900' },
  note: {
    textAlign: 'center',
    fontSize: 12,
    color: '#aaa',
    marginTop: 16,
    lineHeight: 18,
  },
});
