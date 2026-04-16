'use client';

import Link from 'next/link';

const sections = [
  { id: 'identificacion',  title: '1. Identificación y Aceptación' },
  { id: 'definiciones',    title: '2. Definiciones' },
  { id: 'registro',        title: '3. Registro y Cuenta de Usuario' },
  { id: 'servicios',       title: '4. Servicios Disponibles' },
  { id: 'reserva',         title: '5. Proceso de Reserva y Contratación' },
  { id: 'pagos',           title: '6. Precios, Pagos y Facturación' },
  { id: 'reembolsos',      title: '7. Cancelaciones y Reembolsos' },
  { id: 'obligaciones',    title: '8. Obligaciones del Usuario' },
  { id: 'conductores',     title: '9. Conductores y Proveedores' },
  { id: 'responsabilidad', title: '10. Responsabilidad de Going' },
  { id: 'propiedad',       title: '11. Propiedad Intelectual' },
  { id: 'privacidad',      title: '12. Privacidad y Protección de Datos' },
  { id: 'modificaciones',  title: '13. Modificaciones a los Términos' },
  { id: 'regulacion',      title: '14. Regulación y Jurisdicción Aplicable' },
  { id: 'contacto',        title: '15. Contacto' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
          <span>›</span>
          <Link href="/legal" className="hover:text-gray-600">Legal</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Términos y Condiciones</span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: 11 de abril de 2026</p>

        {/* Índice de navegación */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
          <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Contenido</p>
          <ul className="grid sm:grid-cols-2 gap-1">
            {sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`}
                  className="text-sm text-blue-700 hover:text-blue-900 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-10 text-gray-600 leading-relaxed">

          <section id="identificacion">
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Identificación y Aceptación</h2>
            <p>
              Los presentes Términos y Condiciones (en adelante, &quot;Términos&quot;) regulan el acceso, uso y
              contratación de los servicios ofrecidos por <strong>Going Ecuador S.A.S.</strong>
              (en adelante, &quot;Going&quot;) a través de la plataforma digital <strong>goingec.com</strong>{' '}
              y la aplicación móvil Going, domiciliada en Echeverría N2-170, Quito, Ecuador.
            </p>
            <p className="mt-2">
              Al registrarse, acceder o utilizar cualquier servicio de la plataforma, el usuario
              declara haber leído, comprendido y aceptado en su totalidad los presentes Términos.
              Si no está de acuerdo, deberá abstenerse de usar la plataforma.
            </p>
          </section>

          <section id="definiciones">
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Definiciones</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Plataforma:</strong> el sitio web goingec.com y la aplicación móvil Going.</li>
              <li><strong>Usuario / Pasajero:</strong> toda persona natural o jurídica que accede o utiliza la plataforma para solicitar servicios.</li>
              <li><strong>Conductor / Proveedor:</strong> conductor verificado, anfitrión, operador de tours u otro prestador de servicios registrado en Going.</li>
              <li><strong>Servicio:</strong> cualquier servicio disponible en la plataforma, incluyendo transporte, envíos, tours y experiencias.</li>
              <li><strong>Reserva:</strong> la contratación de un servicio a través de la plataforma.</li>
              <li><strong>Token de Verificación:</strong> código de seguridad de un solo uso para validar el inicio o la entrega de un servicio.</li>
            </ul>
          </section>

          <section id="registro">
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

          <section id="servicios">
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Servicios Disponibles</h2>
            <p className="mb-3">Going ofrece los siguientes servicios a través de su plataforma:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Transporte compartido:</strong> servicio de movilidad donde varios pasajeros
                comparten ruta y costo con un conductor verificado.
              </li>
              <li>
                <strong>Transporte privado:</strong> servicio de movilidad exclusivo para el usuario
                o grupo, con conductor asignado y tarifa fija.
              </li>
              <li>
                <strong>Envíos:</strong> servicio de envío y entrega de sobres, paquetes y maletas
                a nivel nacional, con tracking en tiempo real y confirmación por token y foto.
              </li>
              <li>
                <strong>Destinos y Tours:</strong> reserva de actividades turísticas, aventura
                y experiencias culturales con operadores locales certificados.
              </li>
            </ul>
          </section>

          <section id="reserva">
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Proceso de Reserva y Contratación</h2>
            <p>
              La contratación se perfecciona cuando el usuario completa el proceso de reserva en la
              plataforma y recibe la confirmación por notificación en la aplicación. Going actúa como
              intermediario tecnológico entre el usuario y el proveedor del servicio.
            </p>
            <p className="mt-2">
              Para viajes inmediatos, la plataforma asignará al conductor disponible más cercano.
              Para viajes programados, se podrá asignar con anticipación al conductor que habitualmente
              cubre esa ruta y horario. El usuario puede compartir su ubicación en tiempo real durante
              el servicio con personas de confianza.
            </p>
            <p className="mt-2">
              Going no garantiza la disponibilidad permanente de todos los servicios. En caso de que
              un servicio no pueda prestarse por causas imputables a Going, se ofrecerá al usuario una
              alternativa equivalente o el reembolso íntegro del valor pagado.
            </p>
          </section>

          <section id="pagos">
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Precios, Pagos y Facturación</h2>
            <p className="mb-3">
              Los precios se muestran en dólares americanos (USD) e incluyen todos los impuestos
              aplicables según la legislación ecuatoriana (IVA).
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Pago en efectivo:</strong> el pasajero paga directamente al conductor al
                finalizar el viaje o servicio.
              </li>
              <li>
                <strong>Pago digital:</strong> Going acepta tarjetas de crédito y débito a través
                de pasarelas certificadas (Mastercard, Visa y otras). El procesamiento está a cargo
                de proveedores certificados PCI DSS. Going no almacena datos completos de tarjetas.
              </li>
              <li>
                Las facturas se emiten electrónicamente conforme a la normativa del SRI.
                El usuario recibirá su comprobante al correo registrado.
              </li>
              <li>
                Going se reserva el derecho de modificar precios en cualquier momento,
                sin afectar reservas ya confirmadas.
              </li>
            </ul>
          </section>

          <section id="reembolsos">
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Cancelaciones y Reembolsos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Transporte:</strong> cancelación gratuita hasta 5 minutos después de
                confirmar la reserva. Pasado ese tiempo, se aplicará un cargo equivalente al
                valor del viaje.
              </li>
              <li>
                <strong>Tours y Destinos:</strong> las condiciones de cancelación son establecidas
                por cada operador y se muestran claramente antes de confirmar la reserva.
              </li>
              <li>
                <strong>Envíos:</strong> el usuario puede cancelar sin cargo hasta que el conductor
                haya recogido el paquete. Una vez recogido, no aplica reembolso.
              </li>
              <li>
                Los reembolsos aprobados se procesan en un plazo de 5 a 10 días hábiles,
                dependiendo del banco emisor de la tarjeta.
              </li>
            </ul>
          </section>

          <section id="obligaciones">
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Obligaciones del Usuario</h2>
            <p className="mb-3">El usuario se compromete a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar la plataforma de forma lícita y conforme a los presentes Términos.</li>
              <li>No reproducir, distribuir, modificar o explotar comercialmente el contenido de la plataforma sin autorización expresa.</li>
              <li>No intentar acceder a áreas restringidas o realizar ingeniería inversa de la plataforma.</li>
              <li>No usar la plataforma para actividades ilegales, fraudulentas o que dañen a terceros.</li>
              <li>Tratar con respeto a los conductores, proveedores y demás usuarios de la comunidad Going.</li>
              <li>Proporcionar información veraz en reservas, envíos y perfiles.</li>
              <li>No enviar objetos prohibidos por ley ecuatoriana ni contenido peligroso a través del servicio de envíos.</li>
            </ul>
          </section>

          <section id="conductores">
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Conductores y Proveedores</h2>
            <p className="mb-3">
              Los conductores y proveedores de servicios en Going son personas independientes que
              operan bajo los requisitos mínimos exigidos por la plataforma:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Documento de identidad válido (cédula ecuatoriana o pasaporte).</li>
              <li>Licencia de conducir vigente y categoría habilitada para el tipo de servicio.</li>
              <li>Vehículo con matrícula al día, SOAT vigente y revisión técnica aprobada.</li>
              <li>Antecedentes penales verificados antes de activar la cuenta.</li>
              <li>Cumplimiento de las normativas de la ANT y demás autoridades competentes.</li>
            </ul>
            <p className="mt-3">
              Going se reserva el derecho de suspender o dar de baja a cualquier conductor o proveedor
              que incumpla estos requisitos o reciba calificaciones negativas reiteradas.
            </p>
          </section>

          <section id="responsabilidad">
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Responsabilidad de Going</h2>
            <p>
              Going actúa como plataforma tecnológica intermediaria. Los servicios de transporte,
              tours y envíos son prestados por proveedores independientes. Going no es responsable
              por daños o perjuicios derivados de la conducta de los proveedores, casos fortuitos
              o de fuerza mayor.
            </p>
            <p className="mt-2">
              Going garantiza la disponibilidad de la plataforma con una meta de uptime del 99%,
              sin perjuicio de interrupciones por mantenimiento programado, ataques informáticos
              u otras causas fuera de su control.
            </p>
          </section>

          <section id="propiedad">
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Propiedad Intelectual</h2>
            <p>
              Todos los contenidos de la plataforma Going (marca, logotipo, diseño, código,
              textos, imágenes y videos) son propiedad de Going Ecuador S.A.S. y están
              protegidos por la legislación ecuatoriana e internacional de propiedad intelectual.
              Su reproducción total o parcial sin autorización expresa está prohibida.
            </p>
          </section>

          <section id="privacidad">
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Privacidad y Protección de Datos</h2>
            <p>
              El tratamiento de los datos personales del usuario se rige por la{' '}
              <Link href="/legal/privacy" className="text-blue-600 hover:underline font-medium">
                Política de Privacidad
              </Link>{' '}
              de Going y por la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).
              Going recopila únicamente los datos necesarios para prestar los servicios contratados
              y no los comparte con terceros sin consentimiento, salvo obligación legal.
            </p>
          </section>

          <section id="modificaciones">
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Modificaciones a los Términos</h2>
            <p>
              Going se reserva el derecho de modificar los presentes Términos en cualquier momento.
              Los cambios significativos serán notificados al usuario con al menos{' '}
              <strong>15 días de anticipación</strong> mediante correo electrónico o aviso en la
              plataforma. El uso continuado del servicio tras la publicación de los cambios
              constituye la aceptación de los nuevos Términos.
            </p>
          </section>

          <section id="regulacion">
            <h2 className="text-xl font-bold text-gray-900 mb-3">14. Regulación y Jurisdicción Aplicable</h2>
            <p className="mb-3">Going Ecuador opera bajo el marco legal ecuatoriano, incluyendo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>ANT (Agencia Nacional de Tránsito):</strong> para servicios de transporte
                terrestre, habilitación de conductores y vehículos.
              </li>
              <li>
                <strong>SRI (Servicio de Rentas Internas):</strong> para facturación electrónica
                y cumplimiento tributario.
              </li>
              <li>
                <strong>Mintur (Ministerio de Turismo):</strong> para operadores de tours,
                destinos y experiencias turísticas.
              </li>
              <li>
                <strong>LOPDP:</strong> Ley Orgánica de Protección de Datos Personales para
                el tratamiento de información de usuarios.
              </li>
            </ul>
            <p className="mt-3">
              Los presentes Términos se rigen por las leyes de la <strong>República del Ecuador</strong>.
              Para la resolución de cualquier controversia, las partes se someten a los jueces y
              tribunales competentes de la ciudad de <strong>Quito, Ecuador</strong>.
            </p>
          </section>

          <section id="contacto">
            <h2 className="text-xl font-bold text-gray-900 mb-3">15. Contacto</h2>
            <p>Para consultas, reclamaciones o ejercicio de derechos relacionados con estos Términos:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Correo electrónico: <strong>legal@goingec.com</strong></li>
              <li>Teléfono: <strong>096 249 9988</strong></li>
              <li>Dirección: <strong>Echeverría N2-170, Quito, Ecuador</strong></li>
            </ul>
          </section>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 italic">
              Estos Términos y Condiciones constituyen el acuerdo completo entre el usuario y
              Going Ecuador S.A.S. respecto al uso de la plataforma y reemplazan cualquier
              acuerdo anterior sobre la misma materia.
            </p>
            <p className="text-sm text-gray-500 mt-2">Última actualización: 11 de abril de 2026</p>
          </div>

        </div>
      </div>
    </div>
  );
}
