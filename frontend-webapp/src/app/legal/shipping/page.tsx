'use client';

import Link from 'next/link';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
          <span>›</span>
          <Link href="/legal/terms" className="hover:text-gray-600">Legal</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Política de Envíos</span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Envíos</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: 24 de marzo de 2026</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-10 text-gray-600 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Descripción del Servicio</h2>
            <p>
              Going Ecuador ofrece un servicio de <strong>envío de paquetes y documentos</strong>, debidamente
              empacados, en las rutas abiertas a sus servicios, con recogida y entrega en menos de 24 horas.
              El servicio es ejecutado por <strong>conductores verificados y registrados</strong> en la plataforma Going.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Cobertura Geográfica</h2>
            <p className="mb-4">
              El servicio de envíos opera actualmente en las siguientes ciudades del Ecuador:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Quito (Distrito Metropolitano) y aeropuerto</li>
              <li>Latacunga</li>
              <li>Ambato</li>
              <li>Santo Domingo</li>
              <li>El Carmen</li>
              <li>Ibarra</li>
            </ul>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
              La cobertura de ciudades puede variar. La disponibilidad exacta en su zona se muestra en tiempo real
              al ingresar las direcciones de recogida y entrega en la plataforma. <strong>Going no ofrece envíos internacionales.</strong>
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Tiempos de Entrega</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Tipo de Envío</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Tiempo Estimado</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Disponibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Envío Express (misma ciudad)</td>
                    <td className="px-4 py-3">30 – 90 minutos</td>
                    <td className="px-4 py-3 text-green-600 font-medium">24/7</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">Envío Interprovincial</td>
                    <td className="px-4 py-3">Mismo día (3 – 8 horas)</td>
                    <td className="px-4 py-3">Lun – Sáb, 6:00 – 20:00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Envío Programado</td>
                    <td className="px-4 py-3">Según horario elegido</td>
                    <td className="px-4 py-3">Con anticipación mínima de 2 horas</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Los tiempos estimados son referenciales y pueden variar por condiciones de tráfico, clima u otros
              factores externos. Going informará al remitente y destinatario sobre retrasos significativos mediante
              notificaciones en la aplicación. La persona que recibe o envía puede observar por dónde va su pedido
              en tiempo real.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Tipos de Paquetes Aceptados</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Categoría</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Descripción</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Peso Máximo</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Precio desde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Documentos y Sobres</td>
                    <td className="px-4 py-3">Contratos, facturas, cartas</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3 font-bold text-[#0033A0]">$10.00</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">Paquetes Pequeños</td>
                    <td className="px-4 py-3">Ropa, electrónicos, regalos</td>
                    <td className="px-4 py-3">10 kg</td>
                    <td className="px-4 py-3 font-bold text-[#0033A0]">$10.00</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Paquetes Medianos y Grandes</td>
                    <td className="px-4 py-3">Cajas medianas, artículos del hogar, maletas</td>
                    <td className="px-4 py-3">20 kg</td>
                    <td className="px-4 py-3 font-bold text-[#0033A0]">$15.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Artículos Prohibidos</h2>
            <p className="mb-3">Going no acepta el envío de los siguientes artículos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Armas, municiones o explosivos de cualquier tipo.</li>
              <li>Sustancias controladas, drogas o estupefacientes.</li>
              <li>Dinero en efectivo, billetes o monedas.</li>
              <li>Animales vivos.</li>
              <li>Materiales peligrosos, inflamables, tóxicos o corrosivos.</li>
              <li>Mercancía de origen ilícito o falsificada.</li>
              <li>Artículos perecederos que requieran cadena de frío sin notificación previa.</li>
            </ul>
            <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
              El remitente es responsable del contenido del paquete. Going se reserva el derecho de rechazar o
              retener paquetes que se sospeche contienen artículos prohibidos y notificar a las autoridades competentes.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Costos de Envío</h2>
            <p className="mb-3">
              El costo de cada envío se calcula automáticamente en la plataforma al ingresar las direcciones de
              recogida y entrega, en función de la distancia, el tipo de paquete y la disponibilidad de conductores.
              El precio final se muestra al usuario <strong>antes de confirmar el envío</strong> y no tiene cargos ocultos adicionales.
            </p>
            <p>
              Los precios incluyen el IVA vigente en Ecuador y el seguro básico del envío. Going puede aplicar
              tarifas dinámicas en horarios de alta demanda, lo cual se indica claramente en la pantalla de cotización.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Proceso de Recogida</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Una vez confirmado el envío, un conductor verificado será asignado y se dirigirá a la dirección de recogida indicada.</li>
              <li>El remitente recibirá notificaciones en tiempo real con el tiempo estimado de llegada del conductor.</li>
              <li>El conductor verificará que el paquete corresponde a la descripción ingresada en la plataforma. Going se reserva el derecho de rechazar paquetes que no coincidan o que contengan artículos prohibidos.</li>
              <li>El remitente recibirá una <strong>foto de confirmación</strong> de la recogida del paquete.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Proceso de Entrega</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>El destinatario será notificado cuando el conductor esté en camino a la dirección de entrega.</li>
              <li>La entrega se realiza en la dirección exacta indicada al momento de la reserva. Going no se responsabiliza por entregas fallidas causadas por datos incorrectos proporcionados por el remitente.</li>
              <li>El conductor tomará una <strong>foto de confirmación de entrega</strong> que será enviada tanto al remitente como al destinatario.</li>
              <li>Si el destinatario no se encuentra disponible, el conductor esperará un máximo de <strong>5 minutos</strong>. Transcurrido ese tiempo, se intentará una segunda entrega o se acordará un nuevo horario a través de la aplicación.</li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Rastreo del Envío</h2>
            <p>
              Todos los envíos incluyen <strong>tracking en tiempo real</strong> desde la plataforma Going. El remitente
              y el destinatario pueden seguir la ubicación del conductor y el estado del envío en todo momento a
              través de la aplicación o el sitio web.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Seguro y Responsabilidad por Daños</h2>
            <p className="mb-3">
              Todos los envíos incluyen un <strong>seguro básico</strong> que cubre pérdida o daño total del paquete
              hasta un valor de <strong>$100 USD</strong>. Para paquetes de mayor valor, el remitente puede contratar
              un seguro adicional al momento de la reserva.
            </p>
            <p>
              Going no se responsabiliza por daños causados por embalaje inadecuado del remitente, contenido frágil
              no declarado, o artículos prohibidos. Las reclamaciones por daños deben presentarse dentro de las
              <strong> 24 horas siguientes</strong> a la entrega.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Cancelaciones y Reembolsos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>El remitente puede cancelar el envío <strong>sin cargo</strong> hasta que el conductor haya aceptado la solicitud.</li>
              <li>Si el conductor ya aceptó y se dirige al punto de recogida, la cancelación generará un cargo de <strong>$5 USD</strong>.</li>
              <li>Una vez que el conductor ha recogido el paquete, no se aplican reembolsos.</li>
              <li>En caso de envío no entregado por causas imputables a Going o al conductor, se realizará el <strong>reembolso total</strong> del valor pagado en un plazo de 5 días hábiles.</li>
            </ul>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Reclamaciones</h2>
            <p className="mb-3">
              Para presentar una reclamación relacionada con un envío, el usuario deberá contactar a Going
              dentro de las <strong>24 horas posteriores a la entrega</strong>, adjuntando:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Número de seguimiento del envío.</li>
              <li>Descripción del problema (pérdida, daño, entrega incorrecta).</li>
              <li>Fotografías del paquete en caso de daños.</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
              <p>Las reclamaciones pueden presentarse a través de:</p>
              <p className="mt-2">
                📧 <a href="mailto:soporte@goingec.com" className="text-[#0033A0] font-semibold hover:underline">soporte@goingec.com</a>
                {' '}— responderemos en un plazo máximo de 24 horas hábiles.
              </p>
              <p className="mt-1">
                💬 WhatsApp disponible en la aplicación Going.
              </p>
            </div>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-400">
          <Link href="/legal/terms"    className="hover:text-gray-600">Términos de Servicio</Link>
          <Link href="/legal/privacy"  className="hover:text-gray-600">Privacidad</Link>
          <Link href="/legal/cookies"  className="hover:text-gray-600">Cookies</Link>
          <Link href="/legal/contact"  className="hover:text-gray-600">Contacto Legal</Link>
          <Link href="/contact"        className="hover:text-gray-600 ml-auto">¿Necesitas ayuda? →</Link>
        </div>

      </div>
    </div>
  );
}
