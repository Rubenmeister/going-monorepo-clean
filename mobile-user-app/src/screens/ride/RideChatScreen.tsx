import React, { useEffect, useRef, useState } from 'react';
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
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

const GOING_BLUE   = '#0033A0';
const GOING_YELLOW = '#FFCD00';

export type RideChatParams = {
  rideId: string;
  driverName: string;
  driverVehicle: string;
};

interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'user' | 'driver';
  text: string;
  timestamp: number;
}

// ── Mensajes rápidos predefinidos ────────────────────────────────────────────
const QUICK_MESSAGES = [
  'Ya estoy listo',
  'Estoy en la esquina',
  '¿Cuánto falta?',
  'Voy en camino',
  'Espérame 2 minutos',
];

export function RideChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RideChatParams }, 'params'>>();
  const { rideId, driverName, driverVehicle } = route.params;
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // ── Polling de mensajes ───────────────────────────────────────────────────
  useEffect(() => {
    // Cargar mensajes iniciales
    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [rideId]);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/transport/${rideId}/chat`);
      const msgs: ChatMessage[] = Array.isArray(data) ? data : data.messages ?? [];
      setMessages(msgs);
    } catch {
      // silently retry
    }
  };

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setSending(true);

    // Mensaje optimista
    const optimisticMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      senderId: user?.id ?? '',
      senderRole: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');

    try {
      await api.post(`/transport/${rideId}/chat`, {
        senderId: user?.id,
        senderRole: 'user',
        text: text.trim(),
      });
    } catch {
      // El mensaje optimista ya se mostró
    } finally {
      setSending(false);
    }

    // Scroll al final
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Formateo de hora ──────────────────────────────────────────────────────
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // ── Render de mensaje ─────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.senderRole === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.driverAvatar}>
            <Ionicons name="car-sport" size={14} color="#fff" />
          </View>
        )}
        <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleDriver]}>
          <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{item.text}</Text>
          <Text style={[styles.msgTime, isUser && styles.msgTimeUser]}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{driverName}</Text>
          <Text style={styles.headerVehicle}>{driverVehicle}</Text>
        </View>
        <View style={styles.headerOnline}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>En viaje</Text>
        </View>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Envía un mensaje a tu conductor</Text>
          </View>
        }
      />

      {/* Mensajes rápidos */}
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
            >
              <Text style={styles.quickText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
        />
      </View>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje…"
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || sending}
        >
          <Ionicons name="send" size={20} color={input.trim() ? '#fff' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: GOING_BLUE, paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerVehicle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  headerOnline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  onlineText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },

  // Messages list
  messagesList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 8 },

  // Message bubbles
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgRowUser: { flexDirection: 'row-reverse' },
  driverAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: GOING_BLUE,
    justifyContent: 'center', alignItems: 'center',
  },
  msgBubble: {
    maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16,
  },
  msgBubbleUser: {
    backgroundColor: GOING_BLUE, borderBottomRightRadius: 4,
  },
  msgBubbleDriver: {
    backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  msgTextUser: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  msgTimeUser: { color: 'rgba(255,255,255,0.6)' },

  // Quick messages
  quickRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  quickBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  quickText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 30,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: '#111827', backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: GOING_BLUE,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#E5E7EB' },
});
