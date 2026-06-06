import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Envíos: Artículos Prohibidos — Going App',
  description: 'Listado de artículos que Going App NO transporta en su servicio de envíos: armas, drogas, dinero, etc.',
};

export default function EnviosProhibidosPage() {
  return (
    <LegalPlaceholder
      title="Envíos: Artículos Prohibidos"
      summary="Going App NO transporta personas (salvo Transfers), alcohol sin verificación, armas, municiones, bienes robados, drogas, materiales peligrosos (inflamables, venenosos), dinero en efectivo, joyería de alto valor, especies animales reguladas, ni material biológico o desechos médicos. Ante sospecha de mercancía ilegal, se notifica a las autoridades competentes."
      breadcrumb="Going App Envíos"
    />
  );
}
