/**
 * Landing pública para Empresas (empresas.goingec.com)
 * Diseño formal B2B: hero con logo + imagen, qué hace Going, 3 tipos de cuenta.
 */

"use client";

import Link from "next/link";
import { TIPOS_CUENTA } from "@/lib/constants";

const HERO_IMG =
  "https://images.unsplash.com/photo-1526397751294-331021109fbd?w=1600&q=80";

const QUE_HACE = [
  {
    icon: "🚗",
    title: "Viajes corporativos",
    desc: "Traslados privados y ejecutivos entre ciudades y dentro de la ciudad, con conductoras y conductores verificados.",
  },
  {
    icon: "✅",
    title: "Aprobaciones y control",
    desc: "Flujos de aprobación multinivel, límites por departamento y políticas de viaje — el gasto siempre bajo control.",
  },
  {
    icon: "🧾",
    title: "Facturación centralizada",
    desc: "Una sola factura, wallet consolidada y reportes de gasto por empleado y área. Sin cuentas sueltas.",
  },
  {
    icon: "📦",
    title: "Envíos entre ciudades",
    desc: "Mueve documentos y paquetes con seguimiento en tiempo real y comprobante de entrega.",
  },
];

export default function EmpresasLanding() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/going-logo-h.png" alt="Going App" className="h-[4.5rem] w-auto" />
            <span className="ml-3 hidden border-l border-slate-200 pl-3 text-sm font-semibold text-slate-500 sm:inline">
              para Empresas
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Ingresar
            </Link>
            <Link
              href="/solicitud"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Solicitar cuenta
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${HERO_IMG}')` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-900/70" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/going-logo-white-h.png" alt="Going App" className="h-24 w-auto" />
          <div className="mt-8 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80">
              🇪🇨 Movilidad corporativa · Ecuador
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
              La movilidad de tu empresa,<br />
              <span className="text-blue-400">en una sola plataforma</span>
            </h1>
            <p className="mt-5 text-lg text-slate-300">
              Going App conecta a tu equipo con viajes seguros, aprobaciones,
              envíos y facturación centralizada. Estándares altos de seguridad y
              servicio, de norte a sur del país.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/solicitud"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
              >
                Solicitar cuenta <span>→</span>
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-lg border border-white/25 bg-white/5 px-7 py-3.5 font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Qué hace Going App para Empresas ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
            Qué hacemos
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">
            Todo lo que tu empresa necesita para moverse
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {QUE_HACE.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                {f.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tipos de cuenta ── */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Planes
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              Un plan para cada tipo de negocio
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {Object.entries(TIPOS_CUENTA).map(([key, value]: [string, any]) => {
              const feats: Record<string, string[]> = {
                grande: ["Aprobaciones multinivel", "Wallet consolidada", "Límites por departamento"],
                negocio: ["Tarjeta o efectivo", "Factura al momento", "Sin aprobaciones"],
                agencia: ["Reservas a nombre de terceros", "Dashboard de desempeño", "Soporte dedicado"],
              };
              return (
                <div
                  key={key}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-black text-slate-900">{value.label}</h3>
                  <p className="mt-3 text-sm text-slate-600">{value.descripcion}</p>
                  <div className="mt-6 flex-1 space-y-2.5">
                    {(feats[key] ?? []).map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="text-blue-600">✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/solicitud?tipo=${key}`}
                    className="mt-8 block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Solicitar
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/going-logo-h.png" alt="Going App" className="h-[3.75rem] w-auto opacity-80" />
          <p className="text-xs text-slate-500">
            © 2026 Going App · Movilidad corporativa · Hecho en Ecuador
          </p>
        </div>
      </footer>
    </main>
  );
}
