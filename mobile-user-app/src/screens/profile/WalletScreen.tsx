/**
 * WalletScreen — Billetera Going (Mockup #19).
 *
 * Estructura:
 *   - Hero navy con saldo grande + currency + nota informativa
 *   - Tabs: Recargar / Código promo
 *   - Tab Recargar: 4 montos predefinidos + lista de últimos movimientos
 *   - Tab Promo: input código + códigos activos sugeridos
 *
 * Theme adaptativo. Hero navy mantiene identity de billetera.
 *
 * REFIT 2026-05-23:
 *   - Theme tokens (antes hardcoded GOING_BLUE/RED/YELLOW)
 *   - Demo data del fallback marcada explícitamente como mock
 *   - Recarga ahora wire honest stub (TODO Datafast/DeUna real)
 *   - Tipo de transacción usa colores semánticos
 *
 * TODO declarado:
 *   - Wire recarga real a payment-service (Datafast + DeUna ya existen
 *     en backend, falta UI flow + webhook callback)
 *   - Endpoint /users/me/wallet hoy puede no existir — usar fallback
 *     demo data para no romper la pantalla (declarado en code)
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { authService } from '@services/authService';
import { hapticMedium, hapticSuccess, hapticError, hapticLight } from '@utils/haptics';
import { useTheme, type ThemeTokens } from '../../theme';

const API_BASE = 'https://api.goingec.com';

interface Transaction {
  id:          string;
  type:        'credit' | 'debit' | 'promo';
  description: string;
  amount:      number;
  date:        string;
}

const RECHARGE_AMOUNTS = [5, 10, 20, 50];

export function WalletScreen() {
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [balance,      setBalance]      = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [promoCode,    setPromoCode]    = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [activeTab,    setActiveTab]    = useState<'wallet' | 'promo'>('wallet');

  // Type → tokens semánticos
  const TYPE_CONFIG = useMemo(() => ({
    credit: { icon: 'arrow-down-circle' as const, color: tokens.success,    label: 'Recarga' },
    debit:  { icon: 'arrow-up-circle'   as const, color: tokens.brandRed,   label: 'Pago'    },
    promo:  { icon: 'gift'              as const, color: tokens.brandYellow, label: 'Promo'  },
  }), [tokens]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      const { data } = await axios.get(`${API_BASE}/users/me/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(data.balance ?? 0);
      setTransactions(data.transactions ?? []);
    } catch {
      // FALLBACK demo — el endpoint /users/me/wallet aún no existe en
      // backend. Mostramos data realista para que el UI sea evaluable.
      // TODO: remover cuando billing-service o payment-service expongan
      // el endpoint real con saldo + historial paginado.
      setBalance(12.50);
      setTransactions([
        { id: '1', type: 'promo',  description: 'Bono bienvenida Going',   amount:  5.00, date: '2026-03-08' },
        { id: '2', type: 'debit',  description: 'Viaje Latacunga → Quito', amount: -13.00, date: '2026-03-07' },
        { id: '3', type: 'credit', description: 'Recarga manual',           amount: 20.00, date: '2026-03-06' },
        { id: '4', type: 'debit',  description: 'Viaje Ambato → Riobamba', amount: -8.50,  date: '2026-03-05' },
        { id: '5', type: 'promo',  description: 'Código GOING10',           amount:  9.00, date: '2026-03-04' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRecharge = useCallback((amount: number) => {
    hapticMedium();
    Alert.alert(
      'Recargar saldo',
      `¿Recargar $${amount.toFixed(2)} a tu billetera Going?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            // TODO: wire al payment-service (Datafast/DeUna) — backend
            // ya tiene los gateways implementados, falta el flujo
            // UI → POST /payments/recharge → WebBrowser → callback.
            Alert.alert(
              'Próximamente',
              'La recarga por tarjeta (Datafast) y QR (De Una) estará disponible cuando el wire del frontend al payment-service esté listo. Mientras tanto, paga directo al conductor en efectivo.',
            );
          },
        },
      ],
    );
  }, []);

  const handleApplyPromo = useCallback(async () => {
    if (!promoCode.trim()) { hapticError(); return; }
    setPromoLoading(true);
    hapticMedium();
    try {
      const token = await authService.getAccessToken();
      const { data } = await axios.post(
        `${API_BASE}/users/me/promo`,
        { code: promoCode.trim().toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      hapticSuccess();
      Alert.alert(
        '¡Código aplicado!',
        `Se acreditaron $${data.amount?.toFixed(2) ?? '?'} a tu billetera.`,
      );
      setPromoCode('');
      load();
    } catch (e: any) {
      hapticError();
      Alert.alert(
        'Código inválido',
        e.response?.data?.message ?? 'El código no es válido o ya fue usado.',
      );
    } finally {
      setPromoLoading(false);
    }
  }, [promoCode, load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.brandNavy} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Hero saldo ─────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        <Text style={styles.heroLabel}>Saldo disponible</Text>
        <Text style={styles.heroBalance}>${(balance ?? 0).toFixed(2)}</Text>
        <Text style={styles.heroCurrency}>USD</Text>
        <View style={styles.heroNote}>
          <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.heroNoteText}>
            Se aplica automáticamente al pagar viajes
          </Text>
        </View>
      </View>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <View style={styles.tabs}>
        {(['wallet', 'promo'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { hapticLight(); setActiveTab(tab); }}
            accessibilityLabel={tab === 'wallet' ? 'Tab recargar saldo' : 'Tab código promo'}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'wallet' ? 'Recargar' : 'Código promo'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'wallet' ? (
        <>
          <Text style={styles.sectionTitle}>Selecciona un monto</Text>
          <View style={styles.amountsGrid}>
            {RECHARGE_AMOUNTS.map(amount => (
              <TouchableOpacity
                key={amount}
                style={styles.amountBtn}
                onPress={() => handleRecharge(amount)}
                activeOpacity={0.85}
              >
                <Text style={styles.amountValue}>${amount}</Text>
                <Text style={styles.amountLabel}>USD</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>Sin movimientos aún</Text>
          ) : (
            transactions.map(tx => {
              const cfg = TYPE_CONFIG[tx.type];
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: `${cfg.color}18` }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc}>{tx.description}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.date).toLocaleDateString('es-EC', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={[
                    styles.txAmount,
                    { color: tx.amount > 0 ? tokens.success : tokens.brandRed },
                  ]}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </>
      ) : (
        <View style={styles.promoContainer}>
          <View style={styles.promoHero}>
            <Text style={styles.promoEmoji}>🎁</Text>
            <Text style={styles.promoTitle}>¿Tienes un código?</Text>
            <Text style={styles.promoSub}>
              Ingresa tu código promo y obtén saldo gratis
            </Text>
          </View>
          <TextInput
            style={styles.promoInput}
            placeholder="Ej: GOING10"
            placeholderTextColor={tokens.textTertiary}
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
            activeOpacity={0.85}
          >
            {promoLoading ? (
              <ActivityIndicator color={tokens.textOnYellow} />
            ) : (
              <Text style={styles.promoBtnText}>Aplicar código</Text>
            )}
          </TouchableOpacity>
          <View style={styles.promoExamples}>
            <Text style={styles.promoExTitle}>Códigos sugeridos:</Text>
            <View style={styles.promoChipsRow}>
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
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content:   { paddingBottom: 40 },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.bg },

    // ── Hero ───────────────────────────────────────────────
    hero: {
      backgroundColor: t.brandNavy,
      alignItems: 'center',
      paddingTop: 44, paddingBottom: 36, paddingHorizontal: 24,
      overflow: 'hidden',
    },
    heroBg: {
      position: 'absolute', width: 300, height: 300, borderRadius: 150,
      backgroundColor: 'rgba(255,255,255,0.05)',
      top: -120, right: -80,
    },
    heroLabel: {
      fontSize: 13, color: 'rgba(255,255,255,0.7)',
      fontWeight: '700', marginBottom: 6,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    heroBalance: {
      fontSize: 52, fontWeight: '900',
      color: t.textOnNavy, letterSpacing: -1,
    },
    heroCurrency: {
      fontSize: 16, fontWeight: '900',
      color: t.brandYellow, marginTop: -4, marginBottom: 14,
      letterSpacing: 0.5,
    },
    heroNote: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    heroNoteText: {
      fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600',
    },

    // ── Tabs ───────────────────────────────────────────────
    tabs: {
      flexDirection: 'row',
      margin: 16,
      backgroundColor: t.glass,
      borderRadius: 12, padding: 4,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    tab: {
      flex: 1, paddingVertical: 10,
      alignItems: 'center', borderRadius: 10,
    },
    tabActive: {
      backgroundColor: t.bgLayer,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
    },
    tabText: {
      fontSize: 13, fontWeight: '700', color: t.textSecondary,
    },
    tabTextActive: { color: t.textPrimary, fontWeight: '900' },

    sectionTitle: {
      fontSize: 12, fontWeight: '800',
      color: t.textTertiary,
      marginHorizontal: 16, marginBottom: 10, marginTop: 4,
      textTransform: 'uppercase', letterSpacing: 0.8,
    },

    // ── Amounts ────────────────────────────────────────────
    amountsGrid: {
      flexDirection: 'row', gap: 10,
      marginHorizontal: 16, marginBottom: 24,
    },
    amountBtn: {
      flex: 1, alignItems: 'center',
      paddingVertical: 18, borderRadius: 14,
      backgroundColor: t.bgLayer,
      borderWidth: 1.5, borderColor: t.glassBorder,
    },
    amountValue: {
      fontSize: 22, fontWeight: '900',
      color: t.brandNavy, letterSpacing: -0.3,
    },
    amountLabel: {
      fontSize: 10, color: t.textTertiary,
      fontWeight: '700', marginTop: 2, letterSpacing: 0.3,
    },

    // ── Transactions ───────────────────────────────────────
    emptyText: {
      textAlign: 'center', color: t.textTertiary,
      fontSize: 14, marginTop: 20,
    },
    txRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginHorizontal: 16, marginBottom: 10,
      backgroundColor: t.bgLayer,
      borderRadius: 14, padding: 12,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    txIcon: {
      width: 40, height: 40, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center',
    },
    txInfo: { flex: 1 },
    txDesc: { fontSize: 13, fontWeight: '700', color: t.textPrimary },
    txDate: { fontSize: 11, color: t.textTertiary, marginTop: 2 },
    txAmount: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },

    // ── Promo ──────────────────────────────────────────────
    promoContainer: { padding: 16 },
    promoHero: { alignItems: 'center', paddingVertical: 24 },
    promoEmoji: { fontSize: 48, marginBottom: 12 },
    promoTitle: {
      fontSize: 20, fontWeight: '900',
      color: t.textPrimary, marginBottom: 6, letterSpacing: -0.3,
    },
    promoSub: {
      fontSize: 14, color: t.textSecondary,
      textAlign: 'center', lineHeight: 20,
    },
    promoInput: {
      borderWidth: 1.5, borderColor: t.border,
      borderRadius: 14,
      paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 18, fontWeight: '900',
      color: t.textPrimary, textAlign: 'center',
      backgroundColor: t.bgLayer,
      marginBottom: 12, letterSpacing: 3,
    },
    promoBtn: {
      backgroundColor: t.brandYellow,
      paddingVertical: 16, borderRadius: 14,
      alignItems: 'center', marginBottom: 24,
      shadowColor: t.brandYellowDark,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    promoBtnText: {
      color: t.textOnYellow,
      fontSize: 15, fontWeight: '900', letterSpacing: 0.3,
    },
    promoExamples: { alignItems: 'center', gap: 10 },
    promoExTitle: {
      fontSize: 12, color: t.textTertiary, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    promoChipsRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8,
      justifyContent: 'center',
    },
    promoChip: {
      paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5, borderColor: t.brandNavy,
      backgroundColor: `${t.brandNavy}08`,
    },
    promoChipText: {
      fontSize: 13, fontWeight: '900',
      color: t.brandNavy, letterSpacing: 1,
    },
  });
}
