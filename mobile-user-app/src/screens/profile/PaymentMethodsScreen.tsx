import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonPaymentCard } from '@components/Skeleton';
import { api } from '@services/api';

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';

interface PaymentMethod {
  id: string;
  type: 'card' | 'mp';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

const BRAND_ICONS: Record<string, any> = {
  visa: 'card',
  mastercard: 'card',
  default: 'card-outline',
};

export function PaymentMethodsScreen() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payments/methods');
      setMethods(data.data ?? []);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = (id: string) => {
    Alert.alert(
      'Eliminar método',
      '¿Seguro que deseas eliminar este método de pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/payments/methods/${id}`);
              setMethods((prev) => prev.filter((m) => m.id !== id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/payments/methods/${id}/default`);
      setMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === id }))
      );
    } catch {
      Alert.alert('Error', 'No se pudo actualizar.');
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 16, gap: 0 }}>
        {[1, 2, 3].map(i => <SkeletonPaymentCard key={i} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={methods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          methods.length === 0 ? styles.center : styles.list
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Sin métodos de pago</Text>
            <Text style={styles.emptyText}>
              Agrega una tarjeta o cuenta Mercado Pago para pagar tus viajes
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconBox, item.type === 'mp' && { backgroundColor: '#E0F2FE' }]}>
                <Ionicons
                  name={item.type === 'mp' ? 'phone-portrait-outline' : (BRAND_ICONS[item.brand ?? ''] ?? BRAND_ICONS.default)}
                  size={22}
                  color={item.type === 'mp' ? '#0284C7' : GOING_BLUE}
                />
              </View>
              <View>
                <Text style={styles.cardLabel}>
                  {item.type === 'mp'
                    ? 'Mercado Pago'
                    : `${item.brand ?? 'Tarjeta'} •••• ${item.last4 ?? '----'}`}
                </Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Predeterminada</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.cardActions}>
              {!item.isDefault && (
                <TouchableOpacity
                  onPress={() => handleSetDefault(item.id)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="star-outline" size={18} color={GOING_BLUE} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleRemove(item.id)}
                style={styles.actionBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() =>
              Alert.alert(
                'Próximamente',
                'La gestión de métodos de pago estará disponible en la siguiente versión.'
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color={GOING_BLUE} />
            <Text style={styles.addBtnText}>Agregar método de pago</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  defaultBadge: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  defaultText: { fontSize: 11, color: '#D97706', fontWeight: '700' },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 6, textAlign: 'center', lineHeight: 20 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DBEAFE',
    paddingVertical: 16,
    marginTop: 4,
    marginBottom: 32,
  },
  addBtnText: { color: GOING_BLUE, fontSize: 15, fontWeight: '700' },
});
