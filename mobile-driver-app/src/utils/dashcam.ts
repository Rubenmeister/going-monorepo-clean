/**
 * Dashcam (Fase 1) — grabación de seguridad disparada por evento.
 *
 * No graba el viaje entero: cuando se dispara una alerta (SOS o RideCheck),
 * el <DashcamRecorder /> graba un clip corto y lo sube cifrado en tránsito
 * (HTTPS) a un bucket PRIVADO de GCS, con retención por lifecycle. El acceso
 * a la evidencia es solo de soporte/legal ante un incidente.
 *
 * Patrón: el componente DashcamRecorder registra su función de grabación con
 * `registerDashcam`. Cualquier pantalla puede disparar con `triggerDashcam`.
 */
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://api.goingec.com';

export type DashcamTriggerKind = 'sos' | 'ridecheck' | 'manual';

export interface DashcamTrigger {
  rideId: string;
  trigger: DashcamTriggerKind;
  lat?: number;
  lng?: number;
}

type RecordFn = (opts: DashcamTrigger) => Promise<void>;

let recorder: RecordFn | null = null;

/** El DashcamRecorder se registra (o limpia con null al desmontarse). */
export function registerDashcam(fn: RecordFn | null): void {
  recorder = fn;
}

/** Dispara la grabación si hay un recorder montado. No-op silencioso si no. */
export function triggerDashcam(opts: DashcamTrigger): void {
  if (!recorder) return;
  recorder(opts).catch(() => {
    /* la dashcam es best-effort: nunca interrumpe la seguridad del conductor */
  });
}

/**
 * Sube el clip al backend (multipart, campo "clip") y borra el archivo local.
 * El borrado evita dejar evidencia sensible en el teléfono del conductor.
 */
export async function uploadDashcamClip(uri: string, opts: DashcamTrigger): Promise<void> {
  const token = await AsyncStorage.getItem('driver_token');
  const parameters: Record<string, string> = { trigger: opts.trigger };
  if (opts.lat != null) parameters.lat = String(opts.lat);
  if (opts.lng != null) parameters.lng = String(opts.lng);

  try {
    await FileSystem.uploadAsync(`${API_BASE}/rides/${opts.rideId}/dashcam`, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'clip',
      mimeType: 'video/mp4',
      parameters,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } finally {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      /* si no se puede borrar, no es crítico */
    }
  }
}
