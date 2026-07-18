"use client";

import LegalDoc from "../LegalDoc";

export default function SlaPage() {
  return (
    <LegalDoc
      title="SLA — Acuerdo de Nivel de Servicio"
      subtitle="Compromisos de disponibilidad, tiempos de respuesta de soporte y compensaciones aplicables a tu cuenta Going App Empresas."
      version="1.0"
      updated="julio 2026"
      sections={[
        {
          title: "Alcance",
          body: [
            "Este Acuerdo de Nivel de Servicio (“SLA”) describe los compromisos de Thorn AI Technologies S.A.S. respecto a la disponibilidad de la plataforma Going App Empresas (el “Servicio”) y a la atención de solicitudes de soporte de tu empresa.",
          ],
        },
        {
          title: "Disponibilidad del Servicio",
          body: [
            "Thorn AI se compromete a una disponibilidad mensual del Servicio del 99,5%, medida sobre el total de minutos del mes calendario, excluyendo las ventanas de mantenimiento programado y los eventos de fuerza mayor.",
            "El mantenimiento programado se notifica con al menos 48 horas de anticipación y se procura ejecutar en horario de baja demanda (22:00–05:00, hora de Ecuador).",
          ],
        },
        {
          title: "Niveles de severidad y tiempos de respuesta",
          body: [
            "Las solicitudes de soporte se clasifican por severidad, con los siguientes tiempos objetivo de primera respuesta en horario hábil (lunes a viernes, 08:00–18:00, hora de Ecuador):",
            [
              "Crítica (Servicio caído o viajes en curso afectados): 1 hora.",
              "Alta (función clave degradada, sin workaround): 4 horas.",
              "Media (función degradada con workaround): 1 día hábil.",
              "Baja (consulta, mejora o incidencia menor): 3 días hábiles.",
            ],
            "Las incidencias que afectan viajes en curso o la seguridad de viajeras y viajeros se atienden con prioridad, independientemente del horario.",
          ],
        },
        {
          title: "Compensaciones por incumplimiento",
          body: [
            "Si la disponibilidad mensual es inferior al 99,5%, tu empresa podrá solicitar un crédito sobre la facturación del período afectado, según la siguiente escala:",
            [
              "Entre 99,0% y 99,5%: 5% de crédito.",
              "Entre 98,0% y 99,0%: 10% de crédito.",
              "Inferior a 98,0%: 20% de crédito.",
            ],
            "El crédito se aplica a la siguiente factura, es la única compensación por incumplimiento de disponibilidad y debe solicitarse dentro de los 30 días posteriores al mes afectado, escribiendo a soporte@goingec.com.",
          ],
        },
        {
          title: "Exclusiones",
          body: [
            "No se computan como indisponibilidad los eventos derivados de: (a) mantenimiento programado notificado; (b) fuerza mayor o caso fortuito; (c) fallas de terceros fuera del control razonable de Thorn AI (proveedores de mapas, pasarelas de pago, redes móviles, mensajería); (d) uso indebido o configuración incorrecta por parte de la Empresa Cliente; o (e) suspensiones por falta de pago.",
          ],
        },
        {
          title: "Medición y reportes",
          body: [
            "La disponibilidad se mide con el monitoreo propio de Thorn AI sobre la infraestructura del Servicio. A solicitud, se entrega un reporte del período. Ante discrepancias, prevalecen los registros de Thorn AI, sin perjuicio del derecho de tu empresa a objetarlos de buena fe.",
          ],
        },
      ]}
    />
  );
}
