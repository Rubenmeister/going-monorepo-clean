'use client';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Envío y Entrega</h1>
        <p className="text-sm text-gray-500 mb-8">Última actualización: 23 de marzo de 2026</p>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Descripción del Servicio</h2>
            <p>
              Going Ecuador ofrece un servicio de <strong>envío de paquetes y documentos a nivel
              nacional</strong>, con recogida y entrega el <strong>mismo día</strong> en las ciudades
              donde operamos. El servicio es ejecutado por conductores verificados y registrados en
              la plataforma Going.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Cobertura Geográfica</h2>
            <p className="mb-3">
              El servicio de envíos opera actualmente en las siguientes ciudades del Ecuador:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Quito (Distrito Metropolitano)</li>
              <li>Guayaquil</li>
              <li>Cuenca</li>
              <li>Ambato</li>
              <li>Loja</li>
              <li>Manta</li>
              <li>Santo Domingo de los Tsáchilas</li>
              <li>Riobamba</li>
              <li>Ibarra</li>
              <li>Latacunga</li>
            </ul>
            <p className="mt-3">
              La cobertura de ciudades puede variar. La disponibilidad exacta en su zona se muestra
              en tiempo real al ingresar las direcciones de recogida y entrega en la plataforma.
              Going no ofrece actualmente envíos internacionales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Tiempos de Entrega</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-2 text-left text-gray-900">Tipo de Envío</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-gray-900">Tiempo Estimado</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-gray-900">Disponibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Envío Express (misma ciudad)</td>
                    <td className="border border-gray-200 px-4 py-2">30 – 90 minutos</td>
                    <td className="border border-gray-200 px-4 py-2">24/7</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">Envío Interprovincial</td>
                    <td className="border border-gray-200 px-4 py-2">Mismo día (3 – 8 horas)</td>
                    <td className="border border-gray-200 px-4 py-2">Lun – Sáb, 6:00 – 20:00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Envío Programado</td>
                    <td className="border border-gray-200 px-4 py-2">Según horario elegido</td>
                    <td className="border border-gray-200 px-4 py-2">Con anticipación mínima de 2 horas</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm">
              Los tiempos estimados son referenciales y pueden variar por condiciones de tráfico,
              clima u otros factores externos. Going informará al remitente y destinatario sobre
              retrasos significativos mediante notificaciones en la aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Tipos de Paquetes Aceptados</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-2 text-left text-gray-900">Categoría</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-gray-900">Descripción</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-gray-900">Peso Máximo</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-gray-900">Precio desde</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Documentos y Sobres</td>
                    <td className="border border-gray-200 px-4 py-2">Contratos, facturas, cartas</td>
                    <td className="border border-gray-200 px-4 py-2">500 g</td>
                    <td className="border border-gray-200 px-4 py-2">$3.00</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">Paquetes Pequeños</td>
                    <td className="border border-gray-200 px-4 py-2">Ropa, electrónicos, regalos</td>
                    <td className="border border-gray-200 px-4 py-2">5 kg</td>
                    <td className="border border-gray-200 px-4 py-2">$5.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Paquetes Medianos</td>
                    <td className="border border-gray-200 px-4 py-2">Cajas medianas, artículos del hogar</td>
                    <td className="border border-gray-200 px-4 py-2">20 kg</td>
                    <td className="border border-gray-200 px-4 py-2">$8.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Artículos Prohibidos</h2>
            <p className="mb-3">
              Going <strong>no acepta</strong> el envío de los siguientes artículos:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Armas, municiones o explosivos de cualquier tipo.</li>
              <li>Sustancias controladas, drogas o estupefacientes.</li>
              <li>Dinero en efectivo, billetes o monedas.</li>
              <li>Animales vivos.</li>
              <li>Materiales peligrosos, inflamables, tóxicos o corrosivos.</li>
              <li>Mercancía de origen ilícito o falsificada.</li>
              <li>Artículos perecederos que requieran cadena de frío sin notificación previa.</li>
            </ul>
            <p className="mt-3">
              El remitente es responsable del contenido del paquete. Going se reserva el derecho
              de rechazar o retener paquetes que se sospeche contienen artículos prohibidos y
              notificar a las autoridades competentes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Costos de Envío</h2>
            <p>
              El costo de cada envío se calcula automáticamente en la plataforma al ingresar las
              direcciones de recogida y entrega, en función de la distancia, el tipo de paquete y
              la disponibilidad de conductores. El precio final se muestra al usuario antes de
              confirmar el envío y no tiene cargos ocultos adicionales.
            </p>
            <p className="mt-2">
              Los precios incluyen el <strong>IVA</strong> vigente en Ecuador y el seguro básico
              del envío. Going puede aplicar tarifas dinámicas en horarios de alta demanda, lo
              cual se indica claramente en la pantalla de cotización.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Proceso de Recogida</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Una vez confirmado el envío, un conductor verificado será asignado y se dirigirá
                a la dirección de recogida indicada.
              </li>
              <li>
                El remitente recibirá notificaciones en tiempo real con el tiempo estimado de
                llegada del conductor.
              </li>
              <li>
                El conductor verificará que el paquete corresponde a la descripción ingresada
                en la plataforma. Going se reserva el derecho de rechazar paquetes que no
                coincidan o que contengan artículos prohibidos.
              </li>
              <li>
                El remitente recibirá una foto de confirmación de la recogida del paquete.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Proceso de Entrega</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                El destinatario será notificado cuando el conductor esté en camino a la
                dirección de entrega.
              </li>
              <li>
                La entrega se realiza en la dirección exacta indicada al momento de la reserva.
                Going no se responsabiliza por entregas fallidas causadas por datos incorrectos
                proporcionados por el remitente.
              </li>
              <li>
                El conductor tomará una <strong>foto de confirmación de entrega</strong> que será
                enviada tanto al remitente como al destinatario.
              </li>
              <li>
                Si el destinatario no se encuentra disponible, el conductor esperará un máximo de
                5 minutos. Transcurrido ese tiempo, se intentará una segunda entrega o se
                acordará un nuevo horario a través de la aplicación.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Rastreo del Envío</h2>
            <p>
              Todos los envíos incluyen <strong>tracking en tiempo real</strong> desde la plataforma
              Going. El remitente y el destinatario pueden seguir la ubicación del conductor y el
              estado del envío en todo momento a través de la aplicación o el sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Seguro y Responsabilidad por Daños</h2>
            <p>
              Todos los envíos incluyen un <strong>seguro básico</strong> que cubre pérdida o daño
              total del paquete hasta un valor de <strong>$100 USD</strong>. Para paquetes de mayor
              valor, el remitente puede contratar un seguro adicional al momento de la reserva.
            </p>
            <p className="mt-2">
              Going no se responsabiliza por daños causados por embalaje inadecuado del remitente,
              contenido frágil no declarado, o artículos prohibidos. Las reclamaciones por daños
              deben presentarse dentro de las <strong>24 horas</strong> siguientes a la entrega.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Cancelaciones y Reembolsos de Envíos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                El remitente puede cancelar el envío sin cargo hasta que el conductor haya
                aceptado la solicitud.
              </li>
              <li>
                Si el conductor ya aceptó y se dirige al punto de recogida, la cancelación
                generará un cargo del 50% del valor del envío.
              </li>
              <li>
                Una vez que el conductor ha recogido el paquete, no se aplican reembolsos.
              </li>
              <li>
                En caso de envío no entregado por causas imputables a Going o al conductor,
                se realizará el reembolso total del valor pagado en un plazo de 5 a 10 días hábiles.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Reclamaciones</h2>
            <p>
              Para presentar una reclamación relacionada con un envío, el usuario deberá contactar
              a Going dentro de las <strong>24 horas</strong> posteriores a la entrega, adjuntando:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Número de seguimiento del envío.</li>
              <li>Descripción del problema (pérdida, daño, entrega incorrecta).</li>
              <li>Fotografías del paquete en caso de daños.</li>
            </ul>
            <p className="mt-3">
              Las reclamaciones pueden presentarse a través de:
              <strong> soporte@goingec.com</strong> o llamando al <strong>+593 2 600-1234</strong>.
              Going responderá en un plazo máximo de <strong>3 días hábiles</strong>.
            </p>
          </section>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 italic">
              Esta Política de Envío y Entrega aplica exclusivamente al servicio de envío de
              paquetes de Going Ecuador S.A.S. y puede ser actualizada en cualquier momento.
              Los cambios serán notificados con anticipación a través de la plataforma.
            </p>
            <p className="text-sm text-gray-500 mt-2">Última actualización: 23 de marzo de 2026</p>
          </div>

        </div>
      </div>
    </div>
  );
}
