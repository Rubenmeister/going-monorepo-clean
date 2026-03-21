/**
 * Sentry Alerts Integration
 * Webhook handlers, alert workflows, and response automation
 *
 * Features:
 * - Incoming webhook handler for Sentry alerts
 * - Alert aggregation and deduplication
 * - PagerDuty and Slack notifications
 * - Workflow state management
 * - Auto-escalation policies
 */

import { EventEmitter } from 'events';

export interface SentryWebhookPayload {
  action: 'created' | 'resolved' | 'ignored' | 'regressed';
  project: {
    id: number;
    name: string;
    slug: string;
  };
  issue: {
    id: number;
    shortId: string;
    title: string;
    url: string;
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    numComments: number;
    logger: string;
    culprit: string;
    assignedTo?: {
      name: string;
      email: string;
    };
  };
  triggeredBy: string;
}

export interface AlertWorkflow {
  id: string;
  sentryIssueId: number;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated';
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  pagerdutyIncidentId?: string;
  slackThreadId?: string;
  escalationLevel: 0 | 1 | 2 | 3; // 0: team lead, 1: manager, 2: director, 3: VP
  nextEscalationTime?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  errorRate: number; // percentage
  tags: Record<string, string>;
}

export interface AggregatedAlert {
  fingerprint: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  issues: SentryWebhookPayload[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Sentry Alerts Integration Service
 */
export class SentryAlertsIntegration extends EventEmitter {
  private workflows: Map<string, AlertWorkflow> = new Map();
  private aggregatedAlerts: Map<string, AggregatedAlert> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  // Escalation policies (in minutes)
  private readonly ESCALATION_TIMES = {
    critical: 5,
    high: 15,
    medium: 60,
    low: 240,
  };

  constructor(
    private pagerDutyService: any,
    private slackService: any,
    private alertAggregationService: any
  ) {
    super();
    this.initializeEscalationChecker();
  }

  /**
   * Handle incoming Sentry webhook
   */
  async handleWebhook(payload: SentryWebhookPayload): Promise<void> {
    // Step 1: Aggregate similar alerts
    const aggregated = await this.aggregateAlert(payload);

    // Step 2: Check if should deduplicate
    if (this.shouldDeduplicate(aggregated)) {
      console.log(`[ALERT] Deduplicating alert: ${aggregated.fingerprint}`);
      return;
    }

    // Step 3: Determine priority
    const priority = this.determinePriority(payload);

    // Step 4: Create workflow
    const workflow = await this.createWorkflow(payload, priority);

    // Step 5: Send notifications based on priority
    if (payload.action === 'created') {
      await this.notifyOnCreate(workflow, payload);
    } else if (payload.action === 'resolved') {
      await this.handleResolution(workflow);
    } else if (payload.action === 'regressed') {
      await this.handleRegression(workflow, payload);
    }

    // Step 6: Set up escalation timer
    this.setUpEscalation(workflow);
  }

  /**
   * Aggregate similar alerts to prevent duplicates
   */
  private async aggregateAlert(
    payload: SentryWebhookPayload
  ): Promise<AggregatedAlert> {
    const fingerprint = this.generateFingerprint(payload);

    if (this.aggregatedAlerts.has(fingerprint)) {
      const existing = this.aggregatedAlerts.get(fingerprint)!;
      existing.count++;
      existing.lastOccurrence = new Date();
      existing.issues.push(payload);
      existing.trend = this.calculateTrend(existing);
      return existing;
    }

    const aggregated: AggregatedAlert = {
      fingerprint,
      count: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      issues: [payload],
      trend: 'stable',
    };

    this.aggregatedAlerts.set(fingerprint, aggregated);

    // Clean up after 1 hour
    setTimeout(() => {
      this.aggregatedAlerts.delete(fingerprint);
    }, 60 * 60 * 1000);

    return aggregated;
  }

  /**
   * Generate fingerprint for alert grouping
   */
  private generateFingerprint(payload: SentryWebhookPayload): string {
    const key = `${payload.project.slug}:${payload.issue.logger}:${payload.issue.culprit}`;
    return Buffer.from(key).toString('base64');
  }

  /**
   * Calculate trend (increasing, stable, decreasing)
   */
  private calculateTrend(
    alert: AggregatedAlert
  ): 'increasing' | 'stable' | 'decreasing' {
    if (alert.count < 3) return 'stable';

    const recentIssues = alert.issues.slice(-3);
    const oldIssues = alert.issues.slice(
      0,
      Math.max(1, alert.issues.length - 3)
    );

    const recentRate = recentIssues.length;
    const oldRate = oldIssues.length;

    if (recentRate > oldRate * 1.2) return 'increasing';
    if (recentRate < oldRate * 0.8) return 'decreasing';
    return 'stable';
  }

  /**
   * Check if alert should be deduplicated
   */
  private shouldDeduplicate(alert: AggregatedAlert): boolean {
    // If last alert was within 5 minutes and count is stable
    const timeSinceLastAlert = Date.now() - alert.lastOccurrence.getTime();
    return (
      timeSinceLastAlert < 5 * 60 * 1000 &&
      alert.trend !== 'increasing' &&
      alert.count > 5
    );
  }

  /**
   * Determine alert priority based on characteristics
   */
  private determinePriority(
    payload: SentryWebhookPayload
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (payload.issue.level === 'fatal') return 'critical';
    if (
      payload.issue.level === 'error' &&
      payload.issue.culprit.includes('payment')
    )
      return 'critical';
    if (payload.issue.level === 'error') return 'high';
    if (payload.issue.level === 'warning') return 'medium';
    return 'low';
  }

  /**
   * Create workflow for alert
   */
  private async createWorkflow(
    payload: SentryWebhookPayload,
    priority: AlertWorkflow['priority']
  ): Promise<AlertWorkflow> {
    const workflow: AlertWorkflow = {
      id: `workflow_${payload.issue.id}_${Date.now()}`,
      sentryIssueId: payload.issue.id,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
      escalationLevel: 0,
      priority,
      affectedUsers: payload.issue.numComments, // Proxy for affected users
      errorRate: 0, // Will be populated by monitoring
      tags: {
        project: payload.project.slug,
        logger: payload.issue.logger,
        level: payload.issue.level,
      },
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Notify on alert creation
   */
  private async notifyOnCreate(
    workflow: AlertWorkflow,
    payload: SentryWebhookPayload
  ): Promise<void> {
    // Notify Slack immediately
    await this.slackService.sendAlert({
      workflow,
      payload,
      channel: this.getChannelForPriority(workflow.priority),
      includeActionButtons: true,
    });

    // For critical/high priority, also notify PagerDuty
    if (workflow.priority === 'critical' || workflow.priority === 'high') {
      const incident = await this.pagerDutyService.createIncident({
        title: `[${workflow.priority.toUpperCase()}] ${payload.issue.title}`,
        description: `Issue: ${payload.issue.url}\nCulprit: ${payload.issue.culprit}`,
        service: payload.project.slug,
        urgency: workflow.priority === 'critical' ? 'high' : 'low',
        body: {
          details: {
            errorRate: workflow.errorRate,
            affectedUsers: workflow.affectedUsers,
          },
        },
      });

      workflow.pagerdutyIncidentId = incident.id;
      workflow.updatedAt = new Date();
      this.workflows.set(workflow.id, workflow);
    }

    this.emit('alert:created', workflow);
  }

  /**
   * Handle alert resolution
   */
  private async handleResolution(workflow: AlertWorkflow): Promise<void> {
    workflow.status = 'resolved';
    workflow.resolvedAt = new Date();
    workflow.updatedAt = new Date();

    // Clear escalation timer
    if (this.escalationTimers.has(workflow.id)) {
      clearTimeout(this.escalationTimers.get(workflow.id));
      this.escalationTimers.delete(workflow.id);
    }

    // Notify Slack
    await this.slackService.sendResolution(workflow);

    // Resolve PagerDuty incident
    if (workflow.pagerdutyIncidentId) {
      await this.pagerDutyService.resolveIncident(workflow.pagerdutyIncidentId);
    }

    this.emit('alert:resolved', workflow);
  }

  /**
   * Handle alert regression
   */
  private async handleRegression(
    workflow: AlertWorkflow,
    payload: SentryWebhookPayload
  ): Promise<void> {
    workflow.status = 'regressed';
    workflow.updatedAt = new Date();
    workflow.priority = 'critical'; // Regressions are critical

    // Notify with escalation
    await this.slackService.sendRegression({
      workflow,
      payload,
      channel: '#incident-critical',
      mentionTeams: ['@on-call', '@team-lead'],
    });

    // Create high-priority PagerDuty incident
    const incident = await this.pagerDutyService.createIncident({
      title: `[REGRESSION] ${payload.issue.title}`,
      description: `Previously fixed issue has regressed: ${payload.issue.url}`,
      urgency: 'high',
      escalationPolicy: 'immediate',
    });

    workflow.pagerdutyIncidentId = incident.id;
    this.workflows.set(workflow.id, workflow);

    this.emit('alert:regressed', workflow);
  }

  /**
   * Set up auto-escalation timer
   */
  private setUpEscalation(workflow: AlertWorkflow): void {
    const escalationTime = this.ESCALATION_TIMES[workflow.priority];
    const timer = setTimeout(() => {
      this.escalateAlert(workflow);
    }, escalationTime * 60 * 1000);

    this.escalationTimers.set(workflow.id, timer);
  }

  /**
   * Auto-escalate alert if not acknowledged
   */
  private async escalateAlert(workflow: AlertWorkflow): Promise<void> {
    if (workflow.status === 'resolved' || workflow.status === 'acknowledged') {
      return;
    }

    workflow.escalationLevel = Math.min(3, workflow.escalationLevel + 1);
    workflow.updatedAt = new Date();

    const escalationContacts = [
      { level: 0, contact: '@team-lead', channel: '#incidents' },
      { level: 1, contact: '@manager', channel: '#management' },
      { level: 2, contact: '@director', channel: '#executive' },
      { level: 3, contact: '@vp-engineering', channel: '#vp' },
    ];

    const contact = escalationContacts.find(
      (c) => c.level === workflow.escalationLevel
    );

    if (contact) {
      await this.slackService.sendEscalation({
        workflow,
        contact: contact.contact,
        channel: contact.channel,
        level: workflow.escalationLevel,
      });

      // Page via PagerDuty if escalating to director level
      if (workflow.escalationLevel >= 2) {
        await this.pagerDutyService.updateIncident(
          workflow.pagerdutyIncidentId,
          {
            escalationPolicy: 'director-on-call',
          }
        );
      }
    }

    // Set up next escalation if not critical level
    if (workflow.escalationLevel < 3) {
      this.setUpEscalation(workflow);
    }

    this.workflows.set(workflow.id, workflow);
    this.emit('alert:escalated', workflow);
  }

  /**
   * Acknowledge alert (from Slack action button)
   */
  async acknowledgeAlert(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.status = 'acknowledged';
    workflow.acknowledgedAt = new Date();
    workflow.updatedAt = new Date();

    // Clear escalation timer
    if (this.escalationTimers.has(workflowId)) {
      clearTimeout(this.escalationTimers.get(workflowId));
      this.escalationTimers.delete(workflowId);
    }

    // Notify team
    await this.slackService.sendAcknowledgement(workflow);

    // Acknowledge PagerDuty incident
    if (workflow.pagerdutyIncidentId) {
      await this.pagerDutyService.acknowledgeIncident(
        workflow.pagerdutyIncidentId
      );
    }

    this.workflows.set(workflowId, workflow);
    this.emit('alert:acknowledged', workflow);
  }

  /**
   * Get Slack channel based on priority
   */
  private getChannelForPriority(priority: AlertWorkflow['priority']): string {
    const channels = {
      critical: '#incident-critical',
      high: '#incident-high',
      medium: '#incident-medium',
      low: '#incident-low',
    };
    return channels[priority];
  }

  /**
   * Initialize escalation checker (runs every minute)
   */
  private initializeEscalationChecker(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, workflow] of this.workflows.entries()) {
        if (
          workflow.nextEscalationTime &&
          now >= workflow.nextEscalationTime.getTime()
        ) {
          this.escalateAlert(workflow);
        }
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): AlertWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): AlertWorkflow[] {
    return Array.from(this.workflows.values()).filter(
      (w) => w.status !== 'resolved'
    );
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): {
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    averageResolutionTime: number;
  } {
    const allWorkflows = Array.from(this.workflows.values());
    const activeWorkflows = allWorkflows.filter((w) => w.status !== 'resolved');
    const criticalWorkflows = activeWorkflows.filter(
      (w) => w.priority === 'critical'
    );

    const resolutionTimes = allWorkflows
      .filter((w) => w.resolvedAt)
      .map((w) => w.resolvedAt!.getTime() - w.createdAt.getTime());

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    return {
      totalAlerts: allWorkflows.length,
      activeAlerts: activeWorkflows.length,
      criticalAlerts: criticalWorkflows.length,
      averageResolutionTime: avgResolutionTime / 1000 / 60, // Convert to minutes
    };
  }
}

export default SentryAlertsIntegration;
