/**
 * DriverSupportChatScreen — chat de texto con el asistente Going App para
 * conductoras y conductores.
 *
 * Usa el endpoint autenticado /support/message: el JWT del conductor lleva el
 * rol 'driver', así que el backend responde con el prompt de soporte a
 * conductores (Ola 4). Carga el historial al abrir y conversa por texto.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDriverStore } from '../../store/useDriverStore';
import { supportAPI } from '../../services/api';
import { COLORS } from '../../theme/colors';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  '¿Cómo registro mi ruta, días y horas?',
  '¿Cómo veo mis viajes asignados?',
  '¿Cómo mejoro mi calificación?',
];

export function DriverSupportChatScreen() {
  const driver = useDriverStore((s) => s.driver);
  const userId = driver?.id ?? '';

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const listRef = useRef<FlatList<ChatMsg>>(null);

  // Cargar historial al abrir.
  useEffect(() => {
    if (!userId) { setLoadingHistory(false); return; }
    supportAPI
      .history(userId)
      .then(({ data }) => setMessages((data.messages ?? []).filter((m) => m.content?.trim())))
      .catch(() => {/* sin historial previo — empezamos limpio */})
      .finally(() => setLoadingHistory(false));
  }, [userId]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || sending || !userId) return;
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: msg }]);
      setSending(true);
      try {
        const { data } = await supportAPI.send(userId, msg);
        if (data.reply) {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.reply as string }]);
        } else {
          // reply null = la conversación pasó a un agente humano.
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: 'Te estoy conectando con una persona del equipo Going. Te responderá apenas pueda 🙏',
          }]);
        }
      } catch {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'No pude enviar tu mensaje. Revisa tu conexión e intenta de nuevo.',
        }]);
      } finally {
        setSending(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      }
    },
    [sending, userId],
  );

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={32} color={COLORS.textTertiary} />
        <Text style={styles.emptyText}>Inicia sesión para usar el soporte por chat.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loadingHistory ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.NAVY} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={34} color={COLORS.brandYellow} />
          </View>
          <Text style={styles.emptyTitle}>Soporte para conductoras y conductores</Text>
          <Text style={styles.emptyText}>
            Pregúntame sobre tus rutas, viajes, calificaciones o cualquier duda. Si necesitas a una
            persona del equipo, te conecto.
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestion} onPress={() => send(s)} activeOpacity={0.8}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
              <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
                {item.content}
              </Text>
            </View>
          )}
        />
      )}

      {sending && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={COLORS.textTertiary} />
          <Text style={styles.typingText}>Escribiendo...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor={COLORS.textTertiary}
          multiline
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || sending}
          accessibilityLabel="Enviar mensaje"
        >
          <Ionicons name="send" size={18} color={COLORS.textOnRed} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.NAVY,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 },
  suggestions: { marginTop: 10, gap: 8, alignSelf: 'stretch' },
  suggestion: {
    backgroundColor: COLORS.bgLayer,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
  },
  suggestionText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },

  list: { padding: 14, gap: 10 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: COLORS.NAVY, borderBottomRightRadius: 4 },
  bubbleBot: {
    alignSelf: 'flex-start', backgroundColor: COLORS.bgLayer,
    borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: COLORS.textOnRed },

  typing: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  typingText: { fontSize: 12, color: COLORS.textTertiary },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1, maxHeight: 120,
    backgroundColor: COLORS.bgLayer,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.NAVY,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
