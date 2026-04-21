/**
 * Panel de Control (Dashboard) de Empresas
 * Ruta: /empresas/panel
 *
 * Resumen de la cuenta, KPIs, acciones rápidas
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";
import Link from "next/link";

export default function DashboardPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  // Mock data - TODO: Obtener datos reales del backend
  const stats = [
    {
      label: "Viajes Este Mes",
      value: "12",
      change: "+2 desde la semana pasada",
    },
    {
      label: "Gasto Acumulado",
      value: "$3,450",
      change: "+15% vs mes anterior",
    },
    {
      label: "Aprobaciones Pendientes",
      value: "3",
      change: "Requieren tu atención",
    },
    {
      label: "Saldo Disponible",
      value: "$15,000",
      change: "Crédito corporativo",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Bienvenido, {session.user.nombre}
        </h1>
        <p className="text-slate-600 mt-2">
          Panel de control de {session.user.companyName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Acciones Rápidas
          </h2>
          <div className="space-y-3">
            <Link
              href="/empresas/solicitar"
              className="block px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
            >
              + Solicitar Nuevo Viaje
            </Link>
            <Link
              href="/empresas/viajes"
              className="block px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Ver Mis Viajes
            </Link>
            {session.user.roles.includes("aprobador") && (
              <Link
                href="/empresas/aprobaciones"
                className="block px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-medium transition-colors"
              >
                Revisar Aprobaciones (3)
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Actividad Reciente
          </h2>
          <div className="space-y-3">
            <div className="pb-3 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">
                Viaje aprobado: Quito → Guayaquil
              </p>
              <p className="text-xs text-slate-600">Hace 2 horas</p>
            </div>
            <div className="pb-3 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">
                Factura emitida: Mes de Abril
              </p>
              <p className="text-xs text-slate-600">Hace 1 día</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Nuevo usuario añadido: Ana López
              </p>
              <p className="text-xs text-slate-600">Hace 3 días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900">Información Importante</h3>
        <p className="text-sm text-blue-800 mt-2">
          Esta es una versión de demostración de Going para Empresas. Muchas
          funcionalidades están en desarrollo. Por favor, reporta cualquier
          problema al equipo de soporte.
        </p>
      </div>

      {/* TODO: Implementar y vincular datos reales */}
      {/* TODO: Agregar gráficos de gastos/tendencias */}
      {/* TODO: Integrar notificaciones en tiempo real */}
    </div>
  );
}
