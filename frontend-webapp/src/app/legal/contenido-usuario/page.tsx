import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Contenido Generado por Usuarias y Usuarios — Going',
  description: 'Reglas para reseñas, comentarios, fotos y contenido multimedia que la comunidad publica en Going.',
};

export default function ContenidoUsuarioPage() {
  return (
    <LegalPlaceholder
      title="Contenido Generado por Usuarias y Usuarios"
      summary="Reglas aplicables al contenido que la comunidad publica en Going: reseñas, calificaciones, comentarios, fotos y videos. Cubre licencia no exclusiva a favor de Going para uso, reproducción y distribución del contenido, prohibiciones (lenguaje ofensivo, contenido sexual, discriminación, datos personales de terceros), proceso de reporte y moderación, y consecuencias por incumplimiento."
      breadcrumb="Comunidad y conducta"
    />
  );
}
