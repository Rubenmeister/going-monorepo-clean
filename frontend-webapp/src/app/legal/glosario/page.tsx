import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Glosario de Servicios Going App — Going App',
  description: 'Definiciones oficiales de los servicios y términos Going App: Transfers, Destinos, Envíos, Cash.',
};

export default function GlosarioPage() {
  return (
    <LegalPlaceholder
      title="Glosario de Servicios Going App"
      summary="Las definiciones oficiales de los términos y servicios Going App usados en toda la plataforma: Going App Transfers (transporte de pasajeros), Going App Destinos (tours y alojamiento, próximamente), Going App Envíos (paquetería), Going App Cash (créditos), Prestador de Servicios, Usuario, Token de Verificación, Modalidad Compartida vs Privada, y otros."
    />
  );
}
