/**
 * Página de Aprobaciones
 * Ruta: /empresas/aprobaciones
 *
 * Solo visible para usuarios con rol "aprobador"
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";

export default function AprobacionesPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  const esAprobador = session.user.roles.includes("aprobador");

  if (!esAprobador) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Acceso Denegado</h1>
        <p className="text-slate-600 mt-2">
          No tienes permiso para ver esta página. Solo los aprobadores pueden
          acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Aprobaciones Pendientes</h1>
      <p className="text-slate-600 mt-2">
        Revisa y aprueba/rechaza viajes solicitados
      </p>

      <div className="mt-8 bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">
          Esta sección está en desarrollo. Próximamente verás las aprobaciones pendientes.
        </p>
        <p className="text-sm text-slate-500 mt-4">
          TODO: Implementar flujo de aprobación multinivel
        </p>
      </div>
    </div>
  );
}
