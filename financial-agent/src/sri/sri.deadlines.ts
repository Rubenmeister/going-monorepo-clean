// ============================================================
// SRI Deadline Alerts – Alertas de vencimiento de declaraciones
// Ecuador – Calendario tributario del SRI
//
// Formulario 104  – IVA mensual          → día 20 del mes siguiente
// Formulario 103  – Retenciones fuente   → día 20 del mes siguiente
// Formulario 101  – Impuesto a la Renta  → Abril del año siguiente
// Anexo ATS       – Transaccional SRI    → 2do mes siguiente al periodo
// Declaración ISD – Impuesto salida divisas → cuando aplique
// ============================================================

interface TaxDeadline {
  name: string;
  form: string;
  dueDate: Date;
  daysUntilDue: number;
  urgency: 'ok' | 'soon' | 'urgent' | 'overdue';
  description: string;
}

// ─── Calcular próximas fechas límite ─────────────────────────
export function getUpcomingDeadlines(): TaxDeadline[] {
  const now        = new Date();
  const thisMonth  = now.getMonth();      // 0-indexed
  const thisYear   = now.getFullYear();
  const today      = now.getDate();

  const deadlines: TaxDeadline[] = [];

  // ── Formulario 104 y 103 (mensuales) ─────────────────────
  // Si estamos en el mismo mes en que vence la declaración del mes anterior
  const ivaMonth    = thisMonth === 0 ? 11 : thisMonth - 1;
  const ivaYear     = thisMonth === 0 ? thisYear - 1 : thisYear;
  const ivaMonthStr = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                       'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][ivaMonth];

  // Declaración del mes pasado vence el 20 del mes actual
  const ivaDue = new Date(thisYear, thisMonth, 20, 23, 59, 59);

  deadlines.push(buildDeadline(
    `IVA ${ivaMonthStr} ${ivaYear}`,
    'Formulario 104',
    ivaDue,
    `Declaración mensual de IVA período ${ivaMonthStr} ${ivaYear}`,
  ));

  deadlines.push(buildDeadline(
    `Retenciones ${ivaMonthStr} ${ivaYear}`,
    'Formulario 103',
    ivaDue,
    `Declaración de retenciones en la fuente período ${ivaMonthStr} ${ivaYear}`,
  ));

  // ── Próximo mes (para planificación) ─────────────────────
  const nextMonth     = (thisMonth + 1) % 12;
  const nextYear      = thisMonth === 11 ? thisYear + 1 : thisYear;
  const nextMonthStr  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                         'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][thisMonth];
  const nextIvaDue    = new Date(nextYear, nextMonth, 20, 23, 59, 59);

  deadlines.push(buildDeadline(
    `IVA ${nextMonthStr} ${thisYear} (próximo)`,
    'Formulario 104',
    nextIvaDue,
    `Preparar datos del mes en curso para declaración`,
  ));

  // ── ATS – Anexo Transaccional ─────────────────────────────
  // Vence el último día del 2do mes siguiente al periodo
  const atsMonth    = (thisMonth + 2) % 12;
  const atsYear     = thisMonth >= 10 ? thisYear + 1 : thisYear;
  const atsLastDay  = new Date(atsYear, atsMonth + 1, 0);

  deadlines.push(buildDeadline(
    `ATS ${ivaMonthStr} ${ivaYear}`,
    'Anexo Transaccional',
    atsLastDay,
    `Subir archivo ATS al portal del SRI para el período ${ivaMonthStr} ${ivaYear}`,
  ));

  // ── Impuesto a la Renta (anual) ────────────────────────────
  const irDue = new Date(thisYear + 1, 3, 28); // Abril del siguiente año (aprox)
  if (irDue.getFullYear() > thisYear || (irDue.getFullYear() === thisYear && irDue.getMonth() >= thisMonth)) {
    deadlines.push(buildDeadline(
      `Impuesto a la Renta ${thisYear}`,
      'Formulario 101',
      irDue,
      'Declaración anual de Impuesto a la Renta — preparar estados financieros',
    ));
  }

  // Ordenar por urgencia
  return deadlines.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

function buildDeadline(name: string, form: string, dueDate: Date, description: string): TaxDeadline {
  const days = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
  let urgency: TaxDeadline['urgency'] = 'ok';

  if (days < 0)       urgency = 'overdue';
  else if (days <= 3) urgency = 'urgent';
  else if (days <= 10) urgency = 'soon';

  return { name, form, dueDate, daysUntilDue: days, urgency, description };
}

// ─── Formatear alerta para Telegram ──────────────────────────
export function formatDeadlinesForTelegram(deadlines: TaxDeadline[]): string {
  const urgent  = deadlines.filter(d => d.urgency === 'urgent' || d.urgency === 'overdue');
  const soon    = deadlines.filter(d => d.urgency === 'soon');
  const ok      = deadlines.filter(d => d.urgency === 'ok');

  const lines: string[] = ['📅 <b>Calendario Tributario Going — SRI Ecuador</b>', ''];

  if (urgent.length > 0) {
    lines.push('🔴 <b>URGENTE (≤3 días):</b>');
    urgent.forEach(d => {
      const emoji = d.urgency === 'overdue' ? '⛔' : '🚨';
      lines.push(`${emoji} <b>${d.name}</b> (${d.form})`);
      lines.push(`   Vence: ${d.dueDate.toLocaleDateString('es-EC')} | ${Math.abs(d.daysUntilDue)} días ${d.urgency === 'overdue' ? 'VENCIDO' : 'restantes'}`);
    });
    lines.push('');
  }

  if (soon.length > 0) {
    lines.push('🟡 <b>PRÓXIMOS (≤10 días):</b>');
    soon.forEach(d => {
      lines.push(`⚠️ <b>${d.name}</b> (${d.form}) — ${d.daysUntilDue} días`);
    });
    lines.push('');
  }

  if (ok.length > 0) {
    lines.push('🟢 <b>En plazo:</b>');
    ok.forEach(d => {
      lines.push(`✅ ${d.name} — ${d.daysUntilDue} días`);
    });
  }

  return lines.join('\n');
}

// ─── Revisar si hay vencimientos críticos ────────────────────
export function hasUrgentDeadlines(): boolean {
  const deadlines = getUpcomingDeadlines();
  return deadlines.some(d => d.urgency === 'urgent' || d.urgency === 'overdue');
}
