import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Aceptación de Uso de Datos — Going',
  description: 'Consentimiento expreso para el uso de datos personales que el usuario otorga al registrarse en Going.',
};

export default function AceptacionDatosPage() {
  return (
    <LegalPlaceholder
      title="Aceptación de Uso de Datos"
      summary="El consentimiento expreso e informado que la persona usuaria otorga al registrarse en Going, conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP): qué datos se recopilan, con qué finalidad, por cuánto tiempo, derechos del titular y cómo revocar el consentimiento."
    />
  );
}
