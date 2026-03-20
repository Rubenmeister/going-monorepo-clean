import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_CHANGE'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'TOKEN_REFRESH'
  | 'TOKEN_REVOKE'
  | 'ACCOUNT_LOCK'
  | 'ACCOUNT_UNLOCK';

export type ResourceType =
  | 'users'
  | 'accommodations'
  | 'bookings'
  | 'payments'
  | 'transport'
  | 'tracking'
  | 'experiences'
  | 'tours'
  | 'parcels'
  | 'notifications'
  | 'admin_settings'
  | 'auth';

export type AuditResult = 'success' | 'failure' | 'partial';

export interface FieldChange {
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface AuditLogProps {
  id: UUID;
  userId: string;        // can be 'anonymous' for pre-auth actions
  serviceId: string;
  ipAddress: string;
  action: AuditActionType;
  resourceType: ResourceType;
  resourceId: string;
  changes?: FieldChange[];
  timestamp: Date;
  duration: number;      // milliseconds
  result: AuditResult;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLog {
  readonly id: UUID;
  readonly userId: string;
  readonly serviceId: string;
  readonly ipAddress: string;
  readonly action: AuditActionType;
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly changes?: FieldChange[];
  readonly timestamp: Date;
  readonly duration: number;
  readonly result: AuditResult;
  readonly errorMessage?: string;
  readonly metadata?: Record<string, unknown>;

  private constructor(props: AuditLogProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.serviceId = props.serviceId;
    this.ipAddress = props.ipAddress;
    this.action = props.action;
    this.resourceType = props.resourceType;
    this.resourceId = props.resourceId;
    this.changes = props.changes;
    this.timestamp = props.timestamp;
    this.duration = props.duration;
    this.result = props.result;
    this.errorMessage = props.errorMessage;
    this.metadata = props.metadata;
  }

  static create(
    props: Omit<AuditLogProps, 'id'>,
  ): Result<AuditLog, Error> {
    if (!props.userId) {
      return err(new Error('userId is required'));
    }
    if (!props.action) {
      return err(new Error('action is required'));
    }
    if (!props.resourceType) {
      return err(new Error('resourceType is required'));
    }
    if (!props.resourceId) {
      return err(new Error('resourceId is required'));
    }
    if (props.duration < 0) {
      return err(new Error('duration cannot be negative'));
    }

    return ok(
      new AuditLog({
        ...props,
        id: uuidv4(),
      }),
    );
  }

  static fromPrimitives(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  isSuccess(): boolean {
    return this.result === 'success';
  }

  isFailure(): boolean {
    return this.result === 'failure';
  }

  getDurationSeconds(): number {
    return this.duration / 1000;
  }

  hasChanges(): boolean {
    return !!(this.changes && this.changes.length > 0);
  }

  toPrimitives(): AuditLogProps {
    return {
      id: this.id,
      userId: this.userId,
      serviceId: this.serviceId,
      ipAddress: this.ipAddress,
      action: this.action,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      changes: this.changes,
      timestamp: this.timestamp,
      duration: this.duration,
      result: this.result,
      errorMessage: this.errorMessage,
      metadata: this.metadata,
    };
  }
}
