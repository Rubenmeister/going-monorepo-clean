import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Política de Cero Tolerancia — Going App',
  description: 'Cero tolerancia a la discriminación, acoso, violencia, alcohol al volante y otras conductas inaceptables en Going App.',
};

export default function CeroToleranciaPage() {
  return (
    <LegalPlaceholder
      title="Política de Cero Tolerancia"
      summary="Going App aplica una política de tolerancia cero frente a la discriminación, el acoso, el contacto inapropiado, la violencia, el consumo de alcohol o sustancias al volante y otras conductas inaceptables. Cualquier infracción resulta en suspensión inmediata de la cuenta."
    />
  );
}
