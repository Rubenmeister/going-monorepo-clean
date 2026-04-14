import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad — Going Ecuador',
  description:
    'Política de Privacidad de Going Ecuador S.A.S. conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).',
};

const LAST_UPDATE = '14 de abril de 2026';

const SECTIONS = [
  {
    id: 'responsable',
    icon: '🏢',
    title: '1. Responsable del Tratamiento',
    content: `Going Ecuador S.A.S. (en adelante "Going"), con RUC: 1793XXXXXXX001, domicilio en Av. Amazonas N23-45, Quito, Ecuador, es el Responsable del Tratamiento de tus datos personales.

Contacto del Delegado de Protección de Datos (DPD):
• Correo: privacidad@goingec.com
• Teléfono: +593 2 XXX-XXXX
• Horario: lunes a viernes, 09h00 – 17h00

Esta Política de Privacidad cumple con la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP, Registro Oficial No. 459 del 26 de mayo de 2021) y su Reglamento.`,
  },
  {
    id: 'datos',
    icon: '📋',
    title: '2. Datos Personales que Recopilamos',
    content: `Recopilamos los siguientes tipos de datos personales:

Datos de identidad: nombre completo, número de cédula o pasaporte, fecha de nacimiento, fotografía de perfil.

Datos de contacto: correo electrónico, número de teléfono móvil, dirección de domicilio (opcional).

Datos de geolocalización: ubicación en tiempo real durante el uso activo de la app, puntos de recogida y destino frecuentes.

Datos de uso del servicio: historial de viajes y envíos, calificaciones otorgadas y recibidas, preferencias de servicio.

Datos de pago: últimos 4 dígitos de tarjeta, tipo de tarjeta. Los datos completos de pago son procesados directamente por nuestro proveedor certificado PCI-DSS.

Datos técnicos: dirección IP, identificador de dispositivo, sistema operativo, versión de la app, registros de acceso.`,
  },
  {
    id: 'finalidades',
    icon: '🎯',
    title: '3. Finalidades del Tratamiento',
    content: `Tratamos tus datos personales para las siguientes finalidades:

Finalidad contractual (Art. 20 LOPDP):
• Crear y gestionar tu cuenta de usuario.
• Conectarte con conductores disponibles y procesar tu solicitud de viaje.
• Procesar pagos y emitir comprobantes electrónicos (SRI).
• Gestionar reclamaciones, soporte técnico e incidencias.

Finalidad de interés legítimo (Art. 20 LOPDP):
• Garantizar la seguridad de la plataforma y prevenir fraudes.
• Mejorar nuestros algoritmos de asignación y la calidad del servicio.
• Realizar estadísticas internas de uso (datos anonimizados).

Cumplimiento legal:
• Cooperar con autoridades judiciales o administrativas ecuatorianas cuando sea requerido.
• Cumplir obligaciones tributarias y contables ante el SRI y la Superintendencia de Compañías.

Consentimiento:
• Enviar notificaciones push de ofertas y promociones (puedes revocar en cualquier momento desde la app).`,
  },
  {
    id: 'conservacion',
    icon: '📅',
    title: '4. Plazos de Conservación',
    content: `Conservamos tus datos personales durante los siguientes plazos:

• Datos de cuenta activa: mientras mantengas tu cuenta activa.
• Datos de viajes y pagos: 7 años desde cada transacción (obligación tributaria — Código Tributario Ecuador).
• Datos de geolocalización en tiempo real: se eliminan automáticamente tras la finalización del viaje.
• Registros de seguridad y acceso: 12 meses.
• Calificaciones y comentarios: mientras la cuenta esté activa; 6 meses tras su eliminación.

Tras los plazos indicados, los datos serán suprimidos de forma segura o anonimizados de manera irreversible.`,
  },
  {
    id: 'destinatarios',
    icon: '🤝',
    title: '5. Destinatarios y Encargados del Tratamiento',
    content: `Going comparte datos con los siguientes encargados del tratamiento bajo contrato de confidencialidad:

Operaciones del servicio:
• Conductores registrados: nombre, foto de perfil y ubicación de recogida (solo durante el viaje activo).

Proveedores tecnológicos (Encargados del Tratamiento):
• Google Cloud Platform — infraestructura de servidores y base de datos.
• Twilio Inc. — verificación de teléfono y comunicaciones seguras en viaje.
• Mapbox Inc. — cartografía y cálculo de rutas.
• Firebase (Google LLC) — análisis de uso de la aplicación.

Proveedores de pago (Encargados del Tratamiento):
• Datafast — procesamiento de tarjetas de crédito/débito en Ecuador.
• De Una (PayPhone) — transferencias QR y billetera digital.

Autoridades competentes: cuando así lo exija la ley ecuatoriana, resolución judicial o administrativa.

Going NO vende datos personales a terceros ni los usa para publicidad de terceros.`,
  },
  {
    id: 'derechos',
    icon: '⚖️',
    title: '6. Tus Derechos',
    content: `Conforme a la LOPDP (Arts. 22–32), tienes los siguientes derechos:

• Acceso: conocer qué datos personales tuyos tratamos.
• Rectificación: corregir datos inexactos o incompletos.
• Supresión ("derecho al olvido"): solicitar la eliminación de tus datos cuando ya no sean necesarios.
• Oposición: oponerte al tratamiento de tus datos para fines específicos.
• Portabilidad: recibir tus datos en formato estructurado y legible por máquina.
• Limitación del tratamiento: solicitar que suspendamos temporalmente el tratamiento.
• Revocación del consentimiento: retirar cualquier consentimiento previamente otorgado.

Cómo ejercer tus derechos:
Escribe a privacidad@goingec.com con asunto "SOLICITUD DERECHOS LOPDP" indicando tu nombre completo, número de cédula y el derecho que deseas ejercer. Responderemos en un plazo máximo de 15 días hábiles.`,
  },
  {
    id: 'seguridad',
    icon: '🔒',
    title: '7. Seguridad de los Datos',
    content: `Going Ecuador implementa medidas técnicas y organizativas apropiadas para proteger tus datos personales:

• Cifrado TLS 1.3 para todas las comunicaciones entre la app y nuestros servidores.
• Cifrado AES-256 para datos sensibles almacenados en base de datos.
• Autenticación de dos factores (2FA) disponible para cuentas de usuario.
• Acceso a datos personales restringido al personal con necesidad legítima (principio de mínimo acceso).
• Auditorías de seguridad periódicas y pruebas de penetración anuales.
• Política de gestión de incidentes con notificación a la Autoridad de Protección de Datos en caso de brecha grave.

En caso de incidente de seguridad que afecte tus datos, te notificaremos en un plazo no superior a 72 horas desde que tengamos conocimiento del mismo.`,
  },
  {
    id: 'menores',
    icon: '👶',
    title: '8. Protección de Menores de Edad',
    content: `Los servicios de Going Ecuador están dirigidos exclusivamente a personas mayores de 18 años.

No recopilamos intencionalmente datos de menores de 18 años. Si descubrimos que hemos recopilado datos de un menor sin el consentimiento verificable de sus padres o tutores, procederemos a eliminar dicha información inmediatamente.

Si eres padre, madre o tutor y crees que tu hijo/a ha proporcionado datos a Going sin tu consentimiento, contáctanos en privacidad@goingec.com.

Conforme al Art. 15 de la LOPDP, el tratamiento de datos de menores de 18 años requiere el consentimiento expreso y verificable de sus representantes legales.`,
  },
  {
    id: 'transferencias',
    icon: '🌍',
    title: '9. Transferencias Internacionales de Datos',
    content: `Algunos de nuestros proveedores tecnológicos están ubicados fuera de Ecuador. Realizamos transferencias internacionales de datos a:

• Amazon Web Services (AWS): servidores en EE.UU. y Europa.
• Google LLC (Firebase, Maps): servicios de análisis y cartografía.
• Mapbox Inc.: cartografía y cálculo de rutas.
• Datafast y De Una: procesamiento de pagos en Ecuador.

Todas estas transferencias se realizan con las garantías adecuadas exigidas por el Art. 54 de la LOPDP, incluyendo: Decisiones de adecuación, Cláusulas contractuales tipo, o certificaciones de privacidad reconocidas.

Puedes obtener información detallada sobre las transferencias internacionales y las garantías aplicables escribiendo a privacidad@goingec.com.`,
  },
  {
    id: 'actualizaciones',
    icon: '🔄',
    title: '10. Actualizaciones de esta Política',
    content: `Going Ecuador puede actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas, en la legislación aplicable o en los servicios que ofrecemos.

Te notificaremos de cambios sustanciales mediante:
• Notificación push en la aplicación con al menos 15 días de anticipación.
• Correo electrónico a la dirección registrada.
• Aviso destacado en la pantalla de inicio al abrir la app.

La versión vigente siempre estará disponible en goingec.com/privacidad, con su fecha de última actualización claramente indicada.

Si los cambios requieren un nuevo consentimiento, te lo solicitaremos explícitamente antes de continuar usando el servicio.`,
  },
  {
    id: 'reclamaciones',
    icon: '📣',
    title: '11. Reclamaciones ante la Autoridad de Control',
    content: `Si consideras que el tratamiento de tus datos personales infringe la LOPDP o esta Política de Privacidad, tienes derecho a presentar una reclamación ante:

Autoridad de Protección de Datos Personales del Ecuador
• Web: www.protecciondatos.gob.ec
• Correo: info@protecciondatos.gob.ec

Antes de acudir a la autoridad de control, te invitamos a contactarnos directamente en privacidad@goingec.com, ya que nos comprometemos a resolver cualquier inquietud de manera rápida y satisfactoria.`,
  },
];

export default function PrivacidadPage() {
  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="bg-[#0033A0] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[13px] font-black text-[#FFCD00] uppercase tracking-widest mb-3">
            Legal · Going Ecuador
          </p>
          <h1 className="text-4xl font-black text-white mb-4">
            Política de Privacidad
          </h1>
          <p className="text-white/60 text-sm">
            Conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP)<br />
            Última actualización: {LAST_UPDATE}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14">
        {/* Aviso resumen */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10 flex gap-4">
          <span className="text-2xl flex-shrink-0">ℹ️</span>
          <div>
            <p className="font-black text-[#0033A0] text-sm mb-1">Resumen sencillo</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Going recopila solo los datos necesarios para prestarte el servicio de transporte y envíos.
              No vendemos tus datos. Puedes eliminar tu cuenta y tus datos en cualquier momento.
              Cumplimos la ley ecuatoriana de protección de datos (LOPDP).
            </p>
          </div>
        </div>

        {/* Índice */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-10">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Contenido</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-[#0033A0] font-medium transition-colors"
              >
                <span>{s.icon}</span> {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Secciones */}
        <div className="space-y-10">
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{s.icon}</span>
                <h2 className="text-xl font-black text-[#0033A0]">{s.title}</h2>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{s.content}</p>
              </div>
            </section>
          ))}
        </div>

        {/* Contacto */}
        <div className="mt-14 bg-[#0033A0] rounded-2xl p-8 text-center">
          <p className="text-white/70 text-sm mb-2">Contacto de privacidad</p>
          <a href="mailto:privacidad@goingec.com" className="text-[#FFCD00] font-black text-lg hover:underline">
            privacidad@goingec.com
          </a>
          <p className="text-white/40 text-xs mt-4">
            Going Ecuador S.A.S. · Av. Amazonas N23-45, Quito, Ecuador<br />
            Última actualización: {LAST_UPDATE}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a href="/terminos" className="text-xs text-white/50 hover:text-white transition-colors">
              Términos y Condiciones →
            </a>
            <a href="/legal" className="text-xs text-white/50 hover:text-white transition-colors">
              Centro Legal →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
