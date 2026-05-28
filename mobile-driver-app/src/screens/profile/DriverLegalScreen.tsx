/**
 * DriverLegalScreen
 *
 * Centro Legal accesible desde el perfil de conductoras y conductores Going.
 * Reúne los documentos obligatorios bajo la legislación ecuatoriana (LOTTTSV
 * + LOPDP + Código del Trabajo / contratista independiente) y los específicos
 * para quienes operan en la plataforma:
 *
 *  · Normativa de Conductoras y Conductores
 *  · Guías de la Driver App (Driver App)
 *  · Estándares Mínimos de Seguridad (vehículo + persona)
 *  · Política de Cero Tolerancia (alcohol/drogas)
 *  · Tu Primer Viaje (onboarding)
 *  · Estándares de Bienestar / Wellness Guard (4h descanso, 12h tope diario)
 *  · Política de Privacidad (LOPDP)
 *  · Términos y Condiciones del Conductor
 *
 * El contenido completo vive en app.goingec.com/legal/* — esta pantalla los
 * resume y abre la versión web en el navegador del sistema.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NAVY   = '#FF4C41';
const YELLOW = '#FFD253';
const LEGAL_BASE = 'https://app.goingec.com/legal';

interface LegalDoc {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  summary: string;
  url: string;
  mandatory?: boolean;
}

const LEGAL_DOCS: LegalDoc[] = [
  {
    icon: 'document-text',
    title: 'Términos y Condiciones',
    summary:
      'Reglas generales que rigen tu uso de la plataforma Going como conductora o conductor.',
    url: `${LEGAL_BASE}/terms`,
    mandatory: true,
  },
  {
    icon: 'car-sport',
    title: 'Normativa de Conductoras y Conductores',
    summary:
      'Tus derechos, obligaciones y compromisos como prestadora o prestador independiente del servicio.',
    url: `${LEGAL_BASE}/conductores`,
    mandatory: true,
  },
  {
    icon: 'phone-portrait',
    title: 'Guías de la Driver App',
    summary:
      'Procedimientos operativos diarios: aceptación de viajes, pausas, modo híbrido urbano/interurbano.',
    url: `${LEGAL_BASE}/conductores-app`,
  },
  {
    icon: 'shield-checkmark',
    title: 'Estándares Mínimos de Seguridad',
    summary:
      'Requisitos técnicos del vehículo (airbags, ABS, ESC, cinturones) y de la operación segura.',
    url: `${LEGAL_BASE}/conductores-seguridad`,
    mandatory: true,
  },
  {
    icon: 'alert-circle',
    title: 'Política de Cero Tolerancia',
    summary:
      'Prohibición absoluta de alcohol y sustancias. Protocolo de reporte si te niegas a un viaje por causa segura.',
    url: `${LEGAL_BASE}/cero-tolerancia`,
    mandatory: true,
  },
  {
    icon: 'school',
    title: 'Tu Primer Viaje con Going',
    summary:
      'Guía paso a paso para tu primera carrera: preparación del vehículo, encuentro con la persona pasajera.',
    url: `${LEGAL_BASE}/conductores-elegirnos`,
  },
  {
    icon: 'lock-closed',
    title: 'Política de Privacidad (LOPDP)',
    summary:
      'Cómo Going recopila y trata tus datos personales. Tus derechos ARCO conforme a la legislación ecuatoriana.',
    url: `${LEGAL_BASE}/privacy`,
    mandatory: true,
  },
  {
    icon: 'people',
    title: 'Normas Comunitarias',
    summary:
      'Reglas de convivencia con personas pasajeras y otras conductoras y conductores: respeto, inclusión, no discriminación.',
    url: `${LEGAL_BASE}/comunidad`,
  },
  {
    icon: 'cube',
    title: 'Manejo de Envíos (Capacitación)',
    summary:
      'Protocolo de recolección, transporte y entrega de paquetes. Verificación de destinatario y código OTP.',
    url: `${LEGAL_BASE}/envios-manejo`,
  },
  {
    icon: 'ban',
    title: 'Artículos Prohibidos en Envíos',
    summary:
      'Lista de productos que no puedes transportar en Going Envíos (sustancias, armas, productos restringidos).',
    url: `${LEGAL_BASE}/envios-prohibidos`,
  },
];

export function DriverLegalScreen() {
  const handleOpen = (url: string) => {
    Linking.openURL(url).catch(() => {
      // si falla, abrir el hub legal completo como fallback
      Linking.openURL(LEGAL_BASE);
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Centro Legal Going</Text>
        <Text style={styles.subtitle}>
          Documentos que rigen tu actividad como conductora o conductor en la
          plataforma Going.
        </Text>
      </View>

      {/* Aviso bienestar */}
      <View style={styles.wellnessCard}>
        <View style={styles.wellnessHeader}>
          <Ionicons name="heart" size={20} color={YELLOW} />
          <Text style={styles.wellnessTitle}>Bienestar de Conductoras y Conductores</Text>
        </View>
        <Text style={styles.wellnessText}>
          Going aplica reglas automáticas para cuidar tu salud: descanso
          forzado de 15 minutos cada 4 horas de manejo continuo, tope diario
          de 12 horas conectado, bloqueo de 8 horas para garantizar tu sueño.
          La fatiga del viaje interurbano se computa 1,5x.
        </Text>
      </View>

      {/* Obligatorios */}
      <Text style={styles.sectionLabel}>Lectura obligatoria</Text>
      {LEGAL_DOCS.filter(d => d.mandatory).map(doc => (
        <TouchableOpacity
          key={doc.title}
          style={[styles.docCard, styles.docCardMandatory]}
          onPress={() => handleOpen(doc.url)}
          activeOpacity={0.7}
        >
          <View style={[styles.docIcon, styles.docIconMandatory]}>
            <Ionicons name={doc.icon} size={20} color="#fff" />
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
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      ))}

      {/* Complementarios */}
      <Text style={styles.sectionLabel}>Documentos complementarios</Text>
      {LEGAL_DOCS.filter(d => !d.mandatory).map(doc => (
        <TouchableOpacity
          key={doc.title}
          style={styles.docCard}
          onPress={() => handleOpen(doc.url)}
          activeOpacity={0.7}
        >
          <View style={styles.docIcon}>
            <Ionicons name={doc.icon} size={20} color={NAVY} />
          </View>
          <View style={styles.docBody}>
            <Text style={styles.docTitle}>{doc.title}</Text>
            <Text style={styles.docSummary}>{doc.summary}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      ))}

      {/* Centro legal completo */}
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => handleOpen(LEGAL_BASE)}
        activeOpacity={0.8}
      >
        <Text style={styles.viewAllText}>Ver Centro Legal completo</Text>
        <Ionicons name="open-outline" size={16} color="#fff" />
      </TouchableOpacity>

      {/* Razón social */}
      <View style={styles.companyCard}>
        <Text style={styles.companyLabel}>Empresa responsable</Text>
        <Text style={styles.companyText}>
          Going es una marca operada por{' '}
          <Text style={styles.companyBold}>Thorn AI Technologies S.A.S.</Text>,
          RUC <Text style={styles.companyBold}>1793176925001</Text>, con
          domicilio en Echeverría N2-170 y Crespo Toral, Quito, Ecuador.
        </Text>
        <View style={styles.contactRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:soporte@goingec.com')}
          >
            <Text style={styles.contactLink}>soporte@goingec.com</Text>
          </TouchableOpacity>
          <Text style={styles.contactSep}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:privacidad@goingec.com')}
          >
            <Text style={styles.contactLink}>privacidad@goingec.com</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://wa.me/593984037949')}
          style={styles.whatsappBtn}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
          <Text style={styles.whatsappText}>WhatsApp Going +593 98 403 7949</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 16 },

  // Header
  header: { paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19 },

  // Wellness card
  wellnessCard: {
    backgroundColor: NAVY,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    marginBottom: 20,
  },
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  wellnessTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  wellnessText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 17 },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10,
  },

  // Doc card
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  docCardMandatory: { borderLeftWidth: 3, borderLeftColor: YELLOW },
  docIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docIconMandatory: { backgroundColor: NAVY },
  docBody: { flex: 1 },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  docTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  docSummary: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  mandatoryBadge: {
    backgroundColor: YELLOW,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandatoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 0.5,
  },

  // View all
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: NAVY,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 8,
    marginBottom: 24,
  },
  viewAllText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Company
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  companyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  companyText: { fontSize: 12, color: '#4B5563', lineHeight: 18, marginBottom: 10 },
  companyBold: { fontWeight: '800', color: '#111827' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  contactLink: { fontSize: 12, color: NAVY, fontWeight: '700' },
  contactSep: { color: '#9CA3AF' },
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
