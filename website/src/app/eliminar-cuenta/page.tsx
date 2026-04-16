import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eliminación de Cuenta — Going Ecuador',
  description:
    'Solicita la eliminación de tu cuenta Going y la supresión de tus datos personales conforme a la LOPDP.',
};

export default function EliminarCuentaPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-red-600 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Eliminar mi cuenta Going</h1>
        <p className="text-xl max-w-2xl mx-auto opacity-90">
          Tienes derecho a solicitar la eliminación de tu cuenta y la supresión
          de tus datos personales en cualquier momento.
        </p>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Cómo solicitar */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Cómo solicito la eliminación?
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 text-lg">
            <li>
              Desde la app Going: ve a{' '}
              <strong>Perfil → Configuración → Eliminar cuenta</strong> y
              confirma la solicitud.
            </li>
            <li>
              Por correo electrónico: envía un mensaje a{' '}
              <a
                href="mailto:privacidad@goingec.com"
                className="text-red-600 underline font-medium"
              >
                privacidad@goingec.com
              </a>{' '}
              con el asunto <em>"Solicitud de eliminación de cuenta"</em> e
              incluye el correo electrónico registrado en tu cuenta.
            </li>
          </ol>
          <p className="mt-4 text-gray-600">
            Procesaremos tu solicitud en un plazo máximo de <strong>15 días hábiles</strong>.
          </p>
        </section>

        {/* Qué se elimina */}
        <section className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Qué datos se eliminan?
          </h2>
          <ul className="space-y-2 text-gray-700">
            {[
              'Nombre, correo electrónico y número de teléfono',
              'Historial de viajes y reservas',
              'Métodos de pago registrados',
              'Foto de perfil y preferencias de la cuenta',
              'Datos de ubicación almacenados',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Qué se retiene */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Qué datos se conservan temporalmente?
          </h2>
          <p className="text-gray-700 mb-3">
            Por obligaciones legales y fiscales, Going conservará ciertos datos
            por los plazos que la ley exige:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              Registros de transacciones económicas:{' '}
              <strong>7 años</strong> (Código Tributario del Ecuador).
            </li>
            <li>
              Datos necesarios para resolver disputas o reclamos pendientes:
              hasta la resolución del caso.
            </li>
          </ul>
          <p className="mt-3 text-gray-600 text-sm">
            Una vez vencidos estos plazos, todos los datos serán eliminados de
            forma definitiva.
          </p>
        </section>

        {/* Contacto */}
        <section className="border border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            ¿Tienes dudas?
          </h2>
          <p className="text-gray-700">
            Puedes contactar a nuestro Delegado de Protección de Datos:
          </p>
          <div className="mt-3 space-y-1 text-gray-700">
            <p>
              📧{' '}
              <a
                href="mailto:privacidad@goingec.com"
                className="text-red-600 underline"
              >
                privacidad@goingec.com
              </a>
            </p>
            <p>🕐 Lunes a viernes, 09h00 – 17h00</p>
          </div>
        </section>

      </div>
    </main>
  );
}
