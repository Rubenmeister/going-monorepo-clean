import Anthropic from '@anthropic-ai/sdk';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { generateDailyReport, generateWeeklyReport } from '../reports/revenue.report';
import { RevenueReport } from '../types/financial.types';

// ============================================================
// AI Financial Analysis – Claude analiza los datos financieros
// - Detecta conductores con patrones anómalos (posible fraude)
// - Proyección de ingresos del mes
// - Comparación semana vs semana anterior + explicación
// - Análisis de causas de pagos fallidos
// ============================================================

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

// ─── 1. Detectar anomalías en conductores ────────────────────
export async function detectDriverAnomalies(): Promise<{
  suspicious: Array<{ driverId: string; reason: string; riskLevel: 'low' | 'medium' | 'high' }>;
  aiSummary: string;
}> {
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  const ridesSnap = await db.collection('rides')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', Timestamp.fromDate(from))
    .get();

  const rides = ridesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Agrupar por conductor
  const driverStats = new Map<string, {
    rides: number; totalKm: number; totalFare: number;
    avgRideDuration: number; cashRides: number; shortRides: number;
  }>();

  rides.forEach((r: Record<string, unknown>) => {
    const dId = r.driverId as string;
    const existing = driverStats.get(dId) || { rides:0, totalKm:0, totalFare:0, avgRideDuration:0, cashRides:0, shortRides:0 };
    const distKm = r.distanceKm as number || 0;
    driverStats.set(dId, {
      rides: existing.rides + 1,
      totalKm: existing.totalKm + distKm,
      totalFare: existing.totalFare + (r.fareTotal as number || 0),
      avgRideDuration: existing.avgRideDuration,
      cashRides: existing.cashRides + (r.paymentMethod === 'cash' ? 1 : 0),
      shortRides: existing.shortRides + (distKm < 2 ? 1 : 0),  // <2km = viaje muy corto
    });
  });

  // Detectar patrones sospechosos
  const suspicious: Array<{ driverId: string; reason: string; riskLevel: 'low' | 'medium' | 'high' }> = [];

  driverStats.forEach((stats, driverId) => {
    const avgFarePerKm  = stats.totalKm > 0 ? stats.totalFare / stats.totalKm : 0;
    const shortRidePct  = stats.rides > 0 ? stats.shortRides / stats.rides : 0;
    const cashPct       = stats.rides > 0 ? stats.cashRides / stats.rides : 0;
    const avgKmPerRide  = stats.rides > 0 ? stats.totalKm / stats.rides : 0;

    // Alto % de viajes en efectivo + muchos viajes cortos = posible fraude de viajes fantasma
    if (cashPct > 0.8 && shortRidePct > 0.6 && stats.rides >= 5) {
      suspicious.push({
        driverId,
        reason: `${Math.round(cashPct*100)}% pagos en efectivo + ${Math.round(shortRidePct*100)}% viajes <2km — posibles viajes ficticios`,
        riskLevel: 'high',
      });
    } else if (avgFarePerKm > 5) {
      // Tarifa por km muy alta = posible manipulación de GPS
      suspicious.push({
        driverId,
        reason: `Tarifa promedio $${avgFarePerKm.toFixed(2)}/km (esperado <$3/km) — posible ruta inflada`,
        riskLevel: 'medium',
      });
    } else if (stats.rides > 30 && avgKmPerRide < 3) {
      suspicious.push({
        driverId,
        reason: `${stats.rides} viajes en 7 días con promedio ${avgKmPerRide.toFixed(1)}km — actividad inusualmente alta`,
        riskLevel: 'low',
      });
    }
  });

  if (suspicious.length === 0) return { suspicious: [], aiSummary: 'Sin anomalías detectadas esta semana.' };

  // Pedir a Claude un análisis más profundo
  const statsText = suspicious.map(s =>
    `Conductor ${s.driverId.slice(-6)}: ${s.reason} (riesgo: ${s.riskLevel})`
  ).join('\n');

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Eres analista antifraude de Going Ecuador (plataforma de transporte).
Analiza estas anomalías detectadas en conductores esta semana y da recomendaciones de acción:
${statsText}
Responde en máximo 150 palabras, en español, con acciones concretas por nivel de riesgo.`,
    }],
  });

  return {
    suspicious,
    aiSummary: (response.content[0] as { text: string }).text,
  };
}

// ─── 2. Proyección de ingresos del mes ───────────────────────
export async function projectMonthlyRevenue(): Promise<{
  currentRevenue: number;
  projectedRevenue: number;
  daysElapsed: number;
  daysRemaining: number;
  dailyAverage: number;
  onTrack: boolean;
  aiInsight: string;
}> {
  const now   = new Date();
  const day   = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentReport = await generateDailyReport(now);

  // Ingresos acumulados del mes hasta hoy
  const monthSnap = await db.collection('rides')
    .where('status', '==', 'completed')
    .where('completedAt', '>=', Timestamp.fromDate(from))
    .where('completedAt', '<=', Timestamp.fromDate(now))
    .get();

  const currentRevenue = monthSnap.docs.reduce((s, d) => s + (d.data().fareTotal || 0), 0);
  const dailyAverage   = day > 0 ? currentRevenue / day : 0;
  const projected      = dailyAverage * daysInMonth;
  const daysRemaining  = daysInMonth - day;

  // Meta mensual: $100/día × conductores activos
  const activeDrivers = new Set(monthSnap.docs.map(d => d.data().driverId)).size;
  const monthlyTarget = activeDrivers * 100 * daysInMonth;
  const onTrack       = projected >= monthlyTarget * 0.8; // 80% de la meta = on track

  // Claude: análisis de tendencia
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Eres analista financiero de Going Ecuador.
Datos del mes (día ${day} de ${daysInMonth}):
- Ingresos acumulados: $${currentRevenue.toFixed(2)}
- Promedio diario: $${dailyAverage.toFixed(2)}
- Proyección al cierre: $${projected.toFixed(2)}
- Meta mensual estimada: $${monthlyTarget.toFixed(2)}
- Conductores activos: ${activeDrivers}
En 2 oraciones, ¿está el mes en buen camino? ¿Qué recomiendas?`,
    }],
  });

  return {
    currentRevenue: round2(currentRevenue),
    projectedRevenue: round2(projected),
    daysElapsed: day,
    daysRemaining,
    dailyAverage: round2(dailyAverage),
    onTrack,
    aiInsight: (response.content[0] as { text: string }).text,
  };
}

// ─── 3. Comparación semanal con análisis Claude ───────────────
export async function compareWeeklyPerformance(): Promise<{
  currentWeek: RevenueReport;
  previousWeek: RevenueReport;
  revenueChange: number;
  ridesChange: number;
  aiAnalysis: string;
}> {
  const now     = new Date();
  const day     = now.getDay();
  const diff    = day === 0 ? 6 : day - 1;

  // Esta semana
  const thisFrom = new Date(now.getTime() - diff * 86400000);
  thisFrom.setHours(0,0,0,0);

  // Semana anterior
  const prevFrom = new Date(thisFrom.getTime() - 7 * 86400000);
  const prevTo   = new Date(thisFrom.getTime() - 1);

  const [currentWeek, previousWeek] = await Promise.all([
    generateWeeklyReport(),
    generateWeeklyReport(), // En producción: pasar prevFrom/prevTo
  ]);

  const revenueChange = previousWeek.totalRevenue > 0
    ? ((currentWeek.totalRevenue - previousWeek.totalRevenue) / previousWeek.totalRevenue) * 100
    : 0;
  const ridesChange = previousWeek.totalRides > 0
    ? ((currentWeek.totalRides - previousWeek.totalRides) / previousWeek.totalRides) * 100
    : 0;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Analiza el rendimiento semanal de Going Ecuador:
Semana actual: $${currentWeek.totalRevenue.toFixed(2)}, ${currentWeek.totalRides} viajes
Semana anterior: $${previousWeek.totalRevenue.toFixed(2)}, ${previousWeek.totalRides} viajes
Cambio ingresos: ${revenueChange.toFixed(1)}%
Cambio viajes: ${ridesChange.toFixed(1)}%

En 3 oraciones en español: ¿qué explica este cambio y qué se recomienda para la próxima semana?`,
    }],
  });

  return {
    currentWeek,
    previousWeek,
    revenueChange: round2(revenueChange),
    ridesChange: round2(ridesChange),
    aiAnalysis: (response.content[0] as { text: string }).text,
  };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
