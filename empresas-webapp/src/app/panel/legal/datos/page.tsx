"use client";

import LegalDoc from "../LegalDoc";

export default function DatosPage() {
  return (
    <LegalDoc
      title="Política de Datos para Going App Empresas"
      subtitle="Addendum de tratamiento de datos personales (LOPDP) aplicable a las empresas que gestionan datos de sus empleados en la plataforma."
      version="1.0"
      updated="julio 2026"
      sections={[
        {
          title: "Marco y roles",
          body: [
            "Este Addendum complementa la Política de Privacidad de Going App y regula el tratamiento de datos personales realizado a través de Going App Empresas, conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).",
            "Respecto de los datos de sus empleados que la Empresa Cliente carga o gestiona en la plataforma, la Empresa Cliente actúa como Responsable del tratamiento y Thorn AI Technologies S.A.S. como Encargado, tratándolos únicamente conforme a las instrucciones de la Empresa Cliente y a este Addendum.",
          ],
        },
        {
          title: "Datos tratados y finalidades",
          body: [
            "Se tratan los datos personales necesarios para prestar el servicio de movilidad corporativa:",
            [
              "Identificación y contacto de empleados solicitantes y pasajeros.",
              "Origen, destino, fecha, hora y estado de los viajes.",
              "Ubicación en tiempo real durante el viaje, cuando exista consentimiento de rastreo activo.",
              "Datos de facturación, aprobaciones y reportes de uso.",
            ],
            "Las finalidades son: coordinar y ejecutar los viajes, habilitar aprobaciones y control de gasto, generar facturación y reportes, y velar por la seguridad durante el servicio. No se usan estos datos con fines distintos sin base legal.",
          ],
        },
        {
          title: "Consentimiento y base de licitud",
          body: [
            "La Empresa Cliente garantiza contar con base de licitud para incorporar a sus empleados a la plataforma e informarles sobre el tratamiento. El rastreo de ubicación en vivo solo se activa con el consentimiento del empleado, quien puede revocarlo; sin consentimiento, la persona no aparece en el mapa de flota.",
          ],
        },
        {
          title: "Medidas de seguridad",
          body: [
            "Thorn AI aplica medidas técnicas y organizativas razonables para proteger los datos:",
            [
              "Cifrado en tránsito (TLS) y control de acceso por roles.",
              "Segregación por empresa (multi-tenant) y principio de mínimo privilegio.",
              "Registro de auditoría de accesos y acciones sensibles.",
              "Gestión de secretos y respaldos administrados.",
            ],
          ],
        },
        {
          title: "Encargados adicionales (sub-encargados)",
          body: [
            "Para prestar el servicio, Thorn AI se apoya en proveedores que pueden tratar datos por su cuenta (infraestructura en la nube, mapas y geolocalización, mensajería y pasarelas de pago), sujetos a obligaciones de confidencialidad y seguridad equivalentes. La lista vigente puede solicitarse a privacidad@goingec.com.",
          ],
        },
        {
          title: "Derechos de los titulares",
          body: [
            "Los titulares pueden ejercer sus derechos de acceso, rectificación, actualización, eliminación, oposición, portabilidad y a no ser objeto de decisiones automatizadas, conforme a la LOPDP. Las solicitudes se canalizan a través de la Empresa Cliente como Responsable; Thorn AI asiste en su atención dentro de los plazos legales.",
          ],
        },
        {
          title: "Conservación y devolución",
          body: [
            "Los datos se conservan mientras dure la relación y por los plazos legales aplicables (por ejemplo, tributarios y contables). Terminada la relación, se devuelven o eliminan a solicitud de la Empresa Cliente, salvo las copias que la ley obligue a conservar.",
          ],
        },
        {
          title: "Notificación de brechas",
          body: [
            "Ante una vulneración de seguridad que afecte datos personales, Thorn AI notificará a la Empresa Cliente sin dilación indebida tras tener conocimiento, con la información disponible, para que el Responsable cumpla sus obligaciones de notificación ante la Autoridad de Protección de Datos y los titulares cuando corresponda.",
          ],
        },
      ]}
    />
  );
}
