import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

const GOING_BLUE = '#0033A0';

const SECTIONS = [
  {
    title: '1. Aceptación de los términos',
    body: 'Al usar la aplicación Going aceptas estos Términos y Condiciones. Si no estás de acuerdo, te pedimos no usar el servicio.',
  },
  {
    title: '2. Descripción del servicio',
    body: 'Going es una plataforma de transporte intercity en Ecuador que conecta a pasajeros con conductores de vehículos SUV, VAN y BUS. No somos una empresa de transporte: somos un intermediario tecnológico.',
  },
  {
    title: '3. Registro y cuenta',
    body: 'Para usar Going debes registrarte con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tu contraseña y de toda la actividad que ocurra bajo tu cuenta.',
  },
  {
    title: '4. Uso aceptable',
    body: 'Debes usar Going únicamente para fines lícitos. Está prohibido usar la plataforma para actividades ilegales, fraudes, o que violen los derechos de terceros.',
  },
  {
    title: '5. Pagos y tarifas',
    body: 'Las tarifas se muestran antes de confirmar el viaje. Los precios pueden variar según la ruta, el tipo de vehículo y la categoría seleccionada. Going se reserva el derecho de actualizar tarifas con previo aviso.',
  },
  {
    title: '6. Cancelaciones',
    body: 'Puedes cancelar un viaje antes de que el conductor acepte sin costo alguno. Cancelaciones posteriores pueden generar un cargo según la política vigente.',
  },
  {
    title: '7. Responsabilidad',
    body: 'Going no se hace responsable por daños indirectos, incidentales o consecuentes derivados del uso del servicio. La responsabilidad máxima de Going está limitada al monto pagado por el viaje afectado.',
  },
  {
    title: '8. Privacidad',
    body: 'Tu información personal está protegida bajo nuestra Política de Privacidad. No vendemos ni compartimos tus datos con terceros sin tu consentimiento, salvo cuando sea requerido por ley.',
  },
  {
    title: '9. Modificaciones',
    body: 'Going puede modificar estos términos en cualquier momento. Te notificaremos por correo electrónico o mediante la aplicación. El uso continuado del servicio tras la notificación implica aceptación.',
  },
  {
    title: '10. Ley aplicable',
    body: 'Estos términos se rigen por las leyes de la República del Ecuador. Cualquier disputa se resolverá ante los tribunales competentes de Quito, Ecuador.',
  },
];

export function TermsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <Text style={styles.headerSub}>Última actualización: enero 2025</Text>
      </View>

      <View style={styles.content}>
        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>¿Preguntas?</Text>
          <Text style={styles.contactText}>
            Contáctanos en{' '}
            <Text style={styles.contactEmail}>legal@goingec.com</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: GOING_BLUE,
    padding: 28,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  content: { padding: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOING_BLUE,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 21,
  },
  contactBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: GOING_BLUE,
    marginBottom: 4,
  },
  contactText: { fontSize: 13, color: '#374151' },
  contactEmail: { color: GOING_BLUE, fontWeight: '700' },
});
