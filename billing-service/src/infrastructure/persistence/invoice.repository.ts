/**
 * Invoice Repository
 * Handles all database operations for invoices
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvoiceSchema } from '../schemas/invoice.schema';
import { Invoice } from '../../domain/models/invoice.model';

interface ListFilters {
  status?: string;
  paymentStatus?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class InvoiceRepository {
  private readonly logger = new Logger(InvoiceRepository.name);

  constructor(
    @InjectModel(InvoiceSchema.name)
    private readonly invoiceModel: Model<InvoiceSchema>
  ) {}

  /**
   * Defensa en profundidad (auditoría Bloque 2 #1): NUNCA construir una query
   * scoped con un `companyId` vacío/undefined. Mongoose descarta los `undefined`
   * al castear, lo que colapsaría el filtro de tenant y cruzaría empresas. Si
   * un scope inválido llega hasta acá, es un bug de guard/controlador → fallar
   * ruidoso en vez de devolver datos de otra empresa.
   */
  private assertCompanyScope(companyId: string): void {
    if (typeof companyId !== 'string' || companyId.trim() === '') {
      throw new Error(
        'InvoiceRepository: companyId requerido para operación scoped (posible fuga cross-tenant evitada)'
      );
    }
  }

  /**
   * Create a new invoice
   * @param invoice Invoice data to save
   * @returns Saved invoice
   */
  async create(invoice: Partial<Invoice>): Promise<Invoice> {
    try {
      const newInvoice = new this.invoiceModel(invoice);
      const saved = await newInvoice.save();
      this.logger.debug(`Invoice created: ${invoice.invoiceNumber}`);
      return saved.toObject() as unknown as Invoice;
    } catch (error) {
      this.logger.error(`Failed to create invoice: ${error}`);
      throw error;
    }
  }

  /**
   * Find invoice by ID
   * @param invoiceId Invoice ID
   * @param companyId Company ID for scoping
   * @returns Invoice or null
   */
  async findById(
    invoiceId: string,
    companyId: string
  ): Promise<Invoice | null> {
    try {
      this.assertCompanyScope(companyId);
      return (await this.invoiceModel
        .findOne({ _id: invoiceId, companyId })
        .lean()
        .exec()) as unknown as Invoice | null;
    } catch (error) {
      this.logger.error(`Failed to find invoice: ${error}`);
      return null;
    }
  }

  /**
   * Find invoice by invoice number
   * @param invoiceNumber Invoice number
   * @param companyId Company ID
   * @returns Invoice or null
   */
  async findByInvoiceNumber(
    invoiceNumber: string,
    companyId: string
  ): Promise<Invoice | null> {
    try {
      return (await this.invoiceModel
        .findOne({ invoiceNumber, companyId })
        .lean()
        .exec()) as unknown as Invoice | null;
    } catch (error) {
      this.logger.error(`Failed to find invoice by number: ${error}`);
      return null;
    }
  }

  /**
   * List invoices with filters
   * @param companyId Company ID
   * @param filters Query filters
   * @returns Array of invoices and total count
   */
  async list(
    companyId: string,
    filters: ListFilters = {}
  ): Promise<{ invoices: Invoice[]; total: number }> {
    try {
      this.assertCompanyScope(companyId);
      const query: any = { companyId };

      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.paymentStatus) {
        query.paymentStatus = filters.paymentStatus;
      }
      if (filters.clientId) {
        query.clientId = filters.clientId;
      }

      if (filters.startDate || filters.endDate) {
        query.issueDate = {};
        if (filters.startDate) {
          query.issueDate.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.issueDate.$lte = filters.endDate;
        }
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const [invoices, total] = await Promise.all([
        this.invoiceModel
          .find(query)
          .sort({ issueDate: -1 })
          .limit(limit)
          .skip(offset)
          .lean()
          .exec(),
        this.invoiceModel.countDocuments(query),
      ]);

      return {
        invoices: invoices as unknown as Invoice[],
        total,
      };
    } catch (error) {
      this.logger.error(`Failed to list invoices: ${error}`);
      return { invoices: [], total: 0 };
    }
  }

  /**
   * Update an invoice
   * @param invoiceId Invoice ID
   * @param companyId Company ID for scoping
   * @param updateData Data to update
   * @returns Updated invoice or null
   */
  async update(
    invoiceId: string,
    companyId: string,
    updateData: Partial<Invoice>
  ): Promise<Invoice | null> {
    try {
      this.assertCompanyScope(companyId);
      return (await this.invoiceModel
        .findOneAndUpdate({ _id: invoiceId, companyId }, updateData, {
          new: true,
        })
        .lean()
        .exec()) as unknown as Invoice | null;
    } catch (error) {
      this.logger.error(`Failed to update invoice: ${error}`);
      return null;
    }
  }

  /**
   * Delete an invoice
   * @param invoiceId Invoice ID
   * @param companyId Company ID for scoping
   * @returns true if deleted, false otherwise
   */
  async delete(invoiceId: string, companyId: string): Promise<boolean> {
    try {
      this.assertCompanyScope(companyId);
      const result = await this.invoiceModel.deleteOne({
        _id: invoiceId,
        companyId,
      });
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to delete invoice: ${error}`);
      return false;
    }
  }

  /**
   * Record payment against an invoice
   * @param invoiceId Invoice ID
   * @param companyId Company ID
   * @param payment Payment data
   * @returns Updated invoice
   */
  async recordPayment(
    invoiceId: string,
    companyId: string,
    payment: {
      amount: number;
      method: string;
      reference?: string;
    }
  ): Promise<Invoice | null> {
    try {
      this.assertCompanyScope(companyId);
      const invoice = await this.findById(invoiceId, companyId);
      if (!invoice) {
        return null;
      }

      // Idempotencia (auditoría Bloque 2 #3): si ya existe un pago con este
      // `reference` (transactionId), NO volver a acreditar. Un retry S2S de
      // payment-service (POST /internal/payment-completed) llegaba dos veces y
      // doble-contaba amountPaid. Fast-path: ya aplicado → devolver la factura
      // tal cual (éxito idempotente).
      const existingPayments = (invoice as any).payments;
      if (
        payment.reference &&
        Array.isArray(existingPayments) &&
        existingPayments.some((p: any) => p?.reference === payment.reference)
      ) {
        this.logger.warn(
          `recordPayment idempotente: reference ${payment.reference} ya aplicado en ${invoiceId} — sin doble crédito`
        );
        return invoice;
      }

      const paymentRecord = {
        id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: payment.amount,
        date: new Date(),
        method: payment.method,
        reference: payment.reference,
      };

      // Mutación ATÓMICA del dinero (auditoría Bloque 2 #6): antes se leía
      // amountPaid, se sumaba en JS y se escribía el valor ABSOLUTO → dos pagos
      // concurrentes (distintos reference) leían el mismo valor y el last-write
      // perdía uno. Ahora $inc suma en el propio documento (sin perder dinero) y
      // $push agrega el registro. El filtro con 'payments.reference' $ne mantiene
      // la idempotencia por retry.
      const filter: any = { _id: invoiceId, companyId };
      if (payment.reference) {
        filter['payments.reference'] = { $ne: payment.reference };
      }

      const afterInc = (await this.invoiceModel
        .findOneAndUpdate(
          filter,
          { $inc: { amountPaid: payment.amount }, $push: { payments: paymentRecord } },
          { new: true }
        )
        .lean()
        .exec()) as any;

      if (!afterInc) {
        // No matcheó: reference ya aplicado por otro retry → idempotente.
        if (payment.reference) return await this.findById(invoiceId, companyId);
        return null;
      }

      // Derivar estado/saldo del amountPaid YA incrementado atómicamente (fuente
      // de verdad), no de la lectura previa. Los campos derivados son eventual-
      // consistentes; el dinero (amountPaid) siempre es correcto.
      const amountPaid = afterInc.amountPaid || 0;
      const total = afterInc.total || 0;
      const amountDue = Math.max(0, total - amountPaid);
      const paymentStatus =
        amountPaid <= 0 ? 'NOT_PAID' : amountPaid < total ? 'PARTIALLY_PAID' : 'PAID';

      const derived: any = { amountDue, paymentStatus };
      if (paymentStatus === 'PAID') {
        derived.paidAt = new Date();
        if (afterInc.status === 'OVERDUE') derived.status = 'PAID';
      }

      const final = (await this.invoiceModel
        .findOneAndUpdate({ _id: invoiceId, companyId }, derived, { new: true })
        .lean()
        .exec()) as unknown as Invoice | null;

      return final ?? (afterInc as unknown as Invoice);
    } catch (error) {
      this.logger.error(`Failed to record payment: ${error}`);
      return null;
    }
  }

  /**
   * Update invoice status
   * @param invoiceId Invoice ID
   * @param companyId Company ID
   * @param status New status
   * @returns Updated invoice
   */
  async updateStatus(
    invoiceId: string,
    companyId: string,
    status: string
  ): Promise<Invoice | null> {
    try {
      this.assertCompanyScope(companyId);
      const updateData: any = { status };

      if (status === 'SENT') {
        updateData.sentAt = new Date();
        updateData.emailSent = true;
      }
      if (status === 'VIEWED') {
        updateData.viewedAt = new Date();
      }

      return (await this.invoiceModel
        .findOneAndUpdate({ _id: invoiceId, companyId }, updateData, {
          new: true,
        })
        .lean()
        .exec()) as unknown as Invoice | null;
    } catch (error) {
      this.logger.error(`Failed to update invoice status: ${error}`);
      return null;
    }
  }

  /**
   * Find overdue invoices
   * @param companyId Company ID
   * @param daysOverdue How many days overdue
   * @returns Array of overdue invoices
   */
  async findOverdueInvoices(
    companyId: string,
    daysOverdue = 0
  ): Promise<Invoice[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);

      return (await this.invoiceModel
        .find({
          companyId,
          dueDate: { $lt: cutoffDate },
          status: { $nin: ['PAID', 'CANCELLED', 'REFUNDED'] },
        })
        .lean()
        .exec()) as unknown as Invoice[];
    } catch (error) {
      this.logger.error(`Failed to find overdue invoices: ${error}`);
      return [];
    }
  }

  /**
   * Get invoice statistics
   * @param companyId Company ID
   * @returns Invoice stats
   */
  async getStats(companyId: string): Promise<{
    totalCount: number;
    draftCount: number;
    issuedCount: number;
    paidCount: number;
    overdueCount: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
  }> {
    try {
      this.assertCompanyScope(companyId);
      const [totals, status, payment] = await Promise.all([
        this.invoiceModel.aggregate([
          { $match: { companyId } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: '$total' },
              paidAmount: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentStatus', 'PAID'] },
                    '$total',
                    '$amountPaid',
                  ],
                },
              },
            },
          },
        ]),
        this.invoiceModel.aggregate([
          { $match: { companyId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        this.invoiceModel.aggregate([
          { $match: { companyId } },
          { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
        ]),
      ]);

      const totalData = totals[0] || {
        count: 0,
        totalAmount: 0,
        paidAmount: 0,
      };

      const statusMap = status.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const now = new Date();
      const overdue = await this.invoiceModel.countDocuments({
        companyId,
        dueDate: { $lt: now },
        status: { $nin: ['PAID', 'CANCELLED', 'REFUNDED'] },
      });

      return {
        totalCount: totalData.count,
        draftCount: statusMap['DRAFT'] || 0,
        issuedCount: statusMap['ISSUED'] || 0,
        paidCount: statusMap['PAID'] || 0,
        overdueCount: overdue,
        totalAmount: totalData.totalAmount,
        paidAmount: totalData.paidAmount,
        dueAmount: totalData.totalAmount - totalData.paidAmount,
      };
    } catch (error) {
      this.logger.error(`Failed to get invoice stats: ${error}`);
      return {
        totalCount: 0,
        draftCount: 0,
        issuedCount: 0,
        paidCount: 0,
        overdueCount: 0,
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
      };
    }
  }

  /**
   * Find invoice by trip ID
   * Search by metadata.tripId OR invoiceNumber matching tripId
   * @param tripId Trip ID to search
   * @returns Invoice or null
   */
  async findByTripId(tripId: string): Promise<Invoice | null> {
    try {
      return (await this.invoiceModel
        .findOne({
          $or: [
            { 'metadata.tripId': tripId },
            { invoiceNumber: tripId },
          ],
        })
        .lean()
        .exec()) as unknown as Invoice | null;
    } catch (error) {
      this.logger.error(`Failed to find invoice by tripId: ${error}`);
      return null;
    }
  }

  /**
   * Generate next invoice number
   * @param companyId Company ID
   * @param year Year for numbering
   * @returns Next invoice number
   */
  async generateNextInvoiceNumber(
    companyId: string,
    year: number
  ): Promise<string> {
    try {
      const prefix = `INV-${year}-`;
      const regex = new RegExp(`^${prefix}\\d{5}$`);

      const lastInvoice = await this.invoiceModel
        .findOne({ companyId, invoiceNumber: regex })
        .sort({ invoiceNumber: -1 })
        .lean()
        .exec();

      let nextNumber = 1;
      if (lastInvoice) {
        const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
        nextNumber = lastNum + 1;
      }

      return `${prefix}${String(nextNumber).padStart(5, '0')}`;
    } catch (error) {
      this.logger.error(`Failed to generate invoice number: ${error}`);
      throw error;
    }
  }
}
