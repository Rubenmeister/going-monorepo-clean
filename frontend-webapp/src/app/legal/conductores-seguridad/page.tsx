import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Estándares Mínimos de Seguridad — Going App',
  description: 'Requisitos de seguridad para vehículos y conductoras/conductores Going App: airbags, ABS, antigüedad, mantenimiento.',
};

export default function ConductoresSeguridadPage() {
  return (
    <LegalPlaceholder
      title="Estándares Mínimos de Seguridad"
      summary="Los requisitos técnicos y operativos que deben cumplir los vehículos y las personas que conducen para operar en Going App: airbags, frenos ABS, control de estabilidad, cinturones de tres puntos, extintor, botiquín, edad máxima del vehículo, mantenimiento y desinfección periódica."
      breadcrumb="Conductoras y Conductores"
    />
  );
}
