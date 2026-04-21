/**
 * Página de Configuración
 * Ruta: /empresas/configuracion
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";

export default function ConfiguracionPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  const puedeConfigurar = session.user.roles.includes("admin");

  if (!puedeConfigurar) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Acceso Denegado</h1>
        <p className="text-slate-600 mt-2">
          Solo administradores pueden acceder a la configuración.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
      <p className="text-slate-600 mt-2">Ajustes de tu cuenta corporativa</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Información General
          </h2>
          <p className="text-slate-600 text-sm">
            Nombre de empresa, RUC, contactos, ubicación.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm">
            Editar
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Límites y Crédito
          </h2>
          <p className="text-slate-600 text-sm">
            Límites por departamento, plazo de facturación, y crédito autorizado.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm">
            Editar
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Notificaciones
          </h2>
          <p className="text-slate-600 text-sm">
            Configura cuándo recibir notificaciones de viajes y aprobaciones.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm">
            Editar
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Integraciones
          </h2>
          <p className="text-slate-600 text-sm">
            Conecta con tus sistemas: SAP, Salesforce, Jira, etc.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm">
            Configurar
          </button>
        </div>
      </div>

      {/* TODO: Implementar todas las opciones */}
    </div>
  );
}
