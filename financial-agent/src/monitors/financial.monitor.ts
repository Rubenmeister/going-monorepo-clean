import { FinancialAlert, DAILY_REVENUE_TARGET } from '../types/financial.types';
import { generateDailyReport, generateWeeklyReport } from '../reports/revenue.report';
import { generateDailyPayouts, getPendingPayoutsSummary } from '../reports/payouts.report';
import { getPaymentErrorStats, getChargebacks, saveFinancialAlert } from '../firestore/financial.service';
import { reconcileDay } from '../reconciliation/bank.reconciliation';
import { retryFailedInvoices, checkPendingAuthorization } from '../datil/invoice.retry';
import { generateMonthlyIVAReport, generateATS } from '../sri/sri.report';
import { detectDriverAnomalies, projectMonthlyRevenue, compareWeeklyPerformance } from '../analysis/ai.analysis';
import { getUpcomingDeadlines, formatDeadlinesForTelegram, hasUrgentDeadlines } from '../sri/sri.deadlines';

// ============================================================
// Financial Monitor – Alertas por Telegram
// ============================================================

const TELEGRAM_API = 'https://api.telegram.org';

async function sendTelegram(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === 'placeholder') {
    console.log(`[telegram-fin] ${text.slice(0, 120)}...`);
    return;
  }

  await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}
function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// ─── 1. Verificar pagos fallidos ─────────────────────────────
export async function checkPaymentErrors(): Promise<void> {
  const now  = new Date();
  const from = new Date(now.getTime() - 30 * 60 * 1000); // Últimos 30 min

  const stats = await getPaymentErrorStats(from, now);

  if (stats.failed === 0) return;

  if (stats.failureRate > 20) {
    const topErrors = Object.entries(stats.byErrorCode)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code, count]) => `• ${code}: ${count} veces`)
      .join('\n');

    const msg = [
      `🚨 <b>ALERTA: Tasa alta de pagos fallidos</b>`,
      `Últimos 30 min: <b>${stats.failed}/${stats.total} pagos fallidos (${pct(stats.failureRate)})</b>`,
      ``,
      `<b>Errores más frecuentes:</b>`,
      topErrors,
      ``,
      `Verificar estado de Datafast y notificar al equipo técnico.`,
    ].join('\n');

    await sendTelegram(msg);
    await logAlert({ type: 'payment_failed', severity: 'critical', message: msg, data: { failureRate: stats.failureRate, count: stats.failed }, createdAt: new Date() });
  } else if (stats.failed >= 3) {
    await sendTelegram(`⚠️ <b>${stats.failed} pagos fallidos</b> en los últimos 30 minutos. Tasa: ${pct(stats.failureRate)}`);
  }
}

// ─── 2. Verificar contracargos ────────────────────────────────
export async function checkChargebacks(): Promise<void> {
  const now  = new Date();
  const from = new Date(now.getTime() - 24 * 3600 * 1000);

  const chargebacks = await getChargebacks(from, now);
  if (chargebacks.length === 0) return;

  const total = chargebacks.reduce((s, c) => s + c.amount, 0);

  const msg = [
    `🔴 <b>CONTRACARGO DETECTADO</b>`,
    `<b>${chargebacks.length} contracargo(s)</b> en las últimas 24h`,
    `Monto total: <b>${fmt(total)}</b>`,
    ``,
    `Acción requerida: revisar en panel Datafast y gestionar disputa.`,
  ].join('\n');

  await sendTelegram(msg);
  await logAlert({ type: 'chargeback', severity: 'critical', message: msg, data: { count: chargebacks.length, amount: total }, createdAt: new Date() });
}

// ─── 3. Reporte diario de ingresos ───────────────────────────
export async function sendDailyFinancialReport(): Promise<void> {
  console.log('[financial-monitor] Generating daily report...');

  const report = await generateDailyReport();

  const driverLines = report.driverBreakdown
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(d => `  ${d.metDailyTarget ? '✅' : '⚠️'} ${d.driverName}: ${fmt(d.revenue)} (${d.rides} viajes)`)
    .join('\n');

  const paymentBreakdown = [
    report.cardPayments > 0     ? `💳 Tarjeta: ${fmt(report.cardPayments)}` : '',
    report.cashPayments > 0     ? `💵 Efectivo: ${fmt(report.cashPayments)}` : '',
    report.transferPayments > 0 ? `🏦 Transfer: ${fmt(report.transferPayments)}` : '',
  ].filter(Boolean).join(' | ');

  const msg = [
    `📊 <b>Reporte Financiero Diario — Going</b>`,
    `${new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    ``,
    `💰 <b>Ingresos totales: ${fmt(report.totalRevenue)}</b>`,
    `  ├ Going (20%): ${fmt(report.goingRevenue)}`,
    `  ├ Conductores (80%): ${fmt(report.driverRevenue)}`,
    `  └ IVA cobrado: ${fmt(report.ivaCollected)}`,
    ``,
    `🚗 <b>Viajes:</b> ${report.totalRides} completados`,
    report.failedPaymentsCount > 0 ? `❌ Pagos fallidos: ${report.failedPaymentsCount} (${fmt(report.failedPayments)})` : `✅ Sin pagos fallidos`,
    ``,
    `${paymentBreakdown}`,
    ``,
    `<b>Top conductores:</b>`,
    driverLines || '  Sin viajes hoy',
    ``,
    `🎯 Meta $${DAILY_REVENUE_TARGET}/día: ${report.driversMetTarget} alcanzaron | ${report.driversBelowTarget} pendientes`,
  ].filter(l => l !== '').join('\n');

  await sendTelegram(msg);
  console.log('[financial-monitor] Daily report sent ✅');
}

// ─── 4. Reporte semanal ───────────────────────────────────────
export async function sendWeeklyFinancialReport(): Promise<void> {
  console.log('[financial-monitor] Generating weekly report...');

  const report = await generateWeeklyReport();
  const { count: pendingCount, totalAmount: pendingAmount } = await getPendingPayoutsSummary();

  const msg = [
    `📈 <b>Reporte Financiero Semanal — Going</b>`,
    `Semana ${report.from.toLocaleDateString('es-EC')} — ${report.to.toLocaleDateString('es-EC')}`,
    ``,
    `💰 <b>Ingresos semana: ${fmt(report.totalRevenue)}</b>`,
    `  ├ Going: ${fmt(report.goingRevenue)}`,
    `  └ Conductores: ${fmt(report.driverRevenue)}`,
    ``,
    `🚗 <b>Viajes completados:</b> ${report.totalRides}`,
    `📋 <b>Promedio por conductor:</b> ${fmt(report.avgRevenuePerDriver)}/semana`,
    ``,
    `💸 <b>Liquidaciones pendientes:</b> ${pendingCount} conductores — ${fmt(pendingAmount)} por pagar`,
    ``,
    `🎯 Conductores en meta: ${report.driversMetTarget} | Bajo meta: ${report.driversBelowTarget}`,
  ].join('\n');

  await sendTelegram(msg);
  console.log('[financial-monitor] Weekly report sent ✅');
}

// ─── 5. Alertas de liquidaciones pendientes ───────────────────
export async function checkPendingPayouts(): Promise<void> {
  const { count, totalAmount, payouts } = await getPendingPayoutsSummary();

  if (count === 0) return;

  // Alerta si hay liquidaciones con más de 24h pendientes
  const old = payouts.filter(p => {
    const age = Date.now() - new Date(p.createdAt).getTime();
    return age > 24 * 3600 * 1000;
  });

  if (old.length > 0) {
    const msg = [
      `⏰ <b>Liquidaciones con más de 24h pendientes</b>`,
      `${old.length} conductor(es) esperando pago — Total: ${fmt(old.reduce((s, p) => s + p.driverEarningsNet, 0))}`,
      ``,
      `Revisar en panel de operaciones y procesar transferencias.`,
    ].join('\n');

    await sendTelegram(msg);
    await logAlert({ type: 'pending_payouts', severity: 'warning', message: msg, data: { count: old.length, amount: totalAmount }, createdAt: new Date() });
  }
}

// ─── 6. Generar liquidaciones diarias ─────────────────────────
export async function processDailyPayouts(): Promise<void> {
  console.log('[financial-monitor] Processing daily payouts...');

  const payouts = await generateDailyPayouts();
  if (payouts.length === 0) {
    console.log('[financial-monitor] No payouts to process today');
    return;
  }

  const total = payouts.reduce((s, p) => s + p.driverEarningsNet, 0);

  const msg = [
    `💸 <b>Liquidaciones diarias generadas</b>`,
    `<b>${payouts.length} conductores</b> | Total a pagar: <b>${fmt(total)}</b>`,
    ``,
    ...payouts.map(p => `  • ${p.driverName}: ${fmt(p.driverEarningsNet)} (${p.totalRides} viajes)`),
    ``,
    `Estado: <b>Pendiente de transferencia</b>`,
  ].join('\n');

  await sendTelegram(msg);
  console.log(`[financial-monitor] ${payouts.length} payouts created, total: $${total.toFixed(2)}`);
}

// ─── 7. Conciliación bancaria ─────────────────────────────────
export async function runBankReconciliation(): Promise<void> {
  const result = await reconcileDay();

  if (!result.isBalanced) {
    const issueLines = [
      ...result.paymentsWithoutRide.map(i => `• ${i.description}`),
      ...result.ridesWithoutPayment.map(i => `• ${i.description}`),
      ...result.amountMismatches.map(i => `• ${i.description}`),
      ...result.duplicatePayments.map(i => `• ${i.description}`),
    ].slice(0, 8);

    const msg = [
      `🏦 <b>Alerta de Conciliación Bancaria</b>`,
      `Fecha: ${result.date.toLocaleDateString('es-EC')}`,
      ``,
      `❌ <b>${result.issueCount} diferencia(s) encontrada(s)</b>`,
      `Variación: ${result.variance >= 0 ? '+' : ''}$${result.variance.toFixed(2)}`,
      ``,
      ...issueLines,
      ``,
      `Revisar panel de pagos Datafast y Firestore.`,
    ].join('\n');

    await sendTelegram(msg);
    await logAlert({ type: 'revenue_anomaly', severity: 'critical', message: msg, data: { issues: result.issueCount, variance: result.variance }, createdAt: new Date() });
  } else {
    console.log(`[financial-monitor] ✅ Reconciliation balanced: $${result.totalAmount}`);
  }
}

// ─── 8. Alertas SRI / vencimientos tributarios ────────────────
export async function checkSRIDeadlines(): Promise<void> {
  if (!hasUrgentDeadlines()) return;

  const deadlines = getUpcomingDeadlines();
  const msg = formatDeadlinesForTelegram(deadlines);
  await sendTelegram(msg);
  console.log('[financial-monitor] SRI deadline alert sent');
}

// ─── 9. Análisis IA: anomalías + proyección ───────────────────
export async function sendAIFinancialInsights(): Promise<void> {
  console.log('[financial-monitor] Running AI financial analysis...');

  try {
    // Detección de fraude
    const { suspicious, aiSummary } = await detectDriverAnomalies();
    if (suspicious.length > 0) {
      const highRisk = suspicious.filter(s => s.riskLevel === 'high');
      const emoji    = highRisk.length > 0 ? '🚨' : '⚠️';
      const msg = [
        `${emoji} <b>Análisis de Anomalías — Conductores</b>`,
        `${suspicious.length} conductor(es) con patrones inusuales:`,
        ...suspicious.map(s => `• [${s.riskLevel.toUpperCase()}] Conductor ${s.driverId.slice(-6)}: ${s.reason}`),
        ``,
        `💡 ${aiSummary}`,
      ].join('\n');
      await sendTelegram(msg);
    }

    // Proyección mensual
    const projection = await projectMonthlyRevenue();
    const trendEmoji = projection.onTrack ? '📈' : '📉';
    const projMsg = [
      `${trendEmoji} <b>Proyección de Ingresos — Mes en Curso</b>`,
      `Día ${projection.daysElapsed} de mes | ${projection.daysRemaining} días restantes`,
      ``,
      `💰 Acumulado: <b>$${projection.currentRevenue.toFixed(2)}</b>`,
      `📊 Proyección cierre: <b>$${projection.projectedRevenue.toFixed(2)}</b>`,
      `📅 Promedio diario: $${projection.dailyAverage.toFixed(2)}`,
      ``,
      `💡 ${projection.aiInsight}`,
    ].join('\n');
    await sendTelegram(projMsg);

  } catch (e) {
    console.error('[financial-monitor] AI analysis failed:', (e as Error).message);
  }
}

// ─── 10. Reporte SRI mensual ──────────────────────────────────
export async function runMonthlySRIReport(): Promise<void> {
  const now   = new Date();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();  // mes anterior
  const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  console.log(`[financial-monitor] Generating SRI report for ${month}/${year}`);

  const report = await generateMonthlyIVAReport(year, month);

  const msg = [
    `🧾 <b>Reporte Mensual SRI — ${report.monthName} ${report.year}</b>`,
    ``,
    `💰 Ventas totales: <b>$${report.totalSalesWithIVA.toFixed(2)}</b>`,
    `   └ Base imponible: $${report.totalSalesSubtotal.toFixed(2)}`,
    `   └ IVA 15% cobrado: $${report.ivaCollected.toFixed(2)}`,
    ``,
    `📄 Facturas emitidas: ${report.totalInvoices} | Anuladas: ${report.cancelledInvoices}`,
    ``,
    `🏛️ <b>IVA a pagar SRI: $${report.ivaPayable.toFixed(2)}</b>`,
    `   Crédito tributario: $${report.ivaOnPurchases.toFixed(2)}`,
    ``,
    `📅 Vencimiento declaración: <b>${report.deadlineDate.toLocaleDateString('es-EC')}</b>`,
    report.daysUntilDeadline <= 5
      ? `🚨 <b>FALTAN SOLO ${report.daysUntilDeadline} DÍAS</b>`
      : `✅ ${report.daysUntilDeadline} días para el vencimiento`,
  ].join('\n');

  await sendTelegram(msg);

  // Generar ATS
  try {
    const atsPath = await generateATS(year, month);
    console.log(`[financial-monitor] ATS generated: ${atsPath}`);
    await sendTelegram(`📁 <b>Archivo ATS generado</b>\nPeriodo: ${report.monthName} ${report.year}\nListo para subir al portal del SRI.`);
  } catch (e) {
    console.error('[financial-monitor] ATS generation failed:', e);
  }
}

// ─── Runner principal ─────────────────────────────────────────
export async function runFinancialMonitor(): Promise<void> {
  const now       = new Date();
  const hour      = now.getHours();
  const dayOfWeek = now.getDay();   // 0=dom, 1=lun
  const dayOfMonth = now.getDate();

  console.log(`[financial-monitor] Running at hour ${hour}, day ${dayOfWeek}`);

  // ── Cada corrida (cada 30 min) ────────────────────────────
  await checkPaymentErrors();
  await checkChargebacks();
  await checkPendingPayouts();
  await retryFailedInvoices();        // Reintentar facturas fallidas
  await checkPendingAuthorization();  // Verificar autorización SRI
  await checkSRIDeadlines();          // Alertar si vence declaración

  // ── 8am diario: conciliación del día anterior ─────────────
  if (hour === 8) {
    const yesterday = new Date(now.getTime() - 86400000);
    await reconcileDay(yesterday);
  }

  // ── 12pm: análisis IA (anomalías + proyección) ────────────
  if (hour === 12) {
    await sendAIFinancialInsights();
  }

  // ── 8pm diario: reporte + liquidaciones ───────────────────
  if (hour === 20) {
    await sendDailyFinancialReport();
    await processDailyPayouts();
    await runBankReconciliation();
  }

  // ── Lunes 9am: reporte semanal + análisis comparativo ─────
  if (dayOfWeek === 1 && hour === 9) {
    await sendWeeklyFinancialReport();
    try {
      const comparison = await compareWeeklyPerformance();
      await sendTelegram([
        `📊 <b>Análisis Comparativo Semanal</b>`,
        `Ingresos: ${comparison.revenueChange >= 0 ? '▲' : '▼'} ${Math.abs(comparison.revenueChange).toFixed(1)}% vs semana anterior`,
        `Viajes: ${comparison.ridesChange >= 0 ? '▲' : '▼'} ${Math.abs(comparison.ridesChange).toFixed(1)}%`,
        ``,
        `💡 ${comparison.aiAnalysis}`,
      ].join('\n'));
    } catch (e) { console.error('[financial-monitor] Weekly comparison failed:', e); }
  }

  // ── Día 1 del mes 9am: reporte SRI del mes anterior ───────
  if (dayOfMonth === 1 && hour === 9) {
    await runMonthlySRIReport();
  }

  console.log('[financial-monitor] Done ✅');
}

// ─── Helper ───────────────────────────────────────────────────
async function logAlert(alert: FinancialAlert): Promise<void> {
  try {
    await saveFinancialAlert(alert);
  } catch (e) {
    console.error('[financial-monitor] Failed to save alert:', e);
  }
}
