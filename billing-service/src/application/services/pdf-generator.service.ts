/**
 * PDF Generator Service
 * Generates professional PDF invoices from invoice data
 */

import { Injectable, Logger } from '@nestjs/common';
import { Invoice, InvoiceLanguage } from '../../domain/models/invoice.model';
import { TaxCalculatorService } from './tax-calculator.service';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  constructor(private readonly taxCalculator: TaxCalculatorService) {}

  /**
   * Generate PDF buffer from invoice
   * @param invoice Invoice data
   * @returns PDF buffer (bytes)
   */
  async generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
    try {
      // Get HTML template based on language
      const htmlTemplate = this.getTemplate(invoice.language);

      // Generate HTML content
      const htmlContent = this.generateHtmlContent(invoice, htmlTemplate);

      // TODO: Convert HTML to PDF using a library like pdfkit or puppeteer
      // For now, return a placeholder buffer
      this.logger.log(`PDF generated for invoice ${invoice.invoiceNumber}`);

      return Buffer.from(htmlContent, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error}`);
      throw error;
    }
  }

  /**
   * Get HTML template for invoice
   * @param language Invoice language
   * @returns HTML template
   */
  private getTemplate(language: InvoiceLanguage): string {
    const templates = {
      [InvoiceLanguage.SPANISH]: this.getSpanishTemplate(),
      [InvoiceLanguage.ENGLISH]: this.getEnglishTemplate(),
    };

    return templates[language] || templates[InvoiceLanguage.ENGLISH];
  }

  /**
   * Generate HTML content for invoice
   * @param invoice Invoice data
   * @param template HTML template
   * @returns Filled HTML content
   */
  private generateHtmlContent(invoice: Invoice, template: string): string {
    let html = template;

    // Replace company info
    html = html.replace('{{company.name}}', invoice.company.name || '');
    html = html.replace(
      '{{company.address}}',
      `${invoice.company.address.street}, ${invoice.company.address.city} ${invoice.company.address.zipCode}`
    );
    html = html.replace('{{company.phone}}', invoice.company.phone || '');
    html = html.replace('{{company.email}}', invoice.company.email || '');
    html = html.replace('{{company.taxId}}', invoice.company.taxId || '');
    html = html.replace('{{company.website}}', invoice.company.website || '');

    // Replace client info
    html = html.replace('{{client.name}}', invoice.client.name || '');
    html = html.replace(
      '{{client.address}}',
      `${invoice.client.address.street}, ${invoice.client.address.city} ${invoice.client.address.zipCode}`
    );
    html = html.replace('{{client.phone}}', invoice.client.phone || '');
    html = html.replace('{{client.email}}', invoice.client.email || '');
    html = html.replace('{{client.taxId}}', invoice.client.taxId || '');

    // Replace invoice details
    html = html.replace('{{invoiceNumber}}', invoice.invoiceNumber);
    html = html.replace(
      '{{issueDate}}',
      new Date(invoice.issueDate).toLocaleDateString(
        this.getLocale(invoice.language)
      )
    );
    html = html.replace(
      '{{dueDate}}',
      new Date(invoice.dueDate).toLocaleDateString(
        this.getLocale(invoice.language)
      )
    );

    // Replace line items
    const lineItemsHtml = invoice.lineItems
      .map(
        (item) => `
      <tr>
        <td>${item.description}</td>
        <td align="right">${item.quantity}</td>
        <td align="right">${this.formatPrice(item.unitPrice)}</td>
        <td align="right">${item.taxRate}%</td>
        <td align="right">${this.formatPrice(item.total)}</td>
        <td align="right">${this.formatPrice(item.taxAmount)}</td>
      </tr>
    `
      )
      .join('');

    html = html.replace('{{lineItems}}', lineItemsHtml);

    // Replace totals
    html = html.replace('{{subtotal}}', this.formatPrice(invoice.subtotal));
    html = html.replace('{{taxAmount}}', this.formatPrice(invoice.taxAmount));
    html = html.replace(
      '{{discountAmount}}',
      this.formatPrice(invoice.discountAmount || 0)
    );
    html = html.replace('{{total}}', this.formatPrice(invoice.total));

    // Replace payment info
    if (invoice.bankDetails) {
      html = html.replace(
        '{{bankAccountHolder}}',
        invoice.bankDetails.accountHolder
      );
      html = html.replace(
        '{{bankAccountNumber}}',
        invoice.bankDetails.accountNumber
      );
      html = html.replace('{{bankName}}', invoice.bankDetails.bankName);
      html = html.replace(
        '{{bankSwiftCode}}',
        invoice.bankDetails.swiftCode || ''
      );
      html = html.replace('{{bankIban}}', invoice.bankDetails.iban || '');
    }

    // Replace notes and terms
    html = html.replace('{{notes}}', invoice.notes || '');
    html = html.replace('{{terms}}', invoice.terms || '');

    return html;
  }

  /**
   * Get Spanish invoice template
   */
  private getSpanishTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factura {{invoiceNumber}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .company-info { float: left; width: 45%; }
    .client-info { float: right; width: 45%; }
    .clearfix { clear: both; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .totals { text-align: right; margin-top: 20px; }
    .total-row { font-weight: bold; font-size: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FACTURA</h1>
    <p>Número: {{invoiceNumber}}</p>
  </div>

  <div class="company-info">
    <h3>Empresa:</h3>
    <p><strong>{{company.name}}</strong></p>
    <p>{{company.address}}</p>
    <p>Teléfono: {{company.phone}}</p>
    <p>Email: {{company.email}}</p>
    <p>CIF: {{company.taxId}}</p>
  </div>

  <div class="client-info">
    <h3>Cliente:</h3>
    <p><strong>{{client.name}}</strong></p>
    <p>{{client.address}}</p>
    <p>Teléfono: {{client.phone}}</p>
    <p>Email: {{client.email}}</p>
    <p>CIF: {{client.taxId}}</p>
  </div>

  <div class="clearfix"></div>

  <p><strong>Fecha de Emisión:</strong> {{issueDate}}</p>
  <p><strong>Fecha de Vencimiento:</strong> {{dueDate}}</p>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Precio Unitario</th>
        <th>IVA</th>
        <th>Subtotal</th>
        <th>Impuesto</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems}}
    </tbody>
  </table>

  <div class="totals">
    <p><strong>Subtotal:</strong> {{subtotal}}</p>
    <p><strong>Impuesto (IVA):</strong> {{taxAmount}}</p>
    <p><strong>Descuento:</strong> -{{discountAmount}}</p>
    <p class="total-row"><strong>TOTAL:</strong> {{total}}</p>
  </div>

  {{#if bankDetails}}
  <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
    <h3>Datos Bancarios:</h3>
    <p><strong>Titular:</strong> {{bankAccountHolder}}</p>
    <p><strong>Banco:</strong> {{bankName}}</p>
    <p><strong>Cuenta:</strong> {{bankAccountNumber}}</p>
    <p><strong>IBAN:</strong> {{bankIban}}</p>
    <p><strong>SWIFT:</strong> {{bankSwiftCode}}</p>
  </div>
  {{/if}}

  {{#if notes}}
  <div style="margin-top: 20px;">
    <h3>Notas:</h3>
    <p>{{notes}}</p>
  </div>
  {{/if}}
</body>
</html>
    `;
  }

  /**
   * Get English invoice template
   */
  private getEnglishTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice {{invoiceNumber}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .company-info { float: left; width: 45%; }
    .client-info { float: right; width: 45%; }
    .clearfix { clear: both; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .totals { text-align: right; margin-top: 20px; }
    .total-row { font-weight: bold; font-size: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Number: {{invoiceNumber}}</p>
  </div>

  <div class="company-info">
    <h3>From:</h3>
    <p><strong>{{company.name}}</strong></p>
    <p>{{company.address}}</p>
    <p>Phone: {{company.phone}}</p>
    <p>Email: {{company.email}}</p>
    <p>Tax ID: {{company.taxId}}</p>
  </div>

  <div class="client-info">
    <h3>Bill To:</h3>
    <p><strong>{{client.name}}</strong></p>
    <p>{{client.address}}</p>
    <p>Phone: {{client.phone}}</p>
    <p>Email: {{client.email}}</p>
    <p>Tax ID: {{client.taxId}}</p>
  </div>

  <div class="clearfix"></div>

  <p><strong>Issue Date:</strong> {{issueDate}}</p>
  <p><strong>Due Date:</strong> {{dueDate}}</p>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Tax</th>
        <th>Subtotal</th>
        <th>Tax Amount</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems}}
    </tbody>
  </table>

  <div class="totals">
    <p><strong>Subtotal:</strong> {{subtotal}}</p>
    <p><strong>Tax:</strong> {{taxAmount}}</p>
    <p><strong>Discount:</strong> -{{discountAmount}}</p>
    <p class="total-row"><strong>TOTAL:</strong> {{total}}</p>
  </div>

  {{#if bankDetails}}
  <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
    <h3>Bank Details:</h3>
    <p><strong>Account Holder:</strong> {{bankAccountHolder}}</p>
    <p><strong>Bank Name:</strong> {{bankName}}</p>
    <p><strong>Account Number:</strong> {{bankAccountNumber}}</p>
    <p><strong>IBAN:</strong> {{bankIban}}</p>
    <p><strong>SWIFT:</strong> {{bankSwiftCode}}</p>
  </div>
  {{/if}}

  {{#if notes}}
  <div style="margin-top: 20px;">
    <h3>Notes:</h3>
    <p>{{notes}}</p>
  </div>
  {{/if}}
</body>
</html>
    `;
  }

  /**
   * Format price for display
   * @param priceInCents Price in cents
   * @returns Formatted price (e.g., '€100.00')
   */
  private formatPrice(priceInCents: number): string {
    const price = priceInCents / 100;
    return `€${price.toFixed(2)}`;
  }

  /**
   * Get locale from language
   * @param language Language code
   * @returns Locale string (e.g., 'es-ES', 'en-US')
   */
  private getLocale(language: InvoiceLanguage): string {
    const locales: Record<InvoiceLanguage, string> = {
      [InvoiceLanguage.SPANISH]: 'es-ES',
      [InvoiceLanguage.ENGLISH]: 'en-US',
    };

    return locales[language];
  }
}
