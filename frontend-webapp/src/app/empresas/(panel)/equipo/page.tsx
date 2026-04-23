/**
 * Página de Gestión de Equipo
 * Ruta: /empresas/equipo
 * Solo admins.
 *
 * Funciones:
 *  - Listar miembros con búsqueda
 *  - Invitar nuevo miembro con rol asignado (POST /corporate/invite)
 *  - Cambiar rol de un miembro existente (PATCH /auth/admin/users/:id/roles)
 *  - Suspender / reactivar miembro (PATCH /auth/admin/users/:id/status)
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import {
  fetchTeamMembers,
  updateUserStatus,
  inviteTeamMember,
  updateUserRole,
} from "@/lib/empresas/api";
import { ROLES } from "@/lib/empresas/constants";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id:         string;
  email:      string;
  firstName?: string;
  lastName?:  string;
  roles:      string[];
  status:     string;
  createdAt?: string;
  companyId?: string;
}

type RoleKey = keyof typeof ROLES;

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active:               "bg-green-100 text-green-700",
  suspended:            "bg-red-100 text-red-700",
  pending_verification: "bg-yellow-100 text-yellow-700",
};

const STATUS_LABELS: Record<string, string> = {
  active:               "Activo",
  suspended:            "Suspendido",
  pending_verification: "Pendiente",
};

// Roles que se pueden asignar dentro del portal de empresas
const ROLES_ASIGNABLES: { key: RoleKey; desc: string }[] = [
  { key: "aprobador",   desc: "Aprueba o rechaza solicitudes de viaje" },
  { key: "solicitante", desc: "Crea y gestiona solicitudes de viaje" },
  { key: "financiero",  desc: "Accede a facturación, reportes y exportaciones" },
  { key: "agente",      desc: "Reserva viajes a nombre de terceros (agencias)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-EC", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const INPUT = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400";

// ─── Modal: Invitar miembro ───────────────────────────────────────────────────

interface InviteModalProps {
  companyId: string;
  token: string;
  tipoCuenta?: string;
  onClose: () => void;
  onSuccess: (member: TeamMember) => void;
}

function InviteModal({ companyId, token, tipoCuenta, onClose, onSuccess }: InviteModalProps) {
  const [email,     setEmail]     = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [role,      setRole]      = useState<RoleKey>("solicitante");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Agente solo aplica para agencias
  const rolesDisponibles = tipoCuenta === "agencia"
    ? ROLES_ASIGNABLES
    : ROLES_ASIGNABLES.filter((r) => r.key !== "agente");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await inviteTeamMember(token, {
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName:  lastName.trim()  || undefined,
        role,
        companyId,
      });
      // Optimistic: agregar miembro a la lista con status pendiente
      onSuccess({
        id:        crypto.randomUUID(),
        email:     email.trim(),
        firstName: firstName.trim() || undefined,
        lastName:  lastName.trim()  || undefined,
        roles:     [role],
        status:    "pending_verification",
        companyId,
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "No se pudo enviar la invitación. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Invitar miembro al equipo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Email *
            </label>
            <input
              type="email"
              className={INPUT}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Nombre</label>
              <input className={INPUT} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Apellido</label>
              <input className={INPUT} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Pérez" />
            </div>
          </div>

          {/* Selector de rol */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Rol *
            </label>
            <div className="space-y-2">
              {rolesDisponibles.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    role === r.key
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${role === r.key ? "text-blue-700" : "text-slate-800"}`}>
                      {ROLES[r.key].label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                  {role === r.key && (
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Enviando…" : "Enviar invitación"}
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center">
            La persona recibirá un email con el link para activar su cuenta y acceder al portal.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Cambiar rol ───────────────────────────────────────────────────────

interface RoleModalProps {
  member: TeamMember;
  token: string;
  tipoCuenta?: string;
  onClose: () => void;
  onSuccess: (userId: string, roles: string[]) => void;
}

function RoleModal({ member, token, tipoCuenta, onClose, onSuccess }: RoleModalProps) {
  const [selected, setSelected] = useState<RoleKey[]>(
    (member.roles ?? []).filter((r) => r !== "admin") as RoleKey[]
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const rolesDisponibles = tipoCuenta === "agencia"
    ? ROLES_ASIGNABLES
    : ROLES_ASIGNABLES.filter((r) => r.key !== "agente");

  function toggleRole(key: RoleKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );
  }

  async function handleSave() {
    if (selected.length === 0) {
      setError("Debes asignar al menos un rol.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updateUserRole(token, member.id, selected);
      onSuccess(member.id, selected);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "No se pudo actualizar el rol.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Cambiar rol</h2>
            <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Selecciona uno o más roles para este miembro:</p>

          <div className="space-y-2">
            {rolesDisponibles.map((r) => {
              const active = selected.includes(r.key);
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => toggleRole(r.key)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    active ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    active ? "border-blue-500 bg-blue-500" : "border-slate-300"
                  }`}>
                    {active && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${active ? "text-blue-700" : "text-slate-800"}`}>
                      {ROLES[r.key].label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function EquipoPage() {
  const { session } = useAuthRedirect();
  const [members,  setMembers]  = useState<TeamMember[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);
  const [search,   setSearch]   = useState("");

  // Modales
  const [showInvite,    setShowInvite]    = useState(false);
  const [memberForRole, setMemberForRole] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!session?.accessToken || !session.user.companyId) return;
    fetchTeamMembers(session.accessToken, session.user.companyId)
      .then(setMembers)
      .catch(() => setError("No se pudo cargar el equipo."))
      .finally(() => setLoading(false));
  }, [session?.accessToken, session?.user?.companyId]);

  if (!session) return null;

  if (!session.user.roles.includes("admin")) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Acceso Denegado</h1>
        <p className="text-slate-600 mt-2">Solo administradores pueden gestionar el equipo.</p>
      </div>
    );
  }

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Suspender / reactivar
  const handleToggle = async (m: TeamMember) => {
    const newStatus = m.status === "active" ? "suspended" : "active";
    setToggling(m.id);
    try {
      await updateUserStatus(session.accessToken!, m.id, newStatus);
      setMembers((prev) => prev.map((u) => u.id === m.id ? { ...u, status: newStatus } : u));
      showToast(newStatus === "active" ? `${m.email} reactivado.` : `${m.email} suspendido.`, true);
    } catch {
      showToast("No se pudo actualizar el estado. Intenta de nuevo.", false);
    } finally {
      setToggling(null);
    }
  };

  // Nuevo miembro (optimistic)
  const handleInviteSuccess = (newMember: TeamMember) => {
    setMembers((prev) => [newMember, ...prev]);
    showToast(`Invitación enviada a ${newMember.email}.`, true);
  };

  // Cambio de rol (optimistic)
  const handleRoleSuccess = (userId: string, roles: string[]) => {
    setMembers((prev) => prev.map((u) => u.id === userId ? { ...u, roles } : u));
    showToast("Rol actualizado correctamente.", true);
  };

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.email.toLowerCase().includes(q) ||
      `${m.firstName ?? ""} ${m.lastName ?? ""}`.toLowerCase().includes(q)
    );
  });

  const activos     = members.filter((m) => m.status === "active").length;
  const suspendidos = members.filter((m) => m.status === "suspended").length;
  const pendientes  = members.filter((m) => m.status === "pending_verification").length;

  return (
    <div>
      {/* Modales */}
      {showInvite && (
        <InviteModal
          companyId={session.user.companyId!}
          token={session.accessToken!}
          tipoCuenta={session.user.tipoCuenta}
          onClose={() => setShowInvite(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
      {memberForRole && (
        <RoleModal
          member={memberForRole}
          token={session.accessToken!}
          tipoCuenta={session.user.tipoCuenta}
          onClose={() => setMemberForRole(null)}
          onSuccess={handleRoleSuccess}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Equipo</h1>
          <p className="text-slate-600 mt-1">Gestión de usuarios, roles y estados</p>
        </div>
        <div className="flex items-center gap-4">
          {!loading && !error && (
            <div className="flex gap-3 text-sm text-slate-600">
              <span><span className="font-bold text-green-600">{activos}</span> activos</span>
              {pendientes > 0 && (
                <span><span className="font-bold text-amber-500">{pendientes}</span> pendientes</span>
              )}
              <span><span className="font-bold text-red-500">{suspendidos}</span> suspendidos</span>
            </div>
          )}
          <button
            onClick={() => setShowInvite(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Invitar miembro
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          toast.ok
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Buscador */}
      {!loading && !error && members.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 text-sm">{error}</div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* Vacío */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm">
            {search
              ? `Sin resultados para "${search}".`
              : "Aún no hay miembros. Invita al primero con el botón de arriba."}
          </p>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          {/* Cabecera */}
          <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-4">Usuario</div>
            <div className="col-span-3">Roles</div>
            <div className="col-span-2">Alta</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {/* Filas */}
          {filtered.map((m, i) => (
            <div
              key={m.id}
              className={`grid grid-cols-12 px-5 py-4 items-center gap-2 text-sm ${
                i !== filtered.length - 1 ? "border-b border-slate-100" : ""
              } hover:bg-slate-50 transition-colors`}
            >
              {/* Usuario */}
              <div className="col-span-4 min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {m.firstName || m.lastName
                    ? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()
                    : "—"}
                </p>
                <p className="text-xs text-slate-500 truncate">{m.email}</p>
              </div>

              {/* Roles */}
              <div className="col-span-3 flex flex-wrap gap-1">
                {(m.roles ?? []).map((r) => (
                  <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                    {ROLES[r as RoleKey]?.label ?? r}
                  </span>
                ))}
              </div>

              {/* Fecha alta */}
              <div className="col-span-2 text-xs text-slate-500">{fmtDate(m.createdAt)}</div>

              {/* Estado */}
              <div className="col-span-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[m.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {STATUS_LABELS[m.status] ?? m.status}
                </span>
              </div>

              {/* Acciones */}
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {m.id !== session.user.id && (
                  <>
                    {/* Cambiar rol */}
                    <button
                      onClick={() => setMemberForRole(m)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Cambiar rol"
                    >
                      Rol
                    </button>
                    {/* Suspender / Reactivar */}
                    <button
                      onClick={() => handleToggle(m)}
                      disabled={toggling === m.id}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
                        m.status === "active"
                          ? "text-red-600 border-red-200 hover:bg-red-50"
                          : "text-green-600 border-green-200 hover:bg-green-50"
                      }`}
                    >
                      {toggling === m.id
                        ? "…"
                        : m.status === "active"
                        ? "Suspender"
                        : "Reactivar"}
                    </button>
                  </>
                )}
                {m.id === session.user.id && (
                  <span className="text-xs text-slate-400 italic">Tú</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leyenda de roles */}
      <div className="mt-6 bg-slate-50 rounded-lg border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Guía de roles</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ROLES_ASIGNABLES.map((r) => (
            <div key={r.key}>
              <p className="text-xs font-semibold text-slate-700">{ROLES[r.key].label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
