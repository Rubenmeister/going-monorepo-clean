'use client';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Cookies</h1>
        <div className="bg-white rounded-xl shadow-md p-8 space-y-8 text-gray-600 leading-relaxed">

          <p className="text-sm italic text-gray-400">Última actualización: 26 de marzo de 2026</p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (computadora, teléfono o tablet)
              cuando visitas un sitio web. Permiten que la plataforma recuerde tus preferencias y mejore tu experiencia de uso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Tipos de cookies que utilizamos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.1 Cookies estrictamente necesarias</h3>
                <p>Imprescindibles para el funcionamiento básico de la plataforma. Sin ellas, servicios como el inicio de sesión o el carrito de servicios no funcionarían correctamente. No pueden desactivarse.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.2 Cookies de rendimiento</h3>
                <p>Recopilan información anónima sobre cómo los usuarios utilizan Going (páginas visitadas, errores encontrados, tiempo de carga). Nos ayudan a mejorar la plataforma continuamente.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.3 Cookies de funcionalidad</h3>
                <p>Permiten que la plataforma recuerde tus preferencias, como el idioma seleccionado o tu ciudad habitual de origen, para ofrecerte una experiencia personalizada.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">2.4 Cookies de análisis</h3>
                <p>Utilizamos herramientas de análisis (como Google Analytics) para entender el comportamiento de los usuarios de forma agregada y anónima. Estos datos nunca identifican a personas individuales.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cookies de terceros</h2>
            <p>
              Algunos servicios integrados en Going (mapas, pagos, redes sociales) pueden instalar sus propias cookies.
              Going no controla estas cookies; te recomendamos revisar las políticas de privacidad de dichos terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. ¿Cómo gestionar las cookies?</h2>
            <p className="mb-3">
              Puedes configurar tu navegador para rechazar, limitar o eliminar las cookies en cualquier momento.
              Ten en cuenta que desactivar ciertas cookies puede afectar la funcionalidad de la plataforma.
            </p>
            <p>
              Para gestionar cookies, consulta la configuración de privacidad de tu navegador:
              Chrome, Safari, Firefox, Edge o el navegador de tu dispositivo móvil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Base legal</h2>
            <p>
              El uso de cookies en Going se fundamenta en la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> del Ecuador
              y en el consentimiento informado del usuario al aceptar esta política al ingresar a la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cambios en esta política</h2>
            <p>
              Going puede actualizar esta Política de Cookies en cualquier momento. Te notificaremos de cambios significativos
              a través de la plataforma o por correo electrónico. La fecha de &quot;última actualización&quot; siempre refleja la versión vigente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política, puedes escribirnos a{' '}
              <a href="mailto:legal@goingec.com" className="text-primary-600 hover:underline font-medium">legal@goingec.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
