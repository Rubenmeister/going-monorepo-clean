import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

// ============ Consent Recording ============
export class RecordConsentDto {
  @IsString()
  bookingId: string;

  @IsString()
  companyId: string;

  @IsString()
  userId: string;

  @IsBoolean()
  granted: boolean;

  @IsString()
  ipAddress: string;

  @IsString()
  deviceId: string;
}

export class ConsentResponseDto {
  success: boolean;
  logId: string;
  timestamp: string;
}

// ============ Audit Log Query ============
export class AuditLogsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  action?: string; // comma-separated actions

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @IsOptional()
  @Min(0)
  offset?: number = 0;
}

export class AuditLogEntryDto {
  logId: string;
  action: string;
  actorId: string;
  actorEmail: string;
  targetUserId?: string;
  bookingId?: string;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditLogsResponseDto {
  logs: AuditLogEntryDto[];
  total: number;
  limit: number;
  offset: number;
}

// ============ Data Subject Access Request ============
export class DataSubjectAccessDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(['json', 'csv'])
  format?: 'json' | 'csv' = 'json';
}

export class DataAccessEventDto {
  timestamp: string;
  actor: string;
  actorEmail: string;
  action: string;
  bookingId?: string;
  purpose?: string;
}

export class ConsentHistoryEntryDto {
  bookingId: string;
  timestamp: string;
  granted: boolean;
  deviceId?: string;
}

export class DataSubjectAccessResponseDto {
  userId: string;
  email: string;
  dataAccessLog: DataAccessEventDto[];
  consentHistory: ConsentHistoryEntryDto[];
  exportDate: string;
}

// ============ Consent Compliance Report ============
export class ConsentReportDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ConsentReportResponseDto {
  period: {
    from: string;
    to: string;
  };
  companyName: string;
  totalTrips: number;
  trackingEnabled: number;
  trackingEnabledPercent: number;
  trackingDeclined: number;
  trackingDeclinedPercent: number;
  revocations: number;
  revocationsPercent: number;
  employeeConsent: Array<{
    userId: string;
    email: string;
    consentRate: number;
    tripsTotal: number;
    tripsConsented: number;
    tripsDeclined: number;
  }>;
  summary: string;
}

// ============ Access Audit Report ============
export class AccessReportDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AccessReportResponseDto {
  period: {
    from: string;
    to: string;
  };
  companyName: string;
  totalLocationViews: number;
  uniqueViewers: number;
  averageViewsPerTrip: number;
  managerActivity: Array<{
    managerId: string;
    managerEmail: string;
    viewCount: number;
    employeesMonitored: number;
    averageViewsPerEmployee: number;
  }>;
  temporalDistribution: {
    businessHours: number;
    businessHoursPercent: number;
    afterHours: number;
    afterHoursPercent: number;
  };
  riskFlags: Array<{
    managerId: string;
    managerEmail: string;
    flag: string;
    details: string;
  }>;
}

// ============ Manual Log Purge ============
export class DeleteLogsDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsDateString()
  before?: string; // delete logs before this date

  @IsBoolean()
  @IsOptional()
  confirmation?: boolean = false; // must confirm deletion
}

export class DeleteLogsResponseDto {
  success: boolean;
  deletedCount: number;
  companyId: string;
  timestamp: string;
  auditLogId: string; // log ID of this deletion event
}
