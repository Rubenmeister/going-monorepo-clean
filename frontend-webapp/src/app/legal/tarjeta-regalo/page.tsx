import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Tarjeta de Regalo Going — Going',
  description: 'Condiciones de compra, canje y vigencia de las tarjetas de regalo Going (físicas y digitales).',
};

export default function TarjetaRegaloPage() {
  return (
    <LegalPlaceholder
      title="Tarjeta de Regalo Going"
      summary="Condiciones aplicables a las tarjetas de regalo Going en sus modalidades física y digital: compra, activación, requisitos de cuenta para el canje, plazos de vigencia, denominaciones disponibles, restricciones (no reembolsables, no transferibles a efectivo), reposición por pérdida y compatibilidad con Going Cash."
      breadcrumb="Programas y productos"
    />
  );
}
