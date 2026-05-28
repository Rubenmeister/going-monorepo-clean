import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Guías de la Driver App — Going',
  description: 'Procedimientos operativos para conductoras y conductores en la Driver App de Going.',
};

export default function ConductoresAppPage() {
  return (
    <LegalPlaceholder
      title="Guías de la Driver App"
      summary="Procedimientos operativos para conductoras y conductores en el uso diario de la Driver App: encendido y conexión al servicio, gestión de solicitudes entrantes, tiempos de espera permitidos, navegación al punto de recogida, manejo del Modo Híbrido (urbano / interurbano), pausas y reposo, sistema de calificaciones, cierre de sesión y resolución de incidencias técnicas. Complementa la Normativa de Conductoras y Conductores."
      breadcrumb="Conductoras y conductores"
    />
  );
}
