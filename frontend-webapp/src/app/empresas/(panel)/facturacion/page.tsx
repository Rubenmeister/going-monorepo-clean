/**
 * Página de Facturación
 * Ruta: /empresas/facturacion
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";

export default function FacturacionPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Facturación</h1>
      <p className="text-slate-600 mt-2">Tus facturas e historial de pagos</p>

      <div className="mt-8 bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">
          Esta sección está en desarrollo. Próximamente podrás descargar facturas y ver el historial de pagos.
        </p>
        <p className="text-sm text-slate-500 mt-4">
          TODO: Implementar tabla de facturas, download, y reconciliación
        </p>
      </div>
    </div>
  );
}
