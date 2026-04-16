import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@services/api';

const GOING_BLUE = '#0033A0';
const GOING_YELLOW = '#FFCD00';
const WHATSAPP_NUMBER = '593962499988';
const SUPPORT_PHONE = '+593962499988';

const FAQS = [
  {
    q: '¿Cómo reservo un viaje?',
    a: 'En la pantalla de inicio selecciona tu ciudad de origen, destino, tipo de vehículo y modo (compartido o privado). Luego toca "Solicitar viaje".',
  },
  {
    q: '¿Cómo cancelo un viaje?',
    a: 'En la pantalla de viaje activo puedes cancelar antes de que el conductor llegue. Una vez que el conductor esté en camino puede aplicar un cargo.',
  },
  {
    q: '¿Cómo pago mi viaje?',
    a: 'Going acepta tarjetas de crédito/débito y Mercado Pago. Puedes gestionar tus métodos en Perfil → Métodos de pago.',
  },
  {
    q: '¿Qué es el modo Empresa?',
    a: 'El modo Empresa aplica un 30% de descuento en viajes privados para clientes corporativos. Contacta a soporte para activarlo.',
  },
  {
    q: '¿Los conductores están verificados?',
    a: 'Sí. Todos los conductores Going pasan por verificación de documentos, antecedentes y capacitación antes de operar.',
  },
  {
    q: '¿Puedo rastrear mi viaje en tiempo real?',
    a: 'Sí. Durante el viaje activo puedes ver la ubicación del conductor en el mapa y compartir el enlace de seguimiento.',
  },
];

export function UserSupportScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`);
  };

  const callSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`);
  };

  const sendTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Campos requeridos', 'Completa el asunto y el mensaje.');
      return;
    }
    setLoading(true);
    try {
      // customer-support-service: POST /chat/message
      await api.post('/chat/message', {
        content: `[${subject}] ${message}`,
        type: 'user_support',
      });
      setSubject('');
      setMessage('');
      Alert.alert(
        'Mensaje enviado',
        'Te responderemos en menos de 24 horas. Revisa tu correo electrónico.'
      );
    } catch {
      Alert.alert('Error', 'No se pudo enviar el mensaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Contact options */}
      <Text style={styles.sectionTitle}>Contacto rápido</Text>
      <View style={styles.contactRow}>
        <TouchableOpacity style={styles.contactCard} onPress={callSupport} activeOpacity={0.8}>
          <View style={[styles.contactIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="call" size={22} color={GOING_BLUE} />
          </View>
          <Text style={styles.contactLabel}>Llamar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp} activeOpacity={0.8}>
          <View style={[styles.contactIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#059669" />
          </View>
          <Text style={styles.contactLabel}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* FAQs */}
      <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
      <View style={styles.faqContainer}>
        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqItem, i < FAQS.length - 1 && styles.faqBorder]}
            onPress={() => setOpenFaq(openFaq === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Ionicons
                name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9CA3AF"
              />
            </View>
            {openFaq === i && (
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Ticket form */}
      <Text style={styles.sectionTitle}>Enviar mensaje</Text>
      <View style={styles.ticketForm}>
        <TextInput
          style={styles.ticketInput}
          value={subject}
          onChangeText={setSubject}
          placeholder="Asunto"
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={[styles.ticketInput, styles.ticketTextarea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe tu consulta o problema..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.sendBtn, loading && { opacity: 0.7 }]}
          onPress={sendTicket}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={GOING_BLUE} />
          ) : (
            <>
              <Ionicons name="send" size={18} color={GOING_BLUE} />
              <Text style={styles.sendBtnText}>Enviar mensaje</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footnote}>
        Horario de atención: Lunes a Domingo · 6:00 AM – 10:00 PM
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  faqContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  faqItem: { padding: 16 },
  faqBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  faqAnswer: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
    lineHeight: 20,
  },
  ticketForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    gap: 12,
  },
  ticketInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  ticketTextarea: { minHeight: 100 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOING_YELLOW,
    borderRadius: 12,
    paddingVertical: 14,
  },
  sendBtnText: { color: GOING_BLUE, fontSize: 15, fontWeight: '800' },
  footnote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 20,
    marginBottom: 32,
  },
});
