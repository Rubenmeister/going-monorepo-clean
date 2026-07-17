/**
 * NotificationBell
 * Campana con badge de no leídas + dropdown de notificaciones.
 * Polling automático cada 30 segundos.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NotificationItem,
} from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "ahora mismo";
  if (mins < 60)  return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

function notifIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("aprob") || t.includes("pendiente")) return "⏳";
  if (t.includes("confirm") || t.includes("reserva"))  return "✅";
  if (t.includes("factura") || t.includes("pago"))     return "🧾";
  if (t.includes("venc") || t.includes("mora"))        return "⚠️";
  if (t.includes("cancel"))                             return "❌";
  return "🔔";
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props {
  token: string;
}

export default function NotificationBell({ token }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen]                   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [marking, setMarking]             = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => n.status !== "READ").length;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications(token);
      // Más recientes primero
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      // Silencioso — no bloquea el layout si falla
    }
  }, [token]);

  // Carga inicial + polling cada 30 s
  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Cerrar al click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Marcar una como leída ──────────────────────────────────────────────────
  async function handleRead(id: string) {
    setMarking(id);
    try {
      await markNotificationRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ", readAt: new Date().toISOString() } : n))
      );
    } catch {/* silencioso */}
    finally { setMarking(null); }
  }

  // ── Marcar todas como leídas ───────────────────────────────────────────────
  async function handleReadAll() {
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" as const, readAt: new Date().toISOString() })));
    } catch {/* silencioso */}
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón campana */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notificaciones"
      >
        {/* Icono campana SVG */}
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge no leídas */}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unread > 9 ? "9+" : unread}
          </span>
        )}

        {/* Indicador de carga */}
        {loading && unread === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">

          {/* Header dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Notificaciones</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {unread} nuevas
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleReadAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-slate-500">Sin notificaciones por ahora</p>
              </div>
            )}

            {notifications.map((n) => {
              const isRead    = n.status === "READ";
              const isMarking = marking === n.id;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors ${
                    isRead ? "bg-white" : "bg-blue-50"
                  } hover:bg-slate-50`}
                >
                  {/* Icono */}
                  <span className="text-lg flex-shrink-0 mt-0.5">{notifIcon(n.title)}</span>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${isRead ? "text-slate-700" : "text-slate-900 font-medium"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Marcar leída */}
                  {!isRead && (
                    <button
                      onClick={() => handleRead(n.id)}
                      disabled={isMarking}
                      className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 hover:bg-blue-700 transition-colors disabled:opacity-40"
                      title="Marcar como leída"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-400 text-center">
                {notifications.length} notificación{notifications.length !== 1 ? "es" : ""} · actualiza cada 30s
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
