import Link from 'next/link';

const docs = [
  {
    icon: '📋',
    title: 'Términos y Condiciones',
    desc: 'Reglas generales de uso de la plataforma Going, derechos y obligaciones de usuarios y la empresa.',
    href: '/legal/terms',
    updated: '23 mar 2026',
  },
  {
    icon: '🔒',
    title: 'Política de Privacidad',
    desc: 'Cómo recopilamos, usamos y protegemos tus datos personales conforme a la legislación ecuatoriana.',
    href: '/legal/privacy',
    updated: '23 mar 2026',
  },
  {
    icon: '🍪',
    title: 'Política de Cookies',
    desc: 'Qué cookies utilizamos, para qué sirven y cómo puedes gestionarlas o desactivarlas.',
    href: '/legal/cookies',
    updated: '23 mar 2026',
  },
  {
    icon: '📦',
    title: 'Política de Envíos',
    desc: 'Condiciones del servicio de envío de paquetes: cobertura, tiempos, tarifas, responsabilidades y reclamaciones.',
    href: '/legal/shipping',
    updated: '24 mar 2026',
  },
  {
    icon: '⚖️',
    title: 'Contacto Legal',
    desc: 'Canal oficial para notificaciones legales, requerimientos judiciales y comunicaciones formales.',
    href: '/legal/contact',
    updated: '23 mar 2026',
  },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Inicio</Link>
            <span>›</span>
            <span className="text-gray-700 font-medium">Legal</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0033A0] flex items-center justify-center text-2xl flex-shrink-0">
              ⚖️
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Centro Legal Going</h1>
              <p className="text-gray-500 mt-1 max-w-xl">
                Aquí encontrarás todos los documentos legales que rigen el uso de la plataforma Going Ecuador.
                Te recomendamos leerlos para conocer tus derechos y obligaciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documentos */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">

        {docs.map(doc => (
          <Link key={doc.href} href={doc.href}
            className="flex items-start gap-5 bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-[#0033A0]/20 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0 transition-colors">
              {doc.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-gray-900 group-hover:text-[#0033A0] transition-colors">
                  {doc.title}
                </h2>
                <span className="text-xs text-gray-400 flex-shrink-0">Actualizado: {doc.updated}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{doc.desc}</p>
            </div>
            <span className="text-gray-300 group-hover:text-[#0033A0] text-lg flex-shrink-0 transition-colors">→</span>
          </Link>
        ))}

      </div>

      {/* Nota legal */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-sm text-gray-600">
          <p className="font-bold text-gray-800 mb-1">Jurisdicción y legislación aplicable</p>
          <p>
            Todos los documentos legales de Going Ecuador se rigen por las leyes de la República del Ecuador.
            Para cualquier controversia, las partes se someten a los jueces y tribunales competentes de la
            ciudad de Quito, Ecuador. Fecha de vigencia de la versión actual: 24 de marzo de 2026.
          </p>
        </div>
      </div>

    </div>
  );
}
