import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { colors, spacing, fontSizes, borderRadius } from '@going-monorepo-clean/shared-ui';

interface ChatScreenProps {
  tripId?: string;
  recipientId?: string;
  currentUserId?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  isOwn: boolean;
  time: string;
  isRead: boolean;
}

export const DriverChatScreen = ({
  tripId = 'demo-trip-001',
  recipientId = 'passenger-001',
  currentUserId = 'b737f525-45c5-41e9-9136-1c2517830d99',
}: ChatScreenProps) => {
  const { domain } = useMonorepoApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = async () => {
    const result = await domain.chat.getTripChat.execute(tripId, currentUserId, 'token');
    if (result.isOk()) {
      setMessages(result.value);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [tripId]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const result = await domain.chat.send.execute(
      {
        tripId,
        senderId: currentUserId,
        senderRole: 'driver',
        recipientId,
        content: inputText.trim(),
      },
      'token',
    );

    if (result.isOk()) {
      setMessages((prev) => [...prev, result.value]);
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setIsSending(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageBubble, item.isOwn ? styles.ownMessage : styles.otherMessage]}>
      {!item.isOwn && (
        <Text style={styles.senderRole}>👤 Pasajero</Text>
      )}
      <Text style={[styles.messageText, item.isOwn && styles.ownMessageText]}>
        {item.content}
      </Text>
      <View style={styles.messageFooter}>
        <Text style={[styles.messageTime, item.isOwn && styles.ownTimeText]}>{item.time}</Text>
        {item.isOwn && (
          <Text style={styles.readStatus}>{item.isRead ? '✓✓' : '✓'}</Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Chat con Pasajero</Text>
        <Text style={styles.headerSubtitle}>Viaje #{tripId.slice(-6)}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Envía un mensaje al pasajero</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.gray[400]}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: colors.gray[700],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: spacing.lg,
  },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: '600', color: colors.white },
  headerSubtitle: { fontSize: fontSizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  messagesList: { padding: spacing.md, flexGrow: 1 },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  ownMessage: {
    backgroundColor: colors.gray[700],
    alignSelf: 'flex-end',
    borderBottomRightRadius: borderRadius.sm,
  },
  otherMessage: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  senderRole: { fontSize: fontSizes.xs, color: colors.gray[400], marginBottom: 2 },
  messageText: { fontSize: fontSizes.base, color: colors.gray[800], lineHeight: 22 },
  ownMessageText: { color: colors.white },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  messageTime: { fontSize: fontSizes.xs, color: colors.gray[400] },
  ownTimeText: { color: 'rgba(255,255,255,0.7)' },
  readStatus: { fontSize: fontSizes.xs, color: 'rgba(255,255,255,0.7)', marginLeft: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: fontSizes.base, color: colors.gray[400] },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.base,
    maxHeight: 100,
    color: colors.gray[800],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: { backgroundColor: colors.gray[300] },
  sendButtonText: { fontSize: 20, color: colors.white },
});
