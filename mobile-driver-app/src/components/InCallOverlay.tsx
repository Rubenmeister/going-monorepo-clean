/**
 * InCallOverlay — UI de llamada en curso con Agora
 *
 * Muestra un overlay fullscreen durante la llamada VoIP:
 * - Nombre del interlocutor + estado (conectando / en llamada)
 * - Cronómetro de duración
 * - Botones: silenciar, altavoz, colgar
 *
 * Agora SDK se carga con dynamic require (silent no-op si no instalado).
 * Instalar: npx expo install react-native-agora
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticMedium, hapticHeavy } from '../../utils/haptics';
import type { CallSession, CallStatus } from '../../utils/agoraCall';

// ─── Agora dynamic require ────────────────────────────────────────────────────

let RtcEngine: any = null;
let ChannelProfileType: any = null;
let ClientRoleType: any = null;

try {
  const agora = require('react-native-agora');
  RtcEngine          = agora.createAgoraRtcEngine?.() ?? null;
  ChannelProfileType = agora.ChannelProfileType;
  ClientRoleType     = agora.ClientRoleType;
} catch { /* no instalado */ }

// ─── Props ────────────────────────────────────────────────────────────────────

interface InCallOverlayProps {
  session:       CallSession;
  otherPersonName: string;       // "Carlos Mendoza" o "Pasajero"
  onCallEnd:     () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function InCallOverlay({ session, otherPersonName, onCallEnd }: InCallOverlayProps) {
  const [status, setStatus]   = useState<CallStatus>('connecting');
  const [muted,  setMuted]    = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const engineRef  = useRef<any>(null);

  // Animación pulso mientras conecta
  useEffect(() => {
    if (status !== 'connecting') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [status]);

  // Inicializar Agora engine y unirse al canal
  useEffect(() => {
    if (session.type !== 'agora' || !RtcEngine) {
      // Fallback: marcar como en llamada simulada (no debería llegar aquí)
      setStatus('in_call');
      return;
    }

    let engine: any;

    (async () => {
      try {
        engine = RtcEngine;
        engineRef.current = engine;

        await engine.initialize({
          appId: session.appId,
          channelProfile: ChannelProfileType?.ChannelProfileCommunication ?? 0,
        });

        engine.addListener('onJoinChannelSuccess', () => {
          setStatus('in_call');
          hapticMedium();
          // Iniciar cronómetro
          timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        });

        engine.addListener('onUserOffline', () => {
          // El otro colgó
          handleHangup();
        });

        engine.addListener('onError', (err: number) => {
          console.warn('[Agora] error:', err);
          setStatus('error');
        });

        await engine.enableAudio();
        await engine.setEnableSpeakerphone(false);

        await engine.joinChannel(
          session.token ?? '',
          session.channel ?? '',
          session.uid ?? 0,
          {
            clientRoleType: ClientRoleType?.ClientRoleBroadcaster ?? 1,
            publishMicrophoneTrack: true,
            autoSubscribeAudio: true,
          },
        );
      } catch (err) {
        console.warn('[Agora] init error:', err);
        setStatus('error');
      }
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      engine?.leaveChannel?.();
      engine?.release?.();
    };
  }, []);

  const handleHangup = useCallback(async () => {
    hapticHeavy();
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('ended');
    try {
      await engineRef.current?.leaveChannel?.();
      await engineRef.current?.release?.();
    } catch { /* silencio */ }
    setTimeout(() => onCallEnd(), 600);
  }, [onCallEnd]);

  const toggleMute = async () => {
    hapticMedium();
    const next = !muted;
    setMuted(next);
    await engineRef.current?.muteLocalAudioStream?.(next);
  };

  const toggleSpeaker = async () => {
    hapticMedium();
    const next = !speaker;
    setSpeaker(next);
    await engineRef.current?.setEnableSpeakerphone?.(next);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const statusLabel =
    status === 'connecting' ? 'Conectando…' :
    status === 'in_call'    ? formatTime(seconds) :
    status === 'ended'      ? 'Llamada finalizada' : 'Error de conexión';

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#0033A0" />
      <View style={styles.root}>

        {/* Avatar + nombre */}
        <View style={styles.top}>
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          </Animated.View>
          <Text style={styles.name}>{otherPersonName}</Text>
          <Text style={styles.statusText}>{statusLabel}</Text>
          {session.type === 'agora' && (
            <View style={styles.badge}>
              <Ionicons name="wifi" size={11} color="#fff" />
              <Text style={styles.badgeText}>Llamada segura</Text>
            </View>
          )}
        </View>

        {/* Controles */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, muted && styles.controlBtnActive]}
            onPress={toggleMute}
          >
            <Ionicons name={muted ? 'mic-off' : 'mic'} size={26} color={muted ? '#fff' : '#0033A0'} />
            <Text style={[styles.controlLabel, muted && { color: '#fff' }]}>
              {muted ? 'Silenciado' : 'Silenciar'}
            </Text>
          </TouchableOpacity>

          {/* Colgar — botón central grande */}
          <TouchableOpacity style={styles.hangupBtn} onPress={handleHangup}>
            <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, speaker && styles.controlBtnActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons name={speaker ? 'volume-high' : 'volume-medium'} size={26} color={speaker ? '#fff' : '#0033A0'} />
            <Text style={[styles.controlLabel, speaker && { color: '#fff' }]}>
              {speaker ? 'Altavoz' : 'Altavoz'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0033A0',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  top: { alignItems: 'center', gap: 12 },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    width: '100%',
  },
  controlBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  controlLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },
  hangupBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4c41',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4c41',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
