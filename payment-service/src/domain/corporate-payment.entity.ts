/**
 * Corporate Payment Entity
 * Extends the base Payment entity with corporate-specific fields
 */

export enum CorporatePaymentMethod {
  CORPORATE_CREDIT = 'corporate_credit',
  CORPORATE_ACCOUNT = 'corporate_account',
  INVOICE = 'invoice',
}

export enum CorporatePaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface CorporatePaymentEntity {
  paymentId: string;
  companyId: string;
  bookingId: string;
  originalPaymentId?: string; // Reference to B2C payment

  amount: number;
  currency: string;

  paymentMethod: CorporatePaymentMethod;
  status: CorporatePaymentStatus;

  // Corporate-specific fields
  departmentId?: string;
  employeeId: string;
  approverUserId?: string;
  approvalTimestamp?: Date;

  // Transaction details
  transactionId?: string;
  authorizationCode?: string;

  // Billing info
  billedToCompany: boolean;
  invoiceId?: string;
  consolidatedInvoiceId?: string;

  // Metadata
  description: string;
  tags: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;

  // Error handling
  errorCode?: string;
  errorMessage?: string;

  // Audit
  createdBy: string; // User ID who initiated payment
}

export class CorporatePayment implements CorporatePaymentEntity {
  paymentId: string;
  companyId: string;
  bookingId: string;
  originalPaymentId?: string;

  amount: number;
  currency: string;

  paymentMethod: CorporatePaymentMethod;
  status: CorporatePaymentStatus;

  departmentId?: string;
  employeeId: string;
  approverUserId?: string;
  approvalTimestamp?: Date;

  transactionId?: string;
  authorizationCode?: string;

  billedToCompany: boolean;
  invoiceId?: string;
  consolidatedInvoiceId?: string;

  description: string;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;

  errorCode?: string;
  errorMessage?: string;

  createdBy: string;

  constructor(data: CorporatePaymentEntity) {
    Object.assign(this, data);
  }

  /**
   * Is payment processed?
   */
  isProcessed(): boolean {
    return this.status === CorporatePaymentStatus.CAPTURED;
  }

  /**
   * Is payment pending approval?
   */
  isPendingApproval(): boolean {
    return (
      this.status === CorporatePaymentStatus.PENDING && !this.approverUserId
    );
  }

  /**
   * Can be refunded?
   */
  canBeRefunded(): boolean {
    return (
      this.status === CorporatePaymentStatus.CAPTURED ||
      this.status === CorporatePaymentStatus.AUTHORIZED
    );
  }

  /**
   * Mark as authorized
   */
  authorize(authCode: string): void {
    if (this.status !== CorporatePaymentStatus.PENDING) {
      throw new Error('Can only authorize pending payments');
    }
    this.status = CorporatePaymentStatus.AUTHORIZED;
    this.authorizationCode = authCode;
    this.updatedAt = new Date();
  }

  /**
   * Mark as captured
   */
  capture(): void {
    if (this.status !== CorporatePaymentStatus.AUTHORIZED) {
      throw new Error('Can only capture authorized payments');
    }
    this.status = CorporatePaymentStatus.CAPTURED;
    this.processedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Mark as failed
   */
  fail(errorCode: string, errorMessage: string): void {
    this.status = CorporatePaymentStatus.FAILED;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();
  }

  /**
   * Refund payment
   */
  refund(amount: number): void {
    if (!this.canBeRefunded()) {
      throw new Error('Cannot refund this payment');
    }
    if (amount > this.amount) {
      throw new Error('Refund amount cannot exceed original payment');
    }
    this.status = CorporatePaymentStatus.REFUNDED;
    this.updatedAt = new Date();
  }

  /**
   * Approve payment
   */
  approve(approverId: string): void {
    this.approverUserId = approverId;
    this.approvalTimestamp = new Date();
    this.status = CorporatePaymentStatus.AUTHORIZED;
    this.updatedAt = new Date();
  }
}

/**
 * Corporate Payment DTO for API responses
 */
export interface CorporatePaymentDTO {
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: CorporatePaymentMethod;
  status: CorporatePaymentStatus;
  employeeId: string;
  departmentId?: string;
  createdAt: Date;
  processedAt?: Date;
}

/**
 * Create Corporate Payment Request
 */
export interface CreateCorporatePaymentRequest {
  companyId: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: CorporatePaymentMethod;
  departmentId?: string;
  employeeId: string;
  description: string;
  tags?: string[];
  createdBy: string;
}

/**
 * Process Corporate Payment Request
 */
export interface ProcessCorporatePaymentRequest {
  paymentId: string;
  authorizationCode?: string;
  shouldCapture: boolean;
}

/**
 * Refund Corporate Payment Request
 */
export interface RefundCorporatePaymentRequest {
  paymentId: string;
  amount: number;
  reason: string;
  createdBy: string;
}
