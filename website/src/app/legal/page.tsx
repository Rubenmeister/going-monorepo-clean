import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Legal — Going App',
  description:
    'Seguridad, cookies y contrato del conductor de Going App (Ecuador). Los Términos y Condiciones y la Política de Privacidad tienen su página dedicada con la versión completa y vigente.',
};

// Términos y Privacidad NO se duplican acá: viven en su página propia
// (/terminos, /privacidad), que es la versión completa y vigente (LOPDP).
// Desde acá sólo enlazamos, para que no existan dos versiones del mismo documento.
const FULL_DOCS = [
  { id: 'terminos', title: 'Términos y Condiciones', icon: '📄', href: '/terminos', desc: 'Condiciones de uso de la plataforma Going App.' },
  { id: 'privacidad', title: 'Política de Privacidad', icon: '🔒', href: '/privacidad', desc: 'Tratamiento de tus datos personales conforme a la LOPDP.' },
];

const SECTIONS = [
  {
    id: 'seguridad',
    title: 'Seguridad',
    icon: '🛡️',
    content: `La seguridad de viajeras, viajeros, conductoras y conductores es prioridad de Going App.

**PIN de seguridad:** Cada viaje genera un PIN que confirmás antes de subir, para asegurarte de abordar el vehículo correcto.

**Verificación:** Conductoras y conductores pasan validación de documentos, antecedentes y vehículo antes de su primer viaje.

**Seguimiento en vivo:** Puedes compartir tu viaje en tiempo real con tus contactos de confianza desde la app.

**Botón SOS:** Disponible durante el viaje activo; avisa a nuestro equipo y permite contactar al ECU 911.

**Soporte:** Ante cualquier inconveniente, escribinos por WhatsApp o desde la app.`,
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
    content: `Las conductoras y conductores de Going App son proveedores de servicios independientes, no personal en relación de dependencia.

**Requisitos:** Licencia de conducir vigente tipo B mínimo, vehículo 2018 o posterior, seguro SOAT vigente, antecedentes penales limpios, aprobación de evaluación Going App.

**Comisiones:** Going App cobra entre 15% y 20% del valor del viaje según el tipo de servicio. Los conductores reciben el saldo vía transferencia bancaria semanal.

**Obligaciones del conductor:** Mantener el vehículo limpio y en buen estado, respetar la ruta asignada, usar el PIN de seguridad, calificar al pasajero, reportar incidentes.

**Terminación:** Going App puede desactivar a un conductor con rating inferior a 4.0 o por incumplimiento de estos términos.`,
  },
];

export default function LegalPage() {
  return (
    <div className="pt-[88px]">
      <div className="bg-[#011627] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-4xl font-black text-white mb-3">Información Legal</h1>
          <p className="text-[16px] text-white/50">Thorn AI Technologies S.A.S. · RUC: 1793176925001 · Quito, Ecuador</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Quick nav */}
        <div className="flex flex-wrap gap-3 mb-10">
          {FULL_DOCS.map(d => (
            <Link key={d.id} href={d.href} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[13px] font-black text-gray-600 hover:border-[#ff4c41] hover:text-[#ff4c41] transition-all">
              <span>{d.icon}</span> {d.title} <span className="text-gray-400">↗</span>
            </Link>
          ))}
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[13px] font-black text-gray-600 hover:border-[#ff4c41] hover:text-[#ff4c41] transition-all">
              <span>{s.icon}</span> {s.title}
            </a>
          ))}
        </div>

        {/* Documentos completos — viven en su propia página (sin duplicar) */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {FULL_DOCS.map(d => (
            <Link key={d.id} href={d.href} className="group bg-white border-[1.5px] border-gray-100 rounded-2xl p-6 hover:border-[#ff4c41]/40 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{d.icon}</span>
                <h2 className="font-serif text-lg font-black text-[#011627]">{d.title}</h2>
              </div>
              <p className="text-[13px] text-gray-500 mb-3">{d.desc}</p>
              <span className="text-[13px] font-black text-[#ff4c41] group-hover:underline">Ver versión completa →</span>
            </Link>
          ))}
        </div>

        <div className="space-y-12">
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-8 scroll-mt-24">
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
          <a href="mailto:soporte@goingec.com" className="text-[15px] font-black text-[#ff4c41] hover:underline">soporte@goingec.com</a> · DPO: <a href="mailto:privacidad@goingec.com" className="text-[14px] text-[#ff4c41] hover:underline">privacidad@goingec.com</a>
          <p className="text-[11px] text-gray-400 mt-2">Última actualización: Abril 2026</p>
        </div>
      </div>
    </div>
  );
}
