import { FinancialAlert, DAILY_REVENUE_TARGET } from '../types/financial.types';
import { generateDailyReport, generateWeeklyReport } from '../reports/revenue.report';
import { generateDailyPayouts, getPendingPayoutsSummary } from '../reports/payouts.report';
import { getPaymentErrorStats, getChargebacks, saveFinancialAlert } from '../firestore/financial.service';

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

// ─── Runner principal ─────────────────────────────────────────
export async function runFinancialMonitor(): Promise<void> {
  const hour      = new Date().getHours();
  const dayOfWeek = new Date().getDay(); // 1=lunes

  console.log(`[financial-monitor] Running at hour ${hour}`);

  // Cada corrida: verificar pagos fallidos y contracargos
  await checkPaymentErrors();
  await checkChargebacks();
  await checkPendingPayouts();

  // 8pm: reporte diario de ingresos + generar liquidaciones
  if (hour === 20) {
    await sendDailyFinancialReport();
    await processDailyPayouts();
  }

  // Lunes 9am: reporte semanal
  if (dayOfWeek === 1 && hour === 9) {
    await sendWeeklyFinancialReport();
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
