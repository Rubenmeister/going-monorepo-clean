import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Normas Comunitarias — Going',
  description: 'Las reglas de comportamiento, respeto y convivencia que rigen a la comunidad Going.',
};

export default function ComunidadPage() {
  return (
    <LegalPlaceholder
      title="Normas Comunitarias"
      summary="Going celebra la diversidad, la inclusión y el respeto mutuo. Estas son las reglas de comportamiento y respeto que esperamos de cada persona que forma parte de nuestra comunidad: pasajeras, pasajeros, conductoras y conductores."
    />
  );
}
