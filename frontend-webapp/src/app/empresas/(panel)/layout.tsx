/**
 * Layout para el panel autenticado de Empresas
 * Todas las páginas bajo /empresas/panel, /empresas/viajes, etc.
 * están dentro de este layout
 */

"use client";

import { useAuthRedirect } from "@/lib/empresas/auth";
import Link from "next/link";
import { ReactNode } from "react";
import { ROLES } from "@/lib/empresas/constants";

const navItems = [
  { href: "/empresas/panel", label: "Panel de Control" },
  { href: "/empresas/viajes", label: "Viajes" },
  { href: "/empresas/solicitar", label: "Solicitar Viaje" },
  { href: "/empresas/aprobaciones", label: "Aprobaciones" },
  { href: "/empresas/equipo", label: "Equipo" },
  { href: "/empresas/facturacion", label: "Facturación" },
  { href: "/empresas/reportes", label: "Reportes" },
  { href: "/empresas/configuracion", label: "Configuración" },
];

export default function EmpresasLayout({ children }: { children: ReactNode }) {
  const { session, status } = useAuthRedirect();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Redirect handled by useAuthRedirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-slate-200 overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Going
          </Link>
          <p className="text-xs text-slate-600 mt-2">
            {session.user.companyName}
          </p>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-900">
            {session.user.nombre} {session.user.apellido ?? ""}
          </p>
          <p className="text-xs text-slate-600 mt-1">{session.user.email}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {session.user.roles.map((role: string) => (
              <span
                key={role}
                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
              >
                {ROLES[role as keyof typeof ROLES]?.label || role}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button
            onClick={() => {
              // TODO: Implementar signOut
              window.location.href = "/empresas";
            }}
            className="w-full px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
