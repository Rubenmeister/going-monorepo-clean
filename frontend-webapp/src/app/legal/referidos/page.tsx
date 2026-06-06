import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Programa de Referidos Going App — Going App',
  description: 'Condiciones del Programa de Referidos Going App: cómo invitar amistades, recompensas Going App Cash y reglas.',
};

export default function ReferidosPage() {
  return (
    <LegalPlaceholder
      title="Programa de Referidos Going App"
      summary="Cómo funciona el Programa de Referidos: invita a personas a Going App con tu código personal y recibe crédito Going App Cash cuando completen su primer viaje. Condiciones, ventana de validez, restricciones de uso comercial (prohibida la venta de códigos o publicidad pagada) y consecuencias por incumplimiento."
    />
  );
}
