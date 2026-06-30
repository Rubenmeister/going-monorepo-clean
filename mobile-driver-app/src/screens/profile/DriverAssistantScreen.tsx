/**
 * DriverAssistantScreen — Asistente Going App para conductoras y conductores.
 *
 * Análogo al AssistantScreen del mobile-user-app pero adaptado al contexto
 * de quien conduce:
 *
 *   · CTA principal "Llamar al Equipo Going App" — abre dial al número Twilio
 *     voice-call-service (Uyari). El AI atiende y puede:
 *       - resolver dudas operativas (cómo aceptar viaje, cómo cobrar)
 *       - explicar reglas (cero tolerancia, modo híbrido, wellness guard)
 *       - escalar a operador humano si hay incidencia con un viaje activo
 *   · Bloque "¿Qué le puedo preguntar?" con preguntas típicas del conductor
 *   · WhatsApp directo para mensajes (alternativa a llamada)
 *   · Banner LOPDP — privacidad de las llamadas
 *
 * Diseño: NAVY (alias del brandRed Going App) como acento principal, igual que
 * el resto de la driver-app. Sin theme adaptativo (driver-app no tiene
 * tokens semánticos todavía — eso es follow-up post-launch).
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';

// Número Twilio del voice-call-service (Uyari). Vive como TWILIO_VOICE_NUMBER
// en el env del backend; acá display + dial hardcodeado.
const ASSISTANT_PHONE         = '+59324018841';
const ASSISTANT_PHONE_DISPLAY = '+593 2 401 8841';

const WHATSAPP_PHONE          = '+593984037949';
const WHATSAPP_DISPLAY        = '+593 98 403 7949';

export function DriverAssistantScreen() {
  const navigation = useNavigation<any>();
  const [calling, setCalling] = useState(false);

  const handleCallAssistant = useCallback(async () => {
    setCalling(true);
    try {
      const url = `tel:${ASSISTANT_PHONE}`;
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          'No se puede llamar',
          'Tu dispositivo no soporta llamadas telefónicas. Usa WhatsApp.',
        );
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'No pudimos abrir el marcador. Intenta de nuevo.');
    } finally {
      setTimeout(() => setCalling(false), 1500);
    }
  }, []);

  const handleOpenWhatsapp = useCallback(() => {
    const url = `https://wa.me/${WHATSAPP_PHONE.replace(/\D/g, '')}?text=Hola%2C%20soy%20conductor%20Going%20y%20necesito%20soporte`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Asegúrate de tenerlo instalado.'),
    );
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="mic" size={40} color={COLORS.brandYellow} />
        </View>
        <Text style={styles.heroTitle}>Asistente Going App</Text>
        <Text style={styles.heroSubtitle}>
          ¿Tienes una duda durante un viaje? ¿Necesitas ayuda con un cobro o
          una emergencia? Llama al Asistente Going App. Estamos 24/7.
        </Text>
      </View>

      {/* CTA principal */}
      <TouchableOpacity
        style={[styles.callButton, calling && styles.callButtonActive]}
        onPress={handleCallAssistant}
        activeOpacity={0.85}
        accessibilityLabel="Llamar al Asistente Going App"
      >
        <Ionicons
          name={calling ? 'call' : 'call-outline'}
          size={28}
          color={COLORS.textOnRed}
        />
        <View style={styles.callTextWrap}>
          <Text style={styles.callButtonTitle}>
            {calling ? 'Abriendo llamada...' : 'Llamar al Equipo Going App'}
          </Text>
          <Text style={styles.callButtonPhone}>{ASSISTANT_PHONE_DISPLAY}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={COLORS.textOnRed} />
      </TouchableOpacity>

      <Text style={styles.callHint}>
        Tu operadora puede aplicar tarifas locales de llamada. La conversación
        con Going App es siempre gratuita.
      </Text>

      {/* Chat de texto con el asistente (Ola 4 — soporte a conductores) */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate('DriverSupportChat')}
        activeOpacity={0.85}
        accessibilityLabel="Abrir soporte por chat"
      >
        <View style={styles.chatIcon}>
          <Ionicons name="chatbubbles" size={20} color={COLORS.NAVY} />
        </View>
        <View style={styles.callTextWrap}>
          <Text style={styles.chatButtonTitle}>Chatear con el asistente</Text>
          <Text style={styles.chatButtonSub}>Soporte por texto, al instante</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>

      {/* Qué puedo preguntarle */}
      <Text style={styles.sectionLabel}>¿Qué le puedo preguntar?</Text>
      <View style={styles.examplesCard}>
        {[
          { icon: 'cash-outline',         text: '"¿Cómo retiro mis ganancias a mi cuenta bancaria?"' },
          { icon: 'car-sport-outline',    text: '"¿Cómo activo el modo interurbano?"' },
          { icon: 'document-text-outline',text: '"Mi licencia se vence pronto, ¿qué hago?"' },
          { icon: 'warning-outline',      text: '"Tengo un problema con un pasajero en el viaje"' },
          { icon: 'person-outline',       text: '"Necesito hablar con una persona del equipo"' },
        ].map((ex, i) => (
          <View key={i} style={styles.exampleRow}>
            <Ionicons name={ex.icon as any} size={18} color={COLORS.NAVY} />
            <Text style={styles.exampleText}>{ex.text}</Text>
          </View>
        ))}
      </View>

      {/* Alternativa WhatsApp */}
      <Text style={styles.sectionLabel}>¿Prefieres escribir?</Text>
      <TouchableOpacity
        style={styles.altCard}
        onPress={handleOpenWhatsapp}
        activeOpacity={0.7}
      >
        <View style={[styles.altIcon, { backgroundColor: COLORS.whatsappBg }]}>
          <Ionicons name="logo-whatsapp" size={22} color={COLORS.whatsapp} />
        </View>
        <View style={styles.altBody}>
          <Text style={styles.altTitle}>WhatsApp Going App</Text>
          <Text style={styles.altSubtitle}>
            {WHATSAPP_DISPLAY} · soporte conductor en minutos
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
      </TouchableOpacity>

      {/* Bloque emergencia destacado */}
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyHeader}>
          <Ionicons name="alert-circle" size={20} color={COLORS.brandRed} />
          <Text style={styles.emergencyTitle}>¿Es una emergencia?</Text>
        </View>
        <Text style={styles.emergencyText}>
          Si estás en peligro o tenés una situación crítica durante un viaje:
        </Text>
        <View style={styles.emergencyRow}>
          <Ionicons name="call" size={16} color={COLORS.brandRed} />
          <Text style={styles.emergencyBold}>911 Ecuador</Text>
          <Text style={styles.emergencyText}> · emergencias</Text>
        </View>
        <View style={styles.emergencyRow}>
          <Ionicons name="call" size={16} color={COLORS.NAVY} />
          <Text style={styles.emergencyBold}>{ASSISTANT_PHONE_DISPLAY}</Text>
          <Text style={styles.emergencyText}> · Asistente Going App con handoff a operador</Text>
        </View>
      </View>

      {/* Info LOPDP */}
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={18} color={COLORS.NAVY} />
        <Text style={styles.infoText}>
          <Text style={styles.infoTextBold}>Privacidad:</Text>{' '}
          Las llamadas con el Asistente Going App se procesan respetando la Ley
          Orgánica de Protección de Datos Personales (LOPDP) del Ecuador.
          Se conserva un registro de la llamada para mejorar el servicio.
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content:   { paddingHorizontal: 16, paddingBottom: 16 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 14,
  },

  // Call button
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.NAVY,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: COLORS.NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  callButtonActive: { opacity: 0.85 },
  callTextWrap: { flex: 1 },
  callButtonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textOnRed,
    marginBottom: 2,
  },
  callButtonPhone: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  callHint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
  },

  // Chat button (texto)
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.bgLayer,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${COLORS.NAVY}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  chatButtonSub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Examples
  examplesCard: {
    backgroundColor: COLORS.bgLayer,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  exampleText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Alt card
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgLayer,
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  altIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altBody: { flex: 1 },
  altTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  altSubtitle: { fontSize: 12, color: COLORS.textTertiary },

  // Emergency
  emergencyCard: {
    backgroundColor: COLORS.errorBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${COLORS.brandRed}33`,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emergencyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  emergencyBold: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // Info LOPDP
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${COLORS.NAVY}0D`,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${COLORS.NAVY}33`,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  infoTextBold: {
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
