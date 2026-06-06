import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Política de Derechos de Autor — Going App',
  description: 'Procedimiento de notificación, retiro y contra-notificación por infracción de derechos de autor (DMCA y normativa ecuatoriana).',
};

export default function DerechosAutorPage() {
  return (
    <LegalPlaceholder
      title="Política de Derechos de Autor"
      summary="Procedimiento aplicable a notificaciones de infracción de derechos de autor sobre contenido publicado en Going App: agente designado para recepción de avisos, elementos requeridos en una notificación válida, proceso de retiro del contenido infractor, derecho de contra-notificación de quien publicó el contenido y política de desactivación de cuentas reincidentes. Marco alineado con DMCA y la Ley de Propiedad Intelectual del Ecuador."
      breadcrumb="Propiedad intelectual"
    />
  );
}
