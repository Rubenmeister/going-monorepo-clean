/**
 * Analytics Domain Models
 * Data structures for analytics and reporting
 */

// Dashboard KPIs
export interface DashboardKPIs {
  // Location Tracking
  totalTrips: number;
  activeDrivers: number;
  totalDistanceTraveled: number;
  averageSpeedPerDriver: number;
  estimatedFuelCost: number;

  // Invoicing
  totalInvoicesIssued: number;
  totalInvoicesOverdue: number;
  totalRevenueThisMonth: number;
  totalRevenueThisYear: number;
  averagePaymentTime: number;
  outstandingAmount: number;

  // Notifications
  totalNotificationsSent: number;
  notificationDeliveryRate: number;
  notificationReadRate: number;

  // System Health
  systemUptime: number; // percentage
  averageResponseTime: number; // milliseconds
  errorRate: number; // percentage
}

// Chart Data
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  fill?: boolean;
  tension?: number;
  type?: 'line' | 'bar' | 'pie' | 'doughnut';
}

// Report Types
export enum ReportType {
  TRIP_REPORT = 'TRIP_REPORT',
  INVOICE_REPORT = 'INVOICE_REPORT',
  NOTIFICATION_REPORT = 'NOTIFICATION_REPORT',
  DRIVER_PERFORMANCE = 'DRIVER_PERFORMANCE',
  REVENUE_REPORT = 'REVENUE_REPORT',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH',
  COMPLIANCE_REPORT = 'COMPLIANCE_REPORT',
}

// Report
export interface Report {
  id?: string;
  companyId: string;
  createdBy: string;
  type: ReportType;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  data: any;
  totalRecords: number;
  format: 'PDF' | 'XLSX' | 'CSV' | 'JSON';
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  fileUrl?: string;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// Trip Analytics
export interface TripAnalytics {
  tripId: string;
  driverId: string;
  vehicleId: string;
  distance: number; // km
  duration: number; // minutes
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  fuelConsumption: number; // liters (estimated)
  fuelCost: number; // currency units
  carbonEmissions: number; // kg
  safetyScore: number; // 0-100
  startTime: Date;
  endTime: Date;
  route: Array<{ lat: number; lon: number }>;
  stops: number;
  deviations: number;
  idleTime: number; // minutes
}

// Driver Performance
export interface DriverPerformance {
  driverId: string;
  totalTrips: number;
  totalDistance: number; // km
  totalDuration: number; // hours
  averageSpeed: number; // km/h
  safetyScore: number; // 0-100
  fuelEfficiency: number; // km/liter
  onTimePercentage: number; // 0-100
  customerRating: number; // 0-5
  incidentsCount: number;
  lastTripDate: Date;
  performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

// Invoice Analytics
export interface InvoiceAnalytics {
  totalIssued: number;
  totalValue: number;
  totalPaid: number;
  totalOutstanding: number;
  paidPercentage: number; // 0-100
  averagePaymentTime: number; // days
  overdueCount: number;
  overdueAmount: number;
  topClients: Array<{
    clientId: string;
    clientName: string;
    totalInvoiced: number;
  }>;
  invoicesByMonth: Array<{ month: string; count: number; amount: number }>;
  paymentTrends: Array<{ date: Date; amount: number }>;
}

// Notification Analytics
export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  deliveryRate: number; // 0-100
  readRate: number; // 0-100
  byType: Record<string, { count: number; rate: number }>;
  byChannel: Record<string, { count: number; rate: number }>;
  averageDeliveryTime: number; // milliseconds
}

// System Health Metrics
export interface SystemHealthMetrics {
  uptime: number; // percentage
  errorRate: number; // percentage
  averageResponseTime: number; // milliseconds
  peakRequestsPerSecond: number;
  databaseHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  cacheHitRate: number; // 0-100
  totalRequests: number;
  totalErrors: number;
  lastAlertTime?: Date;
}

// Audit Log
export interface AuditLog {
  id?: string;
  companyId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { before: any; after: any }>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Export Job
export interface ExportJob {
  id?: string;
  companyId: string;
  createdBy: string;
  reportType: ReportType;
  format: 'PDF' | 'XLSX' | 'CSV' | 'JSON';
  filters: any;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}
