/**
 * Página para solicitar nuevo viaje
 * Ruta: /empresas/solicitar
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";

export default function SolicitarViajePagea() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Solicitar Viaje</h1>
      <p className="text-slate-600 mt-2">Crea una nueva solicitud de viaje</p>

      <div className="mt-8 bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">
          Esta sección está en desarrollo.
        </p>
        <p className="text-sm text-slate-500 mt-4">
          TODO: Implementar formulario de solicitud de viaje
        </p>
      </div>
    </div>
  );
}
