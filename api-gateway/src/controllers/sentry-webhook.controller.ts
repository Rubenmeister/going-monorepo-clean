/**
 * Sentry Webhook Controller
 * Handles incoming alerts from Sentry
 * Routes them to PagerDuty, Slack, and internal alert management
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SentryAlertsIntegration from '../config/sentry-alerts.integration';
import AlertAggregationService from '../services/alert-aggregation.service';

@Controller('api/webhooks')
export class SentryWebhookController {
  private readonly logger = new Logger(SentryWebhookController.name);

  constructor(
    @Inject('SENTRY_ALERTS') private sentryAlerts: SentryAlertsIntegration,
    @Inject('ALERT_AGGREGATION_SERVICE')
    private alertAggregation: typeof AlertAggregationService,
    private configService: ConfigService
  ) {}

  /**
   * Receive alerts from Sentry
   * POST /api/webhooks/sentry
   */
  @Post('sentry')
  @HttpCode(HttpStatus.OK)
  async handleSentryAlert(
    @Body() payload: any,
    @Headers('x-sentry-hook-resource') resource: string,
    @Headers('x-sentry-hook-timestamp') timestamp: string,
    @Headers('x-sentry-hook-signature') signature: string
  ) {
    try {
      // Validate webhook signature (optional but recommended)
      if (this.configService.get('SENTRY_VALIDATE_WEBHOOK_SIGNATURE')) {
        const isValid = this.validateSignature(payload, signature, timestamp);
        if (!isValid) {
          throw new BadRequestException('Invalid webhook signature');
        }
      }

      this.logger.debug(`Received Sentry webhook: ${resource}`);

      if (!payload || !payload.action || !payload.issue) {
        this.logger.warn('Invalid Sentry webhook payload');
        return { status: 'received', message: 'Invalid payload' };
      }

      // Aggregate the alert (check for duplicates)
      const { shouldNotify, aggregated } =
        await this.alertAggregation.processAlert(payload);

      if (!shouldNotify) {
        this.logger.debug(`Alert deduplicated: ${aggregated.fingerprint}`);
        return { status: 'deduplicated', message: 'Alert was deduplicated' };
      }

      // Route to Sentry alerts integration
      if (this.sentryAlerts) {
        await this.sentryAlerts.handleWebhook(payload);
        this.logger.log(`Alert processed: ${payload.issue.id}`);
      }

      return {
        status: 'received',
        message: 'Alert processed successfully',
        issueId: payload.issue.id,
        action: payload.action,
      };
    } catch (error) {
      this.logger.error('Error processing Sentry webhook:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   * GET /api/webhooks/health
   */
  @Post('health')
  @HttpCode(HttpStatus.OK)
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      alerts: {
        sentryEnabled: !!this.sentryAlerts,
        aggregationServiceRunning: !!this.alertAggregation,
      },
    };
  }

  /**
   * Get alert statistics
   * GET /api/webhooks/alerts/stats
   */
  @Post('alerts/stats')
  @HttpCode(HttpStatus.OK)
  getAlertStats() {
    if (!this.sentryAlerts) {
      return { status: 'disabled' };
    }

    return this.sentryAlerts.getAlertStats();
  }

  /**
   * Get active alerts
   * GET /api/webhooks/alerts/active
   */
  @Post('alerts/active')
  @HttpCode(HttpStatus.OK)
  getActiveAlerts() {
    if (!this.sentryAlerts) {
      return { alerts: [] };
    }

    return {
      alerts: this.sentryAlerts.getActiveWorkflows(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Acknowledge an alert
   * POST /api/webhooks/alerts/:id/acknowledge
   */
  @Post('alerts/:id/acknowledge')
  @HttpCode(HttpStatus.OK)
  async acknowledgeAlert(@Body('workflowId') workflowId: string) {
    if (!this.sentryAlerts) {
      return { status: 'disabled' };
    }

    try {
      await this.sentryAlerts.acknowledgeAlert(workflowId);
      return {
        status: 'acknowledged',
        workflowId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Validate webhook signature
   * (Implement according to Sentry's HMAC verification)
   */
  private validateSignature(
    payload: any,
    signature: string,
    timestamp: string
  ): boolean {
    // In production, implement proper HMAC verification
    // using the Sentry webhook signing secret
    const secret = this.configService.get('SENTRY_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn(
        'SENTRY_WEBHOOK_SECRET not configured, skipping verification'
      );
      return true;
    }

    // Simplified verification (use crypto.createHmac in production)
    this.logger.debug(
      `Validating signature: ${signature}, timestamp: ${timestamp}`
    );
    return true;
  }
}

export default SentryWebhookController;
