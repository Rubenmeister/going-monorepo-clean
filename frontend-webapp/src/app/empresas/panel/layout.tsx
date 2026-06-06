/**
 * Layout para el panel autenticado de Empresas.
 * Navega según tipoCuenta: grande | negocio | agencia
 */

"use client";

import { useAuthRedirect, signOut } from "@/lib/empresas/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ROLES, TIPOS_CUENTA } from "@/lib/empresas/constants";
import { getNavItems, getContexto } from "@/lib/empresas/permisos";
import NotificationBell from "@/components/empresas/NotificationBell";

export default function EmpresasLayout({ children }: { children: ReactNode }) {
  const { session, status } = useAuthRedirect();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 text-sm">Cargando...</p>
      </div>
    );
  }

  if (!session) return null;

  const tipoCuenta = session.user.tipoCuenta as string | undefined;
  const navItems = getNavItems(tipoCuenta);
  const ctx = getContexto(tipoCuenta);
  const tipoCuentaInfo = tipoCuenta
    ? TIPOS_CUENTA[tipoCuenta as keyof typeof TIPOS_CUENTA]
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-slate-200 flex flex-col overflow-hidden">

        {/* Logo + empresa */}
        <div className="p-5 border-b border-slate-200 shrink-0">
          <Link href="/" className="text-xl font-bold text-blue-600">Going App</Link>
          <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
            {session.user.companyName}
          </p>
          {tipoCuentaInfo && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
              {tipoCuentaInfo.label}
            </span>
          )}
        </div>

        {/* Usuario */}
        <div className="px-5 py-4 border-b border-slate-200 shrink-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {[session.user.nombre, session.user.apellido].filter(Boolean).join(" ") || session.user.email}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{session.user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {session.user.roles.map((role: string) => (
              <span
                key={role}
                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
              >
                {ROLES[role as keyof typeof ROLES]?.label || role}
              </span>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Info del plan + logout */}
        <div className="shrink-0 border-t border-slate-200">
          {/* Condiciones contractuales */}
          <div className="px-4 py-3 bg-slate-50 text-xs text-slate-500 leading-relaxed">
            {ctx.descripcionPanel}
          </div>
          <div className="p-3">
            <button
              onClick={() => signOut()}
              className="w-full px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between">
          {/* Breadcrumb / página actual */}
          <p className="text-sm text-slate-500">
            {navItems.find((item) => pathname === item.href || pathname?.startsWith(item.href + "/"))?.label ?? "Panel"}
          </p>

          {/* Acciones header */}
          <div className="flex items-center gap-2">
            {/* Solicitar viaje rápido */}
            <Link
              href="/empresas/panel/solicitar"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo viaje
            </Link>

            {/* Campana */}
            <NotificationBell token={session.accessToken} />
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
