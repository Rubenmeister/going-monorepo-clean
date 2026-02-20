/**
 * Invoice API Controller
 * REST endpoints for invoice management
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { InvoiceService } from '../application/services/invoice.service';
import { InvoiceRepository } from '../infrastructure/persistence/invoice.repository';
import { InvoiceEmailService } from '../application/services/invoice-email.service';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { UpdateInvoiceDto } from './dtos/update-invoice.dto';
import { RecordPaymentDto } from './dtos/record-payment.dto';
import { SendInvoiceEmailDto } from './dtos/send-invoice-email.dto';
import {
  InvoiceResponseDto,
  InvoiceListResponseDto,
  InvoiceStatsResponseDto,
} from './dtos/invoice-response.dto';
import { CorporateJwtAuthGuard } from '../../shared/guards/corporate-jwt.guard';
import { CorporateRbacGuard } from '../../shared/guards/corporate-rbac.guard';

@Controller('api/invoices')
@UseGuards(CorporateJwtAuthGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceEmailService: InvoiceEmailService
  ) {}

  /**
   * Create a new invoice
   * POST /api/invoices
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
    @Req() req: any
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;
    const userId = req.user.sub;

    // RBAC: Require MANAGER or SUPER_ADMIN
    if (!['MANAGER', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new UnauthorizedException(
        'Insufficient permissions to create invoices'
      );
    }

    const invoice = await this.invoiceService.createInvoice(companyId, dto);
    return this.toResponseDto(invoice);
  }

  /**
   * Get invoice by ID
   * GET /api/invoices/:id
   */
  @Get(':id')
  async getInvoice(
    @Param('id') invoiceId: string,
    @Req() req: any
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;

    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toResponseDto(invoice);
  }

  /**
   * List invoices with filters
   * GET /api/invoices
   * Query params: status, paymentStatus, clientId, startDate, endDate, limit, offset
   */
  @Get()
  async listInvoices(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('clientId') clientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any
  ): Promise<InvoiceListResponseDto> {
    const companyId = req.user.companyId;

    const filters: any = {
      status,
      paymentStatus,
      clientId,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const { invoices, total } = await this.invoiceRepository.list(
      companyId,
      filters
    );

    return {
      invoices: invoices.map((inv) => this.toResponseDto(inv)),
      total,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  /**
   * Get invoice statistics
   * GET /api/invoices/stats/summary
   */
  @Get('stats/summary')
  async getStats(@Req() req: any): Promise<InvoiceStatsResponseDto> {
    const companyId = req.user.companyId;
    return this.invoiceRepository.getStats(companyId);
  }

  /**
   * Update an invoice (only if in DRAFT status)
   * PUT /api/invoices/:id
   */
  @Put(':id')
  async updateInvoice(
    @Param('id') invoiceId: string,
    @Body() dto: UpdateInvoiceDto,
    @Req() req: any
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;

    // RBAC: Require MANAGER or SUPER_ADMIN
    if (!['MANAGER', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new UnauthorizedException(
        'Insufficient permissions to update invoices'
      );
    }

    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Can only update invoices in DRAFT status');
    }

    const updated = await this.invoiceService.updateInvoice(
      companyId,
      invoiceId,
      dto
    );
    if (!updated) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toResponseDto(updated);
  }

  /**
   * Issue an invoice (change status from DRAFT to ISSUED)
   * POST /api/invoices/:id/issue
   */
  @Post(':id/issue')
  async issueInvoice(
    @Param('id') invoiceId: string,
    @Req() req: any
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;

    // RBAC: Require MANAGER or SUPER_ADMIN
    if (!['MANAGER', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new UnauthorizedException(
        'Insufficient permissions to issue invoices'
      );
    }

    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Can only issue invoices in DRAFT status');
    }

    const updated = await this.invoiceRepository.updateStatus(
      invoiceId,
      companyId,
      'ISSUED'
    );
    if (!updated) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toResponseDto(updated);
  }

  /**
   * Record a payment against an invoice
   * POST /api/invoices/:id/payment
   */
  @Post(':id/payment')
  async recordPayment(
    @Param('id') invoiceId: string,
    @Body() dto: RecordPaymentDto,
    @Req() req: any
  ): Promise<InvoiceResponseDto> {
    const companyId = req.user.companyId;

    // RBAC: Require MANAGER or SUPER_ADMIN for payment recording
    if (!['MANAGER', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new UnauthorizedException(
        'Insufficient permissions to record payments'
      );
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.paymentStatus === 'REFUNDED') {
      throw new BadRequestException('Cannot add payments to refunded invoices');
    }

    const amountDue =
      invoice.amountDue || invoice.total - (invoice.amountPaid || 0);
    if (dto.amount > amountDue) {
      throw new BadRequestException(
        `Payment exceeds amount due (${amountDue / 100} remaining)`
      );
    }

    const updated = await this.invoiceRepository.recordPayment(
      invoiceId,
      companyId,
      {
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
      }
    );

    if (!updated) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toResponseDto(updated);
  }

  /**
   * Send invoice via email
   * POST /api/invoices/:id/send-email
   */
  @Post(':id/send-email')
  async sendInvoiceEmail(
    @Param('id') invoiceId: string,
    @Body() dto: SendInvoiceEmailDto,
    @Req() req: any
  ): Promise<{ success: boolean; message: string }> {
    const companyId = req.user.companyId;

    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'DRAFT') {
      throw new BadRequestException(
        'Cannot send draft invoices. Issue the invoice first.'
      );
    }

    try {
      await this.invoiceEmailService.sendInvoice(
        invoice as any,
        dto.recipientEmail,
        dto.ccEmails,
        dto.messageBody
      );

      // Update invoice status to SENT
      await this.invoiceRepository.updateStatus(invoiceId, companyId, 'SENT');

      return {
        success: true,
        message: `Invoice ${invoice.invoiceNumber} sent successfully`,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to send invoice: ${error.message}`);
    }
  }

  /**
   * Send payment reminder email
   * POST /api/invoices/:id/send-reminder
   */
  @Post(':id/send-reminder')
  async sendPaymentReminder(
    @Param('id') invoiceId: string,
    @Body() dto: { recipientEmail?: string },
    @Req() req: any
  ): Promise<{ success: boolean; message: string }> {
    const companyId = req.user.companyId;

    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.paymentStatus === 'PAID') {
      throw new BadRequestException('Cannot send reminder for paid invoices');
    }

    try {
      await this.invoiceEmailService.sendPaymentReminder(
        invoice as any,
        dto.recipientEmail
      );

      return {
        success: true,
        message: `Payment reminder for invoice ${invoice.invoiceNumber} sent successfully`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to send reminder: ${error.message}`
      );
    }
  }

  /**
   * Delete an invoice (only if in DRAFT status)
   * DELETE /api/invoices/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInvoice(
    @Param('id') invoiceId: string,
    @Req() req: any
  ): Promise<void> {
    const companyId = req.user.companyId;

    // RBAC: Require SUPER_ADMIN for deletion
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only admins can delete invoices');
    }

    const invoice = await this.invoiceRepository.findById(invoiceId, companyId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Can only delete invoices in DRAFT status');
    }

    const deleted = await this.invoiceRepository.delete(invoiceId, companyId);
    if (!deleted) {
      throw new NotFoundException('Invoice not found');
    }
  }

  /**
   * Convert Invoice to response DTO
   */
  private toResponseDto(invoice: any): InvoiceResponseDto {
    return {
      id: invoice._id?.toString() || invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      companyId: invoice.companyId,
      clientId: invoice.clientId,
      company: invoice.company,
      client: invoice.client,
      lineItems: invoice.lineItems,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      discountAmount: invoice.discountAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      paidAt: invoice.paidAt,
      language: invoice.language,
      currency: invoice.currency,
      bankDetails: invoice.bankDetails,
      notes: invoice.notes,
      terms: invoice.terms,
      paymentTerms: invoice.paymentTerms,
      taxSummary: invoice.taxSummary,
      sentAt: invoice.sentAt,
      viewedAt: invoice.viewedAt,
      emailSent: invoice.emailSent,
      pdfPath: invoice.pdfPath,
      tags: invoice.tags,
    };
  }
}
