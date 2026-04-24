/**
 * Página de Configuración
 * Ruta: /empresas/configuracion
 * Solo admins.
 */

"use client";

import Link from "next/link";
import { useAuthRedirect } from "@/lib/empresas/auth";
import { TIPOS_CUENTA, ROLES } from "@/lib/empresas/constants";

export default function ConfiguracionPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  if (!session!.user.roles.includes("admin")) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Acceso Denegado</h1>
        <p className="text-slate-600 mt-2">Solo administradores pueden acceder a la configuración.</p>
      </div>
    );
  }

  const tipoCuenta = session!.user.tipoCuenta as keyof typeof TIPOS_CUENTA | undefined;
  const tipoCuentaInfo = tipoCuenta ? TIPOS_CUENTA[tipoCuenta] : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-600 mt-1">Ajustes de tu cuenta corporativa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Info de Cuenta */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Información de la Cuenta</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Empresa</dt>
              <dd className="font-semibold text-slate-900">{session!.user.companyName ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">ID de Empresa</dt>
              <dd className="font-mono text-xs text-slate-600">{session!.user.companyId ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tipo de Cuenta</dt>
              <dd>
                {tipoCuentaInfo ? (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {tipoCuentaInfo.label}
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </dd>
            </div>
            {tipoCuentaInfo && "plazo" in tipoCuentaInfo && tipoCuentaInfo.plazo > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Plazo de Pago</dt>
                <dd className="font-semibold text-slate-900">{tipoCuentaInfo.plazo} días</dd>
              </div>
            )}
            {tipoCuentaInfo && "requiereAprobaciones" in tipoCuentaInfo && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Aprobaciones</dt>
                <dd className={`text-xs font-medium ${tipoCuentaInfo.requiereAprobaciones ? "text-amber-600" : "text-green-600"}`}>
                  {tipoCuentaInfo.requiereAprobaciones ? "Requeridas" : "No requeridas"}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Para modificar estos datos contacta al equipo de Going.</p>
          </div>
        </div>

        {/* Perfil Admin */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Tu Perfil de Administrador</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Nombre</dt>
              <dd className="font-semibold text-slate-900">
                {[session!.user.nombre, session!.user.apellido].filter(Boolean).join(" ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-700">{session!.user.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between items-start gap-2">
              <dt className="text-slate-500 shrink-0">Roles</dt>
              <dd className="flex flex-wrap gap-1 justify-end">
                {(session!.user.roles ?? []).map((r) => (
                  <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                    {ROLES[r as keyof typeof ROLES]?.label ?? r}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        {/* Límites */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Límites y Presupuesto</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Límites de gasto por departamento, montos máximos sin aprobación y flujos multinivel.
          </p>
          <Link href="/empresas/presupuesto"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
            Ir a Presupuesto →
          </Link>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Notificaciones</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Próximamente</span>
          </div>
          <p className="text-sm text-slate-500">
            Alertas por email o WhatsApp para viajes, aprobaciones y pagos vencidos.
          </p>
        </div>

        {/* Integraciones */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Integraciones</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Próximamente</span>
          </div>
          <p className="text-sm text-slate-500">
            Conecta Going con tu ERP (SAP, Oracle), sistema de facturación electrónica o Slack.
          </p>
        </div>

      </div>
    </div>
  );
}
