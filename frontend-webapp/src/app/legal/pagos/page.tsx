import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Términos de Pago del Servicio — Going App',
  description: 'Marco de pagos de Going App Ecuador: medios habilitados, retenciones, reembolsos, resolución de disputas.',
};

export default function PagosPage() {
  return (
    <LegalPlaceholder
      title="Términos de Pago del Servicio"
      summary="Marco de pagos aplicable a las transacciones en Going App: medios habilitados en Ecuador (tarjeta, transferencia, Datafast, DeUna y Going App Cash), facturación electrónica conforme al SRI, comisiones de plataforma, retención y liquidación a conductoras y conductores, reembolsos, cancelaciones y mecanismos de resolución de disputas ante mediadores ecuatorianos."
    />
  );
}
