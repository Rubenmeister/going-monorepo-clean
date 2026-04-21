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
 * TODO: Crear implementación real en backend (Fase 1)
 * TODO: Migrar a Go en Mayo (Fase 2)
 */

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
  companyId: string
): Promise<any[]> {
  return corpFetch(
    `/api/v1/empresas/companies/${companyId}/bookings`,
    token
  );
}

export async function crearBooking(
  token: string,
  companyId: string,
  data: any
): Promise<any> {
  return corpFetch(
    `/api/v1/empresas/companies/${companyId}/bookings`,
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// Aprobaciones
export async function fetchApprovals(
  token: string,
  companyId: string
): Promise<any[]> {
  return corpFetch(
    `/api/v1/empresas/companies/${companyId}/approvals`,
    token
  );
}

export async function approveBooking(
  token: string,
  companyId: string,
  bookingId: string,
  approved: boolean,
  notes?: string
): Promise<any> {
  return corpFetch(
    `/api/v1/empresas/companies/${companyId}/approvals/${bookingId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ approved, notes }),
    }
  );
}

// Facturación
export async function fetchInvoices(
  token: string,
  companyId: string
): Promise<any[]> {
  return corpFetch(
    `/api/v1/empresas/companies/${companyId}/invoices`,
    token
  );
}

// Usuarios/Equipo
export async function fetchTeamMembers(
  token: string,
  companyId: string
): Promise<any[]> {
  return corpFetch(
    `/api/v1/empresas/companies/${companyId}/users`,
    token
  );
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

// TODO: Implementar endpoints reales en backend (Fase 1)
// TODO: Validar y tipificar todas las responses (Fase 2)
// TODO: Agregar retry logic y circuit breaker (Fase 2)
// TODO: Implementar cache y revalidation (Fase 2)
