'use client';

export default function SecurityPage() {
  const features = [
    { icon: '🔒', title: 'Encriptación', desc: 'Encriptación SSL/TLS de grado empresarial' },
    { icon: '🔑', title: 'Autenticación', desc: 'Autenticación de dos factores disponible' },
    { icon: '🛡️', title: 'Datos', desc: 'Protección de datos según LOPDP (Ley Orgánica de Protección de Datos Personales)' },
    { icon: '🔍', title: 'Auditoría', desc: 'Auditorías de seguridad regulares' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">Seguridad</h1>
        <div className="bg-white rounded-xl shadow-md p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu Seguridad es Nuestra Prioridad</h2>
            <p className="text-gray-600">Utilizamos tecnología de seguridad de clase mundial para proteger tu información personal y financiera.</p>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Reportar Vulnerabilidades</h3>
            <p className="text-gray-600">Si encuentras una vulnerabilidad de seguridad, contáctanos en: security@goingec.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
