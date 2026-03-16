import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@services/api';

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';

interface NotifSetting {
  id: string;
  label: string;
  desc: string;
  icon: any;
  value: boolean;
}

export function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotifSetting[]>([
    {
      id: 'ride_updates',
      label: 'Estado del viaje',
      desc: 'Notificaciones cuando el conductor se acerca o el estado cambia',
      icon: 'car-outline',
      value: true,
    },
    {
      id: 'promotions',
      label: 'Promociones',
      desc: 'Descuentos y ofertas especiales de Going',
      icon: 'pricetag-outline',
      value: true,
    },
    {
      id: 'chat_messages',
      label: 'Mensajes del conductor',
      desc: 'Cuando recibes un mensaje durante el viaje',
      icon: 'chatbubble-outline',
      value: true,
    },
    {
      id: 'booking_reminders',
      label: 'Recordatorios de reservas',
      desc: 'Aviso antes de tu próximo viaje programado',
      icon: 'calendar-outline',
      value: false,
    },
    {
      id: 'new_services',
      label: 'Nuevos servicios',
      desc: 'Cuando Going lanza nuevas rutas o experiencias',
      icon: 'sparkles-outline',
      value: false,
    },
  ]);

  const toggle = async (id: string) => {
    const updated = settings.map((s) =>
      s.id === id ? { ...s, value: !s.value } : s
    );
    setSettings(updated);
    try {
      await api.patch('/users/me/notifications', {
        [id]: updated.find((s) => s.id === id)?.value,
      });
    } catch {
      // revert on error
      setSettings(settings);
      Alert.alert('Error', 'No se pudo guardar la preferencia.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.infoBox}>
        <Ionicons name="notifications-outline" size={20} color={GOING_BLUE} />
        <Text style={styles.infoText}>
          Controla qué notificaciones recibes de Going
        </Text>
      </View>

      <View style={styles.list}>
        {settings.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.row,
              index < settings.length - 1 && styles.rowBorder,
            ]}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon} size={20} color={GOING_BLUE} />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
            </View>
            <Switch
              value={item.value}
              onValueChange={() => toggle(item.id)}
              trackColor={{ false: '#E5E7EB', true: GOING_YELLOW }}
              thumbColor={item.value ? GOING_BLUE : '#9CA3AF'}
            />
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>
        También puedes administrar los permisos de notificaciones desde la
        configuración de tu teléfono.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: GOING_BLUE, lineHeight: 18 },
  list: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  rowDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2, lineHeight: 16 },
  footnote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 32,
    lineHeight: 18,
  },
});
