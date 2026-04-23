/**
 * Helper de API para llamadas al backend corporativo
 * Adaptado de apps/corporate-portal/lib/api.ts
 */

import { API_BASE_URL } from "./constants";

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch tipado con autenticación
 */
export async function corpFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(token),
      ...(options?.headers ?? {}),
    },
  });

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
 * Obtiene los KPIs del dashboard en paralelo.
 * - GET /bookings/my       → viajes del mes + pendientes de aprobación
 * - GET /invoices/stats/summary → gasto y saldo
 */
export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  const [bookings, invoiceStats] = await Promise.allSettled([
    corpFetch<any[]>("/bookings/my", token),
    corpFetch<any>("/invoices/stats/summary", token),
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

  // Invoices
  let gastoAcumulado = 0;
  let saldoPendiente = 0;
  if (invoiceStats.status === "fulfilled" && invoiceStats.value) {
    gastoAcumulado = invoiceStats.value.totalAmount ?? 0;
    saldoPendiente = invoiceStats.value.dueAmount ?? 0;
  }

  return { viajesEsteMes, gastoAcumulado, aprobacionesPendientes, saldoPendiente };
}

// ── Solicitudes ─────────────────────────────────────────────────────────────

// Solicitudes
export async function crearSolicitudEmpresa(data: any): Promise<any> {
  const res = await fetch("/api/v1/empresas/solicitudes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
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
 * POST /bookings — requiere: userId, serviceId, serviceType, totalPrice, startDate, endDate?
 * Nota: serviceId es asignado por el sistema cuando no hay catálogo de servicios disponible.
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
  return corpFetch("/bookings", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Aprobaciones
// Las aprobaciones son bookings con status "pending".
// No hay servicio dedicado — se usan los endpoints del booking-service.
export async function fetchApprovals(
  token: string,
  _companyId?: string
): Promise<any[]> {
  const all = await corpFetch<any[]>("/bookings/my", token);
  return all.filter((b) => b.status === "pending");
}

export async function approveBooking(
  token: string,
  bookingId: string
): Promise<any> {
  return corpFetch(`/bookings/${bookingId}/confirm`, token, { method: "PATCH" });
}

export async function rejectBooking(
  token: string,
  bookingId: string
): Promise<any> {
  return corpFetch(`/bookings/${bookingId}/cancel`, token, { method: "PATCH" });
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
export async function updateCompanySettings(
  token: string,
  companyId: string,
  data: any
): Promise<any> {
  return corpFetch(
    `/api/v1/empresas/companies/${companyId}/settings`,
    token,
    {
      method: "PATCH",
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

// TODO: Implementar endpoints reales en backend (Fase 1)
// TODO: Validar y tipificar todas las responses (Fase 2)
// TODO: Agregar retry logic y circuit breaker (Fase 2)
// TODO: Implementar cache y revalidation (Fase 2)
