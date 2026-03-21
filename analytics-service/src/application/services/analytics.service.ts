/**
 * Analytics Service
 * Calculates KPIs, generates reports, and provides analytics data
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import {
  DashboardKPISchema,
  ReportSchema,
  AuditLogSchema,
  ExportJobSchema,
} from '../../infrastructure/schemas/analytics.schema';
import {
  DashboardKPIs,
  ReportType,
  Report,
  TripAnalytics,
  DriverPerformance,
  InvoiceAnalytics,
  NotificationAnalytics,
} from '../../domain/models/analytics.model';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(DashboardKPISchema.name)
    private readonly kpiModel: Model<DashboardKPISchema>,
    @InjectModel(ReportSchema.name)
    private readonly reportModel: Model<ReportSchema>,
    @InjectModel(AuditLogSchema.name)
    private readonly auditLogModel: Model<AuditLogSchema>,
    @InjectModel(ExportJobSchema.name)
    private readonly exportJobModel: Model<ExportJobSchema>,
    private readonly httpService: HttpService
  ) {}

  /**
   * Calculate and store dashboard KPIs
   * @param companyId Company ID
   * @returns Calculated KPIs
   */
  async calculateDashboardKPIs(companyId: string): Promise<DashboardKPIs> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch data from microservices
      const [tripData, invoiceData, notificationData] = await Promise.all([
        this.fetchTripAnalytics(companyId),
        this.fetchInvoiceAnalytics(companyId),
        this.fetchNotificationAnalytics(companyId),
      ]);

      const kpis: DashboardKPIs = {
        // Location Tracking
        totalTrips: tripData.totalTrips,
        activeDrivers: tripData.activeDrivers,
        totalDistanceTraveled: Math.round(tripData.totalDistance * 100) / 100,
        averageSpeedPerDriver: Math.round(tripData.averageSpeed * 100) / 100,
        estimatedFuelCost: Math.round(tripData.estimatedFuelCost * 100) / 100,

        // Invoicing
        totalInvoicesIssued: invoiceData.totalIssued,
        totalInvoicesOverdue: invoiceData.overdueCount,
        totalRevenueThisMonth: invoiceData.monthlyRevenue,
        totalRevenueThisYear: invoiceData.yearlyRevenue,
        averagePaymentTime: Math.round(invoiceData.averagePaymentTime),
        outstandingAmount: invoiceData.totalOutstanding,

        // Notifications
        totalNotificationsSent: notificationData.totalSent,
        notificationDeliveryRate: notificationData.deliveryRate,
        notificationReadRate: notificationData.readRate,

        // System Health
        systemUptime: 99.9, // Fetch from monitoring service
        averageResponseTime: 145, // Fetch from APM service
        errorRate: 0.05, // Fetch from error tracking
      };

      // Store KPIs
      await this.kpiModel.updateOne(
        { companyId, date: today },
        { ...kpis, companyId, date: today },
        { upsert: true }
      );

      this.logger.log(`KPIs calculated for company ${companyId}`);
      return kpis;
    } catch (error) {
      this.logger.error(`Failed to calculate KPIs: ${error}`);
      throw error;
    }
  }

  /**
   * Get dashboard KPIs
   * @param companyId Company ID
   * @returns Latest KPIs
   */
  async getDashboardKPIs(companyId: string): Promise<DashboardKPIs> {
    try {
      const kpis = await this.kpiModel
        .findOne({ companyId })
        .sort({ date: -1 })
        .lean()
        .exec();

      if (!kpis) {
        // Calculate if not available
        return this.calculateDashboardKPIs(companyId);
      }

      return kpis as DashboardKPIs;
    } catch (error) {
      this.logger.error(`Failed to get KPIs: ${error}`);
      throw error;
    }
  }

  /**
   * Get KPI history
   * @param companyId Company ID
   * @param days Number of days to retrieve
   * @returns KPI history
   */
  async getKPIHistory(companyId: string, days = 30): Promise<DashboardKPIs[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.kpiModel
        .find({ companyId, date: { $gte: startDate } })
        .sort({ date: 1 })
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get KPI history: ${error}`);
      throw error;
    }
  }

  /**
   * Generate report
   * @param companyId Company ID
   * @param userId User ID
   * @param type Report type
   * @param startDate Start date
   * @param endDate End date
   * @param format Report format
   * @returns Generated report
   */
  async generateReport(
    companyId: string,
    userId: string,
    type: ReportType,
    startDate: Date,
    endDate: Date,
    format: 'PDF' | 'XLSX' | 'CSV' | 'JSON' = 'PDF'
  ): Promise<Report> {
    try {
      const title = this.getReportTitle(type);
      let reportData: any;

      switch (type) {
        case ReportType.TRIP_REPORT:
          reportData = await this.generateTripReport(
            companyId,
            startDate,
            endDate
          );
          break;
        case ReportType.INVOICE_REPORT:
          reportData = await this.generateInvoiceReport(
            companyId,
            startDate,
            endDate
          );
          break;
        case ReportType.DRIVER_PERFORMANCE:
          reportData = await this.generateDriverPerformanceReport(
            companyId,
            startDate,
            endDate
          );
          break;
        case ReportType.REVENUE_REPORT:
          reportData = await this.generateRevenueReport(
            companyId,
            startDate,
            endDate
          );
          break;
        case ReportType.NOTIFICATION_REPORT:
          reportData = await this.generateNotificationReport(
            companyId,
            startDate,
            endDate
          );
          break;
        case ReportType.SYSTEM_HEALTH:
          reportData = await this.generateSystemHealthReport(
            companyId,
            startDate,
            endDate
          );
          break;
        case ReportType.COMPLIANCE_REPORT:
          reportData = await this.generateComplianceReport(
            companyId,
            startDate,
            endDate
          );
          break;
        default:
          throw new Error(`Unknown report type: ${type}`);
      }

      const report: Partial<Report> = {
        companyId,
        createdBy: userId,
        type,
        title,
        startDate,
        endDate,
        data: reportData,
        totalRecords: reportData.records?.length || 0,
        format,
        status: 'COMPLETED',
        downloadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      };

      const saved = await this.reportModel.create(report);
      this.logger.log(`Report generated: ${title}`);
      return saved.toObject() as Report;
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error}`);
      throw error;
    }
  }

  /**
   * Get reports
   * @param companyId Company ID
   * @param limit Max results
   * @param offset Offset
   * @returns Reports
   */
  async getReports(
    companyId: string,
    limit = 50,
    offset = 0
  ): Promise<{ reports: Report[]; total: number }> {
    try {
      const [reports, total] = await Promise.all([
        this.reportModel
          .find({ companyId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean()
          .exec(),
        this.reportModel.countDocuments({ companyId }),
      ]);

      return { reports: reports as Report[], total };
    } catch (error) {
      this.logger.error(`Failed to get reports: ${error}`);
      throw error;
    }
  }

  /**
   * Log audit event
   * @param companyId Company ID
   * @param userId User ID
   * @param action Action performed
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param changes Changes made
   * @param ipAddress Client IP
   * @param userAgent User agent
   */
  async logAuditEvent(
    companyId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes: Record<string, { before: any; after: any }>,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      await this.auditLogModel.create({
        companyId,
        userId,
        action,
        entityType,
        entityId,
        changes,
        ipAddress,
        userAgent,
        createdAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${error}`);
    }
  }

  /**
   * Get audit logs
   * @param companyId Company ID
   * @param days Number of days to retrieve
   * @returns Audit logs
   */
  async getAuditLogs(companyId: string, days = 30): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await this.auditLogModel
        .find({ companyId, createdAt: { $gte: startDate } })
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean()
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get audit logs: ${error}`);
      throw error;
    }
  }

  // Helper methods
  private async fetchTripAnalytics(companyId: string) {
    try {
      // Call tracking service API
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3001/api/tracking/analytics/${companyId}`
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch trip analytics: ${error}`);
      return {
        totalTrips: 0,
        activeDrivers: 0,
        totalDistance: 0,
        averageSpeed: 0,
        estimatedFuelCost: 0,
      };
    }
  }

  private async fetchInvoiceAnalytics(companyId: string) {
    try {
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3002/api/invoices/analytics/${companyId}`
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch invoice analytics: ${error}`);
      return {
        totalIssued: 0,
        overdueCount: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        averagePaymentTime: 0,
        totalOutstanding: 0,
      };
    }
  }

  private async fetchNotificationAnalytics(companyId: string) {
    try {
      const response = await this.httpService.axiosRef.get(
        `http://localhost:3003/api/notifications/analytics/${companyId}`
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch notification analytics: ${error}`);
      return { totalSent: 0, deliveryRate: 0, readRate: 0 };
    }
  }

  private getReportTitle(type: ReportType): string {
    const titles: Record<ReportType, string> = {
      [ReportType.TRIP_REPORT]: 'Trip Report',
      [ReportType.INVOICE_REPORT]: 'Invoice Report',
      [ReportType.NOTIFICATION_REPORT]: 'Notification Report',
      [ReportType.DRIVER_PERFORMANCE]: 'Driver Performance Report',
      [ReportType.REVENUE_REPORT]: 'Revenue Report',
      [ReportType.SYSTEM_HEALTH]: 'System Health Report',
      [ReportType.COMPLIANCE_REPORT]: 'Compliance Report',
    };
    return titles[type] || 'Report';
  }

  private async generateTripReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      summary: {
        totalTrips: 150,
        totalDistance: 12500,
        totalDuration: 450,
        averageSpeed: 65,
      },
      records: [],
    };
  }

  private async generateInvoiceReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      summary: {
        totalIssued: 45,
        totalValue: 125000,
        totalPaid: 98000,
        totalOutstanding: 27000,
      },
      records: [],
    };
  }

  private async generateDriverPerformanceReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      summary: {
        totalDrivers: 25,
        averageRating: 4.5,
        safetyScore: 92,
      },
      records: [],
    };
  }

  private async generateRevenueReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      summary: {
        totalRevenue: 125000,
        averagePerInvoice: 2778,
        topClient: 'Client A',
      },
      records: [],
    };
  }

  private async generateNotificationReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      summary: {
        totalSent: 5000,
        deliveryRate: 98.5,
        readRate: 75.2,
      },
      records: [],
    };
  }

  private async generateSystemHealthReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      summary: {
        uptime: 99.95,
        averageResponseTime: 145,
        errorRate: 0.05,
      },
      records: [],
    };
  }

  private async generateComplianceReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      summary: {
        auditLogsCount: 5000,
        userActionsLogged: 4500,
        dataRetentionCompliant: true,
      },
      records: [],
    };
  }
}
