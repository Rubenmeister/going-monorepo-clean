import { LegalPlaceholder } from '../_components/LegalPlaceholder';

export const metadata = {
  title: 'Manejo de Envíos — Going',
  description: 'Cómo se manejan los paquetes en Going Envíos: recolección, transporte, entrega y comprobante de recepción.',
};

export default function EnviosManejoPage() {
  return (
    <LegalPlaceholder
      title="Manejo de Envíos"
      summary="El protocolo completo del servicio Going Envíos: recolección con verificación del paquete y remitente, transporte con tracking en vivo, entrega con código de verificación (OTP) al destinatario, fotos de comprobante y proceso ante incidentes durante el trayecto."
      breadcrumb="Going Envíos"
    />
  );
}
