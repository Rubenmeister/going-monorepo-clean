/**
 * DashcamRecorder — cámara oculta que graba un clip corto cuando se dispara
 * una alerta de seguridad (SOS o RideCheck). Montar en pantallas de viaje
 * activo. Requiere permiso de cámara/micrófono ya concedido (se pide al
 * "ir en línea" en DriverHomeScreen).
 *
 * Diseño Fase 1: NO graba el viaje entero. Sin gatillo activo no monta la
 * cámara (ahorra batería); al recibir un gatillo monta la cámara, graba un
 * clip de ~20 s y lo sube cifrado en tránsito a un bucket privado.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { registerDashcam, uploadDashcamClip, type DashcamTrigger } from '../utils/dashcam';

const CLIP_SECONDS = 20;

export function DashcamRecorder() {
  const cameraRef = useRef<CameraView>(null);
  const [pending, setPending] = useState<DashcamTrigger | null>(null);
  const recordingRef = useRef(false);

  useEffect(() => {
    registerDashcam(async (opts) => {
      // Si ya hay una grabación en curso, ignorar nuevos gatillos.
      if (recordingRef.current) return;
      setPending(opts);
    });
    return () => registerDashcam(null);
  }, []);

  const handleReady = useCallback(async () => {
    const opts = pending;
    if (!opts || recordingRef.current) return;
    recordingRef.current = true;
    try {
      const rec = await cameraRef.current?.recordAsync({ maxDuration: CLIP_SECONDS });
      if (rec?.uri) {
        await uploadDashcamClip(rec.uri, opts);
      }
    } catch {
      /* best-effort: nunca interrumpe al conductor */
    } finally {
      recordingRef.current = false;
      setPending(null);
    }
  }, [pending]);

  // Sin gatillo activo no montamos la cámara.
  if (!pending) return null;

  return (
    <View style={styles.hidden} pointerEvents="none">
      <CameraView
        ref={cameraRef}
        mode="video"
        facing="front"
        onCameraReady={handleReady}
        style={styles.camera}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0, left: -10, top: -10 },
  camera: { width: 1, height: 1 },
});
