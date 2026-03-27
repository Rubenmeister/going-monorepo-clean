'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: 23 de marzo de 2026</p>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Identificación y Aceptación</h2>
            <p>
              Los presentes Términos y Condiciones (en adelante, &quot;Términos&quot;) regulan el acceso, uso y
              contratación de los servicios ofrecidos por <strong>Going Ecuador S.A.S.</strong>
              (en adelante, &quot;Going&quot;) a través de la plataforma digital <strong>app.goingec.com</strong>{' '}
              y la aplicación móvil Going, domiciliada en Av. República de El Salvador N35-88,
              Torre Atiria Piso 10, Quito, Ecuador.
            </p>
            <p className="mt-2">
              Al registrarse, acceder o utilizar cualquier servicio de la plataforma, el usuario
              declara haber leído, comprendido y aceptado en su totalidad los presentes Términos.
              Si no está de acuerdo, deberá abstenerse de usar la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Definiciones</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Plataforma:</strong> el sitio web app.goingec.com y la aplicación móvil Going.</li>
              <li><strong>Usuario:</strong> toda persona natural o jurídica que accede o utiliza la plataforma.</li>
              <li><strong>Proveedor:</strong> conductor, anfitrión, operador de tours, promotor local u otro prestador de servicios registrado en la plataforma.</li>
              <li><strong>Servicio:</strong> cualquier servicio disponible en la plataforma, incluyendo transporte, alojamiento, tours, experiencias y envíos.</li>
              <li><strong>Reserva:</strong> la contratación de un servicio a través de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Registro y Cuenta de Usuario</h2>
            <p className="mb-3">Para acceder a la mayoría de los servicios, el usuario debe crear una cuenta. Al registrarse, el usuario se compromete a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar información veraz, completa y actualizada.</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Notificar a Going de inmediato ante cualquier uso no autorizado de su cuenta.</li>
              <li>Ser mayor de 18 años o contar con autorización del representante legal.</li>
            </ul>
            <p className="mt-3">
              Going se reserva el derecho de suspender o eliminar cuentas que proporcionen
              información falsa o que incumplan estos Términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Servicios Disponibles</h2>
            <p className="mb-3">Going ofrece los siguientes servicios a través de su plataforma:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Transporte:</strong> servicio de movilidad terrestre a nivel nacional,
                conectando usuarios con conductores verificados.
              </li>
              <li>
                <strong>Alojamiento:</strong> reserva de hospedaje con anfitriones registrados
                en distintas ciudades del Ecuador.
              </li>
              <li>
                <strong>Tours y Experiencias:</strong> reserva de actividades turísticas, aventura
                y experiencias culturales con operadores locales certificados.
              </li>
              <li>
                <strong>Envíos de Paquetes:</strong> servicio de envío y entrega de paquetes y
                documentos a nivel nacional el mismo día.
              </li>
              <li>
                <strong>Academia Going:</strong> contenido formativo para conductores, anfitriones
                y operadores.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Proceso de Reserva y Contratación</h2>
            <p>
              La contratación de un servicio se perfecciona cuando el usuario completa el proceso
              de reserva en la plataforma y recibe la confirmación correspondiente por correo
              electrónico o notificación en la aplicación. Going actúa como intermediario
              tecnológico entre el usuario y el proveedor del servicio.
            </p>
            <p className="mt-2">
              Going no garantiza la disponibilidad permanente de todos los servicios. En caso de
              que un servicio no pueda prestarse por causas imputables a Going, se ofrecerá al
              usuario una alternativa equivalente o el reembolso íntegro del valor pagado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Precios, Pagos y Facturación</h2>
            <p className="mb-3">
              Los precios de los servicios se muestran en dólares americanos (USD) e incluyen
              todos los impuestos aplicables según la legislación ecuatoriana (IVA).
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Going acepta pagos con tarjeta de crédito y débito a través de pasarelas
                de pago certificadas (Mastercard, Visa y otras).
              </li>
              <li>
                El procesamiento de pagos está a cargo de proveedores certificados PCI DSS.
                Going no almacena datos completos de tarjetas bancarias.
              </li>
              <li>
                Las facturas se emiten electrónicamente conforme a la normativa del SRI.
                El usuario recibirá su comprobante al correo registrado.
              </li>
              <li>
                Going se reserva el derecho de modificar los precios de sus servicios
                en cualquier momento, sin afectar reservas ya confirmadas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Política de Cancelaciones y Reembolsos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Transporte:</strong> cancelación gratuita hasta 5 minutos después de
                confirmar la reserva. Pasado ese tiempo, se aplicará un cargo equivalente al
                valor del viaje.
              </li>
              <li>
                <strong>Alojamiento y Tours:</strong> las condiciones de cancelación son
                establecidas por cada proveedor y se muestran claramente antes de confirmar
                la reserva.
              </li>
              <li>
                <strong>Envíos:</strong> el usuario puede cancelar sin cargo hasta que el
                conductor haya recogido el paquete. Una vez recogido, no aplica reembolso.
              </li>
              <li>
                Los reembolsos aprobados se procesan en un plazo de 5 a 10 días hábiles,
                dependiendo del banco emisor de la tarjeta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Obligaciones del Usuario</h2>
            <p className="mb-3">El usuario se compromete a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar la plataforma de forma lícita y conforme a los presentes Términos.</li>
              <li>No reproducir, distribuir, modificar o explotar comercialmente el contenido de la plataforma sin autorización expresa.</li>
              <li>No intentar acceder a áreas restringidas o realizar ingeniería inversa de la plataforma.</li>
              <li>No usar la plataforma para actividades ilegales, fraudulentas o que dañen a terceros.</li>
              <li>Tratar con respeto a los proveedores y demás usuarios de la comunidad Going.</li>
              <li>Proporcionar información veraz en reservas, envíos y perfiles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Responsabilidad de Going</h2>
            <p>
              Going actúa como plataforma tecnológica intermediaria. Los servicios de transporte,
              alojamiento, tours y envíos son prestados por proveedores independientes. Going no
              es responsable por daños o perjuicios derivados de la conducta de los proveedores,
              casos fortuitos o de fuerza mayor.
            </p>
            <p className="mt-2">
              Going garantiza la disponibilidad de la plataforma con una meta de uptime del 99%,
              sin perjuicio de interrupciones por mantenimiento programado, ataques informáticos
              u otras causas fuera de su control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Propiedad Intelectual</h2>
            <p>
              Todos los contenidos de la plataforma Going (marca, logotipo, diseño, código,
              textos, imágenes y videos) son propiedad de Going Ecuador S.A.S. y están
              protegidos por la legislación ecuatoriana e internacional de propiedad intelectual.
              Su reproducción total o parcial sin autorización expresa está prohibida.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Privacidad y Protección de Datos</h2>
            <p>
              El tratamiento de los datos personales del usuario se rige por la
              <strong> Política de Privacidad</strong> de Going, disponible en
              app.goingec.com/legal/privacy, y por la Ley Orgánica de Protección de
              Datos Personales del Ecuador (LOPDP).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Modificaciones a los Términos</h2>
            <p>
              Going se reserva el derecho de modificar los presentes Términos en cualquier momento.
              Los cambios significativos serán notificados al usuario con al menos
              <strong> 15 días de anticipación</strong> mediante correo electrónico o aviso en la
              plataforma. El uso continuado del servicio tras la publicación de los cambios
              constituye la aceptación de los nuevos Términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Suspensión y Terminación</h2>
            <p>
              Going podrá suspender o cancelar el acceso de un usuario a la plataforma, con o
              sin previo aviso, en caso de incumplimiento de los presentes Términos, actividad
              fraudulenta, o cualquier conducta que ponga en riesgo la seguridad de la plataforma
              o de otros usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">14. Legislación Aplicable y Jurisdicción</h2>
            <p>
              Los presentes Términos se rigen por las leyes de la <strong>República del Ecuador</strong>.
              Para la resolución de cualquier controversia derivada de su interpretación o
              cumplimiento, las partes se someten a los jueces y tribunales competentes de la
              ciudad de <strong>Quito, Ecuador</strong>, renunciando expresamente a cualquier
              otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">15. Contacto</h2>
            <p>
              Para consultas, reclamaciones o ejercicio de derechos relacionados con estos
              Términos, el usuario puede contactar a Going a través de:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Correo electrónico: <strong>legal@goingec.com</strong></li>
              <li>Teléfono: <strong>+593 2 600-1234</strong></li>
              <li>Dirección: Av. República de El Salvador N35-88, Torre Atiria Piso 10, Quito, Ecuador</li>
            </ul>
          </section>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 italic">
              Estos Términos y Condiciones constituyen el acuerdo completo entre el usuario y
              Going Ecuador S.A.S. respecto al uso de la plataforma y reemplazan cualquier
              acuerdo anterior sobre la misma materia.
            </p>
            <p className="text-sm text-gray-500 mt-2">Última actualización: 23 de marzo de 2026</p>
          </div>

        </div>
      </div>
    </div>
  );
}
