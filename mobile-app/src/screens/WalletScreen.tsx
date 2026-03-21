/**
 * Wallet Screen
 * Mobile wallet management with Stripe, Apple Pay, Google Pay integration
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CreditCard, Plus, History, Settings } from 'react-native-feather';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  date: Date;
  status: string;
}

interface Wallet {
  id: string;
  balance: number;
  currency: string;
  status: string;
}

export const WalletScreen: React.FC = () => {
  const [topupAmount, setTopupAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'STRIPE' | 'GOOGLE_PAY' | 'APPLE_PAY'
  >('STRIPE');

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/api/wallet/current'),
  });

  // Fetch transaction history
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/api/wallet/transactions?limit=20'),
  });

  // Top-up mutation
  const topupMutation = useMutation({
    mutationFn: (amount: number) =>
      api.post('/api/wallet/topup', {
        amount,
        paymentMethod: selectedPaymentMethod,
      }),
    onSuccess: () => {
      setTopupAmount('');
      alert('Top-up successful!');
    },
    onError: (error) => {
      alert(`Top-up failed: ${error}`);
    },
  });

  const handleTopup = () => {
    const amount = parseFloat(topupAmount);
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    topupMutation.mutate(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'GOOGLE_PAY':
        return '🔵';
      case 'APPLE_PAY':
        return '🍎';
      default:
        return '💳';
    }
  };

  const getTransactionColor = (type: string) =>
    type === 'CREDIT' ? '#48BB78' : '#F56565';

  return (
    <ScrollView style={styles.container}>
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <CreditCard size={24} color="#fff" />
          <Text style={styles.balanceLabel}>Available Balance</Text>
        </View>

        {walletLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.balanceAmount}>${wallet?.balance || 0}</Text>
            <Text style={styles.balanceCurrency}>
              {wallet?.currency || 'USD'}
            </Text>
          </>
        )}

        <View style={styles.balanceFooter}>
          <Text style={styles.walletStatus}>
            Status: {wallet?.status || 'ACTIVE'}
          </Text>
        </View>
      </View>

      {/* Top-up Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Funds</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (USD)</Text>
          <View style={styles.inputWithButton}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="100.00"
              placeholderTextColor="#a0aec0"
              keyboardType="decimal-pad"
              value={topupAmount}
              onChangeText={setTopupAmount}
            />
          </View>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {[25, 50, 100, 250].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickButton}
              onPress={() => setTopupAmount(amount.toString())}
            >
              <Text style={styles.quickButtonText}>${amount}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Method Selection */}
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.paymentMethods}>
          {[
            { id: 'STRIPE' as const, name: 'Card', icon: '💳' },
            { id: 'GOOGLE_PAY' as const, name: 'Google Pay', icon: '🔵' },
            { id: 'APPLE_PAY' as const, name: 'Apple Pay', icon: '🍎' },
          ].map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === method.id &&
                  styles.paymentMethodSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <Text style={styles.methodName}>{method.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top-up Button */}
        <TouchableOpacity
          style={[
            styles.topupButton,
            topupMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleTopup}
          disabled={topupMutation.isPending}
        >
          {topupMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Plus size={20} color="#fff" />
              <Text style={styles.topupButtonText}>
                Add ${topupAmount || '0'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity>
            <History size={20} color="#4299E1" />
          </TouchableOpacity>
        </View>

        {transactions?.transactions && transactions.transactions.length > 0 ? (
          <View>
            {transactions.transactions.map((txn: Transaction) => (
              <View key={txn.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>
                    {txn.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(txn.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text
                    style={[
                      styles.transactionAmountText,
                      { color: getTransactionColor(txn.type) },
                    ]}
                  >
                    {txn.type === 'CREDIT' ? '+' : '-'}${txn.amount}
                  </Text>
                  <Text
                    style={[
                      styles.transactionStatus,
                      {
                        color:
                          txn.status === 'COMPLETED'
                            ? '#48BB78'
                            : txn.status === 'PENDING'
                            ? '#F6AD55'
                            : '#F56565',
                      },
                    ]}
                  >
                    {txn.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noTransactions}>No transactions yet</Text>
        )}
      </View>

      {/* Wallet Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Settings</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Settings size={20} color="#4299E1" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Recurring Top-ups</Text>
            <Text style={styles.settingDescription}>
              Set up automatic monthly top-ups
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>🔒</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Security</Text>
            <Text style={styles.settingDescription}>
              Manage payment methods
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingIcon}>📊</Text>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Spending Analytics</Text>
            <Text style={styles.settingDescription}>
              View your spending patterns
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Your wallet balance is used to automatically pay for services.
          Top-ups are instant and secure.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  balanceCard: {
    backgroundColor: '#4299E1',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    color: '#fff',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    color: '#E0F2FE',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  balanceCurrency: {
    color: '#E0F2FE',
    fontSize: 14,
    marginBottom: 12,
  },
  balanceFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  walletStatus: {
    color: '#E0F2FE',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1A202C',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4299E1',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paymentMethod: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  paymentMethodSelected: {
    borderColor: '#4299E1',
    backgroundColor: '#EBF8FF',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  methodName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A5568',
  },
  topupButton: {
    flexDirection: 'row',
    backgroundColor: '#48BB78',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  topupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A202C',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#718096',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  noTransactions: {
    textAlign: 'center',
    color: '#A0AEC0',
    paddingVertical: 24,
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#718096',
  },
  footer: {
    backgroundColor: '#EBF8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
    padding: 12,
    margin: 16,
    borderRadius: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#2C5282',
    lineHeight: 16,
  },
});

export default WalletScreen;
