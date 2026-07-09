import { GuiaContenido, GuiaSeccion } from '../../components/GuiaContenido';

export const metadata = {
  title: 'Tu primer viaje como conductor — Going',
  description:
    'Guía para socias y socios conductores de Going: preparación del vehículo, seguridad, cómo realizar un viaje, aeropuerto, Going Envíos y soporte.',
};

const secciones: GuiaSeccion[] = [
  {
    paragraphs: [
      'Comenzar a trabajar como socia o socio conductor en Going es más que encender el motor y aceptar solicitudes: se trata de ofrecer un servicio seguro, profesional y agradable para las viajeras y los viajeros, mientras tú operas de forma eficiente y sin contratiempos. Reunimos recomendaciones prácticas, experiencias de conductoras y conductores con trayectoria, y normas de seguridad para un inicio exitoso en la plataforma.',
    ],
  },
  {
    heading: 'Prepara tu vehículo',
    paragraphs: [
      'Más allá de cumplir con las leyes y normativas locales, ciertos accesorios marcan una gran diferencia:',
    ],
    bullets: [
      'Un soporte para celular: te permite seguir las indicaciones de la aplicación sin apartar la vista de la carretera y garantiza un uso manos libres.',
      'Un cargador para el móvil: imprescindible para no quedarte sin batería a mitad de la jornada y evitar interrupciones en tus viajes o envíos.',
      'Elementos identificativos de Going (camisetas, gorras o calcomanías): generan confianza en las viajeras y viajeros y refuerzan la imagen profesional del servicio.',
    ],
  },
  {
    heading: 'Mantén el vehículo impecable',
    paragraphs: [
      'Un auto limpio, con aroma agradable y sin objetos personales a la vista, comunica respeto y cuidado por la experiencia del cliente. El interior debe estar libre de polvo o basura, y el exterior lucir pulcro y bien mantenido. Cuida también los aspectos funcionales: buen estado de frenos, luces y aire acondicionado. Un vehículo bien cuidado se traduce en mejores calificaciones y en la fidelidad de las viajeras y viajeros.',
    ],
  },
  {
    heading: 'La música, con criterio',
    paragraphs: [
      'La música influye directamente en la comodidad del pasajero. Selecciona melodías agradables y mantén un volumen moderado: la meta es que la música acompañe, no que invada el espacio del viaje. Muchas conductoras y conductores preguntan al pasajero si tiene alguna preferencia musical, lo que demuestra atención personalizada.',
    ],
  },
  {
    heading: 'Seguridad con la aplicación',
    paragraphs: [
      'La función Compartir mi viaje permite que tus familiares o personas de confianza sigan tu recorrido en tiempo real y conozcan la hora estimada de llegada. Pulsa el ícono de seguridad en el mapa, elige la opción y selecciona los contactos que recibirán la notificación con tu ubicación y los detalles del trayecto.',
      'Cada viaje queda registrado mediante el sistema de monitoreo GPS de Going, lo que facilita resolver incidencias y garantiza un historial preciso de los recorridos. Además, se aplica una evaluación mutua: las viajeras y viajeros te califican y tú a ellos. Una buena calificación abre la puerta a más oportunidades; las evaluaciones repetidamente negativas pueden llevar a restricciones, protegiendo la calidad y seguridad de la comunidad.',
      'En una emergencia, el botón de ayuda integrado conecta directamente con las autoridades y permite compartir tu ubicación y los datos del viaje, agilizando la respuesta. Nuestras Guías Comunitarias prohíben conductas riesgosas como compartir cuentas o ceder tus credenciales a terceros: la seguridad digital es tan importante como la física.',
    ],
  },
  {
    heading: 'Cómo realizar un viaje',
    paragraphs: [
      'Cuando estés listo, presiona "Iniciar" y la aplicación te mostrará solicitudes cercanas. Antes de aceptar verás el destino y la tarifa estimada, para decidir si tomas el viaje. Tras aceptar, dirígete al punto de recogida con la navegación integrada. Al encontrar al pasajero, confirma su identidad preguntándole su nombre para evitar confusiones. Durante el trayecto puedes seguir la ruta que prefieras, siempre que sea conveniente para ambas partes. Al llegar, finaliza el viaje en la aplicación para que se procese el pago y puedas continuar con nuevas solicitudes.',
    ],
  },
  {
    heading: 'El aeropuerto',
    paragraphs: [
      'El aeropuerto es un escenario particular. Familiarízate con las zonas de espera y recogida autorizadas; a veces deberás portar un letrero con el nombre del pasajero para que te identifique entre la multitud. Conocer los horarios de vuelos ayuda: los picos de demanda coinciden con llegadas y salidas. Deja espacio en el maletero para el equipaje y ofrece asistencia al cargar o descargar las pertenencias.',
    ],
  },
  {
    heading: 'Going Envíos',
    paragraphs: [
      'La seguridad y protección de la carga es prioritaria: los artículos deben ir bien embalados, los documentos en sobres resistentes y los objetos frágiles protegidos con material adecuado. Durante el transporte, los paquetes deben ir asegurados para que no se muevan, y se manipulan con cuidado. La aplicación ofrece seguimiento en tiempo real para que remitente y destinatario verifiquen el avance de la entrega. Mantener el vehículo limpio y ordenado reduce el riesgo de daños.',
    ],
  },
  {
    heading: 'Soporte y accidentes',
    paragraphs: [
      'Desde la sección de Ayuda en la aplicación accedes a respuestas rápidas, al equipo de soporte o puedes programar una cita presencial. Si ocurre un accidente, lo primero es garantizar la seguridad de todos y, de ser necesario, llamar a emergencias. Luego reporta el incidente desde la aplicación: un representante de Going se pondrá en contacto para recopilar la información.',
    ],
  },
  {
    heading: 'Eres parte de una comunidad',
    paragraphs: [
      'Formar parte de Going es integrarte a una comunidad que valora el respeto, la inclusión y la cooperación. Cada viaje no solo es un servicio de transporte, sino una oportunidad para reforzar la confianza en la plataforma, generar experiencias positivas y contribuir a un entorno seguro y agradable para todas y todos.',
    ],
  },
];

export default function PrimerViajeConductoresPage() {
  return (
    <GuiaContenido
      title="Tu primer viaje como conductor"
      intro="Todo lo que necesitas para arrancar con el pie derecho en Going: preparación, seguridad, el paso a paso del viaje, aeropuerto, envíos y soporte."
      breadcrumbs={[
        { label: 'Conductores', href: '/conductores' },
        { label: 'Primer viaje' },
      ]}
      sections={secciones}
      downloadHref="/guias/going-conductores-primer-viaje.pdf"
      footerNote="Documento de Operaciones Going. ¿Dudas? Escríbenos desde la sección Ayuda de la aplicación."
    />
  );
}
