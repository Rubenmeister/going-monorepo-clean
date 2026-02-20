import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CorporatePayment,
  CorporatePaymentEntity,
  CorporatePaymentStatus,
  CorporatePaymentMethod,
  CreateCorporatePaymentRequest,
  ProcessCorporatePaymentRequest,
  RefundCorporatePaymentRequest,
  CorporatePaymentDTO,
} from '../domain/corporate-payment.entity';
import { CorporatePaymentDocument } from '../infrastructure/corporate-payment.schema';

/**
 * Corporate Payment Application Service
 * Handles corporate payment processing with approval workflows
 */
@Injectable()
export class CorporatePaymentService {
  private readonly logger = new Logger(CorporatePaymentService.name);

  constructor(
    @InjectModel('CorporatePayment')
    private readonly corporatePaymentModel: Model<CorporatePaymentDocument>
  ) {}

  /**
   * Create corporate payment
   */
  async createPayment(
    request: CreateCorporatePaymentRequest
  ): Promise<CorporatePayment> {
    try {
      this.logger.log(
        `Creating corporate payment for company ${request.companyId}`
      );

      // Validate company exists
      // const company = await this.companyService.getCompany(request.companyId);

      // Validate employee exists in company
      // const employee = await this.corporateUserService.getUser(request.employeeId);

      // Validate booking exists
      // const booking = await this.bookingService.getBooking(request.bookingId);

      const paymentId = this.generateId();

      const payment = new CorporatePayment({
        paymentId,
        companyId: request.companyId,
        bookingId: request.bookingId,
        amount: request.amount,
        currency: request.currency,
        paymentMethod: request.paymentMethod,
        status: CorporatePaymentStatus.PENDING,
        departmentId: request.departmentId,
        employeeId: request.employeeId,
        billedToCompany: true,
        description: request.description,
        tags: request.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: request.createdBy,
      });

      // Save to database
      const saved = await this.corporatePaymentModel.create(payment);

      this.logger.log(`Created payment ${paymentId}`);

      // Send notification for approval if needed
      if (payment.paymentMethod === CorporatePaymentMethod.CORPORATE_CREDIT) {
        // await this.notificationService.notifyPaymentRequiresApproval(payment);
      }

      return new CorporatePayment(saved.toObject());
    } catch (error) {
      this.logger.error(`Failed to create payment:`, error);
      throw error;
    }
  }

  /**
   * Process corporate payment
   */
  async processPayment(
    request: ProcessCorporatePaymentRequest
  ): Promise<CorporatePayment> {
    try {
      const { paymentId, authorizationCode, shouldCapture } = request;

      const payment = await this.getPayment(paymentId);
      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }

      if (
        !payment.isPendingApproval() &&
        payment.status !== CorporatePaymentStatus.PENDING
      ) {
        throw new BadRequestException(
          `Payment is in ${payment.status} status and cannot be processed`
        );
      }

      // Authorize payment
      if (authorizationCode) {
        payment.authorize(authorizationCode);
      }

      // Capture if requested
      if (
        shouldCapture &&
        payment.status === CorporatePaymentStatus.AUTHORIZED
      ) {
        payment.capture();
      }

      // Save changes
      await this.corporatePaymentModel.updateOne({ paymentId }, payment as any);

      this.logger.log(`Processed payment ${paymentId}`);

      return payment;
    } catch (error) {
      this.logger.error(`Failed to process payment:`, error);
      throw error;
    }
  }

  /**
   * Approve corporate payment
   */
  async approvePayment(
    paymentId: string,
    approverId: string
  ): Promise<CorporatePayment> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }

      if (payment.status !== CorporatePaymentStatus.PENDING) {
        throw new BadRequestException('Only pending payments can be approved');
      }

      // Validate approver has permission
      // await this.rbacService.validatePaymentApproval(approverId, payment.companyId);

      payment.approve(approverId);

      await this.corporatePaymentModel.updateOne({ paymentId }, payment as any);

      this.logger.log(`Approved payment ${paymentId} by ${approverId}`);

      return payment;
    } catch (error) {
      this.logger.error(`Failed to approve payment:`, error);
      throw error;
    }
  }

  /**
   * Refund corporate payment
   */
  async refundPayment(request: RefundCorporatePaymentRequest): Promise<void> {
    try {
      const { paymentId, amount } = request;

      const payment = await this.getPayment(paymentId);
      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }

      payment.refund(amount);

      await this.corporatePaymentModel.updateOne({ paymentId }, payment as any);

      this.logger.log(`Refunded payment ${paymentId} with amount ${amount}`);

      // Create refund transaction
      // await this.createRefundTransaction(payment, amount);

      // Send notification
      // await this.notificationService.notifyPaymentRefunded(payment);
    } catch (error) {
      this.logger.error(`Failed to refund payment:`, error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<CorporatePayment | null> {
    try {
      const payment = await this.corporatePaymentModel.findOne({ paymentId });
      return payment ? new CorporatePayment(payment.toObject()) : null;
    } catch (error) {
      this.logger.error(`Failed to get payment:`, error);
      return null;
    }
  }

  /**
   * List company payments
   */
  async listPayments(
    companyId: string,
    status?: CorporatePaymentStatus
  ): Promise<CorporatePayment[]> {
    try {
      const query: any = { companyId };
      if (status) {
        query.status = status;
      }

      const payments = await this.corporatePaymentModel.find(query);
      return payments.map((p) => new CorporatePayment(p.toObject()));
    } catch (error) {
      this.logger.error(`Failed to list payments:`, error);
      return [];
    }
  }

  /**
   * Get pending payments for approver
   */
  async getPendingPaymentsForApprover(
    approverId: string
  ): Promise<CorporatePayment[]> {
    try {
      const payments = await this.corporatePaymentModel.find({
        status: CorporatePaymentStatus.PENDING,
        // Will filter by company association
      });

      return payments.map((p) => new CorporatePayment(p.toObject()));
    } catch (error) {
      this.logger.error(`Failed to get pending payments:`, error);
      return [];
    }
  }

  /**
   * Get payment statistics for company
   */
  async getPaymentStats(companyId: string): Promise<any> {
    try {
      const stats = await this.corporatePaymentModel.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
      ]);

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get payment stats:`, error);
      return {};
    }
  }

  // Helper methods
  private generateId(): string {
    return `pay-corp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
