'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: 23 de marzo de 2026</p>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Identificación del Responsable</h2>
            <p>
              <strong>Going Ecuador S.A.S.</strong> (en adelante, &quot;Going&quot; o &quot;la Empresa&quot;), con domicilio en
              Av. República de El Salvador N35-88, Torre Atiria Piso 10, Quito, Ecuador, es el responsable
              del tratamiento de los datos personales recopilados a través de la plataforma
              <strong> app.goingec.com</strong> y la aplicación móvil Going.
            </p>
            <p className="mt-2">
              Para consultas relacionadas con privacidad y protección de datos puede contactarnos en:
              <strong> privacidad@goingec.com</strong> o llamar al <strong>+593 2 600-1234</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Datos Personales que Recopilamos</h2>
            <p className="mb-3">Going recopila los siguientes datos personales según el servicio utilizado:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Datos de identificación:</strong> nombre completo, número de cédula o pasaporte,
                fecha de nacimiento y nacionalidad.
              </li>
              <li>
                <strong>Datos de contacto:</strong> dirección de correo electrónico, número de teléfono
                celular o convencional, dirección domiciliaria.
              </li>
              <li>
                <strong>Datos de la cuenta:</strong> nombre de usuario, contraseña cifrada, foto de perfil
                y preferencias de la plataforma.
              </li>
              <li>
                <strong>Datos de transacciones:</strong> historial de reservas, servicios contratados,
                métodos de pago utilizados (sin almacenar datos completos de tarjetas de crédito o débito),
                montos y fechas de pago.
              </li>
              <li>
                <strong>Datos de ubicación:</strong> coordenadas GPS durante el uso activo del servicio de
                transporte o envíos, con el consentimiento expreso del usuario.
              </li>
              <li>
                <strong>Datos de navegación:</strong> dirección IP, tipo de dispositivo, sistema operativo,
                navegador, páginas visitadas y tiempo de sesión.
              </li>
              <li>
                <strong>Datos de envíos:</strong> dirección de recogida, dirección de entrega, descripción
                del paquete, datos del destinatario.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalidades del Tratamiento</h2>
            <p className="mb-3">Los datos personales son utilizados exclusivamente para las siguientes finalidades:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Crear y gestionar la cuenta del usuario en la plataforma.</li>
              <li>Prestar los servicios contratados: transporte, alojamiento, tours, experiencias y envíos.</li>
              <li>Procesar pagos y emitir comprobantes de transacción.</li>
              <li>Verificar la identidad del usuario para prevenir fraudes.</li>
              <li>Enviar notificaciones operativas sobre reservas, estados de envíos y actualizaciones del servicio.</li>
              <li>Enviar comunicaciones comerciales y promociones, únicamente con consentimiento previo.</li>
              <li>Cumplir con obligaciones legales, tributarias y regulatorias vigentes en Ecuador.</li>
              <li>Mejorar la calidad de los servicios mediante análisis estadístico y de uso de la plataforma.</li>
              <li>Resolver disputas, reclamaciones o incidencias reportadas por el usuario.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Base Legal del Tratamiento</h2>
            <p className="mb-3">El tratamiento de datos se fundamenta en:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Ejecución de contrato:</strong> para prestar los servicios solicitados.</li>
              <li><strong>Consentimiento del titular:</strong> para comunicaciones comerciales y uso de datos de ubicación.</li>
              <li><strong>Obligación legal:</strong> para cumplimiento tributario y regulatorio ante el SRI, Superintendencia de Compañías y demás autoridades ecuatorianas.</li>
              <li><strong>Interés legítimo:</strong> para mejorar la plataforma y prevenir fraudes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Conservación de Datos</h2>
            <p>
              Los datos personales se conservan durante el tiempo en que el usuario mantenga su cuenta activa
              en la plataforma. Una vez que el usuario solicite la eliminación de su cuenta, los datos serán
              eliminados en un plazo máximo de <strong>30 días calendario</strong>, salvo aquellos que deban
              conservarse por obligación legal (por ejemplo, datos tributarios que deben conservarse durante
              7 años conforme al Código Tributario del Ecuador).
            </p>
            <p className="mt-2">
              Los datos de transacciones de pago son conservados por <strong>5 años</strong> para cumplimiento
              de normativa financiera y tributaria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Compartición de Datos con Terceros</h2>
            <p className="mb-3">Going podrá compartir datos con terceros únicamente en los siguientes casos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Proveedores de servicios:</strong> conductores, anfitriones, operadores de tours y
                promotores locales registrados en la plataforma, únicamente los datos necesarios para
                prestar el servicio contratado.
              </li>
              <li>
                <strong>Procesadores de pago:</strong> pasarelas de pago autorizadas (Datafast, etc.)
                que procesan transacciones bajo sus propias políticas de seguridad y cumplimiento PCI DSS.
              </li>
              <li>
                <strong>Proveedores tecnológicos:</strong> servicios de infraestructura cloud (servidores,
                almacenamiento, analítica) bajo acuerdos de confidencialidad y protección de datos.
              </li>
              <li>
                <strong>Autoridades competentes:</strong> cuando sea requerido por ley, orden judicial o
                requerimiento de autoridad ecuatoriana competente.
              </li>
            </ul>
            <p className="mt-3">
              Going <strong>no vende, arrienda ni cede</strong> datos personales a terceros con fines
              comerciales propios de esos terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Seguridad de los Datos</h2>
            <p>
              Going implementa medidas técnicas y organizativas para proteger los datos personales contra
              acceso no autorizado, pérdida, alteración o destrucción, que incluyen:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Cifrado de datos en tránsito mediante TLS 1.2/1.3.</li>
              <li>Cifrado de contraseñas mediante algoritmos bcrypt.</li>
              <li>Control de acceso basado en roles (RBAC).</li>
              <li>Monitoreo continuo de seguridad y detección de intrusiones.</li>
              <li>Copias de seguridad periódicas en entornos protegidos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Derechos del Titular</h2>
            <p className="mb-3">
              De conformidad con la <strong>Ley Orgánica de Protección de Datos Personales del Ecuador</strong>
              (LOPDP), el usuario tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acceso:</strong> conocer qué datos personales tenemos sobre usted.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Eliminación:</strong> solicitar la supresión de sus datos personales.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado y legible.</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento para fines de marketing directo.</li>
              <li><strong>Revocación del consentimiento:</strong> retirar el consentimiento otorgado en cualquier momento.</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, el usuario debe enviar una solicitud escrita a
              <strong> privacidad@goingec.com</strong>. Going responderá en un plazo máximo de
              <strong> 15 días hábiles</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Cookies y Tecnologías de Seguimiento</h2>
            <p>
              Going utiliza cookies y tecnologías similares para mejorar la experiencia del usuario,
              analizar el uso de la plataforma y personalizar el contenido. El usuario puede gestionar
              sus preferencias de cookies desde la sección <strong>Política de Cookies</strong> de la
              plataforma o desde la configuración de su navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Transferencias Internacionales</h2>
            <p>
              Algunos proveedores tecnológicos de Going pueden procesar datos fuera del Ecuador.
              En estos casos, Going garantiza que dichas transferencias se realizan a países con nivel
              adecuado de protección o bajo acuerdos contractuales que garantizan la seguridad y
              confidencialidad de los datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Menores de Edad</h2>
            <p>
              La plataforma Going no está dirigida a menores de 18 años. Going no recopila
              intencionalmente datos personales de menores de edad. Si se detecta que se han recopilado
              datos de un menor sin consentimiento parental, serán eliminados de inmediato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Modificaciones a esta Política</h2>
            <p>
              Going se reserva el derecho de modificar esta Política de Privacidad en cualquier momento.
              Los cambios sustanciales serán notificados al usuario mediante correo electrónico o aviso
              destacado en la plataforma con al menos <strong>15 días de anticipación</strong>.
              El uso continuado de la plataforma tras la entrada en vigor de los cambios implica la
              aceptación de la nueva política.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Autoridad de Control</h2>
            <p>
              El usuario tiene derecho a presentar una reclamación ante la
              <strong> Autoridad de Protección de Datos Personales del Ecuador</strong> si considera
              que el tratamiento de sus datos no se ajusta a la normativa vigente.
            </p>
          </section>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 italic">
              Esta Política de Privacidad rige el tratamiento de datos personales por parte de
              Going Ecuador S.A.S. de conformidad con la Ley Orgánica de Protección de Datos
              Personales (LOPDP) y demás normativa aplicable en la República del Ecuador.
            </p>
            <p className="text-sm text-gray-500 mt-2">Última actualización: 23 de marzo de 2026</p>
          </div>

        </div>
      </div>
    </div>
  );
}
