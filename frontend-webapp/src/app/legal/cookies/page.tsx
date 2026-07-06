'use client';

import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
          <span>›</span>
          <Link href="/legal" className="hover:text-gray-600">Legal</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Política de Cookies</span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Cookies</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: 28 de mayo de 2026</p>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que el sitio web almacena en tu dispositivo
              (computadora, celular o tableta) cuando lo visitás. Permiten que la plataforma recuerde
              tus preferencias e inicie sesión automáticamente entre visitas, mejorando tu experiencia
              de uso.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Esta política aplica a los sitios web operados por Going App (<strong>app.goingec.com</strong>,
              <strong> empresas.goingec.com</strong>, <strong>goingec.com</strong>). Las aplicaciones
              móviles Going App Pasajero y Going App Conductor NO usan cookies; en su lugar usan almacenamiento
              local seguro del sistema operativo (SecureStore en iOS y EncryptedSharedPreferences en Android).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Cookies que utiliza Going App</h2>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">2.1 Cookies estrictamente necesarias</h3>
            <p className="mb-3">
              Son imprescindibles para que el sitio funcione. Sin ellas no puedes iniciar sesión ni
              reservar viajes. <strong>No requieren tu consentimiento</strong> y no pueden desactivarse.
            </p>
            <div className="overflow-x-auto -mx-2 mb-4">
              <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Cookie</th>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Propósito</th>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Duración</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="px-3 py-2 border-b border-gray-100 font-mono text-xs">authToken</td>
                    <td className="px-3 py-2 border-b border-gray-100">Mantener tu sesión iniciada en la webapp</td>
                    <td className="px-3 py-2 border-b border-gray-100">Sesión</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border-b border-gray-100 font-mono text-xs">ride_state</td>
                    <td className="px-3 py-2 border-b border-gray-100">Recordar el viaje activo si refrescás la página durante una reserva</td>
                    <td className="px-3 py-2 border-b border-gray-100">Sesión</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border-b border-gray-100 font-mono text-xs">consent</td>
                    <td className="px-3 py-2 border-b border-gray-100">Recordar que ya aceptaste esta política de cookies</td>
                    <td className="px-3 py-2 border-b border-gray-100">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">2.2 Cookies de funcionalidad</h3>
            <p className="mb-3">
              Mejoran tu experiencia pero no son indispensables. Las puedes desactivar.
            </p>
            <div className="overflow-x-auto -mx-2 mb-4">
              <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Cookie</th>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Propósito</th>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Duración</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr>
                    <td className="px-3 py-2 border-b border-gray-100 font-mono text-xs">lang</td>
                    <td className="px-3 py-2 border-b border-gray-100">Recordar tu idioma preferido</td>
                    <td className="px-3 py-2 border-b border-gray-100">1 año</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border-b border-gray-100 font-mono text-xs">theme</td>
                    <td className="px-3 py-2 border-b border-gray-100">Recordar modo claro/oscuro elegido</td>
                    <td className="px-3 py-2 border-b border-gray-100">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">2.3 Cookies analíticas</h3>
            <p>
              Por ahora <strong>Going App NO usa cookies de analítica de terceros</strong> (Google Analytics,
              Facebook Pixel, etc.). Si esto cambia en el futuro, actualizaremos esta política y te
              pediremos tu consentimiento.
            </p>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">2.4 Cookies publicitarias</h3>
            <p>
              <strong>Going App NO usa cookies publicitarias.</strong> No vendemos tus datos a redes
              publicitarias ni a corredores de datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cookies de terceros</h2>
            <p className="mb-3">
              Cuando Going App integra servicios externos, esos servicios pueden colocar sus propias
              cookies bajo sus propias políticas. Going App no controla esas cookies directamente.
              Los terceros activos en nuestra plataforma son:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Mapbox</strong> (mapas, geocoding y rutas) — sus cookies se rigen por la{' '}
                <a
                  href="https://www.mapbox.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  política de privacidad de Mapbox
                </a>.
              </li>
              <li>
                <strong>Datafast</strong> (pasarela de pago Ecuador) — solo activa durante el flujo
                de pago. Cumple PCI DSS. Su política está en{' '}
                <a
                  href="https://datafast.com.ec"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  datafast.com.ec
                </a>.
              </li>
              <li>
                <strong>DeUna</strong> (Banco Pichincha, pago instantáneo) — solo activa durante el
                flujo de pago con DeUna.
              </li>
              <li>
                <strong>Google Cloud / Firebase</strong> (autenticación opcional con cuenta Google) —
                solo si eliges ingresar con Google. Su política está en{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  policies.google.com/privacy
                </a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. ¿Cómo gestionar las cookies?</h2>
            <p className="mb-3">
              Tienes varias formas de controlar las cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Banner de cookies en el sitio:</strong> al ingresar por primera vez, puedes
                aceptar o rechazar las cookies opcionales (las estrictamente necesarias no se pueden
                rechazar porque sin ellas el sitio no funciona).
              </li>
              <li>
                <strong>Configuración del navegador:</strong> puedes borrar todas las cookies de un
                sitio o de tu historial en cualquier momento desde la configuración de tu navegador
                (Chrome, Safari, Firefox, Edge u otro). Ten en cuenta que al borrar las cookies
                tendrás que iniciar sesión nuevamente.
              </li>
              <li>
                <strong>Modo incógnito:</strong> al cerrar la ventana incógnita, todas las cookies
                de esa sesión se eliminan.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Base legal</h2>
            <p>
              El uso de cookies en Going App se fundamenta en la{' '}
              <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> del Ecuador.
              Las cookies estrictamente necesarias se justifican por el interés legítimo de operar
              la plataforma. Las cookies opcionales requieren tu{' '}
              <strong>consentimiento explícito</strong>, otorgado al aceptar el banner inicial.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cambios en esta política</h2>
            <p>
              Going App puede actualizar esta Política de Cookies en cualquier momento. Si los cambios
              son materiales (por ejemplo, agregar un nuevo tipo de cookie analítica), te
              notificaremos con al menos <strong>15 días</strong> de anticipación a través de la
              plataforma o por correo electrónico. La fecha de &quot;última actualización&quot; arriba
              siempre refleja la versión vigente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contacto</h2>
            <p>Para cualquier consulta sobre esta política o el uso de tus datos:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                Privacidad / DPO:{' '}
                <a
                  href="mailto:privacidad@goingec.com"
                  className="text-blue-600 hover:underline font-medium"
                >
                  privacidad@goingec.com
                </a>
              </li>
              <li>
                Atención al cliente:{' '}
                <a
                  href="mailto:soporte@goingec.com"
                  className="text-blue-600 hover:underline font-medium"
                >
                  soporte@goingec.com
                </a>
              </li>
              <li>WhatsApp Going App: <strong>+593 98 403 7949</strong></li>
            </ul>
          </section>

          <div className="border-t pt-6 mt-6">
            <p className="text-sm text-gray-500">
              Going App es una marca operada por <strong>Thorn AI Technologies S.A.S.</strong>,
              RUC <strong>1793176925001</strong>, con domicilio en Echeverría N2-170 y Crespo Toral,
              Quito, Ecuador.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
