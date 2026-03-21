/**
 * Corporate Booking Domain Interfaces
 */

export interface ICorporateBooking {
  bookingId: string;
  companyId: string;
  originalBookingId?: string; // Reference to B2C booking
  serviceId: string;
  serviceType: ServiceType;
  bookedById: string; // Employee or Admin who made the booking
  assignedToId: string; // Employee using the service
  paymentMethod: PaymentMethod;
  totalPrice: Money;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export enum ServiceType {
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  TOUR = 'tour',
  EXPERIENCE = 'experience',
}

export enum PaymentMethod {
  CORPORATE_CREDIT = 'corporate_credit',
  PERSONAL_CARD = 'personal_card',
  INVOICE = 'invoice',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Money {
  amount: number;
  currency: string;
}

/**
 * Booking Request DTOs
 */
export interface CreateCorporateBookingRequest {
  serviceId: string;
  serviceType: ServiceType;
  assignedToId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  departmentId?: string;
}

export interface ManagerBookingRequest extends CreateCorporateBookingRequest {
  bookedById: string; // Manager's user ID
}

export interface EmployeeBookingRequest extends CreateCorporateBookingRequest {
  bookedById: string; // Employee's own user ID
  requiresApproval: boolean;
}

/**
 * Booking Response DTOs
 */
export interface CorporateBookingDTO {
  bookingId: string;
  serviceType: ServiceType;
  assignedTo: string; // Employee name
  totalPrice: Money;
  approvalStatus: ApprovalStatus;
  status: BookingStatus;
  createdAt: Date;
}

/**
 * Approval Workflow
 */
export interface IApprovalWorkflow {
  workflowId: string;
  companyId: string;
  bookingId: string;
  requesterUserId: string;
  assignedToUserId: string;
  approvalChain: ApprovalStep[];
  status: ApprovalStatus;
  createdAt: Date;
  completedAt?: Date;
}

export interface ApprovalStep {
  approverId: string;
  approverName: string;
  level: number;
  status: ApprovalStatus;
  approvedAt?: Date;
  comments?: string;
}

/**
 * Spending Limits
 */
export interface IDepartmentSpendingLimit {
  limitId: string;
  companyId: string;
  department: string;
  dailyLimit: Money;
  monthlyLimit?: Money;
  perEmployeeDaily?: Money;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Consolidated Invoice
 */
export interface IConsolidatedInvoice {
  invoiceId: string;
  companyId: string;
  invoiceNumber: string;
  period: {
    startDate: Date;
    endDate: Date;
    month: string; // YYYY-MM
  };
  bookingIds: string[];
  totalAmount: Money;
  breakdown: InvoiceLineItem[];
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  serviceType: ServiceType;
  count: number;
  subtotal: number;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

/**
 * Spending Report
 */
export interface ISpendingReport {
  companyId: string;
  period: string; // YYYY-MM
  totalSpent: Money;
  byServiceType: Record<ServiceType, Money>;
  byDepartment: Record<string, Money>;
  byEmployee: Record<string, Money>;
  limitBreaches: LimitBreach[];
  generatedAt: Date;
}

export interface LimitBreach {
  departmentId?: string;
  employeeId?: string;
  limitType: 'daily' | 'monthly';
  exceeded: number;
  limit: number;
}

/**
 * Corporate Booking Service Interface
 */
export interface ICorporateBookingService {
  /**
   * Manager books for employee
   */
  managerBook(request: ManagerBookingRequest): Promise<ICorporateBooking>;

  /**
   * Employee books and requests approval
   */
  employeeBook(request: EmployeeBookingRequest): Promise<IApprovalWorkflow>;

  /**
   * Approve booking
   */
  approveBooking(
    workflowId: string,
    approverId: string,
    comments?: string
  ): Promise<ICorporateBooking>;

  /**
   * Reject booking
   */
  rejectBooking(
    workflowId: string,
    approverId: string,
    reason: string
  ): Promise<void>;

  /**
   * Get booking by ID
   */
  getBooking(bookingId: string): Promise<ICorporateBooking | null>;

  /**
   * List company bookings
   */
  listBookings(
    companyId: string,
    filters?: BookingFilters
  ): Promise<ICorporateBooking[]>;

  /**
   * Get approval workflow
   */
  getApprovalWorkflow(workflowId: string): Promise<IApprovalWorkflow | null>;

  /**
   * Check spending limits
   */
  checkSpendingLimits(
    companyId: string,
    departmentId?: string,
    employeeId?: string
  ): Promise<SpendingCheckResult>;

  /**
   * Generate consolidated invoice
   */
  generateConsolidatedInvoice(
    companyId: string,
    month: string
  ): Promise<IConsolidatedInvoice>;

  /**
   * Get spending report
   */
  getSpendingReport(companyId: string, month: string): Promise<ISpendingReport>;

  /**
   * Export bookings to CSV
   */
  exportBookingsToCSV(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string>;

  /**
   * Export invoice to PDF
   */
  exportInvoiceToPDF(invoiceId: string): Promise<Buffer>;
}

export interface BookingFilters {
  status?: BookingStatus;
  approvalStatus?: ApprovalStatus;
  serviceType?: ServiceType;
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  limit?: number;
}

export interface SpendingCheckResult {
  withinLimits: boolean;
  breakages: LimitBreach[];
  remainingBudget: Money;
}
