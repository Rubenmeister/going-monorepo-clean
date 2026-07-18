/**
 * Helper de API para llamadas al backend corporativo
 * Adaptado de apps/corporate-portal/lib/api.ts
 */

import { API_BASE_URL, AUTH_TOKEN_KEY } from "./constants";
import { clearSession, refreshToken } from "./auth";

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch tipado con autenticación + manejo automático de 401.
 *
 * Si el backend responde 401 (token expirado/inválido):
 *   1. Intenta refrescar el token con refreshToken().
 *   2. Si el refresh es exitoso, reintenta la request original con el
 *      nuevo token leído de localStorage.
 *   3. Si el refresh falla, limpia la sesión local y redirige a
 *      /auth/login preservando la ruta actual como ?from=.
 *
 * Esto evita el "logout sorpresivo" donde el usuario veía datos vacíos sin
 * entender que la sesión expiró.
 */
export interface CorpFetchInit extends RequestInit {
  /**
   * Si true, un 401 NO borra la sesión ni redirige a login: solo lanza el error
   * para que el caller lo maneje (degradar a "—"). Úsalo en widgets OPCIONALES
   * que consultan recursos que podrían estar restringidos para el rol actual
   * (p.ej. endpoints solo-admin). Evita también rotar el refresh token en vano.
   */
  silent401?: boolean;
}

export async function corpFetch<T>(
  path: string,
  token: string,
  options?: CorpFetchInit,
  _retried = false
): Promise<T> {
  const { silent401, ...init } = options ?? {};
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && !_retried && typeof window !== "undefined") {
    // Widgets opcionales: un 401 de un recurso restringido no debe arrastrar la
    // sesión ni consumir el refresh token. Lanzamos y que el caller degrade.
    if (silent401) throw new Error(`API 401 (silencioso): ${path}`);
    // Sesión expirada — intentamos refresh transparente y reintentamos una vez
    const refreshed = await refreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
      return corpFetch<T>(path, newToken, options, true);
    }

    // Refresh falló: limpiamos sesión local y redirigimos a login preservando
    // la ruta actual para volver tras el re-login.
    clearSession();
    const from = window.location.pathname + window.location.search;
    window.location.href = `/auth/login?from=${encodeURIComponent(from)}`;
    // Tiramos un error para que el caller no siga procesando datos viejos
    throw new Error("Sesión expirada. Redirigiendo a login.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Endpoints de Empresas
 */

// ── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  viajesEsteMes: number;
  gastoAcumulado: number;       // total facturado (USD)
  aprobacionesPendientes: number;
  saldoPendiente: number;       // monto por cobrar
}

/**
 * Resumen de facturación CORPORATIVA (total facturado y saldo por cobrar).
 *
 * ⚠️ Fuente: /corporate/billing/invoices (corporate-service). NO /invoices ni
 * /invoices/stats/summary (billing-service): son dos almacenes distintos y la
 * facturación de empresas vive en el corporativo. Leer el de billing devolvía
 * SIEMPRE ceros aunque la factura del mes existiera, y por eso el panel mostraba
 * "Total facturado $0 / Saldo pendiente $0" con facturas emitidas.
 */
export async function fetchCorporateBilling(
  token: string,
): Promise<{ totalFacturado: number; saldoPendiente: number; vencidas: number; facturas: any[] }> {
  const raw = await corpFetch<any>("/corporate/billing/invoices", token, { silent401: true });
  const list: any[] = Array.isArray(raw) ? raw : (raw?.invoices ?? []);
  const ahora = Date.now();
  let totalFacturado = 0;
  let saldoPendiente = 0;
  let vencidas = 0;
  for (const inv of list) {
    const monto = Number(inv?.total) || 0;
    totalFacturado += monto;
    const pagada = inv?.status === "paid" || !!inv?.paidAt;
    if (!pagada) {
      saldoPendiente += monto;
      if (inv?.dueDate && new Date(inv.dueDate).getTime() < ahora) vencidas++;
    }
  }
  return {
    totalFacturado: +totalFacturado.toFixed(2),
    saldoPendiente: +saldoPendiente.toFixed(2),
    vencidas,
    facturas: list,
  };
}

/**
 * Obtiene los KPIs del dashboard en paralelo.
 * - GET /bookings/my                 → viajes del mes + pendientes de aprobación
 * - GET /corporate/billing/invoices  → gasto facturado y saldo por cobrar
 */
export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  const [bookings, billing] = await Promise.allSettled([
    corpFetch<any[]>("/bookings/my", token),
    fetchCorporateBilling(token),
  ]);

  // Bookings
  let viajesEsteMes = 0;
  let aprobacionesPendientes = 0;
  if (bookings.status === "fulfilled" && Array.isArray(bookings.value)) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    bookings.value.forEach((b) => {
      const created = new Date(b.createdAt ?? b.startDate ?? "");
      if (created.getMonth() === thisMonth && created.getFullYear() === thisYear) {
        viajesEsteMes++;
      }
      if (b.status === "pending") {
        aprobacionesPendientes++;
      }
    });
  }

  // Facturación corporativa
  let gastoAcumulado = 0;
  let saldoPendiente = 0;
  if (billing.status === "fulfilled" && billing.value) {
    gastoAcumulado = billing.value.totalFacturado;
    saldoPendiente = billing.value.saldoPendiente;
  }

  return { viajesEsteMes, gastoAcumulado, aprobacionesPendientes, saldoPendiente };
}

// ── Solicitudes ─────────────────────────────────────────────────────────────

// Solicitudes — alta pública de empresa (prospecto). Ahora PERSISTE en el
// corporate-service vía el endpoint público del gateway (antes iba a una ruta
// Next mock in-memory que perdía los prospectos en cada reinicio).
export async function crearSolicitudEmpresa(data: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/corporate/public/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`No se pudo enviar la solicitud (${res.status}). ${text.slice(0, 200)}`);
  }

  return res.json();
}

// Bookings
export async function fetchBookings(
  token: string,
  _companyId?: string   // reservado para futuros filtros por empresa (admin)
): Promise<any[]> {
  return corpFetch("/bookings/my", token);
}

/**
 * Crea una nueva reserva corporativa.
 *
 * ⚠️ Va a POST /corporate/bookings (NO /bookings directo). El corporate-service:
 *   1. valida presupuesto + política de viajes de la empresa,
 *   2. reenvía el booking a transport-service,
 *   3. si supera umbral/política O el solicitante marcó "Enviar para aprobación",
 *      CREA la aprobación en el workflow multinivel (/corporate/approvals/*).
 * Postear a /bookings directo se saltaba el paso 3 → las aprobaciones nunca se
 * creaban y el multinivel no arrancaba desde la UI.
 *
 * Por eso mandamos, además del payload de booking, los campos PLANOS que el
 * corporate-service lee: amount (numérico), employeeName, origin, destination,
 * serviceType, startDate y requiresApproval (fuerza aprobación).
 */
export async function crearBooking(
  token: string,
  data: {
    userId: string;
    serviceId: string;
    serviceType: "transport" | "accommodation" | "tour" | "experience" | "parcel";
    totalPrice: { amount: number; currency: string };
    startDate: string;
    endDate?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<any> {
  const meta = (data.metadata ?? {}) as Record<string, any>;
  const body = {
    ...data,
    // Campos planos para el enforcement + workflow del corporate-service.
    amount: data.totalPrice?.amount ?? 0,
    employeeName: meta.passengerName ?? meta.requesterName ?? "",
    origin: meta.origin,
    destination: meta.destination,
    requiresApproval: !!meta.requiresApproval,
    isPersonal: !!meta.isPersonal,
    isInternational: !!meta.isInternational,
    justification: meta.justification ?? data.notes,
  };
  return corpFetch("/corporate/bookings", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Aprobaciones — workflow de aprobación MULTINIVEL del corporate-service.
// Antes esta pantalla usaba /bookings/my (bookings PROPIOS del aprobador) +
// /bookings/:id/confirm|cancel, así que el aprobador no veía las solicitudes de
// su equipo y el multinivel nunca avanzaba. Se reconecta al workflow real:
//  - GET  /corporate/approvals/pending      → items que esperan MI aprobación
//    (traen requesterName, serviceType, amount, description [destino+motivo],
//    approvalChain, currentLevel).
//  - PATCH /corporate/approvals/:id/decide  → aprueba/rechaza y AVANZA el nivel.
export async function fetchApprovals(
  token: string,
  _companyId?: string
): Promise<any[]> {
  return corpFetch<any[]>("/corporate/approvals/pending", token);
}

async function decideApproval(
  token: string,
  approvalId: string,
  decision: "approved" | "rejected",
  comments = ""
): Promise<any> {
  return corpFetch(`/corporate/approvals/${approvalId}/decide`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, comments }),
  });
}

export async function approveBooking(
  token: string,
  approvalId: string,
  comments = ""
): Promise<any> {
  return decideApproval(token, approvalId, "approved", comments);
}

export async function rejectBooking(
  token: string,
  approvalId: string,
  comments = ""
): Promise<any> {
  return decideApproval(token, approvalId, "rejected", comments);
}

// Facturación
export interface InvoiceListResponse {
  invoices: any[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchInvoices(
  token: string,
  params?: {
    status?: string;
    paymentStatus?: string;
    limit?: number;
    offset?: number;
  }
): Promise<InvoiceListResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.paymentStatus) qs.set("paymentStatus", params.paymentStatus);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return corpFetch(`/invoices${query}`, token);
}

// Usuarios/Equipo
// Requiere rol "admin". Filtra por companyId en el cliente.
export async function fetchTeamMembers(
  token: string,
  companyId: string
): Promise<any[]> {
  const res = await corpFetch<{ users: any[]; total: number }>(
    "/auth/admin/users?limit=200",
    token
  );
  return (res.users ?? []).filter(
    (u) => !companyId || u.companyId === companyId
  );
}

export async function updateUserStatus(
  token: string,
  userId: string,
  status: "active" | "suspended"
): Promise<any> {
  return corpFetch(`/auth/admin/users/${userId}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Administradores de empresa (Bloque 3 #5) ──────────────────────────────
export async function fetchCompanyAdmins(token: string): Promise<string[]> {
  const res = await corpFetch<{ adminUserIds: string[] }>("/corporate/admins", token);
  return res.adminUserIds ?? [];
}

export async function addCompanyAdmin(token: string, userId: string): Promise<string[]> {
  const res = await corpFetch<{ adminUserIds: string[] }>("/corporate/admins", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return res.adminUserIds ?? [];
}

export async function removeCompanyAdmin(token: string, userId: string): Promise<string[]> {
  const res = await corpFetch<{ adminUserIds: string[] }>(
    `/corporate/admins/${encodeURIComponent(userId)}`,
    token,
    { method: "DELETE" }
  );
  return res.adminUserIds ?? [];
}

/**
 * Invita a un nuevo miembro al equipo corporativo.
 * POST /corporate/invite
 * El backend envía un email con el link de registro y asigna el rol indicado.
 */
export async function inviteTeamMember(
  token: string,
  data: {
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;        // "aprobador" | "solicitante" | "financiero" | "agente"
    companyId: string;
  }
): Promise<{ invitationId: string; email: string }> {
  return corpFetch("/corporate/invite", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Cambia el rol de un miembro existente.
 * PATCH /auth/admin/users/:id/roles
 */
export async function updateUserRole(
  token: string,
  userId: string,
  roles: string[]
): Promise<any> {
  return corpFetch(`/auth/admin/users/${userId}/roles`, token, {
    method: "PATCH",
    body: JSON.stringify({ roles }),
  });
}

// Configuración
// El endpoint backend canónico es PUT /corporate/settings (corporate-service).
// El companyId se deriva del JWT en el server, no se pasa por path. Aceptamos
// el companyId aquí para compat con el caller actual pero lo ignoramos.
export async function updateCompanySettings(
  token: string,
  _companyId: string,
  data: any
): Promise<any> {
  return corpFetch(
    `/corporate/settings`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

// ── Presupuesto por Departamento ─────────────────────────────────────────────

export interface DepartmentLimit {
  limitId:       string;
  department:    string;
  dailyLimit:    { amount: number; currency: string };
  monthlyLimit?: { amount: number; currency: string };
  status:        "active" | "inactive";
}

export interface DepartmentSpending {
  department: string;
  spent:      number;   // consumido este mes
  limit?:     number;   // límite mensual (si existe)
  currency:   string;
}

export async function fetchSpendingLimits(token: string, companyId: string): Promise<DepartmentLimit[]> {
  const res = await corpFetch<DepartmentLimit[] | { limits: DepartmentLimit[] }>(
    `/corporate/spending-limits?companyId=${companyId}`, token
  );
  return Array.isArray(res) ? res : (res as any).limits ?? [];
}

export async function setDepartmentLimit(
  token: string,
  companyId: string,
  data: { department: string; monthlyLimit: number; dailyLimit?: number; currency?: string }
): Promise<DepartmentLimit> {
  return corpFetch("/corporate/spending-limits", token, {
    method: "POST",
    body: JSON.stringify({
      companyId,
      department:   data.department,
      monthlyLimit: { amount: data.monthlyLimit, currency: data.currency ?? "USD" },
      dailyLimit:   data.dailyLimit ? { amount: data.dailyLimit, currency: data.currency ?? "USD" } : undefined,
    }),
  });
}

export async function fetchSpendingReport(
  token: string,
  companyId: string,
  month: string   // "YYYY-MM"
): Promise<{ byDepartment: Record<string, { amount: number; currency: string }>; totalSpent: { amount: number; currency: string } }> {
  return corpFetch(`/corporate/spending-report?companyId=${companyId}&month=${month}`, token);
}

// ── Notificaciones ───────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  createdAt: string;
  readAt?: string;
}

export async function fetchNotifications(token: string): Promise<NotificationItem[]> {
  const res = await corpFetch<NotificationItem[] | { notifications: NotificationItem[] }>(
    "/notifications", token
  );
  return Array.isArray(res) ? res : (res as any).notifications ?? [];
}

export async function markNotificationRead(token: string, id: string): Promise<void> {
  await corpFetch(`/notifications/${id}/read`, token, { method: "PATCH" });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await corpFetch("/notifications/read-all", token, { method: "PATCH" });
}

// ── Catálogo de Servicios ────────────────────────────────────────────────────

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  location: { address: string; city?: string; country?: string };
  status: string;
  createdAt: string;
}

export interface TourItem extends CatalogItem {
  price: { amount: number; currency: string };
  durationHours: number;
  maxGuests: number;
  category: "ADVENTURE" | "CULTURAL" | "GASTRONOMY" | "NATURE";
}

export interface AccommodationItem extends CatalogItem {
  pricePerNight: { amount: number; currency: string };
  capacity: number;
  amenities: string[];
}

export interface ExperienceItem extends CatalogItem {
  price: { amount: number; currency: string };
  durationHours: number;
}

export async function searchTours(
  token: string,
  params?: { locationCity?: string; category?: string; maxPrice?: number }
): Promise<TourItem[]> {
  const qs = new URLSearchParams();
  if (params?.locationCity) qs.set("locationCity", params.locationCity);
  if (params?.category)     qs.set("category",     params.category);
  if (params?.maxPrice != null) qs.set("maxPrice", String(params.maxPrice));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const res = await corpFetch<TourItem[] | { tours: TourItem[] }>(`/tours${query}`, token);
  return Array.isArray(res) ? res : (res as any).tours ?? [];
}

export async function searchAccommodations(
  token: string,
  params?: { city?: string; country?: string; capacity?: number }
): Promise<AccommodationItem[]> {
  const qs = new URLSearchParams();
  if (params?.city)     qs.set("city",     params.city);
  if (params?.country)  qs.set("country",  params.country);
  if (params?.capacity != null) qs.set("capacity", String(params.capacity));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const res = await corpFetch<AccommodationItem[] | { accommodations: AccommodationItem[] }>(
    `/accommodations${query}`, token
  );
  return Array.isArray(res) ? res : (res as any).accommodations ?? [];
}

export async function searchExperiences(
  token: string,
  params?: { locationCity?: string; maxPrice?: number }
): Promise<ExperienceItem[]> {
  const qs = new URLSearchParams();
  if (params?.locationCity)    qs.set("locationCity", params.locationCity);
  if (params?.maxPrice != null) qs.set("maxPrice",    String(params.maxPrice));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const res = await corpFetch<ExperienceItem[] | { experiences: ExperienceItem[] }>(
    `/experiences${query}`, token
  );
  return Array.isArray(res) ? res : (res as any).experiences ?? [];
}

// ── Voice preference (Voice Sem 3) ───────────────────────────────────────────

export type VoiceLanguage = "es" | "en" | "qu";

export interface VoicePreference {
  language: VoiceLanguage;
  voice: string | null;
  configured: boolean;
}

export async function fetchVoicePreference(token: string): Promise<VoicePreference> {
  return corpFetch<VoicePreference>("/auth/me/voice-preference", token);
}

export async function updateVoicePreference(
  token: string,
  data: { language?: VoiceLanguage; voice?: string | null },
): Promise<VoicePreference> {
  return corpFetch<VoicePreference>("/auth/me/voice-preference", token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── MFA / 2FA (Camino 2A-D) ──────────────────────────────────────────────────

export interface MfaStatus {
  enabled: boolean;
  activatedAt?: string;
}

export interface MfaSetupResponse {
  qrDataUrl: string;
  manualEntryCode: string;
  recoveryCodes: string[];
}

export async function fetchMfaStatus(token: string): Promise<MfaStatus> {
  return corpFetch<MfaStatus>("/auth/mfa/status", token);
}

export async function setupMfa(token: string): Promise<MfaSetupResponse> {
  return corpFetch<MfaSetupResponse>("/auth/mfa/setup", token, { method: "POST" });
}

export async function enableMfa(token: string, code: string): Promise<{ enabled: true; activatedAt: string }> {
  return corpFetch("/auth/mfa/enable", token, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function disableMfa(token: string, password: string, code: string): Promise<{ enabled: false }> {
  return corpFetch("/auth/mfa/disable", token, {
    method: "POST",
    body: JSON.stringify({ password, code }),
  });
}

export async function regenerateMfaCodes(token: string, code: string): Promise<{ recoveryCodes: string[] }> {
  return corpFetch("/auth/mfa/regenerate-codes", token, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// ── PDF de facturas (Gap #3) ─────────────────────────────────────────────────

/**
 * Descarga una factura como PDF. Backend: GET /invoices/:id/pdf en
 * billing-service (via api-gateway). Triggerea descarga en el browser usando
 * un <a download> temporal — necesario porque fetch retorna un Blob, no un
 * stream que el browser pueda salvar automáticamente.
 */
export async function downloadInvoicePdf(
  token: string,
  invoiceId: string,
  invoiceNumber?: string,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`PDF download failed (${res.status}): ${text}`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `factura-${invoiceNumber ?? invoiceId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ── Viajes Recurrentes ───────────────────────────────────────────────────────

export interface RecurringTrip {
  id:          string;
  userId:      string;
  companyId:   string;
  name:        string;
  serviceType: "transport" | "parcel";
  frequency:   "daily" | "weekly" | "monthly";
  weekDays?:   number[];     // 0..6 (domingo=0)
  dayOfMonth?: number;       // 1..28
  time:        string;       // HH:MM
  origin:      { address: string; latitude?: number; longitude?: number };
  destination: { address: string; latitude?: number; longitude?: number };
  vehicleType?: string;
  notes?:      string;
  active:      boolean;
  createdAt:   string;
  updatedAt?:  string;
  expandedUntil?: string;
}

export type RecurringTripInput = Omit<
  RecurringTrip,
  "id" | "userId" | "companyId" | "active" | "createdAt" | "updatedAt" | "expandedUntil"
>;

export async function fetchRecurringTrips(token: string): Promise<RecurringTrip[]> {
  return corpFetch<RecurringTrip[]>("/recurring-trips", token);
}

export async function createRecurringTrip(
  token: string,
  data: RecurringTripInput,
): Promise<RecurringTrip> {
  return corpFetch<RecurringTrip>("/recurring-trips", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRecurringTrip(
  token: string,
  id: string,
  data: Partial<RecurringTripInput> & { active?: boolean },
): Promise<RecurringTrip> {
  return corpFetch<RecurringTrip>(`/recurring-trips/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteRecurringTrip(token: string, id: string): Promise<void> {
  await corpFetch(`/recurring-trips/${id}`, token, { method: "DELETE" });
}

// ── Favoritos corporativos (backend — sincroniza entre dispositivos) ─────────
export async function fetchFavorites(token: string): Promise<any[]> {
  return corpFetch<any[]>("/corporate/favorites", token);
}

export async function addFavoriteApi(
  token: string,
  fav: { name: string; serviceType?: string; origin?: string; destination?: string },
): Promise<any> {
  return corpFetch("/corporate/favorites", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fav),
  });
}

export async function removeFavoriteApi(token: string, id: string): Promise<void> {
  await corpFetch(`/corporate/favorites/${id}`, token, { method: "DELETE" });
}

export async function pauseRecurringTrip(
  token: string,
  id: string,
): Promise<RecurringTrip> {
  return corpFetch<RecurringTrip>(`/recurring-trips/${id}/pause`, token, {
    method: "POST",
  });
}

export async function resumeRecurringTrip(
  token: string,
  id: string,
): Promise<RecurringTrip> {
  return corpFetch<RecurringTrip>(`/recurring-trips/${id}/resume`, token, {
    method: "POST",
  });
}

// TODO: Validar y tipificar todas las responses (Fase 2)
// TODO: Agregar retry logic y circuit breaker (Fase 2)
// TODO: Implementar cache y revalidation (Fase 2)
