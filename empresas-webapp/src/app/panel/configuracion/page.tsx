/**
 * Página de Configuración
 * Ruta: /configuracion
 * Solo admins.
 */

"use client";

import Link from "next/link";
import { useAuthRedirect } from "@/lib/auth";
import { TIPOS_CUENTA, ROLES } from "@/lib/constants";

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
            <p className="text-xs text-slate-400">Para modificar estos datos contacta al equipo de Going App.</p>
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
          <Link href="/panel/presupuesto"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
            Ir a Presupuesto →
          </Link>
        </div>

        {/* Notificaciones — YA operativo para aprobaciones por WhatsApp.
            La limitación de la ventana de 24h se declara en pantalla a
            propósito: prometer entrega siempre sería mentir hasta que estén
            aprobadas las plantillas de Meta. */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Notificaciones</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Activo
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Quien debe aprobar un viaje recibe un aviso por <strong>WhatsApp</strong> con el
            detalle y el enlace directo para resolverlo.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
            <li>✅ Viaje pendiente de aprobación</li>
            <li className="text-slate-400">◻ Factura emitida y por vencer — en preparación</li>
            <li className="text-slate-400">◻ Viaje confirmado y recordatorio — en preparación</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            El aviso usa el teléfono del perfil de cada persona. Si no tiene uno cargado, no lo
            recibe: verifícalo en <strong>Equipo</strong>.
          </p>
        </div>

        {/* Integraciones — se corrige el texto: prometía SAP/Oracle, que NO es
            lo que necesitan PyMEs ni agencias. Se declara el orden real. */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Integraciones</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              En construcción
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Lo que estamos construyendo, en este orden:
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-slate-600 list-decimal list-inside">
            <li><strong>Facturación electrónica (SRI)</strong> — comprobantes válidos en Ecuador</li>
            <li><strong>Exportación contable</strong> — CSV de viajes y facturas (ya disponible en Reportes)</li>
            <li><strong>Webhooks</strong> — para conectar Going App con tus propios sistemas</li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            ¿Necesitas conectar un ERP específico? Escríbenos y lo evaluamos según tu caso.
          </p>
        </div>

      </div>
    </div>
  );
}
