import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { hapticMedium, hapticSuccess, hapticError, hapticLight } from '@utils/haptics';

const GOING_RED    = '#ff4c41';
const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const API_BASE     = 'https://api.goingec.com';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'promo';
  description: string;
  amount: number;
  date: string;
}

const TYPE_CONFIG = {
  credit: { icon: 'arrow-down-circle' as const, color: '#10B981', label: 'Recarga' },
  debit:  { icon: 'arrow-up-circle'   as const, color: GOING_RED,  label: 'Pago' },
  promo:  { icon: 'gift'              as const, color: GOING_YELLOW, label: 'Promo' },
};

// Montos de recarga predefinidos
const RECHARGE_AMOUNTS = [5, 10, 20, 50];

export function WalletScreen() {
  const [balance, setBalance]           = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [promoCode, setPromoCode]       = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [activeTab, setActiveTab]       = useState<'wallet' | 'promo'>('wallet');

  const load = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const { data } = await axios.get(`${API_BASE}/users/me/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(data.balance ?? 0);
      setTransactions(data.transactions ?? []);
    } catch {
      // Demo data
      setBalance(12.50);
      setTransactions([
        { id: '1', type: 'promo',  description: 'Bono bienvenida Going',   amount: 5.00,  date: '2026-03-08' },
        { id: '2', type: 'debit',  description: 'Viaje Latacunga → Quito', amount: -13.00, date: '2026-03-07' },
        { id: '3', type: 'credit', description: 'Recarga manual',           amount: 20.00, date: '2026-03-06' },
        { id: '4', type: 'debit',  description: 'Viaje Ambato → Riobamba', amount: -8.50,  date: '2026-03-05' },
        { id: '5', type: 'promo',  description: 'Código GOING10',           amount: 9.00,  date: '2026-03-04' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRecharge = (amount: number) => {
    hapticMedium();
    Alert.alert(
      'Recargar saldo',
      `¿Recargar $${amount.toFixed(2)} a tu billetera Going?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            hapticSuccess();
            Alert.alert('Próximamente', 'La recarga por tarjeta estará disponible pronto.');
          },
        },
      ]
    );
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) { hapticError(); return; }
    setPromoLoading(true);
    hapticMedium();
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const { data } = await axios.post(
        `${API_BASE}/users/me/promo`,
        { code: promoCode.trim().toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      hapticSuccess();
      Alert.alert('¡Código aplicado!', `Se acreditaron $${data.amount?.toFixed(2) ?? '?'} a tu billetera.`);
      setPromoCode('');
      load();
    } catch (e: any) {
      hapticError();
      Alert.alert('Código inválido', e.response?.data?.message ?? 'El código no es válido o ya fue usado.');
    } finally {
      setPromoLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOING_BLUE} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Hero saldo ── */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        <Text style={styles.heroLabel}>Saldo disponible</Text>
        <Text style={styles.heroBalance}>${(balance ?? 0).toFixed(2)}</Text>
        <Text style={styles.heroCurrency}>USD</Text>
        <View style={styles.heroNote}>
          <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.heroNoteText}>Se aplica automáticamente al pagar viajes</Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {(['wallet', 'promo'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { hapticLight(); setActiveTab(tab); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'wallet' ? '💳 Recargar' : '🎁 Código promo'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'wallet' ? (
        <>
          {/* Montos de recarga */}
          <Text style={styles.sectionTitle}>Selecciona un monto</Text>
          <View style={styles.amountsGrid}>
            {RECHARGE_AMOUNTS.map(amount => (
              <TouchableOpacity
                key={amount}
                style={styles.amountBtn}
                onPress={() => handleRecharge(amount)}
              >
                <Text style={styles.amountValue}>${amount}</Text>
                <Text style={styles.amountLabel}>USD</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Historial */}
          <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>Sin movimientos aún</Text>
          ) : (
            transactions.map(tx => {
              const cfg = TYPE_CONFIG[tx.type];
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: `${cfg.color}15` }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc}>{tx.description}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={[
                    styles.txAmount,
                    { color: tx.amount > 0 ? '#10B981' : GOING_RED },
                  ]}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </>
      ) : (
        /* Tab promo */
        <View style={styles.promoContainer}>
          <View style={styles.promoHero}>
            <Text style={styles.promoEmoji}>🎁</Text>
            <Text style={styles.promoTitle}>¿Tienes un código?</Text>
            <Text style={styles.promoSub}>Ingresa tu código promo y obtén saldo gratis</Text>
          </View>
          <TextInput
            style={styles.promoInput}
            placeholder="Ej: GOING10"
            value={promoCode}
            onChangeText={t => setPromoCode(t.toUpperCase())}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleApplyPromo}
          />
          <TouchableOpacity
            style={[styles.promoBtn, promoLoading && { opacity: 0.7 }]}
            onPress={handleApplyPromo}
            disabled={promoLoading}
          >
            {promoLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.promoBtnText}>Aplicar código</Text>
            }
          </TouchableOpacity>
          <View style={styles.promoExamples}>
            <Text style={styles.promoExTitle}>Códigos activos:</Text>
            {['GOING10', 'BIENVENIDO', 'ECUADORMOVIL'].map(code => (
              <TouchableOpacity
                key={code}
                style={styles.promoChip}
                onPress={() => { hapticLight(); setPromoCode(code); }}
              >
                <Text style={styles.promoChipText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content:   { paddingBottom: 40 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero
  hero: {
    backgroundColor: GOING_BLUE, alignItems: 'center',
    paddingTop: 40, paddingBottom: 36, paddingHorizontal: 24, overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -120, right: -80,
  },
  heroLabel:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 6 },
  heroBalance: { fontSize: 52, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroCurrency:{ fontSize: 16, color: GOING_YELLOW, fontWeight: '800', marginTop: -4, marginBottom: 12 },
  heroNote: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroNoteText:{ fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  // Tabs
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  tabText:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827', fontWeight: '800' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#374151', marginHorizontal: 16, marginBottom: 10, marginTop: 4 },

  // Amounts
  amountsGrid: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 24 },
  amountBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  amountValue: { fontSize: 20, fontWeight: '900', color: GOING_BLUE },
  amountLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  // Transactions
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 20 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txDesc:  { fontSize: 13, fontWeight: '600', color: '#111827' },
  txDate:  { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  txAmount:{ fontSize: 15, fontWeight: '800' },

  // Promo
  promoContainer: { padding: 16 },
  promoHero:  { alignItems: 'center', paddingVertical: 24 },
  promoEmoji: { fontSize: 48, marginBottom: 12 },
  promoTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  promoSub:   { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  promoInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', backgroundColor: '#fff', marginBottom: 12, letterSpacing: 3 },
  promoBtn:   { backgroundColor: GOING_RED, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 24 },
  promoBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  promoExamples: { alignItems: 'center', gap: 8 },
  promoExTitle:  { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  promoChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: GOING_BLUE, backgroundColor: `${GOING_BLUE}08` },
  promoChipText: { fontSize: 13, fontWeight: '800', color: GOING_BLUE, letterSpacing: 1 },
});
