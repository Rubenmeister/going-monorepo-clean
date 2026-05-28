import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Glosario de Servicios Going — Going',
  description: 'Definiciones oficiales de los servicios y términos Going: Transfers, Destinos, Envíos, Cash.',
};

export default function GlosarioPage() {
  return (
    <LegalPlaceholder
      title="Glosario de Servicios Going"
      summary="Las definiciones oficiales de los términos y servicios Going usados en toda la plataforma: Going Transfers (transporte de pasajeros), Going Destinos (tours y alojamiento, próximamente), Going Envíos (paquetería), Going Cash (créditos), Prestador de Servicios, Usuario, Token de Verificación, Modalidad Compartida vs Privada, y otros."
    />
  );
}
