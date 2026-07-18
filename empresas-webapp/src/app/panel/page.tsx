/**
 * Panel de Control (Dashboard) de Empresas
 * Ruta: /panel
 *
 * KPIs y resumen adaptados según tipoCuenta: grande | negocio | agencia
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/auth";
import { fetchDashboardStats, DashboardStats } from "@/lib/api";
import { getKPIConfig, getContexto, KPIConfig } from "@/lib/permisos";
import Link from "next/link";

function fmtMoney(n: number) {
  return "$" + n.toLocaleString("es-EC", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatValue(cfg: KPIConfig, stats: DashboardStats | null, loading: boolean, error: boolean) {
  if (loading) return "—";
  if (error || !stats) return "?";
  const raw = stats[cfg.key] ?? 0;
  return cfg.format === "money" ? fmtMoney(raw as number) : String(raw);
}

export default function DashboardPage() {
  const { session } = useAuthRedirect();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetchDashboardStats(session!.accessToken)
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  if (!session) return null;

  const tipoCuenta = session!.user.tipoCuenta as string | undefined;
  const kpis = getKPIConfig(tipoCuenta);
  const ctx = getContexto(tipoCuenta);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Bienvenido, {session!.user.nombre || session!.user.email}
        </h1>
        <p className="text-slate-600 mt-1">{ctx.descripcionPanel}</p>
      </div>

      {/* Banner informativo por tipo */}
      {ctx.bannerInfo && (
        <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          {ctx.bannerInfo}
        </div>
      )}

      {/* Error de carga */}
      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          No se pudieron cargar algunos datos. Verifica tu conexión o intenta recargar.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) => {
          const value = formatValue(kpi, stats, loading, error);
          const isAlert = kpi.alertColor && stats && (stats[kpi.key] as number) > 0;
          return (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
              <p className={`text-3xl font-bold mt-2 ${
                loading
                  ? "text-slate-300 animate-pulse"
                  : isAlert
                  ? kpi.alertColor
                  : "text-slate-900"
              }`}>
                {value}
              </p>
              <p className="text-xs text-slate-500 mt-2">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Dos columnas inferiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Acciones rápidas — adaptadas por tipo */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <Link
              href="/panel/solicitar"
              className="block px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-sm"
            >
              + {tipoCuenta === "agencia" ? "Reservar Viaje para Cliente" : "Solicitar Nuevo Viaje"}
            </Link>
            <Link
              href="/panel/viajes"
              className="block px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors text-sm"
            >
              {tipoCuenta === "agencia" ? "Ver Reservas Gestionadas" : "Ver Mis Viajes"}
            </Link>
            <Link
              href="/panel/facturacion"
              className="block px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors text-sm"
            >
              {ctx.labelFacturacion}
            </Link>
            {/* Aprobaciones: solo para grande y si es aprobador/admin */}
            {tipoCuenta === "grande" &&
              (session!.user.roles.includes("aprobador") || session!.user.roles.includes("admin")) && (
                <Link
                  href="/panel/aprobaciones"
                  className="block px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-medium transition-colors text-sm"
                >
                  Revisar Aprobaciones
                  {stats?.aprobacionesPendientes
                    ? ` (${stats.aprobacionesPendientes})`
                    : ""}
                </Link>
              )}
          </div>
        </div>

        {/* Resumen financiero — labels contextuales */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {tipoCuenta === "agencia" ? "Resumen de Comisiones" : "Resumen Financiero"}
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-slate-500">No disponible</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {tipoCuenta === "agencia" ? "Comisiones generadas" : "Total facturado"}
                </span>
                <span className="font-semibold text-slate-900">
                  {fmtMoney(stats?.gastoAcumulado ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{ctx.labelSaldo}</span>
                <span className={`font-semibold ${
                  tipoCuenta === "agencia" ? "text-blue-600" : "text-red-600"
                }`}>
                  {fmtMoney(stats?.saldoPendiente ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {tipoCuenta === "agencia"
                    ? "Reservas pendientes"
                    : tipoCuenta === "grande"
                    ? "Aprobaciones pendientes"
                    : "Viajes este mes"}
                </span>
                <span className="font-semibold text-amber-600">
                  {tipoCuenta === "negocio"
                    ? stats?.viajesEsteMes ?? 0
                    : stats?.aprobacionesPendientes ?? 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seguimiento en vivo — mapa visible en la portada del panel.
          Vista general (Quito) + acceso al mapa completo con los empleados
          en viaje en tiempo real. Iframe OSM: sin token ni dependencias JS. */}
      <div className="mt-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Seguimiento en vivo</h2>
          <Link href="/panel/mapa" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Ver mapa completo →
          </Link>
        </div>
        <iframe
          title="Seguimiento en vivo"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-78.60,-0.35,-78.40,-0.05&layer=mapnik"
          className="w-full h-72 border-0"
          loading="lazy"
        />
        <div className="px-6 py-3 text-xs text-slate-500 border-t border-slate-100">
          Abre{" "}
          <Link href="/panel/mapa" className="text-blue-600 hover:underline">Mapa en Vivo</Link>{" "}
          para ver la posición de tus empleados en viaje, en tiempo real y con filtro por departamento.
        </div>
      </div>
    </div>
  );
}
