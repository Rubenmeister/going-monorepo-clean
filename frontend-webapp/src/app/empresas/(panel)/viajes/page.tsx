/**
 * Página de Viajes - Gestión de bookings
 * Ruta: /empresas/viajes
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";

export default function VijesPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Viajes</h1>
      <p className="text-slate-600 mt-2">Gestión de tus viajes corporativos</p>

      <div className="mt-8 bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">
          Esta sección está en desarrollo. Próximamente podrás ver y gestionar todos tus viajes.
        </p>
        <p className="text-sm text-slate-500 mt-4">
          TODO: Implementar lista de viajes, filtros, y acciones bulk
        </p>
      </div>
    </div>
  );
}
