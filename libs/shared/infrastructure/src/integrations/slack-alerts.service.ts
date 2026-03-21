/**
 * Slack Alerts Integration Service
 * Sends rich formatted alerts with action buttons to Slack
 */

import { WebClient, LogLevel } from '@slack/web-api';
import {
  AlertWorkflow,
  SentryWebhookPayload,
} from '../../../config/sentry-alerts.integration';

export class SlackAlertsService {
  private slack: WebClient;

  constructor() {
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN, {
      logLevel: LogLevel.DEBUG,
    });
  }

  /**
   * Send alert to Slack with action buttons
   */
  async sendAlert(options: {
    workflow: AlertWorkflow;
    payload: SentryWebhookPayload;
    channel: string;
    includeActionButtons: boolean;
  }): Promise<void> {
    const { workflow, payload, channel, includeActionButtons } = options;

    const priorityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
    };

    const color = {
      critical: '#FF0000',
      high: '#FF8C00',
      medium: '#FFD700',
      low: '#0066FF',
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${
            priorityEmoji[workflow.priority]
          } ${workflow.priority.toUpperCase()} - ${payload.issue.title}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Project:*\n${payload.project.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Level:*\n${payload.issue.level.toUpperCase()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Logger:*\n${payload.issue.logger}`,
          },
          {
            type: 'mrkdwn',
            text: `*Culprit:*\n${payload.issue.culprit}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:*\n\`\`\`${payload.issue.title}\`\`\``,
        },
      },
      {
        type: 'divider',
      },
    ];

    // Add action buttons if enabled
    if (includeActionButtons) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '👀 View in Sentry',
              emoji: true,
            },
            url: payload.issue.url,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Acknowledge',
              emoji: true,
            },
            action_id: `alert_acknowledge_${workflow.id}`,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🚀 Escalate',
              emoji: true,
            },
            action_id: `alert_escalate_${workflow.id}`,
            style: 'danger',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🔇 Snooze (1h)',
              emoji: true,
            },
            action_id: `alert_snooze_${workflow.id}`,
          },
        ],
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🆔 Workflow: ${workflow.id} | 📅 ${new Date().toISOString()}`,
        },
      ],
    });

    try {
      const result = await this.slack.chat.postMessage({
        channel,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
        metadata: {
          event_type: 'alert_created',
          event_payload: {
            workflow_id: workflow.id,
            issue_id: payload.issue.id,
          },
        },
      });

      console.log(`[Slack] Alert sent to ${channel}`, result.ts);
    } catch (error) {
      console.error('[Slack] Error sending alert:', error);
      throw error;
    }
  }

  /**
   * Send alert resolution message
   */
  async sendResolution(workflow: AlertWorkflow): Promise<void> {
    const channel = this.getChannelForPriority(workflow.priority);

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `✅ RESOLVED - Alert #${workflow.sentryIssueId}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status:*\nResolved`,
          },
          {
            type: 'mrkdwn',
            text: `*Resolution Time:*\n${this.calculateDuration(
              workflow.createdAt,
              workflow.resolvedAt
            )}`,
          },
          {
            type: 'mrkdwn',
            text: `*Workflow ID:*\n${workflow.id}`,
          },
          {
            type: 'mrkdwn',
            text: `*Acknowledged:*\n${workflow.acknowledgedAt ? 'Yes' : 'No'}`,
          },
        ],
      },
    ];

    try {
      await this.slack.chat.postMessage({
        channel,
        blocks,
      });

      console.log(`[Slack] Resolution message sent to ${channel}`);
    } catch (error) {
      console.error('[Slack] Error sending resolution:', error);
      throw error;
    }
  }

  /**
   * Send regression alert
   */
  async sendRegression(options: {
    workflow: AlertWorkflow;
    payload: SentryWebhookPayload;
    channel: string;
    mentionTeams: string[];
  }): Promise<void> {
    const { workflow, payload, channel, mentionTeams } = options;

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🔴 REGRESSION ALERT - ${payload.issue.title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${mentionTeams.join(
            ' '
          )} - A previously fixed issue has regressed!`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Issue:*\n${payload.issue.title}`,
          },
          {
            type: 'mrkdwn',
            text: `*Project:*\n${payload.project.name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Severity:*\nCRITICAL`,
          },
          {
            type: 'mrkdwn',
            text: `*Action Required:*\nImmediate investigation`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Issue',
              emoji: true,
            },
            url: payload.issue.url,
            style: 'danger',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Create Incident',
              emoji: true,
            },
            action_id: `regression_incident_${workflow.id}`,
            style: 'danger',
          },
        ],
      },
    ];

    try {
      await this.slack.chat.postMessage({
        channel,
        blocks,
        text: `Regression Alert: ${payload.issue.title}`,
      });

      console.log(`[Slack] Regression alert sent to ${channel}`);
    } catch (error) {
      console.error('[Slack] Error sending regression alert:', error);
      throw error;
    }
  }

  /**
   * Send escalation notification
   */
  async sendEscalation(options: {
    workflow: AlertWorkflow;
    contact: string;
    channel: string;
    level: number;
  }): Promise<void> {
    const { workflow, contact, channel, level } = options;

    const escalationLevelText = [
      'Team Lead',
      'Manager',
      'Director',
      'VP Engineering',
    ][level];

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⚠️ ESCALATION LEVEL ${level + 1}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${contact} - Alert has been escalated to ${escalationLevelText} due to no acknowledgment.`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Alert ID:*\n${workflow.id}`,
          },
          {
            type: 'mrkdwn',
            text: `*Duration:*\n${this.calculateDuration(
              workflow.createdAt,
              new Date()
            )}`,
          },
          {
            type: 'mrkdwn',
            text: `*Priority:*\n${workflow.priority.toUpperCase()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Escalation Level:*\n${level + 1}/4`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Acknowledge Now',
              emoji: true,
            },
            action_id: `alert_acknowledge_${workflow.id}`,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Details',
              emoji: true,
            },
            action_id: `alert_details_${workflow.id}`,
          },
        ],
      },
    ];

    try {
      await this.slack.chat.postMessage({
        channel,
        blocks,
        text: `Alert Escalation Level ${level + 1}`,
      });

      console.log(`[Slack] Escalation message sent to ${channel}`);
    } catch (error) {
      console.error('[Slack] Error sending escalation:', error);
      throw error;
    }
  }

  /**
   * Send acknowledgment confirmation
   */
  async sendAcknowledgement(workflow: AlertWorkflow): Promise<void> {
    const channel = this.getChannelForPriority(workflow.priority);

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ Alert #${workflow.sentryIssueId} has been acknowledged and is in progress.`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Acknowledged at ${workflow.acknowledgedAt?.toISOString()}`,
          },
        ],
      },
    ];

    try {
      await this.slack.chat.postMessage({
        channel,
        blocks,
      });

      console.log(`[Slack] Acknowledgement sent to ${channel}`);
    } catch (error) {
      console.error('[Slack] Error sending acknowledgement:', error);
      throw error;
    }
  }

  /**
   * Handle Slack slash command
   */
  async handleSlashCommand(
    command: string,
    args: string[]
  ): Promise<{ text: string; blocks: any[] }> {
    if (command === 'alert') {
      const subcommand = args[0];
      const alertId = args[1];

      if (subcommand === 'status') {
        return {
          text: 'Alert status command',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Status of alert ${alertId}: Pending`,
              },
            },
          ],
        };
      }
    }

    return {
      text: 'Unknown command',
      blocks: [],
    };
  }

  /**
   * Get Slack channel based on priority
   */
  private getChannelForPriority(priority: string): string {
    const channels = {
      critical: '#incident-critical',
      high: '#incident-high',
      medium: '#incident-medium',
      low: '#incident-low',
    };
    return channels[priority as keyof typeof channels] || '#incidents';
  }

  /**
   * Calculate duration between two dates
   */
  private calculateDuration(start: Date, end?: Date): string {
    const duration = (end || new Date()).getTime() - start.getTime();
    const minutes = Math.floor(duration / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  /**
   * Send test message to Slack
   */
  async sendTestMessage(channel: string = '#test'): Promise<void> {
    try {
      await this.slack.chat.postMessage({
        channel,
        text: '🧪 Test message from Going Platform',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '🧪 Slack integration is working correctly!',
            },
          },
        ],
      });

      console.log(`[Slack] Test message sent to ${channel}`);
    } catch (error) {
      console.error('[Slack] Error sending test message:', error);
      throw error;
    }
  }
}

export default new SlackAlertsService();
