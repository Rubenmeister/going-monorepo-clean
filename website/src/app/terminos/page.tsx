import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Going Ecuador',
  description:
    'Términos y Condiciones de uso de la plataforma Going Ecuador S.A.S. conforme a la legislación ecuatoriana.',
};

const LAST_UPDATE = '14 de abril de 2026';

const SECTIONS = [
  {
    id: 'objeto',
    icon: '📄',
    title: '1. Objeto y Ámbito de Aplicación',
    content: `Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma tecnológica Going Ecuador, operada por Going Ecuador S.A.S. (RUC: 1793XXXXXXX001), con domicilio en Av. Amazonas N23-45, Quito, Ecuador.

Al registrarte, acceder o usar la aplicación Going, declaras haber leído, comprendido y aceptado íntegramente estos Términos. Si no estás de acuerdo, debes abstenerte de usar el servicio.

Esta aceptación constituye un contrato vinculante entre tú y Going Ecuador S.A.S., de conformidad con el Código Civil ecuatoriano y la Ley de Comercio Electrónico (Ley No. 2002-67).`,
  },
  {
    id: 'naturaleza',
    icon: '🚗',
    title: '2. Naturaleza del Servicio',
    content: `Going Ecuador es una plataforma tecnológica intermediaria que conecta a usuarios con conductores independientes que ofrecen servicios de transporte comercial de pasajeros y envío de paquetes en Ecuador.

Going Ecuador S.A.S. NO es una empresa de transporte. Los conductores son prestadores independientes que actúan conforme a la Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial (LOTTTSV) y sus reglamentos.

Going opera bajo las categorías:
(i) Viajes interurbanos e intercantonal en vehículos SUV, VAN y BUS.
(ii) Envíos y mensajería urbana e interurbana.
(iii) Tours turísticos con operadores certificados.
(iv) Alojamiento y experiencias (próximamente).`,
  },
  {
    id: 'cuenta',
    icon: '👤',
    title: '3. Registro y Cuenta de Usuario',
    content: `Para acceder al servicio debes crear una cuenta proporcionando: nombre completo, número de cédula o pasaporte, correo electrónico, número de teléfono móvil y contraseña segura.

Te comprometes a proporcionar información veraz, completa y actualizada. Going Ecuador se reserva el derecho de suspender o eliminar cuentas con información falsa o incompleta.

Eres el único responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta. Notifica inmediatamente a soporte@goingec.com si sospechas de uso no autorizado.

Going puede requerir verificación de identidad adicional (documento de identidad, selfie) para cumplir con obligaciones legales de debida diligencia.`,
  },
  {
    id: 'pagos',
    icon: '💳',
    title: '4. Tarifas y Pagos',
    content: `Las tarifas se calculan en función de: distancia, tipo de vehículo (SUV / VAN / BUS), categoría del servicio y condiciones del mercado. El precio estimado se muestra antes de confirmar cualquier reserva.

Medios de pago aceptados:
• Tarjeta de crédito/débito Visa, Mastercard y American Express (vía Datafast).
• Transferencia QR / billetera digital De Una (PayPhone).
• Efectivo (solo modalidades habilitadas).

Precio mínimo de viaje: USD 5.00. Las tarifas incluyen el IVA aplicable en Ecuador según el Código Tributario vigente.

Going Ecuador emitirá comprobantes de pago electrónicos según las disposiciones del Servicio de Rentas Internas (SRI).`,
  },
  {
    id: 'cancelaciones',
    icon: '❌',
    title: '5. Política de Cancelaciones',
    content: `Cancelaciones por el usuario:
• Sin cargo: hasta 3 minutos después de confirmar la solicitud, si el conductor no ha sido asignado.
• Con cargo de penalidad: si el conductor ya fue asignado y está en camino.
• Cancelaciones reiteradas injustificadas pueden resultar en la suspensión temporal de la cuenta.

Cancelaciones por el conductor:
• El conductor puede cancelar indicando la causa.
• Cancelaciones reiteradas sin causa justificada afectan la puntuación del conductor.

Viajes compartidos (Compartido):
• La cancelación de un pasajero en viaje compartido puede generar cargo proporcional si ya hay otros pasajeros confirmados.`,
  },
  {
    id: 'conductor-req',
    icon: '📋',
    title: '6. Requisitos y Obligaciones del Conductor',
    content: `Para operar como conductor en Going debes cumplir:

Requisitos de ingreso:
• Licencia de conducir profesional tipo C mínimo (para vehículos de transporte de pasajeros).
• Vehículo modelo 2018 o posterior, en buen estado mecánico.
• Seguro SOAT vigente.
• Antecedentes penales limpios (certificado actualizado).
• Aprobación de la evaluación de manejo y atención al cliente de Going.

Obligaciones durante el servicio:
• Mantener el vehículo limpio y en condiciones óptimas.
• Respetar la ruta sugerida por la plataforma o acordada con el pasajero.
• Usar el sistema de verificación de identidad (QR) al recoger al pasajero.
• Calificar al pasajero tras cada viaje.
• Reportar incidentes de seguridad de forma inmediata.

Comisión de plataforma: Going cobra entre el 15% y el 20% del valor del viaje según el tipo de servicio. El saldo neto se transfiere semanalmente a la cuenta bancaria registrada.`,
  },
  {
    id: 'conducta',
    icon: '🤝',
    title: '7. Conducta y Uso Aceptable',
    content: `Está expresamente prohibido para usuarios y conductores:

• Acoso, discriminación o trato irrespetuoso basado en raza, género, religión, orientación sexual, discapacidad o cualquier otra condición.
• Daño intencional al vehículo o a las pertenencias del otro.
• Transporte de sustancias ilegales, armas o materiales peligrosos.
• Uso fraudulento de la plataforma (cuentas falsas, calificaciones manipuladas).
• Solicitar o aceptar pagos fuera de la plataforma para servicios Going.
• Usar la función SOS de manera frívola o fraudulenta.
• Grabar a otros usuarios sin su consentimiento.

Going Ecuador se reserva el derecho de suspender o eliminar permanentemente cuentas que incumplan estas normas, sin derecho a reembolso de saldos pendientes en casos de infracción grave.`,
  },
  {
    id: 'seguridad-sos',
    icon: '🆘',
    title: '8. Función SOS y Seguridad',
    content: `Going Ecuador incorpora una función de emergencia SOS accesible desde la pantalla de viaje activo. Al activarla:

• Se notifica automáticamente al equipo de seguridad de Going.
• Se comparte la ubicación en tiempo real con los contactos de confianza registrados.
• Se puede iniciar llamada directa al ECU 911 desde la aplicación.

El uso indebido o fraudulento de la función SOS (falsas alarmas reiteradas) podrá resultar en la suspensión de la cuenta.

Going recomienda a los usuarios:
• Verificar la placa y modelo del vehículo antes de abordar.
• Compartir el código de viaje con un familiar o amigo.
• No compartir información personal con el conductor más allá de lo necesario para el viaje.`,
  },
  {
    id: 'responsabilidad',
    icon: '⚠️',
    title: '9. Limitación de Responsabilidad',
    content: `Going Ecuador S.A.S. actúa exclusivamente como intermediario tecnológico y no asume responsabilidad directa por:

• Accidentes de tránsito (responsabilidad del conductor y su seguro SOAT).
• Pérdida, daño o robo de bienes personales durante el viaje.
• Retrasos causados por condiciones del tráfico, clima adverso o fuerza mayor.
• Conducta de los conductores fuera del contexto del servicio contratado.
• Interrupciones del servicio por mantenimiento, actualizaciones o causas técnicas.

En los casos en que Going sea declarado responsable por resolución judicial firme, la responsabilidad máxima estará limitada al valor pagado por el servicio específico que originó el daño.

Going mantiene un proceso de verificación de antecedentes para conductores, pero no garantiza la exactitud o vigencia permanente de dicha información.`,
  },
  {
    id: 'propiedad-intelectual',
    icon: '©️',
    title: '10. Propiedad Intelectual',
    content: `Todos los derechos de propiedad intelectual de la aplicación Going, incluyendo pero no limitado a: código fuente, diseño, logotipos, marcas comerciales, textos, gráficos, interfaz de usuario y bases de datos, son propiedad exclusiva de Going Ecuador S.A.S. y están protegidos por el Código Orgánico de la Economía Social de los Conocimientos y los tratados internacionales aplicables.

Se prohíbe expresamente: reproducir, distribuir, modificar, crear obras derivadas, realizar ingeniería inversa, descompilar o desensamblar cualquier parte de la aplicación sin autorización escrita previa de Going Ecuador S.A.S.

El usuario recibe únicamente una licencia personal, no exclusiva, intransferible y revocable para usar la aplicación de acuerdo con estos Términos.`,
  },
  {
    id: 'privacidad',
    icon: '🔒',
    title: '11. Privacidad y Datos Personales',
    content: `El tratamiento de tus datos personales se rige por nuestra Política de Privacidad, disponible en goingec.com/privacidad, en cumplimiento de la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP, Registro Oficial No. 459 del 26 de mayo de 2021).

Tus datos se usan para: prestación del servicio, seguridad de la plataforma, comunicaciones operativas, mejora del servicio y cumplimiento de obligaciones legales.

Tienes derecho a: acceder, rectificar, suprimir, oponerte al tratamiento y portar tus datos. Ejerce estos derechos escribiendo a privacidad@goingec.com.

Going no vende datos personales a terceros. Los datos compartidos con conductores se limitan al nombre, foto de perfil y ubicación de recogida durante el servicio activo.`,
  },
  {
    id: 'modificaciones',
    icon: '🔄',
    title: '12. Modificaciones de los Términos',
    content: `Going Ecuador S.A.S. se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.

En caso de cambios sustanciales, se notificará al usuario con al menos 15 días de anticipación mediante:
• Notificación push en la aplicación.
• Correo electrónico a la dirección registrada.
• Aviso destacado en la pantalla de inicio.

El uso continuado de la aplicación tras el período de notificación constituye aceptación de los términos modificados. Si no aceptas los cambios, debes dejar de usar el servicio y solicitar la eliminación de tu cuenta escribiendo a legal@goingec.com.`,
  },
  {
    id: 'legislacion',
    icon: '🏛️',
    title: '13. Legislación Aplicable y Resolución de Disputas',
    content: `Estos Términos y Condiciones se rigen e interpretan conforme a las leyes de la República del Ecuador, incluyendo:

• Código Civil ecuatoriano.
• Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos.
• Ley Orgánica de Defensa del Consumidor.
• Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial (LOTTTSV).
• Ley Orgánica de Protección de Datos Personales (LOPDP).

Antes de iniciar cualquier acción legal, las partes se comprometen a intentar resolver la disputa de manera amigable en un plazo de 30 días calendario.

En caso de no alcanzar acuerdo, las disputas se someterán a la jurisdicción y competencia de los jueces y tribunales de la ciudad de Quito, Ecuador.`,
  },
];

export default function TerminosPage() {
  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="bg-[#0033A0] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[13px] font-black text-[#FFCD00] uppercase tracking-widest mb-3">
            Legal · Going Ecuador
          </p>
          <h1 className="text-4xl font-black text-white mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-white/60 text-sm">
            Conforme al Código Civil, Ley de Comercio Electrónico y LOPDP del Ecuador<br />
            Última actualización: {LAST_UPDATE}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14">
        {/* Aviso */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-10 flex gap-4">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <p className="font-black text-yellow-800 text-sm mb-1">Importante</p>
            <p className="text-yellow-700 text-sm leading-relaxed">
              Al usar Going aceptas estos Términos. Going es una <strong>plataforma tecnológica intermediaria</strong>,
              no una empresa de transporte. Los conductores son proveedores independientes.
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
          <p className="text-white/70 text-sm mb-2">Consultas legales</p>
          <a href="mailto:legal@goingec.com" className="text-[#FFCD00] font-black text-lg hover:underline">
            legal@goingec.com
          </a>
          <p className="text-white/40 text-xs mt-4">
            Going Ecuador S.A.S. · Av. Amazonas N23-45, Quito, Ecuador<br />
            Última actualización: {LAST_UPDATE}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <a href="/privacidad" className="text-xs text-white/50 hover:text-white transition-colors">
              Política de Privacidad →
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
