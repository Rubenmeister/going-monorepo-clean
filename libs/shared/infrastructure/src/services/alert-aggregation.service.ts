/**
 * Alert Aggregation & Deduplication Service
 * Groups similar errors and prevents duplicate notifications
 */

import { EventEmitter } from 'events';

export interface AggregatedAlert {
  fingerprint: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  issues: any[];
  trend: 'increasing' | 'stable' | 'decreasing';
  shouldNotify: boolean;
  notificationSent: Date | null;
}

export interface AlertStatistics {
  totalAlerts: number;
  uniqueAlerts: number;
  duplicatesEliminated: number;
  averageAlertsPerFingerprint: number;
  topFingerprints: Array<{ fingerprint: string; count: number }>;
  notificationReduction: number; // percentage
}

export class AlertAggregationService extends EventEmitter {
  private alerts: Map<string, AggregatedAlert> = new Map();
  private fingerprintCache: Map<string, string> = new Map(); // For quick lookups
  private totalAlertsProcessed = 0;
  private alertsDeduped = 0;

  // Configuration
  private readonly AGGREGATION_WINDOW = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ALERTS_PER_FINGERPRINT = 100; // Keep last 100
  private readonly TREND_SAMPLE_SIZE = 10; // Use last 10 for trend

  constructor() {
    super();
    this.initializeCleanupJob();
  }

  /**
   * Process incoming alert and determine if it should be sent
   */
  async processAlert(
    alert: any
  ): Promise<{ shouldNotify: boolean; aggregated: AggregatedAlert }> {
    this.totalAlertsProcessed++;

    // Generate fingerprint for this alert
    const fingerprint = this.generateFingerprint(alert);

    // Check if we have seen this alert before
    if (this.alerts.has(fingerprint)) {
      const existing = this.alerts.get(fingerprint)!;
      return this.handleDuplicateAlert(existing, alert, fingerprint);
    }

    // New alert fingerprint
    const aggregated: AggregatedAlert = {
      fingerprint,
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      issues: [alert],
      trend: 'stable',
      shouldNotify: true,
      notificationSent: null,
    };

    this.alerts.set(fingerprint, aggregated);
    this.fingerprintCache.set(alert.id, fingerprint);

    this.emit('alert:aggregated', aggregated);

    return { shouldNotify: true, aggregated };
  }

  /**
   * Handle duplicate alert
   */
  private handleDuplicateAlert(
    existing: AggregatedAlert,
    newAlert: any,
    fingerprint: string
  ): { shouldNotify: boolean; aggregated: AggregatedAlert } {
    existing.count++;
    existing.lastOccurrence = new Date();
    existing.issues.push(newAlert);
    this.alertsDeduped++;

    // Keep only last MAX_ALERTS_PER_FINGERPRINT
    if (existing.issues.length > this.MAX_ALERTS_PER_FINGERPRINT) {
      existing.issues.shift();
    }

    // Update trend
    existing.trend = this.calculateTrend(existing);

    // Determine if we should notify
    const shouldNotify = this.shouldResendNotification(existing);

    if (shouldNotify) {
      existing.notificationSent = new Date();
    }

    this.alerts.set(fingerprint, existing);
    this.fingerprintCache.set(newAlert.id, fingerprint);

    this.emit('alert:deduplicated', {
      fingerprint,
      isDuplicate: true,
      count: existing.count,
      trend: existing.trend,
    });

    return { shouldNotify, aggregated: existing };
  }

  /**
   * Calculate trend (increasing, stable, decreasing)
   */
  private calculateTrend(
    alert: AggregatedAlert
  ): 'increasing' | 'stable' | 'decreasing' {
    if (alert.issues.length < this.TREND_SAMPLE_SIZE) {
      return 'stable';
    }

    const recent = alert.issues.slice(-this.TREND_SAMPLE_SIZE);
    const old = alert.issues.slice(0, this.TREND_SAMPLE_SIZE);

    // Calculate average time between alerts
    const recentTimes = this.calculateInterarrivalTimes(recent);
    const oldTimes = this.calculateInterarrivalTimes(old);

    const recentAvg =
      recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
    const oldAvg = oldTimes.reduce((a, b) => a + b, 0) / oldTimes.length;

    // If average time between alerts is decreasing, trend is increasing
    if (recentAvg < oldAvg * 0.8) {
      return 'increasing';
    }

    if (recentAvg > oldAvg * 1.2) {
      return 'decreasing';
    }

    return 'stable';
  }

  /**
   * Calculate time differences between consecutive alerts
   */
  private calculateInterarrivalTimes(issues: any[]): number[] {
    const times: number[] = [];

    for (let i = 1; i < issues.length; i++) {
      const prev = new Date(
        issues[i - 1].createdAt || issues[i - 1].timestamp
      ).getTime();
      const curr = new Date(
        issues[i].createdAt || issues[i].timestamp
      ).getTime();
      times.push(curr - prev);
    }

    return times.length > 0 ? times : [0];
  }

  /**
   * Determine if we should resend notification for duplicate
   */
  private shouldResendNotification(alert: AggregatedAlert): boolean {
    if (!alert.notificationSent) {
      return true; // First notification always sent
    }

    // Time since last notification
    const timeSinceLastNotification =
      Date.now() - alert.notificationSent.getTime();

    // Resend based on count and trend
    if (alert.trend === 'increasing') {
      // Increasing trend: resend more frequently
      return timeSinceLastNotification > 2 * 60 * 1000; // Every 2 minutes
    }

    if (alert.trend === 'decreasing') {
      // Decreasing trend: resend less frequently
      return timeSinceLastNotification > 30 * 60 * 1000; // Every 30 minutes
    }

    // Stable trend: resend at doubling intervals
    const interval = Math.min(
      15 * 60 * 1000, // Max 15 minutes
      Math.pow(alert.count, 1.5) * 60 * 1000 // Exponential backoff
    );

    return timeSinceLastNotification > interval;
  }

  /**
   * Generate fingerprint for alert grouping
   * Combines: service + error type + location
   */
  private generateFingerprint(alert: any): string {
    const components = [
      alert.service || alert.project?.slug || 'unknown',
      alert.errorType || alert.issue?.level || 'error',
      alert.logger || alert.issue?.logger || 'unknown',
      alert.culprit || alert.issue?.culprit || 'unknown',
    ];

    const key = components.join('::');
    return Buffer.from(key).toString('base64');
  }

  /**
   * Get aggregation statistics
   */
  getStatistics(): AlertStatistics {
    const aggregatedAlerts = Array.from(this.alerts.values());

    const totalDuplicates = aggregatedAlerts.reduce((sum, alert) => {
      return sum + Math.max(0, alert.count - 1);
    }, 0);

    const topFingerprints = aggregatedAlerts
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((alert) => ({
        fingerprint: alert.fingerprint,
        count: alert.count,
      }));

    const notificationReduction =
      this.totalAlertsProcessed > 0
        ? (this.alertsDeduped / this.totalAlertsProcessed) * 100
        : 0;

    return {
      totalAlerts: this.totalAlertsProcessed,
      uniqueAlerts: aggregatedAlerts.length,
      duplicatesEliminated: this.alertsDeduped,
      averageAlertsPerFingerprint:
        aggregatedAlerts.length > 0
          ? this.totalAlertsProcessed / aggregatedAlerts.length
          : 0,
      topFingerprints,
      notificationReduction,
    };
  }

  /**
   * Get alert by fingerprint
   */
  getAggregatedAlert(fingerprint: string): AggregatedAlert | undefined {
    return this.alerts.get(fingerprint);
  }

  /**
   * Get all aggregated alerts
   */
  getAllAggregatedAlerts(): AggregatedAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get trend summary
   */
  getTrendSummary(): {
    increasing: AggregatedAlert[];
    stable: AggregatedAlert[];
    decreasing: AggregatedAlert[];
  } {
    const alerts = Array.from(this.alerts.values());

    return {
      increasing: alerts.filter((a) => a.trend === 'increasing'),
      stable: alerts.filter((a) => a.trend === 'stable'),
      decreasing: alerts.filter((a) => a.trend === 'decreasing'),
    };
  }

  /**
   * Clear old alerts (cleanup)
   */
  private clearOldAlerts(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [fingerprint, alert] of this.alerts.entries()) {
      // Clear if not updated in last 24 hours
      if (now - alert.lastOccurrence.getTime() > 24 * 60 * 60 * 1000) {
        this.alerts.delete(fingerprint);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(
        `[Alert Aggregation] Cleared ${cleared} old alert fingerprints`
      );
      this.emit('alerts:cleaned', { cleared });
    }
  }

  /**
   * Initialize cleanup job (runs every hour)
   */
  private initializeCleanupJob(): void {
    setInterval(() => {
      this.clearOldAlerts();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.totalAlertsProcessed = 0;
    this.alertsDeduped = 0;
  }

  /**
   * Export alerts for reporting
   */
  exportAlerts(): string {
    const stats = this.getStatistics();
    const trends = this.getTrendSummary();

    return JSON.stringify(
      {
        statistics: stats,
        trends: {
          increasing: trends.increasing.length,
          stable: trends.stable.length,
          decreasing: trends.decreasing.length,
        },
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

export default new AlertAggregationService();
