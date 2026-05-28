import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Tu Primer Viaje con Going — Going',
  description: 'Guía paso a paso para tu primer viaje con Going: descarga, registro, reserva, pago y calificación.',
};

export default function UsuariosPrimerViajePage() {
  return (
    <LegalPlaceholder
      title="Tu Primer Viaje con Going"
      summary="Una guía paso a paso para acompañar a quienes usan Going por primera vez: cómo descargar la app, crear una cuenta, configurar el método de pago, reservar un viaje compartido o privado, ver el tracking en vivo, pagar dentro de la app y calificar al final."
      breadcrumb="Para Usuarias y Usuarios"
    />
  );
}
