import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Aviso de Privacidad para Aspirantes y Empleados — Going App',
  description: 'Cómo Going App maneja los datos personales de personas que postulan a trabajar en la empresa o son empleadas.',
};

export default function PrivacyEmpleadosPage() {
  return (
    <LegalPlaceholder
      title="Aviso de Privacidad para Aspirantes y Empleados"
      summary="Cómo Going App (operado por Thorn AI Technologies) trata los datos personales de quienes postulan a una vacante o son empleadas/empleados activos: datos recopilados durante reclutamiento y empleo, finalidad, retención, transferencia a entidades laborales legalmente exigibles y derechos LOPDP."
    />
  );
}
