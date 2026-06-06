import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Going App Envíos: Condiciones y Normativas — Going App',
  description: 'Las condiciones generales del servicio Going App Envíos: cobertura, peso, valor, responsabilidades y reclamaciones.',
};

export default function EnviosCondicionesPage() {
  return (
    <LegalPlaceholder
      title="Going App Envíos: Condiciones y Normativas"
      summary="Las condiciones generales del servicio de paquetería Going App Envíos: ámbito de cobertura urbano e interurbano, peso máximo (20 kg), valor declarado máximo ($100 USD sin seguro adicional), embalaje, responsabilidades del remitente y de Going App, y proceso de reclamación."
      breadcrumb="Going App Envíos"
    />
  );
}
