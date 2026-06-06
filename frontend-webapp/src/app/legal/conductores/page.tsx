import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Normativa de Conductores — Going App',
  description: 'Reglas, derechos y obligaciones de las conductoras y conductores que operan en la plataforma Going App.',
};

export default function ConductoresPage() {
  return (
    <LegalPlaceholder
      title="Normativa de Conductoras y Conductores"
      summary="Las reglas que rigen a quienes prestan servicios de transporte a través de Going App: requisitos de habilitación, obligaciones, comisiones, jornadas máximas, política de cero tolerancia al alcohol y proceso de desconexión por incumplimiento."
      breadcrumb="Conductoras y Conductores"
    />
  );
}
