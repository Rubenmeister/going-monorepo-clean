import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';

const RED  = '#F04E40';
const NAVY = '#131B2E';
const VERSION = '1.0';
const UPDATED = '13 de abril de 2026';

const SECTIONS = [
  {
    number: '1',
    title: 'Responsable del Tratamiento',
    body: 'Going Ecuador S.A.S. (en adelante "Going"), con RUC: 1793XXXXXXX001, domicilio en Av. Amazonas N23-45, Quito, Ecuador, es el Responsable del Tratamiento de tus datos personales.\n\nContacto del Delegado de Protección de Datos (DPD):\n• Correo: privacidad@goingec.com\n• Teléfono: +593 2 XXX-XXXX\n• Horario: lunes a viernes, 09h00 – 17h00\n\nEsta Política de Privacidad cumple con la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP, Registro Oficial No. 459 del 26 de mayo de 2021) y su Reglamento.',
  },
  {
    number: '2',
    title: 'Datos que Recopilamos',
    body: 'Recopilamos los siguientes tipos de datos personales:\n\nDatos de identidad: nombre completo, número de cédula o pasaporte, fecha de nacimiento, fotografía de perfil.\n\nDatos de contacto: correo electrónico, número de teléfono móvil, dirección de domicilio (opcional).\n\nDatos de geolocalización: ubicación en tiempo real durante el uso activo de la app, puntos de recogida y destino frecuentes.\n\nDatos de uso del servicio: historial de viajes y envíos, calificaciones otorgadas y recibidas, preferencias de servicio.\n\nDatos de pago: últimos 4 dígitos de tarjeta, tipo de tarjeta. Los datos completos de pago son procesados directamente por nuestro proveedor certificado PCI-DSS.\n\nDatos técnicos: dirección IP, identificador de dispositivo, sistema operativo, versión de la app, registros de acceso.',
  },
  {
    number: '3',
    title: 'Finalidades y Bases Legales del Tratamiento',
    body: 'Tratamos tus datos personales para las siguientes finalidades:\n\n1. Prestación del servicio (base: ejecución contractual): crear y gestionar tu cuenta, procesar reservas y pagos, conectarte con conductores, enviarte notificaciones operativas del viaje.\n\n2. Seguridad de la plataforma (base: interés legítimo): verificar identidades, prevenir fraude, gestionar la función SOS, investigar incidentes de seguridad.\n\n3. Mejora del servicio (base: interés legítimo): análisis de uso, optimización de rutas, desarrollo de nuevas funciones, encuestas de satisfacción.\n\n4. Comunicaciones de marketing (base: consentimiento): promociones, descuentos y novedades de Going. Puedes revocar este consentimiento en cualquier momento desde Configuración > Notificaciones.\n\n5. Cumplimiento legal (base: obligación legal): responder a requerimientos de autoridades competentes, cumplir obligaciones tributarias con el SRI.',
  },
  {
    number: '4',
    title: 'Transferencia de Datos a Terceros',
    body: 'Going no vende, alquila ni comercializa tus datos personales.\n\nCompartimos datos únicamente con:\n\n• Conductores: nombre, foto de perfil y ubicación de recogida (solo durante el servicio activo).\n• Procesadores de pago: datos de transacción necesarios para cobros y reembolsos (Stripe, PayPhone u operadores certificados PCI-DSS).\n• Servicios en la nube: Amazon Web Services (AWS) y Google Cloud Platform para almacenamiento y procesamiento seguro.\n• Proveedor de mapas: Mapbox Inc. para cálculo de rutas y visualización de mapas.\n• Autoridades públicas: Policía Nacional, Fiscalía, SENADI, SRI u otras, cuando sea requerido por ley o resolución judicial.\n\nTodas las transferencias internacionales de datos cumplen con el Artículo 54 de la LOPDP mediante cláusulas contractuales tipo aprobadas por la Autoridad de Protección de Datos.',
  },
  {
    number: '5',
    title: 'Geolocalización',
    body: 'La recopilación de tu ubicación es esencial para el funcionamiento de Going. Específicamente:\n\nUbicación en primer plano: activa mientras usas la app. Necesaria para mostrarte conductores disponibles, calcular tarifas y seguir tu viaje en tiempo real.\n\nUbicación en segundo plano: solo activamos esta función cuando un viaje está en curso, para garantizar tu seguridad y permitir el seguimiento.\n\nPuedes revocar el permiso de ubicación en cualquier momento desde la configuración de tu dispositivo, aunque esto impedirá el uso normal de la aplicación.\n\nTus datos de ubicación históricos se conservan por 24 meses para fines de seguridad y resolución de disputas. No usamos tu ubicación fuera del contexto de los servicios activos para publicidad.',
  },
  {
    number: '6',
    title: 'Conservación de Datos',
    body: 'Conservamos tus datos personales por los siguientes plazos:\n\n• Datos de cuenta activa: durante toda la vigencia de la relación contractual.\n• Historial de viajes y pagos: 7 años (obligación tributaria, Código Tributario ecuatoriano).\n• Datos de geolocalización histórica: 24 meses.\n• Registros de seguridad e incidentes: 5 años.\n• Comunicaciones de soporte: 3 años.\n• Datos de marketing (con consentimiento): hasta que revoques el consentimiento.\n\nUna vez vencidos estos plazos, procederemos a la anonimización o eliminación segura de los datos conforme al Art. 25 de la LOPDP.\n\nCuando solicites la eliminación de tu cuenta, aplicaremos los períodos de retención legal antes de la supresión definitiva.',
  },
  {
    number: '7',
    title: 'Tus Derechos ARCO+',
    body: 'De conformidad con la LOPDP, tienes los siguientes derechos sobre tus datos personales:\n\n• Acceso (Art. 68): conocer qué datos tenemos sobre ti y cómo los usamos.\n• Rectificación (Art. 69): corregir datos inexactos o incompletos.\n• Supresión (Art. 70): solicitar la eliminación de tus datos cuando ya no sean necesarios o revoques el consentimiento.\n• Oposición (Art. 71): oponerte al tratamiento para fines de marketing directo en cualquier momento.\n• Portabilidad (Art. 72): recibir tus datos en formato estructurado y legible por máquina.\n• Limitación del tratamiento (Art. 73): restringir el uso de tus datos en casos específicos.\n\nPara ejercer tus derechos, escríbenos a privacidad@goingec.com con el asunto "Ejercicio de derechos LOPDP", adjuntando copia de tu cédula o pasaporte. Responderemos en un plazo máximo de 15 días hábiles.',
  },
  {
    number: '8',
    title: 'Seguridad de la Información',
    body: 'Going Ecuador implementa medidas técnicas y organizativas apropiadas para proteger tus datos personales, incluyendo:\n\n• Cifrado TLS 1.3 para todas las comunicaciones entre la app y nuestros servidores.\n• Cifrado AES-256 para datos sensibles almacenados en base de datos.\n• Autenticación de dos factores (2FA) disponible para cuentas de usuario.\n• Acceso a datos personales restringido a empleados con necesidad legítima (principio de mínimo acceso).\n• Auditorías de seguridad periódicas y pruebas de penetración anuales.\n• Política de gestión de incidentes de seguridad con notificación a la Autoridad de Protección de Datos en caso de brecha grave.\n\nEn caso de incidente de seguridad que afecte tus datos, te notificaremos en un plazo no superior a 72 horas desde que tengamos conocimiento del mismo.',
  },
  {
    number: '9',
    title: 'Cookies y Tecnologías de Seguimiento',
    body: 'La aplicación móvil Going utiliza las siguientes tecnologías de seguimiento:\n\nSDK de análisis (Firebase Analytics): para entender cómo los usuarios interactúan con la app y mejorar la experiencia. Los datos se anonimizan.\n\nCrashlytics: para detectar y corregir errores técnicos en la app. Recopila datos técnicos del dispositivo cuando ocurre un fallo.\n\nTokens de notificación push: para enviarte notificaciones de tu viaje, ofertas (si las has aceptado) y alertas de seguridad.\n\nPuedes desactivar las notificaciones push y el análisis de uso desde Configuración > Privacidad en la app o desde los ajustes de tu dispositivo.',
  },
  {
    number: '10',
    title: 'Menores de Edad',
    body: 'Los servicios de Going Ecuador están dirigidos exclusivamente a personas mayores de 18 años.\n\nNo recopilamos intencionalmente datos de menores de 18 años. Si descubrimos que hemos recopilado datos de un menor sin el consentimiento verificable de sus padres o tutores, procederemos a eliminar dicha información inmediatamente.\n\nSi eres padre, madre o tutor y crees que tu hijo/a ha proporcionado datos a Going sin tu consentimiento, contáctanos en privacidad@goingec.com.\n\nConforme al Art. 15 de la LOPDP, el tratamiento de datos de menores de 18 años requiere el consentimiento expreso y verificable de sus representantes legales.',
  },
  {
    number: '11',
    title: 'Inteligencia Artificial y Decisiones Automatizadas',
    body: 'Going utiliza sistemas automatizados para las siguientes funciones:\n\n• Cálculo dinámico de tarifas basado en demanda, distancia y disponibilidad.\n• Asignación automática de conductores según proximidad y calificación.\n• Detección de patrones de fraude en pagos y uso de la plataforma.\n• Sugerencia de rutas y destinos frecuentes basada en tu historial.\n\nNinguna de estas decisiones automatizadas produce efectos jurídicos significativos ni te afecta de manera igualmente significativa de forma unilateral, sin posibilidad de revisión humana.\n\nConforme al Art. 24 de la LOPDP, tienes derecho a solicitar revisión humana de cualquier decisión automatizada que te afecte. Ejerce este derecho escribiendo a privacidad@goingec.com.',
  },
  {
    number: '12',
    title: 'Cambios en la Política de Privacidad',
    body: 'Going Ecuador puede actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas, en la legislación aplicable o en los servicios que ofrecemos.\n\nTe notificaremos de cambios sustanciales mediante:\n• Notificación push en la aplicación con al menos 15 días de anticipación.\n• Correo electrónico a la dirección registrada.\n• Aviso destacado en la pantalla de inicio al abrir la app.\n\nLa versión vigente siempre estará disponible en la aplicación y en goingec.com/privacidad, con su fecha de última actualización claramente indicada.\n\nSi los cambios requieren un nuevo consentimiento, te lo solicitaremos explícitamente antes de continuar usando el servicio.',
  },
  {
    number: '13',
    title: 'Transferencias Internacionales',
    body: 'Algunos de nuestros proveedores tecnológicos están ubicados fuera de Ecuador. Realizamos transferencias internacionales de datos a:\n\n• Amazon Web Services (AWS): servidores en EE.UU. y Europa para almacenamiento y procesamiento.\n• Google LLC (Firebase, Maps): servicios de análisis y cartografía.\n• Mapbox Inc.: cartografía y cálculo de rutas.\n• Stripe / PayPhone: procesamiento de pagos.\n\nTodas estas transferencias se realizan con las garantías adecuadas exigidas por el Art. 54 de la LOPDP, incluyendo: Decisiones de adecuación, Cláusulas contractuales tipo, o certificaciones de privacidad reconocidas.\n\nPuedes obtener información detallada sobre las transferencias internacionales y las garantías aplicables escribiendo a privacidad@goingec.com.',
  },
  {
    number: '14',
    title: 'Autoridad de Control y Reclamaciones',
    body: 'Si consideras que el tratamiento de tus datos personales infringe la LOPDP o esta Política de Privacidad, tienes derecho a presentar una reclamación ante:\n\nAutoridad de Protección de Datos Personales del Ecuador\n• Web: www.protecciondatos.gob.ec\n• Correo: info@protecciondatos.gob.ec\n\nAntes de acudir a la autoridad de control, te invitamos a contactarnos directamente en privacidad@goingec.com, ya que nos comprometemos a resolver cualquier inquietud de manera rápida y satisfactoria.\n\nGoing Ecuador S.A.S. cooperará plenamente con la Autoridad de Protección de Datos en cualquier investigación relativa al tratamiento de datos personales de nuestros usuarios.',
  },
];

export function PrivacyPolicyScreen() {
  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyTag}>GOING ECUADOR S.A.S.</Text>
        <Text style={styles.headerTitle}>Política de{'\n'}Privacidad</Text>
        <View style={styles.versionRow}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{VERSION}</Text>
          </View>
          <Text style={styles.updatedText}>Actualizado: {UPDATED}</Text>
        </View>
        <Text style={styles.legalNote}>
          Conforme a la LOPDP — Ley Orgánica de Protección de Datos Personales del Ecuador
        </Text>
      </View>

      <View style={styles.content}>
        {/* Intro box */}
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            En Going Ecuador valoramos tu privacidad. Esta política explica qué datos recopilamos,
            para qué los usamos y cómo puedes ejercer tus derechos de conformidad con la LOPDP.
          </Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.number} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{section.number}</Text>
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        {/* Contact box */}
        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Delegado de Protección de Datos</Text>
          <TouchableOpacity onPress={() => openEmail('privacidad@goingec.com')}>
            <Text style={styles.contactEmail}>privacidad@goingec.com</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.webLink}
            onPress={() => openURL('https://goingec.com/privacidad')}
          >
            <Text style={styles.webLinkText}>goingec.com/privacidad</Text>
          </TouchableOpacity>
          <Text style={styles.contactAddress}>
            Av. Amazonas N23-45, Quito, Ecuador
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: NAVY,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 28,
  },
  companyTag: {
    fontSize: 10,
    fontWeight: '800',
    color: RED,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 30,
    marginBottom: 12,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  versionBadge: {
    backgroundColor: RED,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  updatedText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
  legalNote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 16,
  },
  content: { padding: 14 },
  introBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: RED,
  },
  introText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 21,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: RED,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    flex: 1,
  },
  sectionBody: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 21,
  },
  contactBox: {
    backgroundColor: NAVY,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 40,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  contactEmail: {
    fontSize: 14,
    color: RED,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginBottom: 6,
  },
  webLink: {
    marginBottom: 6,
  },
  webLinkText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },
  contactAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
});
