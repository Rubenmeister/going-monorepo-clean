/**
 * Políticas y guías de primer viaje — base de conocimiento para el asistente
 * (chat + voz + llamadas). Origen: documentos oficiales de Operaciones Going
 * ("Manual de Políticas para Usuarios", "Tu primer viaje" pasajero y conductor).
 *
 * Se mantiene CONCISO a propósito (son hechos operativos que el agente debe saber
 * responder), no la prosa completa. Para el detalle largo, el usuario tiene las
 * guías en la webapp: /pasajeros/primer-viaje, /pasajeros/politicas,
 * /conductores/primer-viaje.
 */

/** Bloque para el prompt del PASAJERO (políticas + primer viaje). */
export const POLICIES_AND_GUIDES_KB = `## Políticas de usuario (cancelaciones, reembolsos, conducta)
- Cancelación GRATIS dentro de los primeros 5 minutos después de que una conductora o conductor acepta la solicitud.
- Después de esos 5 minutos, la cancelación tiene una tarifa de $5 (compensa el tiempo y desplazamiento).
- Si quien conduce cancela, al pasajero NO se le cobra y puede pedir otro viaje de inmediato.
- Reembolsos: se solicitan desde la app (historial de viajes → seleccionar el viaje). Respuesta normal en 3 a 5 días hábiles.
- Recibo detallado de cada viaje en la app y por correo.
- Créditos/promos: se aplican automáticamente en el próximo viaje elegible; el descuento se ve antes de confirmar.
- Conducta a bordo: uso obligatorio del cinturón; respeto a quien conduce; sin ruido excesivo; no fumar ni consumir alcohol/drogas; no se toleran comportamientos abusivos o violentos. Los daños al vehículo son responsabilidad del pasajero.
- Inclusión: respeto a todas las personas sin importar origen, género, orientación o creencias. Reportar cualquier comportamiento inapropiado desde la app.
- Evaluación: al terminar, el pasajero califica de 1 a 5 estrellas y puede comentar (confidencial).

## Primer viaje (guía rápida para el pasajero)
1. Ten la app instalada y actualizada, internet estable y el GPS activado.
2. Configura tu método de pago (tarjeta, billetera digital o efectivo, según la ciudad).
3. Ingresa tu destino, elige el servicio (privado, compartido, VIP, entre ciudades o aeropuerto) y confirma la tarifa estimada.
4. ANTES de subir: verifica que el vehículo, la placa y quien conduce coincidan con la app. Espera en un lugar seguro y visible.
5. Durante: puedes usar "Compartir mi viaje" y el Botón de Seguridad; usa siempre el cinturón.
6. Al final: pago automático (tarjeta/digital) o en efectivo a quien conduce; luego califica el viaje.
Guías completas en la webapp: /pasajeros/primer-viaje y /pasajeros/politicas.`;

/** Bloque para el prompt del CONDUCTOR (primer viaje). */
export const DRIVER_FIRST_TRIP_KB = `## Primer viaje (guía para conductoras y conductores)
- Prepara el vehículo: soporte y cargador para el celular; accesorios identificativos de Going generan confianza.
- Mantén el auto limpio (interior y exterior), con frenos, luces y aire acondicionado en buen estado — impacta tus calificaciones.
- Música con volumen moderado; pregunta preferencias al pasajero.
- Seguridad: usa "Compartir mi viaje"; cada viaje queda con monitoreo GPS; hay evaluación mutua (buenas calificaciones = más oportunidades). El botón de emergencia conecta con autoridades.
- NUNCA compartas tu cuenta ni tus credenciales (Guías Comunitarias).
- Proceso del viaje: "Iniciar" → ves destino y tarifa estimada antes de aceptar → navega al punto de recogida → confirma el nombre del pasajero → finaliza en la app para procesar el pago.
- Aeropuerto: conoce zonas de espera/recogida autorizadas; a veces se usa letrero con el nombre; deja espacio para equipaje.
- Going Envíos: carga bien embalada y asegurada; seguimiento en tiempo real; manipular con cuidado.
- Accidentes: primero la seguridad de todos y emergencias si aplica; luego reportar en la app.
Guía completa en la webapp: /conductores/primer-viaje.`;
