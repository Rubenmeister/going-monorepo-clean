/**
 * Legal Corporativo — Empresas Panel
 * Ruta: /empresas/panel/legal
 *
 * Hub legal específico para clientes B2B. Concentra los documentos que rigen
 * la relación contractual entre Thorn AI Technologies S.A.S. y las empresas
 * cliente (grandes, negocios y agencias).
 *
 * No reemplaza al Centro Legal público (/legal); lo complementa con
 * instrumentos corporativos: condiciones del tipo de cuenta, marco de pagos
 * a crédito, gestión de equipos, NDA y SLA.
 */

"use client";

import Link from "next/link";
import { useAuthRedirect } from "@/lib/empresas/auth";

type DocStatus = "vigente" | "borrador" | "proximo";

interface CorporateDoc {
  title: string;
  desc: string;
  href: string;
  external?: boolean;
  status: DocStatus;
}

interface DocSection {
  label: string;
  docs: CorporateDoc[];
}

const SECTIONS: DocSection[] = [
  {
    label: "Documentos corporativos propios",
    docs: [
      {
        title: "Mis Condiciones Contractuales",
        desc: "Condiciones específicas de tu tipo de cuenta (crédito, plazos, aprobaciones, cancelaciones).",
        href: "/empresas/panel/condiciones",
        status: "vigente",
      },
      {
        title: "Política de Viajes",
        desc: "Editor de las reglas internas de tu empresa: presupuesto, horarios, destinos, aprobaciones.",
        href: "/empresas/panel/politica",
        status: "vigente",
      },
      {
        title: "Acuerdo de Confidencialidad (NDA)",
        desc: "NDA estándar entre tu empresa y Thorn AI Technologies para datos de empleados, rutas y reportes.",
        href: "#",
        status: "proximo",
      },
      {
        title: "SLA — Acuerdo de Nivel de Servicio",
        desc: "Compromisos de disponibilidad, tiempos de respuesta y compensaciones por incumplimiento.",
        href: "#",
        status: "proximo",
      },
      {
        title: "Política de Datos para Going Empresas",
        desc: "Addendum LOPDP para clientes corporativos que gestionan datos de empleados en la plataforma.",
        href: "#",
        status: "proximo",
      },
    ],
  },
  {
    label: "Marco legal Going aplicable",
    docs: [
      {
        title: "Términos y Condiciones de Going",
        desc: "Las reglas generales que rigen el uso de la plataforma.",
        href: "/legal/terms",
        external: true,
        status: "vigente",
      },
      {
        title: "Política de Privacidad (LOPDP)",
        desc: "Cómo Going recopila, usa y protege los datos personales conforme a la legislación ecuatoriana.",
        href: "/legal/privacy",
        external: true,
        status: "vigente",
      },
      {
        title: "Términos de Pago del Servicio",
        desc: "Marco de pagos: medios habilitados en Ecuador, facturación SRI, retenciones y disputas.",
        href: "/legal/pagos",
        external: true,
        status: "borrador",
      },
      {
        title: "Política de Cero Tolerancia",
        desc: "Conductas inaceptables y consecuencias inmediatas durante el servicio.",
        href: "/legal/cero-tolerancia",
        external: true,
        status: "borrador",
      },
      {
        title: "Centro Legal completo",
        desc: "Acceso al índice de los 26 documentos legales públicos de Going.",
        href: "/legal",
        external: true,
        status: "vigente",
      },
    ],
  },
];

const STATUS_STYLES: Record<DocStatus, { label: string; bg: string; text: string }> = {
  vigente: { label: "Vigente", bg: "bg-emerald-50", text: "text-emerald-700" },
  borrador: { label: "En revisión", bg: "bg-amber-50", text: "text-amber-700" },
  proximo: { label: "Próximamente", bg: "bg-slate-100", text: "text-slate-600" },
};

export default function LegalCorporativoPage() {
  const { session, status } = useAuthRedirect();

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Legal Corporativo</h1>
        <p className="text-slate-600 max-w-2xl">
          Instrumentos legales aplicables a tu cuenta empresarial Going y
          marco legal general de la plataforma operada por Thorn AI
          Technologies S.A.S.
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.label} className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
            {section.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.docs.map((doc) => {
              const statusStyle = STATUS_STYLES[doc.status];
              const isDisabled = doc.status === "proximo" && doc.href === "#";

              const inner = (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {doc.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text} flex-shrink-0`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">
                    {doc.desc}
                  </p>
                  {doc.external && (
                    <p className="mt-3 text-xs text-blue-600 font-medium">
                      Centro Legal Going →
                    </p>
                  )}
                </div>
              );

              if (isDisabled) {
                return (
                  <div key={doc.title} className="opacity-60 cursor-not-allowed">
                    {inner}
                  </div>
                );
              }

              return (
                <Link
                  key={doc.title}
                  href={doc.href}
                  target={doc.external ? "_blank" : undefined}
                  rel={doc.external ? "noopener noreferrer" : undefined}
                  className="block"
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empresa responsable */}
      <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <p className="font-bold text-slate-900 mb-2">Empresa responsable</p>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          Going es una marca operada por <strong>Thorn AI Technologies
          S.A.S.</strong>, RUC <strong>1793176925001</strong>, con domicilio en
          Echeverría N2-170 y Crespo Toral, Quito, Ecuador. Para asuntos
          legales o contractuales corporativos, escríbenos a{" "}
          <a
            href="mailto:soporte@goingec.com"
            className="text-blue-600 font-medium hover:underline"
          >
            soporte@goingec.com
          </a>{" "}
          o ejerce tus derechos LOPDP a través de{" "}
          <a
            href="mailto:privacidad@goingec.com"
            className="text-blue-600 font-medium hover:underline"
          >
            privacidad@goingec.com
          </a>
          .
        </p>
        <p className="text-xs text-slate-500">
          Jurisdicción: República del Ecuador. Para controversias, las partes
          se someten a los jueces y tribunales competentes de la ciudad de
          Quito.
        </p>
      </div>
    </div>
  );
}
