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
    title: 'Objeto y Aceptación',
    body: 'Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma tecnológica Going Ecuador, operada por Going Ecuador S.A.S. (RUC: 1793XXXXXXX001), con domicilio en Av. Amazonas N23-45, Quito, Ecuador.\n\nAl registrarte, acceder o usar la aplicación Going, declaras haber leído, comprendido y aceptado íntegramente estos Términos. Si no estás de acuerdo, debes abstenerte de usar el servicio.\n\nEsta aceptación constituye un contrato vinculante entre tú y Going Ecuador S.A.S., de conformidad con el Código Civil ecuatoriano y la Ley de Comercio Electrónico (Ley No. 2002-67).',
  },
  {
    number: '2',
    title: 'Naturaleza del Servicio',
    body: 'Going Ecuador es una plataforma tecnológica intermediaria que conecta a usuarios con conductores independientes que ofrecen servicios de transporte comercial de pasajeros y envío de paquetes en Ecuador.\n\nGoing Ecuador S.A.S. NO es una empresa de transporte. Los conductores son prestadores independientes que actúan conforme a la Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial (LOTTTSV) y sus reglamentos.\n\nGoing opera bajo las categorías: (i) Viajes interurbanos e intercantonal en vehículos SUV, VAN y BUS; (ii) Envíos y mensajería urbana e interurbana; (iii) Tours turísticos con operadores certificados; (iv) Alojamiento y experiencias (próximamente).',
  },
  {
    number: '3',
    title: 'Registro y Cuenta de Usuario',
    body: 'Para acceder al servicio debes crear una cuenta proporcionando: nombre completo, número de cédula o pasaporte, correo electrónico, número de teléfono móvil y contraseña segura.\n\nTe comprometes a proporcionar información veraz, completa y actualizada. Going Ecuador se reserva el derecho de suspender o eliminar cuentas con información falsa o incompleta.\n\nEres el único responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta. Notifica inmediatamente a soporte@goingec.com si sospechas de uso no autorizado.\n\nGoing puede requerir verificación de identidad adicional (documento de identidad, selfie) para cumplir con obligaciones legales de debida diligencia.',
  },
  {
    number: '4',
    title: 'Tarifas y Pagos',
    body: 'Las tarifas se calculan en función de: distancia, tipo de vehículo (SUV / VAN / BUS), categoría del servicio y condiciones del mercado. El precio estimado se muestra antes de confirmar cualquier reserva.\n\nLos medios de pago aceptados incluyen: tarjeta de crédito/débito Visa, Mastercard y American Express; billetera digital Going Credits; transferencia bancaria para reservas corporativas.\n\nPrecio mínimo de viaje: USD 5.00. Las tarifas incluyen el 15% IVA aplicable en Ecuador según el Código Tributario.\n\nGoing Ecuador emitirá comprobantes de pago electrónicos según las disposiciones del Servicio de Rentas Internas (SRI).',
  },
  {
    number: '5',
    title: 'Política de Cancelaciones y Reembolsos',
    body: 'Cancelación gratuita: disponible hasta 30 minutos antes de la hora programada del viaje.\n\nCancelación con cargo del 20%: entre 30 y 10 minutos antes de la hora programada.\n\nCancelación sin reembolso: con menos de 10 minutos de anticipación o cuando el conductor ya está en camino.\n\nNo-show (pasajero no se presenta): se cobra el 50% de la tarifa acordada.\n\nReembolsos aplicables se procesarán en un plazo de 5 a 10 días hábiles al medio de pago original. Going Credits se acreditan en un máximo de 24 horas.\n\nGoing se reserva el derecho de cancelar viajes por causas de fuerza mayor (desastres naturales, emergencias de salud pública, disposiciones gubernamentales) sin responsabilidad económica.',
  },
  {
    number: '6',
    title: 'Obligaciones del Usuario',
    body: 'El usuario se compromete a:\n\n• Proporcionar información de recogida y destino exacta y verificada.\n• Presentarse puntualmente en el punto de encuentro acordado.\n• Tratar al conductor y demás pasajeros con respeto y cortesía.\n• No transportar sustancias ilícitas, armas o materiales peligrosos.\n• No fumar, consumir alcohol ni alimentos en los vehículos.\n• Usar el cinturón de seguridad en todo momento.\n• Respetar la capacidad máxima del vehículo según la matrícula.\n• No solicitar al conductor que infrinja las normas de tránsito.\n• No compartir las credenciales de su cuenta con terceros.\n\nEl incumplimiento de estas obligaciones podrá resultar en la suspensión temporal o permanente de la cuenta, sin perjuicio de las acciones legales que correspondan.',
  },
  {
    number: '7',
    title: 'Calificaciones y Reseñas',
    body: 'Al finalizar cada viaje o servicio, el usuario podrá calificar al conductor en una escala de 1 a 5 estrellas y dejar comentarios opcionales.\n\nLas calificaciones deben reflejar la experiencia real del servicio. Está prohibido publicar reseñas falsas, difamatorias, con contenido discriminatorio, obsceno o que infrinja derechos de terceros.\n\nGoing se reserva el derecho de eliminar reseñas que violen estas directrices sin previo aviso. Los conductores con calificación promedio inferior a 3.5 estrellas (sostenida por 30 días) podrán ser suspendidos de la plataforma.\n\nEl sistema de calificaciones es mutuo: los conductores también califican a los usuarios, lo que puede afectar la aceptación de futuras solicitudes.',
  },
  {
    number: '8',
    title: 'Responsabilidad y Limitaciones',
    body: 'Going Ecuador S.A.S. actúa exclusivamente como intermediario tecnológico y no asume responsabilidad directa por:\n\n• Accidentes de tránsito (responsabilidad del conductor y su seguro SOAT).\n• Pérdida, daño o robo de bienes personales durante el viaje.\n• Retrasos causados por condiciones del tráfico, clima adverso o fuerza mayor.\n• Conducta de los conductores fuera del contexto del servicio contratado.\n• Interrupciones del servicio por mantenimiento, actualizaciones o causas técnicas.\n\nEn los casos en que Going sea declarado responsable por resolución judicial firme, la responsabilidad máxima estará limitada al valor pagado por el servicio específico que originó el daño.\n\nGoing mantiene un proceso de verificación de antecedentes para conductores, pero no garantiza la exactitud o vigencia de dicha información.',
  },
  {
    number: '9',
    title: 'Seguridad y Función SOS',
    body: 'Going Ecuador incorpora una función de emergencia SOS accesible desde la pantalla de viaje activo. Al activarla:\n\n• Se notifica automáticamente al equipo de seguridad de Going.\n• Se comparte la ubicación en tiempo real con los contactos de confianza registrados.\n• Se puede iniciar llamada directa al ECU 911 desde la aplicación.\n\nEl uso indebido o fraudulento de la función SOS (falsas alarmas reiteradas) podrá resultar en la suspensión de la cuenta.\n\nGoing recomienda a los usuarios: verificar la placa y modelo del vehículo antes de abordar, compartir el código de viaje con un familiar o amigo, y no compartir información personal con el conductor más allá de lo necesario.',
  },
  {
    number: '10',
    title: 'Propiedad Intelectual',
    body: 'Todos los derechos de propiedad intelectual de la aplicación Going, incluyendo pero no limitado a: código fuente, diseño, logotipos, marcas comerciales, textos, gráficos, interfaz de usuario y bases de datos, son propiedad exclusiva de Going Ecuador S.A.S. y están protegidos por la Ley de Propiedad Intelectual del Ecuador (Código Orgánico de la Economía Social de los Conocimientos) y los tratados internacionales aplicables.\n\nSe prohíbe expresamente: reproducir, distribuir, modificar, crear obras derivadas, realizar ingeniería inversa, descompilar o desensamblar cualquier parte de la aplicación sin autorización escrita previa de Going Ecuador S.A.S.\n\nEl usuario recibe únicamente una licencia personal, no exclusiva, intransferible y revocable para usar la aplicación de acuerdo con estos Términos.',
  },
  {
    number: '11',
    title: 'Privacidad y Protección de Datos',
    body: 'El tratamiento de tus datos personales se rige por nuestra Política de Privacidad, disponible en la aplicación y en goingec.com/privacidad, en cumplimiento de la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP, Registro Oficial No. 459 del 26 de mayo de 2021).\n\nTus datos se usan para: prestación del servicio, seguridad de la plataforma, comunicaciones operativas, mejora del servicio y cumplimiento de obligaciones legales.\n\nTienes derecho a: acceder, rectificar, suprimir, oponerte al tratamiento y portar tus datos. Ejerce estos derechos escribiendo a privacidad@goingec.com.\n\nGoing no vende datos personales a terceros. Los datos compartidos con conductores se limitan al nombre, foto de perfil y ubicación de recogida durante el servicio activo.',
  },
  {
    number: '12',
    title: 'Modificaciones de los Términos',
    body: 'Going Ecuador S.A.S. se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.\n\nEn caso de cambios sustanciales, se notificará al usuario con al menos 15 días de anticipación mediante: notificación push en la aplicación, correo electrónico a la dirección registrada, y aviso destacado en la pantalla de inicio.\n\nEl uso continuado de la aplicación tras el período de notificación constituye aceptación de los términos modificados. Si no aceptas los cambios, debes dejar de usar el servicio y solicitar la eliminación de tu cuenta escribiendo a legal@goingec.com.',
  },
  {
    number: '13',
    title: 'Ley Aplicable y Resolución de Disputas',
    body: 'Estos Términos y Condiciones se rigen e interpretan conforme a las leyes de la República del Ecuador, incluyendo:\n\n• Código Civil ecuatoriano.\n• Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos.\n• Ley Orgánica de Defensa del Consumidor.\n• Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial (LOTTTSV).\n• Ley Orgánica de Protección de Datos Personales (LOPDP).\n\nAntes de iniciar cualquier acción legal, las partes se comprometen a intentar resolver la disputa de manera amigable en un plazo de 30 días calendario.\n\nEn caso de no alcanzar acuerdo, las disputas se someterán a la jurisdicción y competencia de los jueces y tribunales de la ciudad de Quito, Ecuador, renunciando las partes a cualquier otro fuero que pudiera corresponderles.',
  },
];

export function TermsScreen() {
  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyTag}>GOING ECUADOR S.A.S.</Text>
        <Text style={styles.headerTitle}>Términos y{'\n'}Condiciones de Uso</Text>
        <View style={styles.versionRow}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{VERSION}</Text>
          </View>
          <Text style={styles.updatedText}>Actualizado: {UPDATED}</Text>
        </View>
        <Text style={styles.legalNote}>
          Conforme a la LOTTTSV, Ley de Comercio Electrónico y LOPDP del Ecuador
        </Text>
      </View>

      <View style={styles.content}>
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
          <Text style={styles.contactTitle}>¿Tienes preguntas legales?</Text>
          <TouchableOpacity onPress={() => openEmail('legal@goingec.com')}>
            <Text style={styles.contactEmail}>legal@goingec.com</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openEmail('soporte@goingec.com')}>
            <Text style={[styles.contactEmail, { marginTop: 4 }]}>soporte@goingec.com</Text>
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
  },
  contactAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
    textAlign: 'center',
  },
});
