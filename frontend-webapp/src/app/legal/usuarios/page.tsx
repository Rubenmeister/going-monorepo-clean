import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Normativa de Usuarias y Usuarios — Going App',
  description: 'Reglas y obligaciones de las personas que usan la plataforma Going App para reservar viajes y envíos.',
};

export default function UsuariosPage() {
  return (
    <LegalPlaceholder
      title="Normativa de Usuarias y Usuarios"
      summary="Las reglas que rigen a quienes usan Going App para reservar viajes o enviar paquetes: edad mínima, veracidad de información, responsabilidad sobre la cuenta, conductas permitidas y prohibidas, calificaciones y proceso de suspensión por incumplimiento."
      breadcrumb="Para Usuarias y Usuarios"
    />
  );
}
