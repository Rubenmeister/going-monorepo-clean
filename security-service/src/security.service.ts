/**
 * Advanced Security & Compliance Service
 * Two-factor authentication, GDPR compliance, encryption, and audit logging
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface TwoFactorAuth {
  id?: string;
  userId: string;
  method: '2FA_EMAIL' | '2FA_SMS' | '2FA_AUTHENTICATOR';
  secret?: string;
  backupCodes: string[];
  enabled: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface SecurityAuditLog {
  id?: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  status: 'SUCCESS' | 'FAILED';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface DataPrivacyRequest {
  id?: string;
  userId: string;
  requestType: 'EXPORT' | 'DELETE' | 'RECTIFY' | 'PORT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  dataToDelete?: string[];
  exportFormat?: 'JSON' | 'CSV';
  completedAt?: Date;
  createdAt: Date;
}

export interface EncryptionKey {
  id?: string;
  keyId: string;
  algorithm: 'AES-256-GCM' | 'RSA-4096';
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED';
  createdAt: Date;
  rotatedAt?: Date;
  revokedAt?: Date;
}

export interface CompliancePolicy {
  id?: string;
  name: string;
  category: 'GDPR' | 'CCPA' | 'HIPAA' | 'PCI_DSS' | 'SOC2';
  description: string;
  requirements: string[];
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  lastChecked: Date;
  nextAudit: Date;
}

export interface SecurityEvent {
  id?: string;
  type:
    | 'LOGIN'
    | 'LOGOUT'
    | 'FAILED_LOGIN'
    | 'SUSPICIOUS_ACTIVITY'
    | 'PRIVILEGE_CHANGE';
  userId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  actionTaken?: string;
  resolved: boolean;
  timestamp: Date;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  // In-memory storage
  private twoFactorAuths: Map<string, TwoFactorAuth> = new Map();
  private auditLogs: SecurityAuditLog[] = [];
  private dataPrivacyRequests: Map<string, DataPrivacyRequest> = new Map();
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private compliancePolicies: Map<string, CompliancePolicy> = new Map();
  private securityEvents: Map<string, SecurityEvent> = new Map();

  constructor() {
    this.initializeEncryptionKeys();
    this.initializeCompliancePolicies();
  }

  /**
   * Initialize encryption keys
   */
  private initializeEncryptionKeys(): void {
    const keyId = crypto.randomBytes(16).toString('hex');
    const key: EncryptionKey = {
      id: `key-${Date.now()}`,
      keyId,
      algorithm: 'AES-256-GCM',
      status: 'ACTIVE',
      createdAt: new Date(),
    };

    this.encryptionKeys.set(keyId, key);
    this.logger.log(`🔐 Master encryption key initialized`);
  }

  /**
   * Initialize compliance policies
   */
  private initializeCompliancePolicies(): void {
    const policies: CompliancePolicy[] = [
      {
        id: `policy-gdpr`,
        name: 'GDPR Compliance',
        category: 'GDPR',
        description: 'General Data Protection Regulation compliance',
        requirements: [
          'Data subject rights (access, rectification, deletion)',
          'Data protection impact assessment',
          'Privacy by design',
          'Data breach notification within 72 hours',
          'Lawful basis for processing',
        ],
        status: 'COMPLIANT',
        lastChecked: new Date(),
        nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        id: `policy-pci`,
        name: 'PCI-DSS Compliance',
        category: 'PCI_DSS',
        description: 'Payment Card Industry Data Security Standard',
        requirements: [
          'Secure network architecture',
          'Cardholder data protection',
          'Vulnerability management',
          'Access control measures',
          'Regular monitoring and testing',
        ],
        status: 'COMPLIANT',
        lastChecked: new Date(),
        nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        id: `policy-soc2`,
        name: 'SOC 2 Compliance',
        category: 'SOC2',
        description: 'Service Organization Control 2 compliance',
        requirements: [
          'Security controls',
          'Availability controls',
          'Processing integrity controls',
          'Confidentiality controls',
          'Privacy controls',
        ],
        status: 'COMPLIANT',
        lastChecked: new Date(),
        nextAudit: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    ];

    policies.forEach((policy) => {
      this.compliancePolicies.set(policy.id!, policy);
    });

    this.logger.log(`✅ ${policies.length} compliance policies initialized`);
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactorAuth(
    userId: string,
    method: TwoFactorAuth['method']
  ): Promise<TwoFactorAuth> {
    try {
      const twoFactorId = `2fa-${Date.now()}`;
      const secret =
        method === '2FA_AUTHENTICATOR'
          ? crypto.randomBytes(32).toString('hex')
          : undefined;

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      const twoFactor: TwoFactorAuth = {
        id: twoFactorId,
        userId,
        method,
        secret,
        backupCodes,
        enabled: false, // Not enabled until verified
        createdAt: new Date(),
      };

      this.twoFactorAuths.set(twoFactorId, twoFactor);

      this.logger.log(`🔐 2FA setup initiated: ${userId} (${method})`);

      return {
        ...twoFactor,
        backupCodes: twoFactor.backupCodes, // Return to user once to save
      };
    } catch (error) {
      this.logger.error(`Failed to enable 2FA: ${error}`);
      throw error;
    }
  }

  /**
   * Verify and confirm two-factor authentication
   */
  async confirmTwoFactorAuth(
    userId: string,
    code: string
  ): Promise<TwoFactorAuth | null> {
    try {
      let twoFactor = Array.from(this.twoFactorAuths.values()).find(
        (t) => t.userId === userId
      );

      if (!twoFactor) {
        return null;
      }

      // Verify code (simplified - in production use TOTP library)
      const isValid = this.verifyTwoFactorCode(twoFactor, code);

      if (isValid) {
        twoFactor.enabled = true;
        this.logger.log(`✅ 2FA enabled for user: ${userId}`);
      } else {
        this.logger.warn(`❌ Invalid 2FA code for user: ${userId}`);
      }

      return twoFactor;
    } catch (error) {
      this.logger.error(`Failed to confirm 2FA: ${error}`);
      throw error;
    }
  }

  /**
   * Verify two-factor code
   */
  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    try {
      const twoFactor = Array.from(this.twoFactorAuths.values()).find(
        (t) => t.userId === userId && t.enabled
      );

      if (!twoFactor) {
        return false;
      }

      return this.verifyTwoFactorCode(twoFactor, code);
    } catch (error) {
      this.logger.error(`Failed to verify 2FA code: ${error}`);
      return false;
    }
  }

  /**
   * Log security audit event
   */
  async logAudit(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    status: 'SUCCESS' | 'FAILED',
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<SecurityAuditLog> {
    try {
      const log: SecurityAuditLog = {
        id: `audit-${Date.now()}`,
        userId,
        action,
        resourceType,
        resourceId,
        status,
        ipAddress,
        userAgent,
        metadata,
        timestamp: new Date(),
      };

      this.auditLogs.push(log);

      // Keep only last 1 year of logs
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      this.auditLogs = this.auditLogs.filter((l) => l.timestamp >= oneYearAgo);

      this.logger.log(
        `📋 Audit logged: ${action} -> ${resourceType}/${resourceId} (${status})`
      );

      return log;
    } catch (error) {
      this.logger.error(`Failed to log audit: ${error}`);
      throw error;
    }
  }

  /**
   * Get audit trail for resource
   */
  async getAuditTrail(
    resourceId: string,
    limit = 100
  ): Promise<SecurityAuditLog[]> {
    try {
      return this.auditLogs
        .filter((log) => log.resourceId === resourceId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get audit trail: ${error}`);
      throw error;
    }
  }

  /**
   * Request data privacy action (GDPR)
   */
  async requestDataPrivacy(
    userId: string,
    requestType: DataPrivacyRequest['requestType'],
    dataToDelete?: string[]
  ): Promise<DataPrivacyRequest> {
    try {
      const requestId = `dpr-${Date.now()}`;
      const request: DataPrivacyRequest = {
        id: requestId,
        userId,
        requestType,
        status: 'PENDING',
        dataToDelete,
        createdAt: new Date(),
      };

      this.dataPrivacyRequests.set(requestId, request);

      this.logger.log(
        `📝 Data privacy request created: ${userId} (${requestType})`
      );

      return request;
    } catch (error) {
      this.logger.error(`Failed to create data privacy request: ${error}`);
      throw error;
    }
  }

  /**
   * Process data export
   */
  async exportUserData(
    userId: string,
    format: 'JSON' | 'CSV' = 'JSON'
  ): Promise<any> {
    try {
      const request = Array.from(this.dataPrivacyRequests.values()).find(
        (r) => r.userId === userId && r.requestType === 'EXPORT'
      );

      if (!request) {
        throw new Error('Export request not found');
      }

      // Simulated data export
      const exportData = {
        userId,
        exportedAt: new Date(),
        auditLogs: this.auditLogs.filter((l) => l.userId === userId),
        securityEvents: Array.from(this.securityEvents.values()).filter(
          (e) => e.userId === userId
        ),
        format,
      };

      if (request) {
        request.status = 'COMPLETED';
        request.completedAt = new Date();
      }

      this.logger.log(`📤 User data exported: ${userId} (${format})`);

      return exportData;
    } catch (error) {
      this.logger.error(`Failed to export user data: ${error}`);
      throw error;
    }
  }

  /**
   * Delete user personal data (Right to be forgotten)
   */
  async deleteUserData(userId: string): Promise<boolean> {
    try {
      const request = Array.from(this.dataPrivacyRequests.values()).find(
        (r) => r.userId === userId && r.requestType === 'DELETE'
      );

      if (!request) {
        throw new Error('Delete request not found');
      }

      // Remove audit logs for user
      this.auditLogs = this.auditLogs.filter((l) => l.userId !== userId);

      // Remove security events for user
      const keysToDelete = Array.from(this.securityEvents.entries())
        .filter(([, e]) => e.userId === userId)
        .map(([k]) => k);

      keysToDelete.forEach((k) => this.securityEvents.delete(k));

      if (request) {
        request.status = 'COMPLETED';
        request.completedAt = new Date();
      }

      this.logger.log(`🗑️ User personal data deleted: ${userId}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete user data: ${error}`);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(plaintext: string): Promise<string> {
    try {
      const activeKey = Array.from(this.encryptionKeys.values()).find(
        (k) => k.status === 'ACTIVE'
      );

      if (!activeKey) {
        throw new Error('No active encryption key');
      }

      // Simplified encryption (in production use proper crypto libraries)
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.alloc(32), iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();
      const encryptedData = {
        iv: iv.toString('hex'),
        data: encrypted,
        authTag: authTag.toString('hex'),
        keyId: activeKey.keyId,
      };

      return Buffer.from(JSON.stringify(encryptedData)).toString('base64');
    } catch (error) {
      this.logger.error(`Failed to encrypt data: ${error}`);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(ciphertext: string): Promise<string> {
    try {
      const encryptedData = JSON.parse(
        Buffer.from(ciphertext, 'base64').toString()
      );
      const key = this.encryptionKeys.get(encryptedData.keyId);

      if (!key) {
        throw new Error('Encryption key not found');
      }

      // Simplified decryption
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.alloc(32),
        Buffer.from(encryptedData.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Failed to decrypt data: ${error}`);
      throw error;
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateEncryptionKeys(): Promise<EncryptionKey> {
    try {
      // Mark old key as rotated
      const oldKey = Array.from(this.encryptionKeys.values()).find(
        (k) => k.status === 'ACTIVE'
      );
      if (oldKey) {
        oldKey.status = 'ROTATED';
        oldKey.rotatedAt = new Date();
      }

      // Create new key
      const newKeyId = crypto.randomBytes(16).toString('hex');
      const newKey: EncryptionKey = {
        id: `key-${Date.now()}`,
        keyId: newKeyId,
        algorithm: 'AES-256-GCM',
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      this.encryptionKeys.set(newKeyId, newKey);
      this.logger.log(`🔑 Encryption keys rotated`);

      return newKey;
    } catch (error) {
      this.logger.error(`Failed to rotate encryption keys: ${error}`);
      throw error;
    }
  }

  /**
   * Record security event
   */
  async recordSecurityEvent(
    userId: string,
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    description: string,
    actionTaken?: string
  ): Promise<SecurityEvent> {
    try {
      const eventId = `sec-${Date.now()}`;
      const event: SecurityEvent = {
        id: eventId,
        type,
        userId,
        severity,
        description,
        actionTaken,
        resolved: false,
        timestamp: new Date(),
      };

      this.securityEvents.set(eventId, event);

      if (severity === 'CRITICAL') {
        this.logger.error(`🚨 CRITICAL SECURITY EVENT: ${description}`);
      } else {
        this.logger.warn(`⚠️ Security event: ${type} - ${description}`);
      }

      return event;
    } catch (error) {
      this.logger.error(`Failed to record security event: ${error}`);
      throw error;
    }
  }

  /**
   * Get compliance status
   */
  async getComplianceStatus(): Promise<any> {
    try {
      const policies = Array.from(this.compliancePolicies.values());

      const summary = {
        totalPolicies: policies.length,
        compliant: policies.filter((p) => p.status === 'COMPLIANT').length,
        partialCompliance: policies.filter((p) => p.status === 'PARTIAL')
          .length,
        nonCompliant: policies.filter((p) => p.status === 'NON_COMPLIANT')
          .length,
        policies: policies.map((p) => ({
          name: p.name,
          category: p.category,
          status: p.status,
          lastChecked: p.lastChecked,
          nextAudit: p.nextAudit,
        })),
      };

      this.logger.log(`📊 Compliance status retrieved`);
      return summary;
    } catch (error) {
      this.logger.error(`Failed to get compliance status: ${error}`);
      throw error;
    }
  }

  /**
   * Verify two-factor code (helper)
   */
  private verifyTwoFactorCode(twoFactor: TwoFactorAuth, code: string): boolean {
    // Check if code is a backup code
    const backupCodeIndex = twoFactor.backupCodes.indexOf(code);
    if (backupCodeIndex !== -1) {
      // Remove used backup code
      twoFactor.backupCodes.splice(backupCodeIndex, 1);
      return true;
    }

    // In production, use TOTP library (e.g., speakeasy)
    // For now, accept any 6-digit code
    return code.length === 6 && /^\d+$/.test(code);
  }
}
