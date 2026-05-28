import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Compartir en caso de Emergencia — Going',
  description: 'Cómo compartir tu ubicación en tiempo real con familia o amigos y usar el botón SOS de emergencia.',
};

export default function UsuariosEmergenciaPage() {
  return (
    <LegalPlaceholder
      title="Compartir en caso de Emergencia"
      summary="Cómo usar las funciones de seguridad de Going en momentos críticos: compartir tu viaje en tiempo real con personas de confianza, activar el botón SOS de emergencia, contacto directo con operador Going y protocolo de derivación a servicios de emergencia."
      breadcrumb="Para Usuarias y Usuarios"
    />
  );
}
