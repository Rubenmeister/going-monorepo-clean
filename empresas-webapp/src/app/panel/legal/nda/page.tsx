"use client";

import LegalDoc from "../LegalDoc";

export default function NdaPage() {
  return (
    <LegalDoc
      title="Acuerdo de Confidencialidad (NDA)"
      subtitle="Acuerdo mutuo de confidencialidad entre tu empresa y Thorn AI Technologies S.A.S. para la información intercambiada al usar Going App Empresas."
      version="1.0"
      updated="julio 2026"
      sections={[
        {
          title: "Partes",
          body: [
            "Este Acuerdo de Confidencialidad (el “Acuerdo”) se celebra entre tu empresa (la “Empresa Cliente”), identificada con la cuenta corporativa activa en Going App, y Thorn AI Technologies S.A.S. (“Thorn AI”), operadora de la plataforma Going App. En adelante, cada una una “Parte” y conjuntamente las “Partes”.",
          ],
        },
        {
          title: "Información confidencial",
          body: [
            "Se considera “Información Confidencial” toda información no pública que una Parte (la “Parte Reveladora”) divulgue a la otra (la “Parte Receptora”), en cualquier formato, incluyendo de forma enunciativa y no limitativa:",
            [
              "Datos de empleados, viajeras y viajeros: nombres, contactos, ubicaciones, rutas y patrones de viaje.",
              "Tarifas corporativas negociadas, presupuestos, volúmenes y condiciones comerciales.",
              "Reportes, métricas de operación, información financiera y datos de facturación.",
              "Software, arquitectura, algoritmos de asignación y tarificación, y credenciales de acceso.",
            ],
          ],
        },
        {
          title: "Obligaciones de la Parte Receptora",
          body: [
            "La Parte Receptora se obliga a:",
            [
              "Usar la Información Confidencial únicamente para ejecutar la relación de servicio de movilidad corporativa.",
              "No divulgarla a terceros sin autorización previa y por escrito de la Parte Reveladora.",
              "Limitar el acceso al personal que necesite conocerla, sujeto a deberes de confidencialidad equivalentes.",
              "Aplicar medidas de seguridad razonables, al menos las que emplea para su propia información sensible.",
            ],
          ],
        },
        {
          title: "Exclusiones",
          body: [
            "No se considera Información Confidencial aquella que: (a) sea o pase a ser de dominio público sin culpa de la Parte Receptora; (b) ya estuviera legítimamente en poder de la Parte Receptora antes de su divulgación; (c) sea desarrollada de forma independiente sin usar la Información Confidencial; o (d) deba revelarse por mandato legal o de autoridad competente, en cuyo caso se notificará previamente a la Parte Reveladora cuando la ley lo permita.",
          ],
        },
        {
          title: "Vigencia y devolución",
          body: [
            "Las obligaciones de confidencialidad rigen durante la relación comercial y se mantienen por tres (3) años tras su terminación. Para datos personales, la protección se mantiene mientras la ley lo exija. Terminada la relación, la Parte Receptora devolverá o destruirá la Información Confidencial a solicitud de la Parte Reveladora, salvo copias exigidas por obligaciones legales o de respaldo.",
          ],
        },
        {
          title: "Ley aplicable y jurisdicción",
          body: [
            "Este Acuerdo se rige por las leyes de la República del Ecuador, incluida la Ley Orgánica de Protección de Datos Personales (LOPDP). Para cualquier controversia, las Partes se someten a los jueces y tribunales competentes de la ciudad de Quito, sin perjuicio de los mecanismos de mediación disponibles.",
          ],
        },
      ]}
    />
  );
}
