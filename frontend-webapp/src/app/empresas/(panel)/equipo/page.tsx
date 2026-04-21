/**
 * Página de Gestión de Equipo
 * Ruta: /empresas/equipo
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";

export default function EquipoPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  const puedeGestionarEquipo = session.user.roles.includes("admin");

  if (!puedeGestionarEquipo) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Acceso Denegado</h1>
        <p className="text-slate-600 mt-2">
          Solo administradores pueden gestionar el equipo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Equipo</h1>
      <p className="text-slate-600 mt-2">Gestión de usuarios y roles</p>

      <div className="mt-8 bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">
          Esta sección está en desarrollo.
        </p>
        <p className="text-sm text-slate-500 mt-4">
          TODO: Implementar gestión de usuarios, roles, y permisos
        </p>
      </div>
    </div>
  );
}
