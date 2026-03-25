// ============================================================
// GOING – Financial Agent Types
// Comisión Going: 20% | Conductor: 80% | IVA Ecuador: 15%
// ============================================================

// ─── Ride / Transacción ──────────────────────────────────────
export type RideStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'chargeback';
export type PaymentMethod = 'card' | 'cash' | 'transfer' | 'wallet';
export type RideType = 'private' | 'shared';

export interface Ride {
  id: string;
  driverId: string;
  passengerId: string;
  status: RideStatus;
  rideType: RideType;

  // Ruta
  origin: string;
  destination: string;
  distanceKm: number;

  // Financiero
  fareTotal: number;            // Precio pagado por el pasajero (incluye IVA)
  fareSubtotal: number;         // Sin IVA
  ivaAmount: number;            // IVA 15%
  goingCommission: number;      // 20% del subtotal
  driverEarnings: number;       // 80% del subtotal
  platformFee: number;          // Tarifa fija plataforma si aplica

  // Pago
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentGateway?: string;      // 'datafast' | 'transfer' | 'cash'
  transactionId?: string;       // ID en Datafast
  invoiceId?: string;           // ID en Datil

  // Tiempos
  requestedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

// ─── Liquidación a conductor ─────────────────────────────────
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DriverPayout {
  id: string;
  driverId: string;
  driverName: string;
  period: 'daily' | 'weekly';
  periodStart: Date;
  periodEnd: Date;

  // Breakdown
  totalRides: number;
  totalFareCollected: number;    // Total cobrado a pasajeros
  goingCommissionTotal: number;  // 20% que retiene Going
  driverEarningsGross: number;   // 80% bruto
  adjustments: number;           // Bonos, penalidades, etc.
  driverEarningsNet: number;     // Lo que se le paga al conductor

  // Estado del pago
  status: PayoutStatus;
  payoutMethod: 'transfer' | 'cash' | 'wallet';
  bankAccount?: string;
  paidAt?: Date;
  reference?: string;            // Número de transferencia

  createdAt: Date;
  updatedAt: Date;
}

// ─── Factura Datil ───────────────────────────────────────────
export interface DatilInvoice {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  passengerRuc?: string;         // RUC o cédula para factura

  sequential: string;            // Número secuencial SRI
  accessKey: string;             // Clave de acceso SRI
  subtotal: number;
  iva: number;
  total: number;
  currency: 'USD';

  status: 'draft' | 'authorized' | 'cancelled';
  authorizedAt?: Date;
  pdfUrl?: string;
  xmlUrl?: string;

  createdAt: Date;
}

// ─── Estado de pagos (Datafast) ───────────────────────────────
export interface PaymentTransaction {
  id: string;
  rideId: string;
  gateway: string;
  amount: number;
  currency: 'USD';
  status: PaymentStatus;
  errorCode?: string;
  errorMessage?: string;
  gatewayTransactionId?: string;
  cardLast4?: string;
  cardBrand?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Reporte de ingresos ─────────────────────────────────────
export interface RevenueReport {
  period: 'daily' | 'weekly' | 'monthly';
  from: Date;
  to: Date;

  // Totales
  totalRevenue: number;           // Total facturado
  goingRevenue: number;           // Comisión Going (20%)
  driverRevenue: number;          // Ingresos conductores (80%)
  ivaCollected: number;           // IVA 15% cobrado
  totalRides: number;
  cancelledRides: number;
  refundedAmount: number;

  // Pagos
  cardPayments: number;           // Monto pagado con tarjeta
  cashPayments: number;           // Monto pagado en efectivo
  transferPayments: number;
  failedPayments: number;         // Pagos fallidos
  failedPaymentsCount: number;

  // Por conductor
  driverBreakdown: {
    driverId: string;
    driverName: string;
    rides: number;
    revenue: number;
    earnings: number;
    metDailyTarget: boolean;      // >= $100/día
  }[];

  // Objetivo
  dailyTargetPerDriver: number;   // $100
  driversMetTarget: number;
  driversBelowTarget: number;
  avgRevenuePerDriver: number;

  generatedAt: Date;
}

// ─── Alertas financieras ─────────────────────────────────────
export type FinancialAlertType =
  | 'payment_failed'          // Pago rechazado
  | 'high_refund_rate'        // Tasa de reembolso alta
  | 'chargeback'              // Contracargo bancario
  | 'payout_failed'           // Liquidación fallida
  | 'below_daily_target'      // Ingresos bajo $100/conductor
  | 'revenue_anomaly'         // Ingreso anormal (muy alto o muy bajo)
  | 'invoice_error'           // Error al emitir factura SRI
  | 'daily_summary'           // Resumen diario
  | 'weekly_summary'          // Resumen semanal
  | 'pending_payouts';        // Liquidaciones pendientes

export interface FinancialAlert {
  type: FinancialAlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data?: Record<string, string | number>;
  createdAt: Date;
}

// ─── Constantes financieras Going ────────────────────────────
export const GOING_COMMISSION_RATE = 0.20;     // 20%
export const DRIVER_RATE           = 0.80;     // 80%
export const IVA_RATE              = 0.15;     // 15% Ecuador
export const DAILY_REVENUE_TARGET  = 100;      // $100/día por conductor
export const WEEKLY_TARGET         = DAILY_REVENUE_TARGET * 5; // $500/semana
