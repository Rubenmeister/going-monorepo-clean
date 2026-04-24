/**
 * alerts.ts — Lógica centralizada de generación de alertas para el Admin Dashboard
 * Agrega datos de múltiples endpoints y retorna una lista unificada de alertas.
 */

const API = 'https://api-gateway-780842550857.us-central1.run.app';

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory  = 'documentos' | 'pagos' | 'calidad' | 'corporativo' | 'usuarios' | 'vehiculos';

export interface Alert {
  id:          string;
  severity:    AlertSeverity;
  category:    AlertCategory;
  title:       string;
  description: string;
  link:        string;
  entityId?:   string;
  detectedAt:  string;   // ISO string
}

function daysDiff(dateStr?: string): number {
  if (!dateStr) return -9999;
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export async function fetchAlerts(token: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  const [vehicles, companies, payments, invoices, ratings, pendingUsers] = await Promise.all([
    safeGet<any[]>(token, '/vehicles?limit=200'),
    safeGet<any>(token,   '/corporate/companies?limit=200'),
    safeGet<any>(token,   '/payments?status=failed&limit=100'),
    safeGet<any>(token,   '/invoices?limit=200'),
    safeGet<any>(token,   '/ratings?limit=200'),
    safeGet<any>(token,   '/auth/admin/users?status=pending_verification&limit=100'),
  ]);

  const now = new Date().toISOString();

  /* ── Vehículos: documentos ── */
  const vehicleList: any[] = Array.isArray(vehicles) ? vehicles : vehicles ?? [];
  vehicleList.forEach((v: any) => {
    const name = v.plate ?? v.id;
    const driver = v.driverName ?? 'conductor';

    const soatDiff = daysDiff(v.soatExpiry);
    if (soatDiff < 0) {
      alerts.push({ id:`soat-exp-${v.id}`, severity:'critical', category:'documentos',
        title:`SOAT vencido — ${name}`, description:`Vehículo de ${driver}. Venció hace ${Math.abs(soatDiff)} días.`,
        link:'/vehicles', entityId:v.id, detectedAt:now });
    } else if (soatDiff < 30) {
      alerts.push({ id:`soat-soon-${v.id}`, severity:'warning', category:'documentos',
        title:`SOAT por vencer — ${name}`, description:`Vence en ${soatDiff} días. Conductor: ${driver}.`,
        link:'/vehicles', entityId:v.id, detectedAt:now });
    }

    const matDiff = daysDiff(v.matriculaExpiry);
    if (matDiff < 0) {
      alerts.push({ id:`mat-exp-${v.id}`, severity:'critical', category:'documentos',
        title:`Matrícula vencida — ${name}`, description:`Vehículo de ${driver}. Venció hace ${Math.abs(matDiff)} días.`,
        link:'/vehicles', entityId:v.id, detectedAt:now });
    } else if (matDiff < 30) {
      alerts.push({ id:`mat-soon-${v.id}`, severity:'warning', category:'documentos',
        title:`Matrícula por vencer — ${name}`, description:`Vence en ${matDiff} días. Conductor: ${driver}.`,
        link:'/vehicles', entityId:v.id, detectedAt:now });
    }

    if (!v.approved) {
      alerts.push({ id:`veh-pending-${v.id}`, severity:'info', category:'vehiculos',
        title:`Vehículo pendiente de aprobación`, description:`${name} — ${driver}. Requiere revisión documental.`,
        link:'/vehicles', entityId:v.id, detectedAt:now });
    }
  });

  /* ── Empresas: solicitudes corporativas ── */
  const companyList: any[] = Array.isArray(companies) ? companies
    : companies?.companies ?? companies?.data ?? [];
  const prospects = companyList.filter((c: any) => c.status === 'prospect');
  if (prospects.length > 0) {
    const old = prospects.filter((c: any) =>
      Math.abs(daysDiff(c.createdAt)) > 2
    );
    if (old.length > 0) {
      alerts.push({ id:'corp-old-prospects', severity:'critical', category:'corporativo',
        title:`${old.length} solicitud${old.length>1?'es':''} corporativa${old.length>1?'s':''} sin atender`,
        description:`Llevan más de 2 días sin revisión. Empresas: ${old.map((c:any)=>c.name??c.companyName??'—').slice(0,3).join(', ')}${old.length>3?'…':''}`,
        link:'/companies?tab=prospect', detectedAt:now });
    } else {
      alerts.push({ id:'corp-new-prospects', severity:'info', category:'corporativo',
        title:`${prospects.length} solicitud${prospects.length>1?'es':''} corporativa${prospects.length>1?'s':''} nuevas`,
        description:`Recibidas en las últimas 48 horas. Haz click para revisar.`,
        link:'/companies?tab=prospect', detectedAt:now });
    }
  }

  /* ── Pagos fallidos ── */
  const failedList: any[] = Array.isArray(payments) ? payments
    : payments?.data ?? payments?.items ?? [];
  if (failedList.length > 0) {
    const totalFailed = failedList.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
    alerts.push({ id:'payments-failed', severity:'warning', category:'pagos',
      title:`${failedList.length} pago${failedList.length>1?'s':''} fallido${failedList.length>1?'s':''}`,
      description:`Monto total no cobrado: PEN ${totalFailed.toLocaleString('es-PE', {minimumFractionDigits:2})}. Requieren seguimiento.`,
      link:'/payments', detectedAt:now });
  }

  /* ── Facturas vencidas ── */
  const invoiceList: any[] = Array.isArray(invoices) ? invoices
    : invoices?.data ?? invoices?.invoices ?? invoices?.items ?? [];
  const overdue = invoiceList.filter((i: any) => i.status === 'overdue');
  if (overdue.length > 0) {
    const totalOverdue = overdue.reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
    alerts.push({ id:'invoices-overdue', severity:'critical', category:'pagos',
      title:`${overdue.length} factura${overdue.length>1?'s':''} vencida${overdue.length>1?'s':''}`,
      description:`Total vencido: PEN ${totalOverdue.toLocaleString('es-PE', {minimumFractionDigits:2})}. Gestiona cobro inmediato.`,
      link:'/ingresos', detectedAt:now });
  }

  /* ── Calidad: conductores con rating bajo ── */
  const ratingList: any[] = Array.isArray(ratings) ? ratings
    : ratings?.data ?? ratings?.items ?? [];
  const driverMap = new Map<string, { name: string; scores: number[] }>();
  ratingList.forEach((r: any) => {
    if (!r.driverId) return;
    const e = driverMap.get(r.driverId) ?? { name: r.driverName ?? r.driverId, scores: [] as number[] };
    e.scores.push(r.score);
    driverMap.set(r.driverId, e);
  });
  driverMap.forEach((d, id) => {
    if (d.scores.length < 3) return;
    const avg = d.scores.reduce((s, v) => s + v, 0) / d.scores.length;
    if (avg < 3.5) {
      alerts.push({ id:`rating-low-${id}`, severity:'critical', category:'calidad',
        title:`Rating crítico — ${d.name}`, description:`Promedio: ${avg.toFixed(2)}★ sobre ${d.scores.length} valoraciones. Requiere atención inmediata.`,
        link:'/ratings', entityId:id, detectedAt:now });
    } else if (avg < 4.0) {
      alerts.push({ id:`rating-warn-${id}`, severity:'warning', category:'calidad',
        title:`Rating bajo — ${d.name}`, description:`Promedio: ${avg.toFixed(2)}★ sobre ${d.scores.length} valoraciones.`,
        link:'/ratings', entityId:id, detectedAt:now });
    }
  });

  /* ── Usuarios pendientes de verificación ── */
  const pendingList: any[] = Array.isArray(pendingUsers) ? pendingUsers
    : pendingUsers?.users ?? pendingUsers?.data ?? [];
  if (pendingList.length > 0) {
    alerts.push({ id:'users-pending', severity:'info', category:'usuarios',
      title:`${pendingList.length} usuario${pendingList.length>1?'s':''} pendiente${pendingList.length>1?'s':''} de verificación`,
      description:`Esperando activación de cuenta. Revisa si requieren acción manual.`,
      link:'/clients', detectedAt:now });
    }

  /* Sort: critical first, then warning, then info */
  const ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
