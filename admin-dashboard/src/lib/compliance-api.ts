/**
 * compliance-api.ts — cliente tipado para los endpoints del Driver
 * Compliance System (transport-service /compliance/* via api-gateway).
 *
 * Usa fetch nativo + localStorage('authToken') igual que el resto del
 * admin-dashboard. NO se mete con el provider useMonorepoApp() porque
 * ese sirve a varias apps y queremos mantener este cliente local al
 * dashboard.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

export type DriverComplianceStatus =
  | 'verified'
  | 'pending'
  | 'expired'
  | 'rejected'
  | 'tourism_pending';

export type DriverDocumentStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export type DriverDocumentType =
  | 'cedula' | 'licencia' | 'criminal_record'
  | 'matricula' | 'mechanical_inspection' | 'foto_vehiculo'
  | 'vehicle_insurance' | 'third_party_insurance'
  | 'ant_permit' | 'company_membership' | 'tourism_permit'
  | 'going_contract' | 'going_training'
  | 'soat'; // deprecated

export interface DriverComplianceListItem {
  driverId: string;
  status: DriverComplianceStatus;
  approved: DriverDocumentType[];
  missing: DriverDocumentType[];
  expired: DriverDocumentType[];
  rejected: DriverDocumentType[];
  expiringSoon: DriverDocumentType[];
}

export interface DriverDocumentDetail {
  id: string;
  type: DriverDocumentType;
  url: string;
  filename: string;
  status: DriverDocumentStatus;
  documentNumber?: string;
  issuingAuthority?: string;
  issuedAt?: string;
  expiresAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  uploadedAt: string;
}

export interface DriverComplianceDetail {
  driverId: string;
  compliance: {
    status: DriverComplianceStatus;
    approved: DriverDocumentType[];
    missing: DriverDocumentType[];
    expired: DriverDocumentType[];
    rejected: DriverDocumentType[];
    expiringSoon: DriverDocumentType[];
  };
  documents: DriverDocumentDetail[];
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
    } catch { message = text || message; }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const complianceApi = {
  /** GET /compliance/drivers?status=...&limit=... */
  listDrivers: (params?: { status?: DriverComplianceStatus; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return req<{ total: number; items: DriverComplianceListItem[] }>(
      'GET',
      `/compliance/drivers${suffix}`,
    );
  },

  /** GET /compliance/drivers/:id */
  getDriver: (driverId: string) =>
    req<DriverComplianceDetail>('GET', `/compliance/drivers/${driverId}`),

  /** PATCH /compliance/documents/:docId/approve */
  approveDoc: (docId: string, body: {
    documentNumber?: string;
    issuingAuthority?: string;
    issuedAt?: string;
    expiresAt?: string;
  }) =>
    req<{ id: string; status: 'approved'; reviewedBy: string; reviewedAt: Date }>(
      'PATCH',
      `/compliance/documents/${docId}/approve`,
      body,
    ),

  /** PATCH /compliance/documents/:docId/reject */
  rejectDoc: (docId: string, rejectionReason: string) =>
    req<{ id: string; status: 'rejected'; rejectionReason: string; reviewedBy: string }>(
      'PATCH',
      `/compliance/documents/${docId}/reject`,
      { rejectionReason },
    ),
};
