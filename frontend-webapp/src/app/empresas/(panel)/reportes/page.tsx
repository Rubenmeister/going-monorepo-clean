/**
 * Página de Reportes
 * Ruta: /empresas/reportes
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";

export default function ReportesPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
      <p className="text-slate-600 mt-2">Análisis y reportes de tus viajes</p>

      <div className="mt-8 bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">
          Esta sección está en desarrollo.
        </p>
        <p className="text-sm text-slate-500 mt-4">
          TODO: Implementar reportes, gráficos, y exportación de datos
        </p>
      </div>
    </div>
  );
}
