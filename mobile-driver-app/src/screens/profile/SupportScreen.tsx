import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverMainStackParamList } from '../../navigation/DriverMainNavigator';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/constants';

type Nav = NativeStackNavigationProp<DriverMainStackParamList>;

const GOING_BLUE   = '#FF4C41';
const GOING_YELLOW = '#FFD253';

// ── FAQ ──────────────────────────────────────────────────────────────────────
interface FAQItem { q: string; a: string }

const FAQ: FAQItem[] = [
  {
    q: '¿Cómo recibo mis pagos?',
    a: 'Los pagos se acumulan en tu billetera Going App. Puedes retirar a tu cuenta bancaria desde la sección Ganancias cuando alcances el mínimo de $10.',
  },
  {
    q: '¿Qué documentos necesito para conducir?',
    a: 'Necesitas 4 documentos vigentes: Cédula de Identidad, Licencia de Conducir (tipo C o superior), Matrícula del Vehículo y SOAT. Súbelos desde la sección Mis Documentos en tu perfil.',
  },
  {
    q: '¿Cómo funciona el modo Compartido?',
    a: 'En viajes compartidos, tu SUV o VAN lleva hasta 3 u 8 pasajeros respectivamente que comparten la ruta. Cada pasajero paga individualmente. Tú recibes el total.',
  },
  {
    q: '¿Puedo rechazar un viaje?',
    a: 'Sí, puedes dejar pasar solicitudes sin penalización. Sin embargo, una tasa alta de aceptación mejora tu posición en el ranking de conductoras y conductores.',
  },
  {
    q: '¿Qué hago si un pasajero no aparece?',
    a: 'Espera 5 minutos en el punto de recogida. Si no aparece, puedes cancelar el viaje sin penalización y recibirás una compensación por tiempo de espera.',
  },
  {
    q: '¿Cómo mejoro mi calificación?',
    a: 'Mantén tu vehículo limpio, sé puntual, conduce de forma segura y sé amable con las personas pasajeras. Las calificaciones de 4+ estrellas te mantienen activo.',
  },
];

export function SupportScreen() {
  const navigation = useNavigation<Nav>();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleCall = () => {
    Linking.openURL('tel:+593984037949');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/593984037949?text=Hola,%20necesito%20soporte%20Going%20Conductor');
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Campos requeridos', 'Completa el asunto y el mensaje.');
      return;
    }
    // El backend aún no tiene /support/ticket. Para no perder el contenido
    // que la persona conductora escribió, abrimos WhatsApp con el subject +
    // mensaje pre-llenados — la conversación queda en el canal real de
    // soporte. Cuando el endpoint exista, este flujo cambia a POST directo.
    const composed = `*${subject.trim()}*\n\n${message.trim()}`;
    const url = `https://wa.me/593984037949?text=${encodeURIComponent(composed)}`;
    Linking.openURL(url).then(() => {
      setSubject('');
      setMessage('');
      setShowContactForm(false);
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Banner Asistente Going App (voz IA + handoff a humano) ──
          Acceso prioritario al asistente de voz Uyari. Llamada PSTN al
          backend voice-call-service deployado en Cloud Run. */}
      <TouchableOpacity
        style={styles.assistantBanner}
        onPress={() => navigation.navigate('Assistant')}
        activeOpacity={0.85}
      >
        <View style={styles.assistantBannerIcon}>
          <Ionicons name="mic" size={22} color={GOING_YELLOW} />
        </View>
        <View style={styles.assistantBannerBody}>
          <Text style={styles.assistantBannerTitle}>Asistente Going App</Text>
          <Text style={styles.assistantBannerSub}>
            Llama y habla con nuestro AI o un operador humano · 24/7
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Quick contact */}
      <View style={styles.contactRow}>
        <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
          <Ionicons name="call-outline" size={22} color={GOING_BLUE} />
          <Text style={styles.contactLabel}>Llamar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' + '15' }]} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          <Text style={[styles.contactLabel, { color: '#25D366' }]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactBtn} onPress={() => setShowContactForm(!showContactForm)}>
          <Ionicons name="mail-outline" size={22} color={GOING_BLUE} />
          <Text style={styles.contactLabel}>Escribir</Text>
        </TouchableOpacity>
      </View>

      {/* Contact form (toggle) */}
      {showContactForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enviar ticket de soporte</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Asunto"
            placeholderTextColor="#9CA3AF"
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.formInput, styles.formTextarea]}
            placeholder="Describe tu problema o consulta..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.submitBtn, (!subject.trim() || !message.trim()) && styles.submitBtnDisabled]}
            onPress={handleSubmitTicket}
            disabled={sending || !subject.trim() || !message.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Enviar ticket</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* FAQ */}
      <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
      {FAQ.map((item, index) => {
        const expanded = expandedFaq === index;
        return (
          <TouchableOpacity
            key={index}
            style={styles.faqCard}
            onPress={() => toggleFaq(index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.q}</Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9CA3AF"
              />
            </View>
            {expanded && <Text style={styles.faqAnswer}>{item.a}</Text>}
          </TouchableOpacity>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 16, paddingTop: 16 },

  // Assistant banner (top priority)
  assistantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GOING_BLUE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    shadowColor: GOING_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  assistantBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantBannerBody: { flex: 1 },
  assistantBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  assistantBannerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 15,
  },

  // Quick contact
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  contactBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 16, borderRadius: 14, backgroundColor: `${GOING_BLUE}08`,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  contactLabel: { fontSize: 12, fontWeight: '700', color: GOING_BLUE },

  // Contact form
  formCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  formTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  formInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  formTextarea: { minHeight: 90 },
  submitBtn: {
    paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: GOING_BLUE,
  },
  submitBtnDisabled: { backgroundColor: '#D1D5DB' },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // FAQ section
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  faqCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  faqAnswer: { fontSize: 13, color: '#4B5563', marginTop: 10, lineHeight: 19 },
});
