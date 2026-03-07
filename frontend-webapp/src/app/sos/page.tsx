export const dynamic = 'force-dynamic';

export default function SOSPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-4xl font-bold text-red-600 mb-2">
            Asistencia de Emergencia
          </h1>
          <p className="text-gray-500 text-lg">
            Disponible 24/7 para todos los usuarios de Going
          </p>
        </div>

        {/* Emergency Contact Banner */}
        <div className="bg-red-600 text-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            ¿Necesitas ayuda inmediata?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📞</div>
              <div>
                <p className="text-red-200 text-sm">Línea de emergencia</p>
                <p className="text-3xl font-bold">+593 99 876 5432</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-4xl">💬</div>
              <div>
                <p className="text-red-200 text-sm">WhatsApp soporte urgente</p>
                <p className="text-3xl font-bold">+593 99 876 5432</p>
              </div>
            </div>
          </div>
        </div>

        {/* SOS Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {[
            {
              icon: '🚗',
              title: 'Emergencia de Transporte',
              desc: '¿Problemas con tu viaje? Nuestro equipo está listo para ayudarte de inmediato.',
              action: 'Solicitar soporte urgente',
              variant: 'red',
            },
            {
              icon: '🏥',
              title: 'Emergencia Médica',
              desc: 'En caso de emergencia médica, te conectamos con los servicios de emergencia locales.',
              action: 'Llamar emergencias',
              variant: 'red',
            },
            {
              icon: '📍',
              title: 'Objeto Perdido',
              desc: '¿Perdiste algo durante tu viaje? Te ayudamos a localizarlo con el conductor o anfitrión.',
              action: 'Reportar objeto perdido',
              variant: 'blue',
            },
            {
              icon: '💳',
              title: 'Problema de Pago',
              desc: '¿Inconvenientes con una transacción? Estamos aquí para resolverlo rápidamente.',
              action: 'Reportar problema de pago',
              variant: 'blue',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {item.icon} {item.title}
              </h3>
              <p className="text-gray-500 text-sm mb-4">{item.desc}</p>
              <button
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  item.variant === 'red'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {item.action}
              </button>
            </div>
          ))}
        </div>

        {/* Safety Tips */}
        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            🛡️ Consejos de Seguridad
          </h2>
          <ul className="space-y-3">
            {[
              'Siempre verifica la identidad del conductor antes de subir al vehículo.',
              'Comparte los detalles de tu viaje con un contacto de confianza.',
              'Mantén tus objetos de valor seguros y fuera de la vista.',
              'Reporta cualquier problema de seguridad de inmediato a Going.',
              'Espera tu transporte en áreas bien iluminadas y concurridas.',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                <span className="text-gray-700 text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            ❓ Preguntas Frecuentes
          </h2>
          <div className="space-y-3">
            {[
              {
                q: '¿Qué hago si me siento inseguro durante un viaje?',
                a: 'Solicita inmediatamente al conductor que detenga el vehículo en un lugar seguro y público. Luego contacta nuestra línea de emergencia o las autoridades locales.',
              },
              {
                q: '¿Cuánto demora en llegar la asistencia de emergencia?',
                a: 'Nuestro equipo de respuesta de emergencia está disponible 24/7 y busca responder en menos de 5 minutos tras tu llamada o mensaje.',
              },
              {
                q: '¿Tiene costo el servicio de emergencia?',
                a: 'La asistencia básica de emergencia es gratuita para todos los usuarios de Going. Servicios adicionales pueden tener costos según la naturaleza de la emergencia.',
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm cursor-pointer group"
              >
                <summary className="font-semibold text-gray-900 hover:text-blue-600 list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-gray-400 ml-2">▼</span>
                </summary>
                <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
