import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Tecnología y Seguridad de la Plataforma — Going App',
  description: 'Cómo Going App protege la información, el sistema de seguridad de la plataforma y las medidas técnicas implementadas.',
};

export default function SeguridadTecnologiaPage() {
  return (
    <LegalPlaceholder
      title="Tecnología y Seguridad de la Plataforma"
      summary="Las medidas técnicas que Going App implementa para proteger tu información: verificación de identidad, reconocimiento facial, encriptación de datos, monitoreo de rutas, botón de emergencia SOS y respaldo continuo de la plataforma."
    />
  );
}
