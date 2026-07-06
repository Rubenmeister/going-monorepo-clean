/**
 * HybridModeBanner
 *
 * Componente que renderiza el estado del modo híbrido del conductor en
 * la home screen del driver app (Fase E del Hybrid Mode).
 *
 * Renders:
 *   IDLE                  → null (no aparece el banner)
 *   LONG_TRIP_OUTBOUND    → barra azul "Viaje interurbano en curso"
 *   AVAILABLE_LOCAL       → barra verde con countdown "Modo local · 1h 20m"
 *   BLOCKED_REST          → barra amarilla "Hora de descansar · retorno HH:MM"
 *   LONG_TRIP_RETURN      → barra azul "Viaje de retorno en curso"
 *
 * Poll cada 30s al endpoint /driver-hybrid/me para refrescar el state.
 * Cuando el componente unmounta, limpia el interval.
 *
 * Wire en DriverHomeScreen agregando <HybridModeBanner /> al tope del scroll.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  driverHybridAPI,
  type DriverHybridStateResponse,
  type DriverHybridState,
} from '../services/api';

const POLL_INTERVAL_MS = 30_000;

/** Formato "1h 20m" o "45m" a partir de minutos. */
function fmtCountdown(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Hora local HH:MM en zona EC del nextLongTripStartTime ISO. */
function fmtReturnTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

interface StyleConfig {
  bg: string;
  fg: string;
  icon: keyof typeof Ionicons.glyphMap;
  border: string;
}

function styleFor(state: DriverHybridState): StyleConfig {
  switch (state) {
    case 'AVAILABLE_LOCAL':
      return { bg: '#DCFCE7', fg: '#166534', border: '#16A34A', icon: 'flash' };
    case 'BLOCKED_REST':
      return { bg: '#FEF3C7', fg: '#92400E', border: '#F59E0B', icon: 'cafe' };
    case 'LONG_TRIP_OUTBOUND':
    case 'LONG_TRIP_RETURN':
      return { bg: '#DBEAFE', fg: '#1E40AF', border: '#3B82F6', icon: 'bus' };
    default:
      return { bg: '#F3F4F6', fg: '#374151', border: '#9CA3AF', icon: 'help-circle' };
  }
}

export function HybridModeBanner() {
  const [data, setData] = useState<DriverHybridStateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await driverHybridAPI.getMyState();
      setData(res.data);
    } catch (err) {
      // Silent fail — si el endpoint no está disponible, el banner
      // simplemente no aparece. No mostramos error al driver para no
      // contaminar el home screen.
    }
  }, []);

  useEffect(() => {
    void fetchState();
    intervalRef.current = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchState]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      '¿Salir del modo híbrido?',
      'No vas a recibir más carreras locales en esta ciudad. Tu viaje de retorno sigue programado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, salir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await driverHybridAPI.cancel();
              await fetchState();
            } catch (err) {
              Alert.alert('Error', 'No se pudo salir del modo. Reintenta.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }, [fetchState]);

  if (!data || !data.active) return null;

  const cfg = styleFor(data.state);

  // ── Render por estado ─────────────────────────────────────────────

  if (data.state === 'AVAILABLE_LOCAL') {
    const countdown = fmtCountdown(data.minutesUntilRestWindow);
    return (
      <View style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.fg} style={styles.icon} />
        <View style={styles.body}>
          <Text style={[styles.title, { color: cfg.fg }]}>Modo local activo</Text>
          <Text style={[styles.subtitle, { color: cfg.fg }]}>
            {data.destinationCity ? `En ${data.destinationCity} · ` : ''}
            Faltan {countdown} para tu descanso
          </Text>
        </View>
        <TouchableOpacity onPress={handleCancel} disabled={loading} style={styles.cancelBtn}>
          <Ionicons name="close-circle-outline" size={22} color={cfg.fg} />
        </TouchableOpacity>
      </View>
    );
  }

  if (data.state === 'BLOCKED_REST') {
    const returnAt = fmtReturnTime(data.nextLongTripStartTime);
    return (
      <View style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.fg} style={styles.icon} />
        <View style={styles.body}>
          <Text style={[styles.title, { color: cfg.fg }]}>Hora de descansar</Text>
          <Text style={[styles.subtitle, { color: cfg.fg }]}>
            No vas a recibir carreras. Tu retorno sale a las {returnAt}.
          </Text>
        </View>
      </View>
    );
  }

  // LONG_TRIP_OUTBOUND o LONG_TRIP_RETURN
  const isReturn = data.state === 'LONG_TRIP_RETURN';
  return (
    <View style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Ionicons name={cfg.icon} size={22} color={cfg.fg} style={styles.icon} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: cfg.fg }]}>
          {isReturn ? 'Viaje de retorno' : 'Viaje interurbano'}
        </Text>
        <Text style={[styles.subtitle, { color: cfg.fg }]}>
          {isReturn
            ? 'Buen viaje de regreso.'
            : data.destinationCity
            ? `Rumbo a ${data.destinationCity}`
            : 'En ruta'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  icon: { marginRight: 12 },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  cancelBtn: { padding: 4 },
});
