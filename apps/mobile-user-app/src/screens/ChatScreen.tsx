import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

// Design tokens
const COLORS = {
  goingRed: '#FF4E43',
  charcoal: '#1A1A1A',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  gray: '#6B7280',
  border: '#E5E5E5',
  driverBubble: '#E8F5E9',
  userBubble: '#E3F2FD',
};

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'driver';
  time: string;
}

interface ChatScreenProps {
  navigation: any;
}

export function ChatScreen({ navigation }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: '¡Hola! Soy tu conductor Carlos. Estoy en camino.', sender: 'driver', time: '10:30' },
    { id: 2, text: 'Perfecto, te espero en la dirección indicada.', sender: 'user', time: '10:31' },
    { id: 3, text: 'Llegaré en aproximadamente 5 minutos 🚗', sender: 'driver', time: '10:32' },
    { id: 4, text: '¡Listo! Estaré afuera.', sender: 'user', time: '10:33' },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Driver info
  const driverInfo = {
    name: 'Carlos Mendoza',
    vehicle: 'Toyota Corolla Blanco',
    plate: 'ABC-1234',
    rating: 4.8,
  };

  useEffect(() => {
    // Scroll to bottom on new messages
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate driver response after 2 seconds
    setTimeout(() => {
      const responses = [
        '¡Entendido! 👍',
        'Perfecto, gracias por avisar.',
        'De acuerdo, cualquier cosa me dices.',
        'Ya casi llego, un momento.',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const driverResponse: Message = {
        id: messages.length + 2,
        text: randomResponse,
        sender: 'driver',
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, driverResponse]);
    }, 2000);
  };

  const handleEmergency = () => {
    Alert.alert(
      '🚨 AUXILIO - SOS',
      '¿Estás en una situación de emergencia?\n\nSe notificará a los servicios de emergencia y a tu contacto de confianza.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: '📞 Llamar al 911',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Emergencia', 'Conectando con servicios de emergencia...');
          }
        },
        {
          text: '📍 Compartir ubicación',
          onPress: () => {
            Alert.alert('Ubicación compartida', 'Tu ubicación ha sido enviada a tus contactos de confianza.');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.white} size={24} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.driverName}>{driverInfo.name}</Text>
          <Text style={styles.vehicleInfo}>{driverInfo.vehicle} • {driverInfo.plate}</Text>
        </View>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handleEmergency}
        >
          <Text style={styles.emergencyButtonText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Driver Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverAvatar}>
          <Text style={styles.driverAvatarText}>CM</Text>
        </View>
        <View style={styles.driverDetails}>
          <Text style={styles.driverCardName}>{driverInfo.name}</Text>
          <Text style={styles.driverRating}>⭐ {driverInfo.rating}</Text>
        </View>
        <View style={styles.tripStatus}>
          <Text style={styles.tripStatusText}>En camino</Text>
          <Text style={styles.tripEta}>5 min</Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View 
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userBubble : styles.driverBubble
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender === 'user' ? styles.userMessageText : styles.driverMessageText
              ]}>
                {message.text}
              </Text>
              <Text style={styles.messageTime}>{message.time}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={COLORS.gray}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={sendMessage}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Floating Emergency Button */}
      <TouchableOpacity 
        style={styles.floatingEmergency}
        onPress={handleEmergency}
      >
        <Text style={styles.floatingEmergencyText}>🆘</Text>
        <Text style={styles.floatingEmergencyLabel}>AUXILIO</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goingRed,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  emergencyButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emergencyButtonText: {
    color: COLORS.goingRed,
    fontSize: 14,
    fontWeight: 'bold',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.goingRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.charcoal,
  },
  driverRating: {
    fontSize: 14,
    color: COLORS.gray,
  },
  tripStatus: {
    alignItems: 'flex-end',
  },
  tripStatusText: {
    fontSize: 12,
    color: COLORS.goingRed,
    fontWeight: '600',
  },
  tripEta: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.charcoal,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  driverBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.driverBubble,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.charcoal,
  },
  driverMessageText: {
    color: COLORS.charcoal,
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.goingRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    color: COLORS.white,
  },
  floatingEmergency: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: COLORS.goingRed,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingEmergencyText: {
    fontSize: 20,
    marginRight: 8,
  },
  floatingEmergencyLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ChatScreen;
