/**
 * Administradores de la empresa (Bloque 3 #5).
 *
 * Designa qué miembros pueden CONFIGURAR la empresa: políticas de viaje, límites
 * de gasto, ajustes e invitaciones. El resto del equipo puede reservar y ver
 * reportes, pero no cambiar la configuración.
 *
 * Consume /corporate/admins (GET/POST/DELETE) del corporate-service vía gateway.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthRedirect } from "@/lib/auth";
import {
  fetchTeamMembers,
  fetchCompanyAdmins,
  addCompanyAdmin,
  removeCompanyAdmin,
} from "@/lib/api";

interface Member {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function AdministradoresPage() {
  const { session } = useAuthRedirect();
  const [members, setMembers] = useState<Member[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const token = session?.accessToken;
  const companyId = session?.user?.companyId;

  const load = useCallback(async () => {
    if (!token || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [mem, adm] = await Promise.all([
        fetchTeamMembers(token, companyId),
        fetchCompanyAdmins(token),
      ]);
      setMembers(mem as Member[]);
      setAdmins(adm);
    } catch (e) {
      setError(`No se pudieron cargar los datos: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [token, companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const toggle = async (userId: string, makeAdmin: boolean) => {
    if (!token) return;
    setBusy(userId);
    try {
      const next = makeAdmin
        ? await addCompanyAdmin(token, userId)
        : await removeCompanyAdmin(token, userId);
      setAdmins(next);
      flash(makeAdmin ? "Administrador agregado." : "Administrador removido.", true);
    } catch (e) {
      flash((e as Error).message || "No se pudo actualizar.", false);
    } finally {
      setBusy(null);
    }
  };

  if (!session) return null;

  const name = (m: Member) =>
    [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Administradores</h1>
      <p className="text-gray-500 mb-6">
        Los administradores pueden configurar políticas de viaje, límites de gasto,
        ajustes de la empresa e invitar miembros. El resto del equipo solo reserva y
        consulta.
      </p>

      {toast && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
            toast.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {admins.length === 0 && !loading && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
          Esta empresa aún no tiene administradores designados. Marca al menos a una
          persona como administradora.
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Cargando…</p>
      ) : error ? (
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      ) : members.length === 0 ? (
        <p className="text-gray-400">No hay miembros en el equipo todavía.</p>
      ) : (
        <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {members.map((m) => {
            const isAdmin = admins.includes(String(m.id));
            const isSelf = String(m.id) === String(session.user.id);
            return (
              <div key={m.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  {name(m)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {name(m)} {isSelf && <span className="text-xs text-gray-400">(tú)</span>}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{m.email}</p>
                </div>
                {isAdmin ? (
                  <>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                      Admin
                    </span>
                    <button
                      disabled={busy === m.id}
                      onClick={() => toggle(String(m.id), false)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Quitar
                    </button>
                  </>
                ) : (
                  <button
                    disabled={busy === m.id}
                    onClick={() => toggle(String(m.id), true)}
                    className="text-sm px-3 py-1.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                  >
                    Hacer admin
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
