/**
 * AssistantScreen — Asistente Going por voz
 *
 * Pantalla dedicada al "Asistente Going" (alias Uyari) — el agente de voz
 * que responde llamadas, asiste con cotizaciones, ayuda con dudas y escala
 * a operador humano cuando hace falta.
 *
 * Versión MVP (soft launch v2.0):
 *   · Botón principal "Llamar al Asistente" → abre el dial del celular y
 *     marca al número Twilio de Going (+593 2 401 8841). Funciona en
 *     CUALQUIER teléfono Android/iOS sin permisos de micrófono, sin
 *     handling de PCM, sin latencia variable.
 *   · La llamada entra al voice-call-service (Uyari) deployado en Cloud Run
 *     que ya tiene OpenAI Realtime + tools de cotización + handoff PSTN
 *     a operador humano vía Telegram alert + Twilio Dial.
 *
 * Versión 2.1 (post-launch — diferido):
 *   · WebSocket in-app con react-native-webrtc para conversación full
 *     duplex sin usar la línea PSTN. Requiere streaming PCM16 24kHz
 *     bidireccional, audio worklet nativo, manejo de barge-in.
 *
 * Theme: adaptativo (light/dark/tourism). Brand red dominante.
 */
import React, { useCallback, useMemo, useState } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useTheme, type ThemeTokens } from '../../theme';
import { hapticLight, hapticMedium } from '../../utils/haptics';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// Número Twilio Going Voice — backend Uyari (voice-call-service). El número
// vive como TWILIO_VOICE_NUMBER en el env del service; acá lo hardcodeamos
// porque es display/dial y no cambia sin redeploy de la app.
const ASSISTANT_PHONE         = '+59324018841';
const ASSISTANT_PHONE_DISPLAY = '+593 2 401 8841';

// WhatsApp Going — fallback texto + soporte operador.
const WHATSAPP_PHONE          = '+593984037949';
const WHATSAPP_DISPLAY        = '+593 98 403 7949';

export function AssistantScreen() {
  const navigation = useNavigation<Nav>();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  // Estado mínimo: tracking si el user disparó la llamada (para UI feedback).
  const [calling, setCalling] = useState(false);

  // ── Acciones ──────────────────────────────────────────────
  const handleCallAssistant = useCallback(async () => {
    hapticMedium();
    setCalling(true);
    try {
      const url = `tel:${ASSISTANT_PHONE}`;
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          'No se puede llamar',
          'Tu dispositivo no soporta llamadas telefónicas. Usá WhatsApp o el soporte por chat.',
        );
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'No pudimos abrir el marcador. Intentá de nuevo.');
    } finally {
      // Pequeño delay antes de bajar el flag — UX: el botón queda en estado
      // "llamando" mientras el dialer se abre.
      setTimeout(() => setCalling(false), 1500);
    }
  }, []);

  const handleOpenWhatsapp = useCallback(async () => {
    hapticLight();
    const url = `https://wa.me/${WHATSAPP_PHONE.replace(/\D/g, '')}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Asegurate de tenerlo instalado.'),
    );
  }, []);

  const handleOpenSupport = useCallback(() => {
    hapticLight();
    navigation.navigate('UserSupport');
  }, [navigation]);

  // ── Render ────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="mic" size={42} color={tokens.brandYellow} />
        </View>
        <Text style={styles.heroTitle}>Asistente Going</Text>
        <Text style={styles.heroSubtitle}>
          Hablá con Going como con un amigo. Te ayudo con cotizaciones,
          horarios, rutas y cualquier duda. Estoy disponible 24/7.
        </Text>
      </View>

      {/* CTA principal — Llamar */}
      <TouchableOpacity
        style={[styles.callButton, calling && styles.callButtonActive]}
        onPress={handleCallAssistant}
        activeOpacity={0.85}
        accessibilityLabel="Llamar al Asistente Going"
      >
        <View style={styles.callButtonInner}>
          <Ionicons
            name={calling ? 'call' : 'call-outline'}
            size={28}
            color={tokens.textOnRed}
          />
          <View style={styles.callTextWrap}>
            <Text style={styles.callButtonTitle}>
              {calling ? 'Abriendo llamada...' : 'Llamar al Asistente'}
            </Text>
            <Text style={styles.callButtonPhone}>{ASSISTANT_PHONE_DISPLAY}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={tokens.textOnRed} />
        </View>
      </TouchableOpacity>

      <Text style={styles.callHint}>
        Tu operadora puede aplicar tarifas locales de llamada. La conversación
        con Going es siempre gratuita.
      </Text>

      {/* Qué puedo preguntarle */}
      <Text style={styles.sectionLabel}>¿Qué le puedo preguntar?</Text>
      <View style={styles.examplesCard}>
        {[
          { icon: 'cash-outline',     text: '"¿Cuánto cuesta de Quito a Ambato compartido?"' },
          { icon: 'time-outline',     text: '"¿A qué hora sale el próximo bus a Riobamba?"' },
          { icon: 'cube-outline',     text: '"Quiero enviar un paquete a Latacunga"' },
          { icon: 'help-circle-outline', text: '"¿Cómo cancelo un viaje programado?"' },
          { icon: 'person-outline',   text: '"Necesito hablar con una persona humana"' },
        ].map((ex, i) => (
          <View key={i} style={styles.exampleRow}>
            <Ionicons name={ex.icon as any} size={18} color={tokens.brandRed} />
            <Text style={styles.exampleText}>{ex.text}</Text>
          </View>
        ))}
      </View>

      {/* Canales alternos */}
      <Text style={styles.sectionLabel}>¿Preferís otra forma?</Text>
      <View style={styles.alternativesCard}>
        <TouchableOpacity
          style={styles.alternativeRow}
          onPress={handleOpenWhatsapp}
          activeOpacity={0.7}
        >
          <View style={[styles.altIcon, { backgroundColor: '#25D36615' }]}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          </View>
          <View style={styles.altBody}>
            <Text style={styles.altTitle}>WhatsApp Going</Text>
            <Text style={styles.altSubtitle}>{WHATSAPP_DISPLAY} · respondemos en minutos</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tokens.textTertiary} />
        </TouchableOpacity>

        <View style={styles.altDivider} />

        <TouchableOpacity
          style={styles.alternativeRow}
          onPress={handleOpenSupport}
          activeOpacity={0.7}
        >
          <View style={[styles.altIcon, { backgroundColor: `${tokens.brandNavy}15` }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={tokens.brandNavy} />
          </View>
          <View style={styles.altBody}>
            <Text style={styles.altTitle}>Chat en la app</Text>
            <Text style={styles.altSubtitle}>Tickets y reclamos formales</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tokens.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={18} color={tokens.brandRed} />
        <Text style={styles.infoText}>
          <Text style={styles.infoTextBold}>Privacidad:</Text>{' '}
          Las llamadas con el Asistente Going se procesan respetando la Ley
          Orgánica de Protección de Datos Personales (LOPDP) del Ecuador. Si
          activás la función SOS durante un viaje, podemos compartir tu
          ubicación con tus contactos de confianza.
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content:   { paddingHorizontal: 16, paddingBottom: 16 },

    // Hero
    hero: {
      alignItems: 'center',
      paddingTop: 24,
      paddingBottom: 28,
    },
    heroIcon: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: t.brandRed,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: t.brandRed,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: t.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 16,
    },

    // Call button
    callButton: {
      backgroundColor: t.brandRed,
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
      shadowColor: t.brandRed,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    callButtonActive: {
      opacity: 0.85,
    },
    callButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    callTextWrap: { flex: 1 },
    callButtonTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: t.textOnRed,
      marginBottom: 2,
    },
    callButtonPhone: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      fontWeight: '600',
    },
    callHint: {
      fontSize: 11,
      color: t.textTertiary,
      textAlign: 'center',
      lineHeight: 16,
      marginBottom: 24,
      paddingHorizontal: 12,
    },

    // Section label
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: t.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 8,
      marginBottom: 10,
      marginLeft: 4,
    },

    // Examples card
    examplesCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 14,
      padding: 14,
      gap: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: t.glassBorder,
    },
    exampleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    exampleText: {
      flex: 1,
      fontSize: 13,
      color: t.textSecondary,
      fontStyle: 'italic',
      lineHeight: 18,
    },

    // Alternatives card
    alternativesCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 14,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: t.glassBorder,
      overflow: 'hidden',
    },
    alternativeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
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
      color: t.textPrimary,
      marginBottom: 2,
    },
    altSubtitle: {
      fontSize: 12,
      color: t.textTertiary,
    },
    altDivider: {
      height: 1,
      backgroundColor: t.border,
      marginLeft: 66,
    },

    // Info card
    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: `${t.brandRed}0D`,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: `${t.brandRed}33`,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 17,
    },
    infoTextBold: {
      fontWeight: '800',
      color: t.textPrimary,
    },
  });
}
