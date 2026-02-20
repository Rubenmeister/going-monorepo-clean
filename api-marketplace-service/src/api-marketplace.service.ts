/**
 * API Marketplace Service
 * Third-party integrations, webhooks, developer portal, and rate limiting
 */

import { Injectable, Logger } from '@nestjs/common';

export interface Developer {
  id?: string;
  name: string;
  email: string;
  companyName: string;
  website?: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'BANNED';
  verified: boolean;
  createdAt: Date;
  approvedAt?: Date;
}

export interface APIKey {
  id?: string;
  keyId: string;
  developerId: string;
  name: string;
  secret?: string;
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  rateLimit: number; // requests per minute
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface WebhookSubscription {
  id?: string;
  developerId: string;
  events: string[];
  callbackUrl: string;
  isActive: boolean;
  secret?: string;
  retryPolicy: {
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
  };
  createdAt: Date;
}

export interface WebhookEvent {
  id?: string;
  type: string;
  timestamp: Date;
  data: Record<string, any>;
  subscriptions: string[]; // webhook IDs that should receive this
}

export interface RateLimitBucket {
  developerId: string;
  keyId: string;
  requestCount: number;
  resetTime: Date;
}

export interface APIIntegration {
  id?: string;
  integrationCode: string;
  name: string;
  description: string;
  category:
    | 'PAYMENT'
    | 'LOGISTICS'
    | 'ANALYTICS'
    | 'CRM'
    | 'COMMUNICATION'
    | 'CUSTOM';
  developerId: string;
  version: string;
  isPublished: boolean;
  documentation?: string;
  apiEndpoint?: string;
  status: 'DEVELOPMENT' | 'BETA' | 'PRODUCTION';
  installCount: number;
  rating: number; // 0-5
  createdAt: Date;
  updatedAt?: Date;
}

export interface IntegrationInstallation {
  id?: string;
  integrationId: string;
  organizationId: string;
  config: Record<string, any>;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  installCount: number;
  lastError?: string;
  installedAt: Date;
  updatedAt?: Date;
}

export interface APIUsageMetrics {
  developerId: string;
  period: 'DAILY' | 'MONTHLY' | 'YEARLY';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number; // ms
  topEndpoints: { endpoint: string; count: number }[];
  timestamp: Date;
}

@Injectable()
export class ApiMarketplaceService {
  private readonly logger = new Logger(ApiMarketplaceService.name);

  // In-memory storage
  private developers: Map<string, Developer> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private webhookSubscriptions: Map<string, WebhookSubscription> = new Map();
  private webhookEvents: WebhookEvent[] = [];
  private rateLimitBuckets: Map<string, RateLimitBucket> = new Map();
  private integrations: Map<string, APIIntegration> = new Map();
  private installations: Map<string, IntegrationInstallation> = new Map();
  private usageMetrics: APIUsageMetrics[] = [];

  /**
   * Register developer account
   */
  async registerDeveloper(
    name: string,
    email: string,
    companyName: string,
    description: string,
    website?: string
  ): Promise<Developer> {
    try {
      const developerId = `dev-${Date.now()}`;
      const developer: Developer = {
        id: developerId,
        name,
        email,
        companyName,
        website,
        description,
        status: 'PENDING',
        verified: false,
        createdAt: new Date(),
      };

      this.developers.set(developerId, developer);
      this.logger.log(`👨‍💻 Developer registered: ${name} (${companyName})`);

      return developer;
    } catch (error) {
      this.logger.error(`Failed to register developer: ${error}`);
      throw error;
    }
  }

  /**
   * Approve developer account
   */
  async approveDeveloper(developerId: string): Promise<Developer | null> {
    try {
      const developer = this.developers.get(developerId);
      if (!developer) return null;

      developer.status = 'APPROVED';
      developer.verified = true;
      developer.approvedAt = new Date();

      this.logger.log(`✅ Developer approved: ${developer.name}`);
      return developer;
    } catch (error) {
      this.logger.error(`Failed to approve developer: ${error}`);
      throw error;
    }
  }

  /**
   * Create API key for developer
   */
  async createAPIKey(
    developerId: string,
    keyName: string,
    permissions: string[] = [],
    rateLimit: number = 1000,
    expiresInDays?: number
  ): Promise<APIKey> {
    try {
      const developer = this.developers.get(developerId);
      if (!developer || developer.status !== 'APPROVED') {
        throw new Error('Developer not found or not approved');
      }

      const keyId = `key_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
      const secret = this.generateSecret();

      const apiKey: APIKey = {
        id: `apikey-${Date.now()}`,
        keyId,
        developerId,
        name: keyName,
        secret,
        permissions,
        status: 'ACTIVE',
        rateLimit,
        createdAt: new Date(),
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : undefined,
      };

      this.apiKeys.set(keyId, apiKey);

      // Initialize rate limit bucket
      this.rateLimitBuckets.set(keyId, {
        developerId,
        keyId,
        requestCount: 0,
        resetTime: new Date(Date.now() + 60000), // 1 minute window
      });

      this.logger.log(`🔑 API key created: ${keyName} for ${developer.name}`);

      return apiKey;
    } catch (error) {
      this.logger.error(`Failed to create API key: ${error}`);
      throw error;
    }
  }

  /**
   * Revoke API key
   */
  async revokeAPIKey(keyId: string): Promise<boolean> {
    try {
      const apiKey = this.apiKeys.get(keyId);
      if (!apiKey) return false;

      apiKey.status = 'REVOKED';
      this.logger.log(`🚫 API key revoked: ${keyId}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to revoke API key: ${error}`);
      throw error;
    }
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(keyId: string): Promise<boolean> {
    try {
      const bucket = this.rateLimitBuckets.get(keyId);
      const apiKey = this.apiKeys.get(keyId);

      if (!bucket || !apiKey) {
        return false;
      }

      // Reset bucket if time window has passed
      if (new Date() >= bucket.resetTime) {
        bucket.requestCount = 0;
        bucket.resetTime = new Date(Date.now() + 60000);
      }

      if (bucket.requestCount >= apiKey.rateLimit) {
        this.logger.warn(`⚠️ Rate limit exceeded for ${keyId}`);
        return false;
      }

      bucket.requestCount++;
      apiKey.lastUsedAt = new Date();

      return true;
    } catch (error) {
      this.logger.error(`Failed to check rate limit: ${error}`);
      return false;
    }
  }

  /**
   * Subscribe to webhook events
   */
  async subscribeWebhook(
    developerId: string,
    events: string[],
    callbackUrl: string
  ): Promise<WebhookSubscription> {
    try {
      const developer = this.developers.get(developerId);
      if (!developer) {
        throw new Error('Developer not found');
      }

      const webhookId = `webhook-${Date.now()}`;
      const secret = this.generateSecret();

      const subscription: WebhookSubscription = {
        id: webhookId,
        developerId,
        events,
        callbackUrl,
        isActive: true,
        secret,
        retryPolicy: {
          maxRetries: 5,
          retryDelayMs: 1000,
          exponentialBackoff: true,
        },
        createdAt: new Date(),
      };

      this.webhookSubscriptions.set(webhookId, subscription);

      this.logger.log(
        `🪝 Webhook subscription created: ${developerId} -> ${events.join(
          ', '
        )}`
      );

      return subscription;
    } catch (error) {
      this.logger.error(`Failed to subscribe webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Trigger webhook event
   */
  async triggerWebhookEvent(
    eventType: string,
    data: Record<string, any>
  ): Promise<WebhookEvent> {
    try {
      const event: WebhookEvent = {
        id: `event-${Date.now()}`,
        type: eventType,
        timestamp: new Date(),
        data,
        subscriptions: [],
      };

      // Find all subscriptions interested in this event
      const subscriptions = Array.from(
        this.webhookSubscriptions.values()
      ).filter((s) => s.isActive && s.events.includes(eventType));

      event.subscriptions = subscriptions.map((s) => s.id!);

      this.webhookEvents.push(event);

      // Simulate sending webhooks
      for (const subscription of subscriptions) {
        await this.sendWebhook(subscription, event);
      }

      this.logger.log(
        `📨 Webhook event triggered: ${eventType} (${subscriptions.length} subscribers)`
      );

      return event;
    } catch (error) {
      this.logger.error(`Failed to trigger webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Send webhook to subscriber (simulated)
   */
  private async sendWebhook(
    subscription: WebhookSubscription,
    event: WebhookEvent
  ): Promise<boolean> {
    try {
      // In production, this would make HTTP POST request to callbackUrl
      // with signature verification using the secret
      this.logger.log(
        `📡 Webhook sent to ${subscription.callbackUrl} (${event.type})`
      );

      return true;
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error}`);
      return false;
    }
  }

  /**
   * Create API integration
   */
  async createIntegration(
    developerId: string,
    name: string,
    description: string,
    category: APIIntegration['category'],
    version: string = '1.0.0'
  ): Promise<APIIntegration> {
    try {
      const developer = this.developers.get(developerId);
      if (!developer) {
        throw new Error('Developer not found');
      }

      const integrationId = `integration-${Date.now()}`;
      const integrationCode = `${name
        .toLowerCase()
        .replace(/\s+/g, '_')}_${Math.random().toString(36).substring(2, 8)}`;

      const integration: APIIntegration = {
        id: integrationId,
        integrationCode,
        name,
        description,
        category,
        developerId,
        version,
        isPublished: false,
        status: 'DEVELOPMENT',
        installCount: 0,
        rating: 0,
        createdAt: new Date(),
      };

      this.integrations.set(integrationId, integration);

      this.logger.log(`🔧 API integration created: ${name} (v${version})`);

      return integration;
    } catch (error) {
      this.logger.error(`Failed to create integration: ${error}`);
      throw error;
    }
  }

  /**
   * Publish integration to marketplace
   */
  async publishIntegration(
    integrationId: string
  ): Promise<APIIntegration | null> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) return null;

      integration.isPublished = true;
      integration.status = 'PRODUCTION';
      integration.updatedAt = new Date();

      this.logger.log(`📦 Integration published: ${integration.name}`);

      return integration;
    } catch (error) {
      this.logger.error(`Failed to publish integration: ${error}`);
      throw error;
    }
  }

  /**
   * Install integration for organization
   */
  async installIntegration(
    integrationId: string,
    organizationId: string,
    config: Record<string, any>
  ): Promise<IntegrationInstallation> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration || !integration.isPublished) {
        throw new Error('Integration not found or not published');
      }

      const installationId = `install-${Date.now()}`;

      const installation: IntegrationInstallation = {
        id: installationId,
        integrationId,
        organizationId,
        config,
        status: 'ACTIVE',
        installCount: (integration.installCount || 0) + 1,
        installedAt: new Date(),
      };

      this.installations.set(installationId, installation);
      integration.installCount++;

      this.logger.log(
        `✅ Integration installed: ${integration.name} for ${organizationId}`
      );

      return installation;
    } catch (error) {
      this.logger.error(`Failed to install integration: ${error}`);
      throw error;
    }
  }

  /**
   * Uninstall integration
   */
  async uninstallIntegration(installationId: string): Promise<boolean> {
    try {
      const installation = this.installations.get(installationId);
      if (!installation) return false;

      const integration = this.integrations.get(installation.integrationId);
      if (integration && integration.installCount > 0) {
        integration.installCount--;
      }

      this.installations.delete(installationId);

      this.logger.log(`🗑️ Integration uninstalled: ${installationId}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to uninstall integration: ${error}`);
      throw error;
    }
  }

  /**
   * Get API usage metrics
   */
  async getUsageMetrics(
    developerId: string,
    period: 'DAILY' | 'MONTHLY' | 'YEARLY' = 'DAILY'
  ): Promise<APIUsageMetrics | null> {
    try {
      const metrics = this.usageMetrics.find(
        (m) => m.developerId === developerId && m.period === period
      );

      if (!metrics) {
        return {
          developerId,
          period,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageLatency: 0,
          topEndpoints: [],
          timestamp: new Date(),
        };
      }

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get usage metrics: ${error}`);
      throw error;
    }
  }

  /**
   * Record API usage
   */
  async recordUsage(
    keyId: string,
    endpoint: string,
    latency: number,
    success: boolean
  ): Promise<void> {
    try {
      const apiKey = this.apiKeys.get(keyId);
      if (!apiKey) return;

      // Find or create metrics for today
      const today = new Date().toDateString();
      let metrics = this.usageMetrics.find(
        (m) =>
          m.developerId === apiKey.developerId &&
          m.period === 'DAILY' &&
          m.timestamp.toDateString() === today
      );

      if (!metrics) {
        metrics = {
          developerId: apiKey.developerId,
          period: 'DAILY',
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageLatency: 0,
          topEndpoints: [],
          timestamp: new Date(),
        };
        this.usageMetrics.push(metrics);
      }

      metrics.totalRequests++;
      if (success) {
        metrics.successfulRequests++;
      } else {
        metrics.failedRequests++;
      }

      // Update average latency
      metrics.averageLatency =
        (metrics.averageLatency * (metrics.totalRequests - 1) + latency) /
        metrics.totalRequests;

      // Update top endpoints
      const endpointEntry = metrics.topEndpoints.find(
        (e) => e.endpoint === endpoint
      );
      if (endpointEntry) {
        endpointEntry.count++;
      } else {
        metrics.topEndpoints.push({ endpoint, count: 1 });
      }

      // Keep only top 5 endpoints
      metrics.topEndpoints = metrics.topEndpoints
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      this.logger.error(`Failed to record usage: ${error}`);
    }
  }

  /**
   * Get marketplace integrations
   */
  async getMarketplaceIntegrations(
    category?: APIIntegration['category']
  ): Promise<APIIntegration[]> {
    try {
      let integrations = Array.from(this.integrations.values()).filter(
        (i) => i.isPublished
      );

      if (category) {
        integrations = integrations.filter((i) => i.category === category);
      }

      return integrations.sort((a, b) => b.rating - a.rating);
    } catch (error) {
      this.logger.error(`Failed to get marketplace integrations: ${error}`);
      throw error;
    }
  }

  /**
   * Get developer dashboard
   */
  async getDeveloperDashboard(developerId: string): Promise<any> {
    try {
      const developer = this.developers.get(developerId);
      if (!developer) return null;

      const apiKeys = Array.from(this.apiKeys.values()).filter(
        (k) => k.developerId === developerId
      );

      const integrations = Array.from(this.integrations.values()).filter(
        (i) => i.developerId === developerId
      );

      const webhookSubscriptions = Array.from(
        this.webhookSubscriptions.values()
      ).filter((w) => w.developerId === developerId);

      const totalInstalls = integrations.reduce(
        (sum, i) => sum + i.installCount,
        0
      );

      return {
        developer: {
          id: developer.id,
          name: developer.name,
          company: developer.companyName,
          status: developer.status,
          verified: developer.verified,
        },
        apiKeys: {
          total: apiKeys.length,
          active: apiKeys.filter((k) => k.status === 'ACTIVE').length,
          revoked: apiKeys.filter((k) => k.status === 'REVOKED').length,
        },
        integrations: {
          total: integrations.length,
          published: integrations.filter((i) => i.isPublished).length,
          totalInstalls,
        },
        webhooks: {
          subscriptions: webhookSubscriptions.length,
          active: webhookSubscriptions.filter((w) => w.isActive).length,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get developer dashboard: ${error}`);
      throw error;
    }
  }

  // Helper methods

  private generateSecret(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }
}
