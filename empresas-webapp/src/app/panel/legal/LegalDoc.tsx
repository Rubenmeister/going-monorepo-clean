/**
 * LegalDoc — layout compartido para los documentos legales corporativos propios
 * (NDA, SLA, Addendum de Datos). Encabezado + navegación de vuelta + cuerpo por
 * secciones numeradas, con metadatos de vigencia y empresa responsable.
 */

"use client";

import Link from "next/link";
import { useAuthRedirect } from "@/lib/auth";

export interface LegalSection {
  title: string;
  /** Párrafos y/o listas. Un string es un párrafo; un string[] es una lista. */
  body: (string | string[])[];
}

interface Props {
  title: string;
  subtitle: string;
  version: string;
  updated: string;
  sections: LegalSection[];
}

export default function LegalDoc({ title, subtitle, version, updated, sections }: Props) {
  const { session, status } = useAuthRedirect();

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/panel/legal" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
        ← Legal Corporativo
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            Vigente
          </span>
          <span className="text-xs text-slate-400">v{version} · Actualizado {updated}</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600">{subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-7">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              {i + 1}. {s.title}
            </h2>
            <div className="space-y-2.5">
              {s.body.map((b, j) =>
                Array.isArray(b) ? (
                  <ul key={j} className="list-disc pl-5 space-y-1.5">
                    {b.map((li, k) => (
                      <li key={k} className="text-sm text-slate-600 leading-relaxed">{li}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={j} className="text-sm text-slate-600 leading-relaxed">{b}</p>
                )
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Empresa responsable */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <p className="font-bold text-slate-900 mb-1.5">Empresa responsable</p>
        <p className="text-sm text-slate-700 leading-relaxed">
          Going App es una marca operada por <strong>Thorn AI Technologies S.A.S.</strong>, RUC{" "}
          <strong>1793176925001</strong>, con domicilio en Echeverría N2-170 y Crespo Toral, Quito,
          Ecuador. Consultas legales:{" "}
          <a href="mailto:soporte@goingec.com" className="text-blue-600 font-medium hover:underline">soporte@goingec.com</a>
          {" · "}Datos (LOPDP):{" "}
          <a href="mailto:privacidad@goingec.com" className="text-blue-600 font-medium hover:underline">privacidad@goingec.com</a>.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Este documento es un modelo base. Para condiciones firmadas y personalizadas de tu empresa,
          escríbenos: preparamos el instrumento definitivo con tu representante legal.
        </p>
      </div>
    </div>
  );
}
