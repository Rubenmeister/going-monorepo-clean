/**
 * Going – Generador de reporte de ganancias en PDF
 * Usa expo-print (HTML → PDF nativo iOS/Android) + expo-sharing
 *
 * Instalación:
 *   npx expo install expo-print expo-sharing
 */

type DayData = {
  label: string;    // ej. "Lun"
  date: string;     // ej. "10 Mar"
  earnings: number;
  trips: number;
};

type ReportParams = {
  driverName: string;
  vehicleType: string;
  period: string;           // ej. "10 Mar – 16 Mar 2026"
  totalEarnings: number;
  totalTrips: number;
  avgRating: number;
  days: DayData[];
};

const GOING_RED  = '#ff4c41';
const GOING_BLUE = '#0033A0';

function buildHtml(p: ReportParams): string {
  const maxEarning = Math.max(...p.days.map(d => d.earnings), 1);

  const rows = p.days.map(d => {
    const pct = Math.round((d.earnings / maxEarning) * 100);
    return `
      <tr>
        <td>${d.label} ${d.date}</td>
        <td>${d.trips} viajes</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;background:#e5e7eb;border-radius:4px;height:8px;">
              <div style="width:${pct}%;background:${GOING_BLUE};border-radius:4px;height:8px;"></div>
            </div>
            <span style="min-width:56px;text-align:right;font-weight:700;">$${d.earnings.toFixed(2)}</span>
          </div>
        </td>
      </tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; background: #fff; padding: 32px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .logo { font-size: 28px; font-weight: 900; color: ${GOING_RED}; letter-spacing: -1px; }
    .logo span { color: ${GOING_BLUE}; }
    .meta { text-align: right; font-size: 12px; color: #6b7280; }
    .meta .period { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 2px; }

    /* Hero stats */
    .hero { background: ${GOING_BLUE}; border-radius: 16px; padding: 24px; color: #fff; margin-bottom: 24px;
            display: flex; justify-content: space-between; align-items: center; }
    .hero-main { }
    .hero-label { font-size: 12px; opacity: 0.75; text-transform: uppercase; letter-spacing: 1px; }
    .hero-value { font-size: 42px; font-weight: 900; line-height: 1.1; }
    .hero-sub { font-size: 13px; opacity: 0.8; margin-top: 4px; }
    .hero-stats { display: flex; gap: 24px; }
    .hero-stat { text-align: center; }
    .hero-stat-val { font-size: 22px; font-weight: 900; }
    .hero-stat-lbl { font-size: 11px; opacity: 0.75; }

    /* Driver info */
    .driver-card { background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;
                   display: flex; justify-content: space-between; }
    .driver-card .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
    .driver-card .value { font-size: 15px; font-weight: 700; color: #111; margin-top: 2px; }

    /* Table */
    h2 { font-size: 16px; font-weight: 800; color: #111; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;
         padding: 8px 12px; border-bottom: 2px solid #e5e7eb; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }

    /* Footer */
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;
              display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    .footer strong { color: ${GOING_RED}; font-weight: 900; }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo">going<span>.</span></div>
    <div class="meta">
      <div class="period">${p.period}</div>
      <div>Reporte de Ganancias</div>
      <div>Generado el ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  <div class="hero">
    <div class="hero-main">
      <div class="hero-label">Total ganado</div>
      <div class="hero-value">$${p.totalEarnings.toFixed(2)}</div>
      <div class="hero-sub">USD · ${p.period}</div>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <div class="hero-stat-val">${p.totalTrips}</div>
        <div class="hero-stat-lbl">Viajes</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-val">${p.avgRating.toFixed(1)}★</div>
        <div class="hero-stat-lbl">Rating</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-val">$${p.totalTrips > 0 ? (p.totalEarnings / p.totalTrips).toFixed(2) : '0.00'}</div>
        <div class="hero-stat-lbl">Por viaje</div>
      </div>
    </div>
  </div>

  <div class="driver-card">
    <div>
      <div class="label">Conductor</div>
      <div class="value">${p.driverName}</div>
    </div>
    <div>
      <div class="label">Tipo de vehículo</div>
      <div class="value">${p.vehicleType}</div>
    </div>
    <div>
      <div class="label">Plataforma</div>
      <div class="value">Going Ecuador</div>
    </div>
  </div>

  <h2>Detalle por día</h2>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Actividad</th>
        <th>Ganancias</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    <div>© 2026 <strong>Going</strong> · goingapp.ec</div>
    <div>Este documento es un resumen informativo de actividad en plataforma.</div>
  </div>

</body>
</html>`;
}

export async function exportEarningsPDF(params: ReportParams): Promise<void> {
  // Dynamic require — silent no-op si expo-print o expo-sharing no están instalados
  let Print: typeof import('expo-print') | null = null;
  let Sharing: typeof import('expo-sharing') | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Print = require('expo-print');
  } catch {
    console.warn('[earningsReport] expo-print no instalado');
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Sharing = require('expo-sharing');
  } catch {
    console.warn('[earningsReport] expo-sharing no instalado');
  }

  const html = buildHtml(params);
  const { uri } = await Print!.printToFileAsync({ html, base64: false });

  if (Sharing) {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Reporte Going ${params.period}`,
        UTI: 'com.adobe.pdf',
      });
      return;
    }
  }

  // Fallback: imprimir directo
  await Print!.printAsync({ uri });
}
