/**
 * Landing pública para Empresas
 * Ruta: /empresas
 *
 * Muestra hero, 3 cards de tipos de cuenta, CTA a solicitud
 */

"use client";

import Link from "next/link";
import { TIPOS_CUENTA } from "@/lib/empresas/constants";

export default function EmpresasLanding() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Going
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/empresas/auth/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Ingresar
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl lg:text-6xl">
            Going para Empresas
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600">
            Soluciones de movilidad corporativa pensadas para tu negocio.
            Gestiona viajes, aprobaciones y facturación en una plataforma unificada.
          </p>
          <div className="mt-10">
            <Link
              href="/empresas/solicitud"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Solicitar Cuenta
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Account Types Cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {Object.entries(TIPOS_CUENTA).map(([key, value]: [string, any]) => (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-2xl font-bold text-slate-900">
                {value.label}
              </h3>
              <p className="mt-4 text-slate-600">
                {value.descripcion}
              </p>
              <div className="mt-6 space-y-2">
                {key === "grande" && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Crédito y pago a {value.plazo} días
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Aprobaciones multinivel
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Wallet consolidada
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Límites por departamento
                    </div>
                  </>
                )}
                {key === "negocio" && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Pago por viaje
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Tarjeta o efectivo
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Factura al momento
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Sin aprobaciones
                    </div>
                  </>
                )}
                {key === "agencia" && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Comisión a {value.plazo} días
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Reservas a nombre de terceros
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Dashboard de desempeño
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-lg">✓</span>
                      Soporte dedicado
                    </div>
                  </>
                )}
              </div>
              <Link
                href={`/empresas/solicitud?tipo=${key}`}
                className="mt-8 block w-full rounded-lg border border-blue-600 bg-white px-4 py-2 text-center font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Solicitar
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-16">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-600">
            © 2026 Going. Soluciones de movilidad.
          </p>
        </div>
      </footer>
    </main>
  );
}
