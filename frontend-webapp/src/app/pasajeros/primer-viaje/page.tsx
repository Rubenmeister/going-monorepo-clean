import { GuiaContenido, GuiaSeccion } from '../../components/GuiaContenido';

export const metadata = {
  title: 'Tu primer viaje con Going — Guía para viajeras y viajeros',
  description:
    'Cómo prepararte, solicitar tu viaje, qué verificar antes de subir, y cómo aprovechar la seguridad y el soporte de Going en tu primer viaje.',
};

const secciones: GuiaSeccion[] = [
  {
    paragraphs: [
      'Bienvenida y bienvenido a Going. Tu primera experiencia está pensada para que sea fácil, segura y agradable desde el momento en que abres la aplicación hasta que llegas a tu destino. Aquí tienes todo lo que necesitas para sacarle el máximo provecho.',
    ],
  },
  {
    heading: 'Prepárate para tu viaje',
    paragraphs: ['Antes de solicitar tu primer viaje, asegúrate de:'],
    bullets: [
      'Tener la aplicación instalada y actualizada en tu teléfono.',
      'Contar con una conexión a internet estable.',
      'Activar la ubicación GPS, para asignarte la conductora o el conductor más cercano y calcular con precisión el tiempo de llegada.',
      'Verificar que tu método de pago (tarjeta, billetera electrónica o efectivo, según la ciudad) esté configurado correctamente.',
    ],
  },
  {
    heading: 'Cómo solicitar tu primer viaje',
    bullets: [
      'Abre la aplicación y permite que detecte tu ubicación actual.',
      'Ingresa tu destino en la barra de búsqueda.',
      'Revisa las opciones de servicio disponibles (viaje privado, compartido, VIP, entre ciudades o al aeropuerto).',
      'Confirma la tarifa estimada y el tiempo de llegada.',
      'Pulsa en Confirmar viaje para que el sistema te asigne una conductora o un conductor.',
    ],
  },
  {
    heading: 'Antes de subir al vehículo',
    paragraphs: ['Una vez aceptada tu solicitud, podrás ver la foto y el nombre de quien conduce; el modelo, color y número de placa del vehículo; y el tiempo estimado de llegada. Te recomendamos:'],
    bullets: [
      'Espera en un lugar seguro y visible.',
      'Verifica siempre que el vehículo y la conductora o el conductor coincidan con los datos de la aplicación antes de subir.',
      'Si tienes equipaje o necesidades especiales, comunícalo por el chat o la llamada dentro de la aplicación.',
    ],
  },
  {
    heading: 'Durante el viaje',
    bullets: [
      'Si quieres, comparte tu viaje con familiares o amistades con la función Compartir mi viaje, para que sigan tu recorrido en tiempo real.',
      'Si prefieres silencio o música, coméntalo con amabilidad a quien conduce.',
      'Evita distraer innecesariamente a la conductora o al conductor y usa siempre el cinturón de seguridad.',
      'Ante cualquier inconveniente, usa el Botón de Seguridad de la aplicación para asistencia inmediata.',
    ],
  },
  {
    heading: 'Llegada y finalización',
    paragraphs: [
      'La conductora o el conductor finalizará el viaje en la aplicación al llegar a tu destino. Verás el monto final y podrás calificar la experiencia con estrellas y comentarios. Si el pago es en efectivo, entrégalo directamente; si es por tarjeta o billetera digital, el cobro será automático.',
    ],
  },
  {
    heading: 'Consejos para un viaje más agradable',
    bullets: [
      'Mantén actualizados tus datos de contacto en la aplicación.',
      'Usa la mensajería interna para comunicarte, en lugar de compartir tu número personal.',
      'Reporta cualquier incidente o pérdida desde la sección Ayuda.',
      'Respeta las Guías Comunitarias de Going, basadas en el respeto mutuo y la seguridad.',
    ],
  },
  {
    heading: 'Soporte y ayuda',
    paragraphs: [
      'Tu seguridad y satisfacción son nuestra prioridad. En la sección Ayuda de la aplicación encuentras respuestas a preguntas frecuentes y puedes contactar al equipo de soporte. Tu primer viaje con Going es el inicio de muchas experiencias seguras y agradables: llegarás a tu destino con la confianza de que cuentas con una comunidad y un equipo que te respalda en cada trayecto.',
    ],
  },
];

export default function PrimerViajePasajerosPage() {
  return (
    <GuiaContenido
      title="Tu primer viaje con Going"
      intro="Una guía sencilla para viajeras y viajeros: cómo prepararte, solicitar tu viaje, qué verificar antes de subir y cómo usar la seguridad y el soporte."
      breadcrumbs={[
        { label: 'Para viajeras y viajeros', href: '/pasajeros' },
        { label: 'Primer viaje' },
      ]}
      sections={secciones}
      downloadHref="/guias/going-usuario-primer-viaje.pdf"
      footerNote="Documento de Operaciones Going. ¿Necesitas ayuda? Escríbenos desde la sección Ayuda de la aplicación."
    />
  );
}
