/**
 * PagerDuty Integration Service
 * Manages incident creation, acknowledgment, and escalation
 */

import axios, { AxiosInstance } from 'axios';

export interface PagerDutyIncident {
  id: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  url: string;
  escalationPolicy?: string;
  urgency: 'high' | 'low';
}

export interface IncidentBody {
  type: 'incident_body';
  details: Record<string, any>;
}

export class PagerDutyService {
  private client: AxiosInstance;
  private apiToken: string;
  private serviceId: string;
  private escalationPolicyId: string;

  constructor() {
    this.apiToken = process.env.PAGERDUTY_API_KEY || '';
    this.serviceId = process.env.PAGERDUTY_SERVICE_ID || '';
    this.escalationPolicyId = process.env.PAGERDUTY_ESCALATION_POLICY_ID || '';

    this.client = axios.create({
      baseURL: 'https://api.pagerduty.com',
      headers: {
        Authorization: `Token token=${this.apiToken}`,
        Accept: 'application/vnd.pagerduty+json;version=2',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new incident in PagerDuty
   */
  async createIncident(options: {
    title: string;
    description?: string;
    service: string;
    urgency?: 'high' | 'low';
    escalationPolicy?: string;
    body?: IncidentBody;
  }): Promise<PagerDutyIncident> {
    try {
      const response = await this.client.post('/incidents', {
        incident: {
          type: 'incident',
          title: options.title,
          description: options.description,
          service: {
            type: 'service_reference',
            id: this.serviceId,
          },
          urgency: options.urgency || 'low',
          escalation_policy: options.escalationPolicy
            ? {
                type: 'escalation_policy_reference',
                id: options.escalationPolicy,
              }
            : undefined,
          body: options.body,
        },
      });

      return this.formatIncident(response.data.incident);
    } catch (error) {
      console.error('[PagerDuty] Error creating incident:', error);
      throw error;
    }
  }

  /**
   * Acknowledge an incident
   */
  async acknowledgeIncident(incidentId: string): Promise<PagerDutyIncident> {
    try {
      const response = await this.client.put(`/incidents/${incidentId}`, {
        incident: {
          type: 'incident_reference',
          status: 'acknowledged',
        },
      });

      return this.formatIncident(response.data.incident);
    } catch (error) {
      console.error('[PagerDuty] Error acknowledging incident:', error);
      throw error;
    }
  }

  /**
   * Resolve an incident
   */
  async resolveIncident(incidentId: string): Promise<PagerDutyIncident> {
    try {
      const response = await this.client.put(`/incidents/${incidentId}`, {
        incident: {
          type: 'incident_reference',
          status: 'resolved',
        },
      });

      return this.formatIncident(response.data.incident);
    } catch (error) {
      console.error('[PagerDuty] Error resolving incident:', error);
      throw error;
    }
  }

  /**
   * Update incident escalation policy
   */
  async updateIncident(
    incidentId: string,
    options: { escalationPolicy?: string }
  ): Promise<PagerDutyIncident> {
    try {
      const updatePayload: any = {
        incident: {
          type: 'incident_reference',
        },
      };

      if (options.escalationPolicy) {
        updatePayload.incident.escalation_policy = {
          type: 'escalation_policy_reference',
          id: options.escalationPolicy,
        };
      }

      const response = await this.client.put(
        `/incidents/${incidentId}`,
        updatePayload
      );

      return this.formatIncident(response.data.incident);
    } catch (error) {
      console.error('[PagerDuty] Error updating incident:', error);
      throw error;
    }
  }

  /**
   * Get incident details
   */
  async getIncident(incidentId: string): Promise<PagerDutyIncident> {
    try {
      const response = await this.client.get(`/incidents/${incidentId}`);
      return this.formatIncident(response.data.incident);
    } catch (error) {
      console.error('[PagerDuty] Error fetching incident:', error);
      throw error;
    }
  }

  /**
   * List oncalls for a service
   */
  async getOncall(
    serviceId?: string
  ): Promise<Array<{ id: string; email: string; name: string }>> {
    try {
      const response = await this.client.get('/oncalls', {
        params: {
          service_ids: [serviceId || this.serviceId],
          include: ['users'],
        },
      });

      return response.data.oncalls.map((oncall: any) => ({
        id: oncall.user.id,
        email: oncall.user.email,
        name: oncall.user.summary,
      }));
    } catch (error) {
      console.error('[PagerDuty] Error fetching oncall:', error);
      throw error;
    }
  }

  /**
   * Create a note on an incident
   */
  async addIncidentNote(
    incidentId: string,
    noteContent: string
  ): Promise<void> {
    try {
      await this.client.post(`/incidents/${incidentId}/notes`, {
        note: {
          content: noteContent,
        },
      });
    } catch (error) {
      console.error('[PagerDuty] Error adding note:', error);
      throw error;
    }
  }

  /**
   * Snooze an incident
   */
  async snoozeIncident(
    incidentId: string,
    duration: number
  ): Promise<PagerDutyIncident> {
    try {
      const response = await this.client.post(
        `/incidents/${incidentId}/snooze`,
        {
          duration,
        }
      );

      return this.formatIncident(response.data.incident);
    } catch (error) {
      console.error('[PagerDuty] Error snoozing incident:', error);
      throw error;
    }
  }

  /**
   * Format incident response
   */
  private formatIncident(incident: any): PagerDutyIncident {
    return {
      id: incident.id,
      status: incident.status,
      url: incident.html_url,
      urgency: incident.urgency,
      escalationPolicy: incident.escalation_policy?.id,
    };
  }

  /**
   * Send test event to PagerDuty
   */
  async sendTestEvent(): Promise<void> {
    try {
      const response = await axios.post(
        'https://events.pagerduty.com/v2/enqueue',
        {
          routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
          event_action: 'trigger',
          dedup_key: `going-platform-test-${Date.now()}`,
          payload: {
            summary: 'Going Platform - Test Event',
            severity: 'info',
            source: 'Going Platform',
            custom_details: {
              message: 'This is a test event from Going Platform',
              timestamp: new Date().toISOString(),
            },
          },
        }
      );

      console.log('[PagerDuty] Test event sent successfully', response.data);
    } catch (error) {
      console.error('[PagerDuty] Error sending test event:', error);
      throw error;
    }
  }
}

export default new PagerDutyService();
