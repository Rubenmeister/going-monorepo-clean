/**
 * Admin Portal Domain Models
 * User management, company settings, and system configuration
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface AdminUser {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanySettings {
  companyId: string;
  companyName: string;
  industryType: string;
  timezone: string;
  currency: string;
  language: string;
  logoUrl?: string;
  websiteUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  billingAddress?: string;
  maxUsers: number;
  features: string[];
  integrations: string[];
  customBranding: boolean;
  twoFactorEnabled: boolean;
  ssoEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfiguration {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maxUploadSize: number; // MB
  sessionTimeout: number; // minutes
  passwordPolicy: {
    minLength: number;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  emailConfig: {
    provider: string;
    apiKey?: string;
  };
  backupConfig: {
    enabled: boolean;
    frequency: string;
    retentionDays: number;
  };
  securityConfig: {
    enforceHttps: boolean;
    corsOrigins: string[];
    rateLimitEnabled: boolean;
    rateLimitPerMinute: number;
  };
}

export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  timestamp: Date;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  activeCompanies: number;
  databaseSize: number; // MB
  storageUsed: number; // MB
  apiCallsToday: number;
  averageResponseTime: number;
  errorRate: number;
  lastBackupTime: Date;
}
