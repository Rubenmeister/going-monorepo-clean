/**
 * Invoice Email Service
 * Handles invoice delivery via email with PDF attachments
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Invoice, InvoiceLanguage } from '../../domain/models/invoice.model';
import { PdfGeneratorService } from './pdf-generator.service';
import * as nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

@Injectable()
export class InvoiceEmailService {
  private readonly logger = new Logger(InvoiceEmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly pdfGenerator: PdfGeneratorService) {
    // Initialize Nodemailer transporter with environment config
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'noreply@going-platform.com',
        pass: process.env.SMTP_PASSWORD || '',
      },
      from: process.env.SMTP_FROM || 'noreply@going-platform.com',
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  /**
   * Send invoice via email
   * @param invoice Invoice to send
   * @param recipientEmail Email recipient
   * @param ccEmails CC email addresses
   * @param messageBody Custom message body
   * @returns true if sent successfully
   */
  async sendInvoice(
    invoice: Invoice,
    recipientEmail?: string,
    ccEmails?: string[],
    messageBody?: string
  ): Promise<boolean> {
    try {
      const email = recipientEmail || invoice.client.email;

      if (!email) {
        throw new BadRequestException(
          'No email address found for invoice recipient'
        );
      }

      // Generate PDF
      const pdfBuffer = await this.pdfGenerator.generateInvoicePdf(invoice);

      // Compose email
      const subject = this.getEmailSubject(invoice);
      const htmlContent = this.getEmailTemplate(invoice, messageBody);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@going-platform.com',
        to: email,
        cc: ccEmails?.join(','),
        subject,
        html: htmlContent,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Invoice ${invoice.invoiceNumber} sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invoice email: ${error}`);
      throw error;
    }
  }

  /**
   * Send payment reminder email
   * @param invoice Invoice to remind about
   * @param recipientEmail Email recipient
   * @returns true if sent successfully
   */
  async sendPaymentReminder(
    invoice: Invoice,
    recipientEmail?: string
  ): Promise<boolean> {
    try {
      const email = recipientEmail || invoice.client.email;

      if (!email) {
        throw new BadRequestException(
          'No email address found for invoice recipient'
        );
      }

      const subject = this.getReminderEmailSubject(invoice);
      const htmlContent = this.getReminderEmailTemplate(invoice);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@going-platform.com',
        to: email,
        subject,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Payment reminder sent for invoice ${invoice.invoiceNumber} to ${email}`
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send payment reminder: ${error}`);
      throw error;
    }
  }

  /**
   * Get email subject for invoice
   */
  private getEmailSubject(invoice: Invoice): string {
    const language = invoice.language || 'en';
    if (language === 'es') {
      return `Factura ${invoice.invoiceNumber} - ${invoice.company.name}`;
    }
    return `Invoice ${invoice.invoiceNumber} - ${invoice.company.name}`;
  }

  /**
   * Get payment reminder email subject
   */
  private getReminderEmailSubject(invoice: Invoice): string {
    const language = invoice.language || 'en';
    const amountDue = this.formatPrice(invoice.amountDue || invoice.total);
    if (language === 'es') {
      return `Recordatorio de pago: Factura ${invoice.invoiceNumber} - ${amountDue} pendiente`;
    }
    return `Payment Reminder: Invoice ${invoice.invoiceNumber} - ${amountDue} due`;
  }

  /**
   * Get email template for invoice
   */
  private getEmailTemplate(invoice: Invoice, messageBody?: string): string {
    const language = invoice.language || 'en';
    const amountDue = this.formatPrice(invoice.amountDue || invoice.total);
    const dueDate = new Date(invoice.dueDate).toLocaleDateString(
      language === 'es' ? 'es-ES' : 'en-US'
    );

    if (language === 'es') {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Estimado/a ${invoice.client.name},</p>

            <p>Le adjuntamos la factura <strong>${
              invoice.invoiceNumber
            }</strong> de ${invoice.company.name}.</p>

            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Información de la Factura:</strong></p>
              <ul>
                <li>Número: ${invoice.invoiceNumber}</li>
                <li>Total: <strong>${amountDue}</strong></li>
                <li>Fecha de Vencimiento: <strong>${dueDate}</strong></li>
              </ul>
            </div>

            ${messageBody ? `<p>${messageBody}</p>` : ''}

            ${invoice.bankDetails ? this.getBankDetailsHtml(invoice, 'es') : ''}

            <p>Si tiene alguna pregunta, no dude en ponerse en contacto con nosotros.</p>

            <p>Saludos cordiales,<br/>
            ${invoice.company.name}<br/>
            ${invoice.company.email}</p>
          </body>
        </html>
      `;
    }

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${invoice.client.name},</p>

          <p>Please find attached the invoice <strong>${
            invoice.invoiceNumber
          }</strong> from ${invoice.company.name}.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Invoice Details:</strong></p>
            <ul>
              <li>Number: ${invoice.invoiceNumber}</li>
              <li>Total Due: <strong>${amountDue}</strong></li>
              <li>Due Date: <strong>${dueDate}</strong></li>
            </ul>
          </div>

          ${messageBody ? `<p>${messageBody}</p>` : ''}

          ${invoice.bankDetails ? this.getBankDetailsHtml(invoice, 'en') : ''}

          <p>If you have any questions, please don't hesitate to contact us.</p>

          <p>Best regards,<br/>
          ${invoice.company.name}<br/>
          ${invoice.company.email}</p>
        </body>
      </html>
    `;
  }

  /**
   * Get payment reminder email template
   */
  private getReminderEmailTemplate(invoice: Invoice): string {
    const language = invoice.language || 'en';
    const amountDue = this.formatPrice(invoice.amountDue || invoice.total);
    const dueDate = new Date(invoice.dueDate).toLocaleDateString(
      language === 'es' ? 'es-ES' : 'en-US'
    );

    if (language === 'es') {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Estimado/a ${invoice.client.name},</p>

          <p>Le recordamos que tiene un pago pendiente:</p>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Factura ${invoice.invoiceNumber}</strong></p>
            <p>Importe pendiente: <strong>${amountDue}</strong></p>
            <p>Fecha de vencimiento: <strong>${dueDate}</strong></p>
          </div>

          ${invoice.bankDetails ? this.getBankDetailsHtml(invoice, 'es') : ''}

          <p>Por favor, procese el pago lo antes posible.</p>

          <p>Saludos cordiales,<br/>
          ${invoice.company.name}<br/>
          ${invoice.company.email}</p>
        </body>
        </html>
      `;
    }

    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Dear ${invoice.client.name},</p>

          <p>This is a reminder that you have an outstanding payment:</p>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Invoice ${invoice.invoiceNumber}</strong></p>
            <p>Amount Due: <strong>${amountDue}</strong></p>
            <p>Due Date: <strong>${dueDate}</strong></p>
          </div>

          ${invoice.bankDetails ? this.getBankDetailsHtml(invoice, 'en') : ''}

          <p>Please process this payment at your earliest convenience.</p>

          <p>Best regards,<br/>
          ${invoice.company.name}<br/>
          ${invoice.company.email}</p>
        </body>
      </html>
    `;
  }

  /**
   * Get bank details HTML
   */
  private getBankDetailsHtml(invoice: Invoice, language: string): string {
    if (!invoice.bankDetails) {
      return '';
    }

    const { accountHolder, accountNumber, bankName, swiftCode, iban } =
      invoice.bankDetails;

    if (language === 'es') {
      return `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>Datos Bancarios:</strong></p>
          <ul>
            <li>Titular: ${accountHolder}</li>
            <li>Banco: ${bankName}</li>
            <li>Cuenta: ${accountNumber}</li>
            ${iban ? `<li>IBAN: ${iban}</li>` : ''}
            ${swiftCode ? `<li>SWIFT: ${swiftCode}</li>` : ''}
          </ul>
        </div>
      `;
    }

    return `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p><strong>Bank Details:</strong></p>
        <ul>
          <li>Account Holder: ${accountHolder}</li>
          <li>Bank Name: ${bankName}</li>
          <li>Account Number: ${accountNumber}</li>
          ${iban ? `<li>IBAN: ${iban}</li>` : ''}
          ${swiftCode ? `<li>SWIFT: ${swiftCode}</li>` : ''}
        </ul>
      </div>
    `;
  }

  /**
   * Format price for display
   */
  private formatPrice(priceInCents: number): string {
    const price = priceInCents / 100;
    return `€${price.toFixed(2)}`;
  }
}
