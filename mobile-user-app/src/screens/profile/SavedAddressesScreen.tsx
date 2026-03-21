import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSavedAddressesStore, AddressType, SavedAddress } from '@store/useSavedAddressesStore';
import { hapticLight, hapticMedium, hapticError } from '@utils/haptics';

const GOING_BLUE   = '#0033A0';
const GOING_RED    = '#ff4c41';
const GOING_YELLOW = '#FFCD00';

const TYPE_CONFIG: Record<AddressType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  home:     { icon: 'home',       color: GOING_BLUE,  label: 'Casa' },
  work:     { icon: 'briefcase',  color: '#059669',   label: 'Trabajo' },
  favorite: { icon: 'heart',      color: GOING_RED,   label: 'Favorito' },
};

export function SavedAddressesScreen() {
  const { addresses, loaded, load, save, remove } = useSavedAddressesStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<AddressType>('home');
  const [labelInput, setLabelInput] = useState('');
  const [addressInput, setAddressInput] = useState('');

  useEffect(() => { if (!loaded) load(); }, []);

  const handleAdd = async () => {
    if (!addressInput.trim()) {
      hapticError();
      Alert.alert('Error', 'Ingresa una dirección');
      return;
    }
    hapticMedium();
    await save({
      type: selectedType,
      label: labelInput.trim() || TYPE_CONFIG[selectedType].label,
      address: addressInput.trim(),
      latitude: 0,
      longitude: 0,
    });
    setModalVisible(false);
    setAddressInput('');
    setLabelInput('');
  };

  const handleDelete = (addr: SavedAddress) => {
    Alert.alert('Eliminar', `¿Eliminar "${addr.label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { remove(addr.id); } },
    ]);
  };

  const renderItem = ({ item }: { item: SavedAddress }) => {
    const cfg = TYPE_CONFIG[item.type];
    return (
      <View style={styles.card}>
        <View style={[styles.iconBg, { backgroundColor: `${cfg.color}15` }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>{item.label}</Text>
          <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>
        </View>
        <TouchableOpacity onPress={() => { hapticLight(); handleDelete(item); }}>
          <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>Sin direcciones guardadas</Text>
            <Text style={styles.emptySub}>Guarda tu casa y trabajo para llegar más rápido</Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => { hapticLight(); setModalVisible(true); }}>
            <Ionicons name="add-circle" size={20} color={GOING_BLUE} />
            <Text style={styles.addBtnText}>Agregar dirección</Text>
          </TouchableOpacity>
        }
      />

      {/* Modal agregar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva dirección</Text>

            {/* Tipo */}
            <View style={styles.typeRow}>
              {(Object.keys(TYPE_CONFIG) as AddressType[]).map(t => {
                const cfg = TYPE_CONFIG[t];
                const active = selectedType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                    onPress={() => { hapticLight(); setSelectedType(t); setLabelInput(cfg.label); }}
                  >
                    <Ionicons name={cfg.icon} size={16} color={active ? '#fff' : cfg.color} />
                    <Text style={[styles.typeBtnText, active && { color: '#fff' }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre (ej: Mi casa)"
              value={labelInput}
              onChangeText={setLabelInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Dirección completa"
              value={addressInput}
              onChangeText={setAddressInput}
              multiline
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  iconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardLabel:   { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardAddress: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: GOING_BLUE, borderRadius: 14, borderStyle: 'dashed',
    paddingVertical: 14, marginTop: 4,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: GOING_BLUE },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: '#111827', marginBottom: 12, backgroundColor: '#F9FAFB',
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: GOING_BLUE },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
