import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Asistencia al Usuario — Going',
  description: 'Cómo contactar al soporte Going: WhatsApp, email, chat dentro de la app y atención 24/7.',
};

export default function UsuariosAsistenciaPage() {
  return (
    <LegalPlaceholder
      title="Asistencia al Usuario"
      summary="Cómo contactarnos cuando necesitas ayuda: WhatsApp Going +593 98 403 7949 disponible 24/7, chat dentro de la aplicación con asistente virtual y escalamiento a operador humano, correo soporte@goingec.com y centro de ayuda en línea."
      breadcrumb="Para Usuarias y Usuarios"
    />
  );
}
