import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Política de Marcas Registradas — Going',
  description: 'Protección de la marca Going y procedimiento de reporte por uso no autorizado.',
};

export default function MarcasPage() {
  return (
    <LegalPlaceholder
      title="Política de Marcas Registradas"
      summary="Política de protección de la marca Going y de los signos distintivos asociados (logotipo, paleta, tipografía). Incluye el alcance de las marcas registradas ante el SENADI, los usos permitidos y prohibidos por parte de terceros, el procedimiento de reporte por uso no autorizado, y la política de cancelación de cuentas o publicaciones que infrinjan los derechos de marca."
      breadcrumb="Propiedad intelectual"
    />
  );
}
