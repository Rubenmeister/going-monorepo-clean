import { GuiaContenido, GuiaSeccion } from '../../components/GuiaContenido';

export const metadata = {
  title: 'Políticas para usuarios — Going',
  description:
    'Manual de políticas para viajeras y viajeros de Going: seguridad y conducta, pagos y cancelaciones, reembolsos, evaluación y feedback.',
};

const secciones: GuiaSeccion[] = [
  {
    paragraphs: [
      'Queremos que cada viaje sea seguro, cómodo y transparente. Este manual reúne las pautas de convivencia, las reglas de pagos y cancelaciones, y cómo funciona la evaluación entre la comunidad de Going.',
    ],
  },
  {
    heading: 'Seguridad y conducta',
    bullets: [
      'Cinturón de seguridad: abróchate al subir y verifica que las demás personas también lo hagan.',
      'Respeto y amabilidad: trata a la conductora o al conductor con cortesía; una actitud amable hace la diferencia.',
      'Evita el ruido excesivo: mantén conversaciones y dispositivos en un volumen moderado para que quien conduce se concentre.',
      'Cuida el vehículo: evita comer o beber a bordo y llévate tu basura al salir; cualquier daño causado es tu responsabilidad.',
      'Comportamiento seguro: no distraigas a quien conduce y permanece sentado durante el viaje.',
      'Prohibiciones: no está permitido fumar ni consumir alcohol o drogas en el vehículo; no se toleran comportamientos abusivos, violentos o irrespetuosos.',
    ],
  },
  {
    heading: 'Inclusión y respeto',
    paragraphs: [
      'Respetamos a todas las personas —viajeras, viajeros, conductoras y conductores— sin importar su origen, género, orientación sexual o creencias. Promovemos un ambiente inclusivo y diverso. Si vives o presencias un comportamiento inapropiado, repórtalo de inmediato desde la aplicación: nos tomamos estas situaciones muy en serio y actuamos con rapidez.',
    ],
  },
  {
    heading: 'Métodos de pago',
    paragraphs: [
      'Aceptamos varios métodos para tu comodidad: tarjeta de crédito, tarjeta de débito, pago en efectivo y plataformas de pago digital. Todos los pagos se procesan de forma segura en la aplicación. Al final de cada viaje, el pago se procesa automáticamente con el método que hayas seleccionado.',
    ],
  },
  {
    heading: 'Tarifas y facturación',
    paragraphs: [
      'Antes de confirmar tu viaje verás una estimación del costo, que incluye tarifa base, distancia, tiempo de viaje y cualquier cargo adicional (por ejemplo, alta demanda o peajes). Después de cada viaje recibirás un recibo detallado en la aplicación y por correo, con el desglose de todas las tarifas.',
    ],
  },
  {
    heading: 'Cancelaciones',
    bullets: [
      'Cancelación gratuita: puedes cancelar sin costo dentro de los primeros 5 minutos después de que una conductora o un conductor acepte tu solicitud.',
      'Tarifa de cancelación: si cancelas después de esos 5 minutos, se aplica una tarifa de $5 para compensar el tiempo y el desplazamiento.',
      'Cancelación por quien conduce: en raras ocasiones puede cancelarse el viaje desde el otro lado; en ese caso no se te cobra y puedes solicitar uno nuevo de inmediato.',
    ],
  },
  {
    heading: 'Reembolsos, créditos y promociones',
    paragraphs: [
      'Si crees que se te cobró incorrectamente o tienes un problema con un pago, solicita un reembolso desde la aplicación: abre tu historial de viajes y selecciona el viaje en cuestión. Normalmente recibirás respuesta en un plazo de 3 a 5 días hábiles.',
      'De vez en cuando ofrecemos créditos promocionales que reducen el costo de tus viajes. Se aplican automáticamente en tu próximo viaje elegible y verás el descuento reflejado en la tarifa antes de confirmar.',
    ],
  },
  {
    heading: 'Evaluación y feedback',
    paragraphs: [
      'Al finalizar cada viaje puedes calificar tu experiencia de 1 a 5 estrellas y dejar comentarios. Tu opinión nos ayuda a mejorar continuamente y a reconocer a las conductoras y conductores con mejor desempeño. Tus comentarios y calificaciones son confidenciales y se usan únicamente para mejorar el servicio; si lo prefieres, puedes dejar tu comentario de forma anónima.',
    ],
  },
  {
    heading: 'Soporte al cliente',
    paragraphs: [
      'Nuestro equipo de soporte está disponible las 24 horas, los 7 días de la semana. Puedes comunicarte desde la aplicación, por correo o por teléfono para cualquier duda sobre pagos, cancelaciones o tu experiencia de viaje.',
    ],
  },
];

export default function PoliticasUsuariosPage() {
  return (
    <GuiaContenido
      title="Políticas para usuarios"
      intro="Seguridad y conducta, pagos y cancelaciones, reembolsos y evaluación: todo lo que rige tu experiencia como viajera o viajero de Going."
      breadcrumbs={[
        { label: 'Para viajeras y viajeros', href: '/pasajeros' },
        { label: 'Políticas' },
      ]}
      sections={secciones}
      downloadHref="/guias/going-politicas-usuarios.pdf"
      footerNote="Documento de Operaciones Going. Para el texto legal completo, visita el Centro Legal o escríbenos desde la sección Ayuda."
    />
  );
}
