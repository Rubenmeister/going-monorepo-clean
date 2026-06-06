/**
 * UserLegalScreen
 *
 * Centro Legal in-app para personas usuarias de Going App (pasajeras / pasajeros
 * y remitentes de envíos). Reúne los documentos del Marco Legal Integral
 * aplicables a quienes usan la plataforma:
 *
 *  Lectura obligatoria:
 *   · Términos y Condiciones de Uso
 *   · Política de Privacidad (LOPDP Ecuador)
 *   · Aceptación de Uso de Datos
 *   · Política de Cero Tolerancia
 *
 *  Documentos complementarios:
 *   · Normas Comunitarias
 *   · Asistencia al Usuario
 *   · Compartir en Caso de Emergencia (SOS)
 *   · Términos de Pago del Servicio
 *   · Condiciones de Going App Envíos
 *   · Artículos Prohibidos en Envíos
 *   · Programa de Referidos
 *   · Tarjeta de Regalo Going App
 *
 * Los obligatorios T&C y Privacidad navegan a las pantallas internas (que ya
 * tienen el texto completo). El resto abre la versión completa en
 * app.goingec.com/legal/* dentro del navegador del sistema.
 *
 * Theme adaptativo (light + dark + tourism).
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@navigation/MainNavigator';
import { useTheme, type ThemeTokens } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const LEGAL_BASE = 'https://app.goingec.com/legal';

interface LegalDoc {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  summary: string;
  /** Si se define, navega a esta pantalla interna. */
  screen?: keyof MainStackParamList;
  /** Si se define, abre esta URL en el navegador. */
  url?: string;
  mandatory?: boolean;
}

const MANDATORY: LegalDoc[] = [
  {
    icon: 'document-text',
    title: 'Términos y Condiciones',
    summary:
      'Las reglas generales que rigen tu uso de la plataforma Going App como persona usuaria.',
    screen: 'Terms',
    mandatory: true,
  },
  {
    icon: 'lock-closed',
    title: 'Política de Privacidad (LOPDP)',
    summary:
      'Cómo recopilamos y tratamos tus datos personales. Tus derechos ARCO conforme a la legislación ecuatoriana.',
    screen: 'Privacy',
    mandatory: true,
  },
  {
    icon: 'checkbox',
    title: 'Aceptación de Uso de Datos',
    summary:
      'El consentimiento expreso que otorgas al registrarte: qué datos se recopilan, finalidad y cómo revocarlo.',
    url: `${LEGAL_BASE}/aceptacion-datos`,
    mandatory: true,
  },
  {
    icon: 'alert-circle',
    title: 'Política de Cero Tolerancia',
    summary:
      'Prohibición absoluta de alcohol y sustancias durante el servicio. Qué hacer si encuentras una conductora o conductor en esa condición.',
    url: `${LEGAL_BASE}/cero-tolerancia`,
    mandatory: true,
  },
];

const COMPLEMENTARY: LegalDoc[] = [
  {
    icon: 'people',
    title: 'Normas Comunitarias',
    summary:
      'Reglas de convivencia con conductoras, conductores y otras personas usuarias: respeto, inclusión, no discriminación.',
    url: `${LEGAL_BASE}/comunidad`,
  },
  {
    icon: 'help-circle',
    title: 'Asistencia al Usuario',
    summary:
      'Cómo abrir un reclamo o solicitar soporte. Canales oficiales: WhatsApp, chat en app y email.',
    url: `${LEGAL_BASE}/usuarios-asistencia`,
  },
  {
    icon: 'shield-checkmark',
    title: 'Compartir en Caso de Emergencia',
    summary:
      'Cómo funciona la función SOS, compartir viaje en tiempo real y protocolo de emergencia.',
    url: `${LEGAL_BASE}/usuarios-emergencia`,
  },
  {
    icon: 'card',
    title: 'Términos de Pago del Servicio',
    summary:
      'Medios habilitados en Ecuador, facturación SRI, reembolsos y resolución de disputas.',
    url: `${LEGAL_BASE}/pagos`,
  },
  {
    icon: 'cube',
    title: 'Condiciones de Going App Envíos',
    summary:
      'Términos del servicio de envío de paquetes: cobertura, peso, valor, seguros y responsabilidades.',
    url: `${LEGAL_BASE}/envios-condiciones`,
  },
  {
    icon: 'ban',
    title: 'Artículos Prohibidos en Envíos',
    summary:
      'Productos que no pueden enviarse por Going App (sustancias, armas, productos restringidos).',
    url: `${LEGAL_BASE}/envios-prohibidos`,
  },
  {
    icon: 'gift',
    title: 'Programa de Referidos',
    summary:
      'Cómo invitar amistades a Going App y ganar crédito Going App Cash cuando completen su primer viaje.',
    url: `${LEGAL_BASE}/referidos`,
  },
  {
    icon: 'wallet',
    title: 'Tarjeta de Regalo Going App',
    summary:
      'Condiciones de compra, canje y vigencia de las tarjetas de regalo (físicas y digitales).',
    url: `${LEGAL_BASE}/tarjeta-regalo`,
  },
];

export function UserLegalScreen() {
  const navigation = useNavigation<Nav>();
  const { tokens, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(tokens, isDark), [tokens, isDark]);

  const handleOpen = (doc: LegalDoc) => {
    if (doc.screen) {
      (navigation.navigate as any)(doc.screen);
    } else if (doc.url) {
      Linking.openURL(doc.url).catch(() => {
        Linking.openURL(LEGAL_BASE);
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Centro Legal Going App</Text>
        <Text style={styles.subtitle}>
          Documentos que rigen tu uso de la plataforma y los derechos que
          tienes sobre tus datos personales en Ecuador.
        </Text>
      </View>

      {/* Aviso SOS */}
      <View style={styles.sosCard}>
        <View style={styles.sosHeader}>
          <Ionicons name="shield-checkmark" size={20} color={tokens.brandYellow} />
          <Text style={styles.sosTitle}>Tu seguridad es prioridad</Text>
        </View>
        <Text style={styles.sosText}>
          En cualquier viaje activo puedes activar el SOS desde la pantalla
          del viaje, compartir tu ubicación con contactos de confianza y
          llamar directo al ECU 911 desde la app. Going App registra cada
          incidente para tu protección.
        </Text>
      </View>

      {/* Obligatorios */}
      <Text style={styles.sectionLabel}>Lectura obligatoria</Text>
      {MANDATORY.map(doc => (
        <TouchableOpacity
          key={doc.title}
          style={[styles.docCard, styles.docCardMandatory]}
          onPress={() => handleOpen(doc)}
          activeOpacity={0.7}
        >
          <View style={[styles.docIcon, styles.docIconMandatory]}>
            <Ionicons name={doc.icon} size={20} color={tokens.textOnNavy} />
          </View>
          <View style={styles.docBody}>
            <View style={styles.docTitleRow}>
              <Text style={styles.docTitle}>{doc.title}</Text>
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryBadgeText}>OBLIGATORIO</Text>
              </View>
            </View>
            <Text style={styles.docSummary}>{doc.summary}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tokens.textTertiary} />
        </TouchableOpacity>
      ))}

      {/* Complementarios */}
      <Text style={styles.sectionLabel}>Documentos complementarios</Text>
      {COMPLEMENTARY.map(doc => (
        <TouchableOpacity
          key={doc.title}
          style={styles.docCard}
          onPress={() => handleOpen(doc)}
          activeOpacity={0.7}
        >
          <View style={styles.docIcon}>
            <Ionicons name={doc.icon} size={20} color={tokens.brandNavy} />
          </View>
          <View style={styles.docBody}>
            <Text style={styles.docTitle}>{doc.title}</Text>
            <Text style={styles.docSummary}>{doc.summary}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tokens.textTertiary} />
        </TouchableOpacity>
      ))}

      {/* Centro legal completo */}
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => Linking.openURL(LEGAL_BASE)}
        activeOpacity={0.85}
      >
        <Text style={styles.viewAllText}>Ver Centro Legal completo</Text>
        <Ionicons name="open-outline" size={16} color={tokens.textOnNavy} />
      </TouchableOpacity>

      {/* Razón social */}
      <View style={styles.companyCard}>
        <Text style={styles.companyLabel}>Empresa responsable</Text>
        <Text style={styles.companyText}>
          Going App es una marca operada por{' '}
          <Text style={styles.companyBold}>Thorn AI Technologies S.A.S.</Text>,
          RUC <Text style={styles.companyBold}>1793176925001</Text>, con
          domicilio en Echeverría N2-170 y Crespo Toral, Quito, Ecuador.
        </Text>
        <View style={styles.contactRow}>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:soporte@goingec.com')}>
            <Text style={styles.contactLink}>soporte@goingec.com</Text>
          </TouchableOpacity>
          <Text style={styles.contactSep}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:privacidad@goingec.com')}>
            <Text style={styles.contactLink}>privacidad@goingec.com</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://wa.me/593984037949')}
          style={styles.whatsappBtn}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
          <Text style={styles.whatsappText}>WhatsApp Going App +593 98 403 7949</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function makeStyles(t: ThemeTokens, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 16 },

    // Header
    header: { paddingTop: 16, paddingBottom: 8 },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: t.textPrimary,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    subtitle: { fontSize: 13, color: t.textSecondary, lineHeight: 19 },

    // SOS card
    sosCard: {
      backgroundColor: t.brandNavy,
      borderRadius: 14,
      padding: 14,
      marginTop: 14,
      marginBottom: 20,
    },
    sosHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    sosTitle: { fontSize: 14, fontWeight: '800', color: t.textOnNavy },
    sosText: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 17,
    },

    // Section labels
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: t.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: 8,
      marginBottom: 10,
    },

    // Doc card
    docCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.bgLayer,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: t.glassBorder,
    },
    docCardMandatory: {
      borderLeftWidth: 3,
      borderLeftColor: t.brandYellow,
    },
    docIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: `${t.brandNavy}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    docIconMandatory: { backgroundColor: t.brandNavy },
    docBody: { flex: 1 },
    docTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 2,
    },
    docTitle: { fontSize: 14, fontWeight: '700', color: t.textPrimary },
    docSummary: {
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 17,
    },
    mandatoryBadge: {
      backgroundColor: t.brandYellow,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    mandatoryBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: t.textOnYellow,
      letterSpacing: 0.5,
    },

    // View all
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: t.brandNavy,
      borderRadius: 14,
      paddingVertical: 13,
      marginTop: 8,
      marginBottom: 24,
    },
    viewAllText: { color: t.textOnNavy, fontSize: 14, fontWeight: '700' },

    // Company
    companyCard: {
      backgroundColor: t.bgLayer,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: t.glassBorder,
    },
    companyLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: t.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    companyText: {
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 18,
      marginBottom: 10,
    },
    companyBold: { fontWeight: '800', color: t.textPrimary },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 10,
    },
    contactLink: { fontSize: 12, color: t.brandNavy, fontWeight: '700' },
    contactSep: { color: t.textTertiary },
    whatsappBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#25D36615',
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    whatsappText: { fontSize: 12, fontWeight: '700', color: '#25D366' },
  });
}
