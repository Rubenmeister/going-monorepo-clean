import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Legal — Going Ecuador',
  description: 'Términos y condiciones, política de privacidad y documentos legales de Going Ecuador.',
};

const SECTIONS = [
  {
    id: 'terminos',
    title: 'Términos y Condiciones',
    icon: '📄',
    content: `Going Ecuador S.A.S. ("Going") es una plataforma tecnológica que conecta pasajeros con conductores independientes. Al usar nuestros servicios aceptas estos términos.

**Uso del servicio:** Going es una plataforma de intermediación. Los conductores son proveedores independientes, no empleados de Going. Going no es responsable por el contenido publicado por usuarios.

**Cuentas:** Debes tener al menos 18 años para crear una cuenta. Eres responsable de mantener la confidencialidad de tu contraseña.

**Pagos:** Los precios se muestran antes de confirmar el viaje. Going aplica una comisión de servicio. Los reembolsos están sujetos a nuestra política de cancelación.

**Cancelaciones:** Puedes cancelar hasta 15 minutos antes sin cargo. Cancelaciones tardías pueden tener penalidad. El conductor también puede cancelar con justificación.

**Conducta:** Está prohibido el acoso, discriminación, daño a vehículos o cualquier conducta que afecte la seguridad. Going puede suspender cuentas por incumplimiento.`,
  },
  {
    id: 'privacidad',
    title: 'Política de Privacidad',
    icon: '🔒',
    content: `Going recopila y procesa datos personales de acuerdo con la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).

**Datos que recopilamos:** Nombre, correo, teléfono, ubicación GPS durante viajes, historial de viajes, método de pago (sin números completos de tarjeta), valoraciones y comentarios.

**Uso de datos:** Para procesar reservas y pagos, mejorar el servicio, comunicarnos contigo, cumplir obligaciones legales y garantizar la seguridad.

**Compartir datos:** Solo compartimos datos con conductores necesarios para completar tu viaje, procesadores de pago certificados y cuando lo requiera la ley.

**Tus derechos:** Tienes derecho a acceder, corregir, eliminar y portar tus datos. Escríbenos a privacidad@goingec.com.

**Retención:** Conservamos datos mientras tu cuenta esté activa. Datos de viajes por 5 años por obligación fiscal.`,
  },
  {
    id: 'cookies',
    title: 'Política de Cookies',
    icon: '🍪',
    content: `Usamos cookies para mejorar tu experiencia en goingec.com.

**Cookies esenciales:** Necesarias para el funcionamiento del sitio (sesión, seguridad). No pueden desactivarse.

**Cookies de análisis:** Google Analytics para entender cómo usas el sitio. Datos anónimos y agregados.

**Cookies de preferencias:** Guardan tus preferencias de idioma y configuración.

**Cómo gestionarlas:** Puedes aceptar o rechazar cookies no esenciales en el banner de cookies. También puedes configurarlas en tu navegador.`,
  },
  {
    id: 'conductor',
    title: 'Contrato del Conductor',
    icon: '📋',
    content: `Los conductores de Going son proveedores de servicios independientes, no empleados.

**Requisitos:** Licencia de conducir vigente tipo B mínimo, vehículo 2018 o posterior, seguro SOAT vigente, antecedentes penales limpios, aprobación de evaluación Going.

**Comisiones:** Going cobra entre 15% y 20% del valor del viaje según el tipo de servicio. Los conductores reciben el saldo vía transferencia bancaria semanal.

**Obligaciones del conductor:** Mantener el vehículo limpio y en buen estado, respetar la ruta asignada, usar el PIN de seguridad, calificar al pasajero, reportar incidentes.

**Terminación:** Going puede desactivar a un conductor con rating inferior a 4.0 o por incumplimiento de estos términos.`,
  },
];

export default function LegalPage() {
  return (
    <div className="pt-[68px]">
      <div className="bg-[#011627] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-4xl font-black text-white mb-3">Información Legal</h1>
          <p className="text-[16px] text-white/50">Going Ecuador S.A.S. · RUC: 1792XXXXXX001 · Quito, Ecuador</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Quick nav */}
        <div className="flex flex-wrap gap-3 mb-12">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[13px] font-black text-gray-600 hover:border-[#ff4c41] hover:text-[#ff4c41] transition-all">
              <span>{s.icon}</span> {s.title}
            </a>
          ))}
        </div>

        <div className="space-y-12">
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{s.icon}</span>
                <h2 className="font-serif text-2xl font-black text-[#011627]">{s.title}</h2>
              </div>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {s.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-[13px] text-gray-500 mb-1">¿Tienes preguntas legales?</p>
          <a href="mailto:legal@goingec.com" className="text-[15px] font-black text-[#ff4c41] hover:underline">legal@goingec.com</a>
          <p className="text-[11px] text-gray-400 mt-2">Última actualización: Abril 2026</p>
        </div>
      </div>
    </div>
  );
}
