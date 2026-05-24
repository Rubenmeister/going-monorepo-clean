/**
 * RideChatScreen — Chat in-ride pasajero ↔ conductor (Mockup #12).
 *
 * Flujo:
 *  - Polling cada 3s al endpoint /transport/{rideId}/chat
 *  - Quick replies (5 mensajes predefinidos comunes)
 *  - Optimistic UI con retry visible si falla el envío
 *
 * Theme adaptativo light + dark. Header navy + send btn yellow brand.
 *
 * REFIT 2026-05-23:
 *   - Theme adaptativo (antes hardcoded GOING_BLUE/YELLOW)
 *   - Send btn yellow brand (matches mockup canónico)
 *   - Driver avatar con iniciales (consistent con ActiveRide)
 *   - Fix layout header (driver info ya no se apila bajo el logo)
 *   - Optimistic con retry: mensajes failed marcados con ⚠️ tap-to-retry
 *   - Cleanup imports unused
 *
 * TODO declarado:
 *   - Reemplazar polling por socket.io subscription al room ride:{id}
 *     (transport-service ya expone /rides socket — verificar event name)
 *   - Push notification cuando llega mensaje del conductor en background
 *   - Typing indicator + read receipts (estándar moderno chat)
 */
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuthStore } from '@store/useAuthStore';
import { api } from '../../services/api';
import { useTheme, type ThemeTokens } from '../../theme';
import { hapticLight, hapticError } from '../../utils/haptics';

export type RideChatParams = {
  rideId:        string;
  driverName:    string;
  driverVehicle: string;
};

interface ChatMessage {
  id:          string;
  senderId:    string;
  senderRole:  'user' | 'driver';
  text:        string;
  timestamp:   number;
  /** Estado local solo del cliente — el backend no lo manda. */
  status?:     'sending' | 'sent' | 'failed';
}

/** Mensajes rápidos predefinidos — los más comunes entre pasajero y conductor. */
const QUICK_MESSAGES = [
  'Ya estoy listo',
  'Estoy en la esquina',
  '¿Cuánto falta?',
  'Voy en camino',
  'Espérame 2 minutos',
];

const POLL_INTERVAL_MS = 3000;

export function RideChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RideChatParams }, 'params'>>();
  const { rideId, driverName, driverVehicle } = route.params;
  const { user } = useAuthStore();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input,    setInput]    = useState('');
  const [sending,  setSending]  = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Iniciales del conductor para el avatar
  const driverInitials = useMemo(() => {
    const parts = driverName.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p.charAt(0).toUpperCase()).join('');
  }, [driverName]);

  // ── Polling de mensajes ───────────────────────────────────────────────────
  // TODO: reemplazar por socket.io subscription a ride:{rideId} con event
  // 'ride:chat_message'. transport-service ya expone /rides socket — verificar
  // si el backend tiene chat events implementados (sino, llevar al equipo de
  // transport-service para agregarlos). Mientras tanto, polling cada 3s.
  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/transport/${rideId}/chat`);
      const fetched: ChatMessage[] = Array.isArray(data) ? data : data?.messages ?? [];
      // Merge: conserva nuestros optimistic 'sending'/'failed' que no estén
      // en backend todavía. El backend devuelve la copia canónica de los
      // ya entregados.
      setMessages(prev => {
        const localPending = prev.filter(m => m.status === 'sending' || m.status === 'failed');
        return [...fetched.map(m => ({ ...m, status: 'sent' as const })), ...localPending];
      });
    } catch {
      // silently retry next tick
    }
  }, [rideId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    hapticLight();
    setSending(true);
    setInput('');

    // Mensaje optimista con id local
    const localId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id:          localId,
      senderId:    user?.id ?? '',
      senderRole:  'user',
      text:        trimmed,
      timestamp:   Date.now(),
      status:      'sending',
    };
    setMessages(prev => [...prev, optimistic]);

    // Scroll inmediato
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));

    try {
      await api.post(`/transport/${rideId}/chat`, {
        senderId:   user?.id,
        senderRole: 'user',
        text:       trimmed,
      });
      // Marcar como sent — el próximo poll lo va a reemplazar con la copia
      // canónica del backend.
      setMessages(prev => prev.map(m =>
        m.id === localId ? { ...m, status: 'sent' } : m,
      ));
    } catch {
      hapticError();
      // Marcar como failed — el usuario puede tap-to-retry
      setMessages(prev => prev.map(m =>
        m.id === localId ? { ...m, status: 'failed' } : m,
      ));
    } finally {
      setSending(false);
    }
  }, [rideId, user?.id]);

  // Retry de mensaje failed — re-envía con el mismo texto.
  const retryMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    sendMessage(msg.text);
  }, [sendMessage]);

  // ── Formato hora ──────────────────────────────────────────────────────────
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // ── Render de mensaje ─────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.senderRole === 'user';
    const isFailed = item.status === 'failed';

    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.driverBubbleAvatar}>
            <Text style={styles.driverBubbleAvatarText}>{driverInitials}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.msgBubble,
            isUser ? styles.msgBubbleUser : styles.msgBubbleDriver,
            isFailed && styles.msgBubbleFailed,
          ]}
          disabled={!isFailed}
          onPress={() => isFailed && retryMessage(item)}
          activeOpacity={0.85}
          accessibilityLabel={isFailed ? 'Tap para reintentar envío' : undefined}
        >
          <Text style={[styles.msgText, isUser && styles.msgTextUser]}>
            {item.text}
          </Text>
          <View style={styles.msgMetaRow}>
            <Text style={[styles.msgTime, isUser && styles.msgTimeUser]}>
              {formatTime(item.timestamp)}
            </Text>
            {isUser && item.status === 'sending' && (
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.6)" />
            )}
            {isUser && item.status === 'sent' && (
              <Ionicons name="checkmark-done" size={11} color="rgba(255,255,255,0.6)" />
            )}
            {isUser && isFailed && (
              <Ionicons name="alert-circle" size={11} color={tokens.error} />
            )}
          </View>
          {isFailed && (
            <Text style={styles.msgFailedNote}>Tap para reintentar</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header navy con driver info */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver al viaje activo"
        >
          <Ionicons name="arrow-back" size={22} color={tokens.textOnNavy} />
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{driverInitials}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{driverName}</Text>
          <View style={styles.headerStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerVehicle} numberOfLines={1}>
              {driverVehicle}
            </Text>
          </View>
        </View>
      </View>

      {/* Mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={56} color={tokens.textTertiary} />
            <Text style={styles.emptyTitle}>Sin mensajes todavía</Text>
            <Text style={styles.emptyText}>
              Envía un mensaje a {driverName.split(' ')[0]} o usa una respuesta rápida.
            </Text>
          </View>
        }
      />

      {/* Quick replies */}
      <View style={styles.quickRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={QUICK_MESSAGES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => sendMessage(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.quickListContent}
        />
      </View>

      {/* Input + send */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje…"
          placeholderTextColor={tokens.textTertiary}
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          editable={!sending}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || sending}
          activeOpacity={0.85}
          accessibilityLabel="Enviar mensaje"
        >
          <Ionicons
            name="send"
            size={20}
            color={input.trim() ? tokens.textOnYellow : tokens.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },

    // ── Header ─────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: t.brandNavy,
      paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
    },
    backBtn: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    headerAvatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: t.brandYellow,
      alignItems: 'center', justifyContent: 'center',
    },
    headerAvatarText: {
      color: t.textOnYellow,
      fontWeight: '900', fontSize: 14, letterSpacing: 0.3,
    },
    headerInfo: { flex: 1 },
    headerName: {
      color: t.textOnNavy,
      fontSize: 15, fontWeight: '800', letterSpacing: -0.2,
    },
    headerStatusRow: {
      flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2,
    },
    onlineDot: {
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: t.success,
    },
    headerVehicle: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11, fontWeight: '600',
    },

    // ── Messages list ──────────────────────────────────────
    messagesList: {
      paddingHorizontal: 16, paddingVertical: 14,
      flexGrow: 1,
    },
    emptyState: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      paddingTop: 80, paddingHorizontal: 32,
    },
    emptyTitle: {
      color: t.textPrimary, fontSize: 16, fontWeight: '800',
      marginTop: 12, textAlign: 'center',
    },
    emptyText: {
      color: t.textTertiary, fontSize: 13,
      marginTop: 6, textAlign: 'center', lineHeight: 18,
    },

    // ── Message bubbles ────────────────────────────────────
    msgRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8, marginBottom: 10,
    },
    msgRowUser: { flexDirection: 'row-reverse' },
    driverBubbleAvatar: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: t.brandYellow,
      alignItems: 'center', justifyContent: 'center',
    },
    driverBubbleAvatarText: {
      color: t.textOnYellow,
      fontWeight: '900', fontSize: 11,
    },
    msgBubble: {
      maxWidth: '75%',
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 18,
    },
    msgBubbleUser: {
      backgroundColor: t.brandNavy,
      borderBottomRightRadius: 4,
    },
    msgBubbleDriver: {
      backgroundColor: t.bgLayer,
      borderWidth: 1, borderColor: t.glassBorder,
      borderBottomLeftRadius: 4,
    },
    msgBubbleFailed: {
      borderWidth: 1.5,
      borderColor: t.error,
    },
    msgText: {
      fontSize: 14, color: t.textPrimary,
      lineHeight: 20,
    },
    msgTextUser: { color: t.textOnNavy },
    msgMetaRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'flex-end', gap: 4, marginTop: 4,
    },
    msgTime: { fontSize: 10, color: t.textTertiary },
    msgTimeUser: { color: 'rgba(255,255,255,0.6)' },
    msgFailedNote: {
      fontSize: 10, color: t.error,
      marginTop: 4, fontStyle: 'italic',
    },

    // ── Quick replies ──────────────────────────────────────
    quickRow: {
      paddingVertical: 8,
      borderTopWidth: 1, borderTopColor: t.border,
    },
    quickListContent: { gap: 8, paddingHorizontal: 16 },
    quickBtn: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
    },
    quickText: {
      fontSize: 12, fontWeight: '700',
      color: t.brandNavy,
    },

    // ── Input bar ──────────────────────────────────────────
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 28,
      borderTopWidth: 1, borderTopColor: t.border,
      backgroundColor: t.bg,
    },
    input: {
      flex: 1,
      borderWidth: 1.5, borderColor: t.border,
      borderRadius: 22,
      paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 14, color: t.textPrimary,
      backgroundColor: t.glass,
      maxHeight: 100,  // multiline cap
    },
    sendBtn: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: t.brandYellow,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: t.brandYellowDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3, shadowRadius: 6,
      elevation: 3,
    },
    sendBtnDisabled: {
      backgroundColor: t.glass,
      borderWidth: 1, borderColor: t.glassBorder,
      shadowOpacity: 0,
      elevation: 0,
    },
  });
}
