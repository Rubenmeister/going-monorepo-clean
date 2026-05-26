/**
 * PdfGeneratorService — genera el PDF real de una factura usando pdfkit.
 *
 * Decisión Gap #3: pdfkit (≈3MB) preferido sobre puppeteer (≈150MB) porque
 * Cloud Run cobra por tamaño de imagen y arranque en frío. Layout
 * programático (no HTML→PDF) — más controlable y predecible.
 *
 * Estructura del PDF:
 *   - Header: razón social emisor + nº factura + estado
 *   - Bloque emisor/cliente (lado a lado)
 *   - Tabla de items con totales por línea (descripción, qty, unit, IVA, total)
 *   - Bloque de totales: subtotal, descuento, IVA, TOTAL
 *   - Datos bancarios (si la factura los tiene)
 *   - Notas / términos (si están)
 *
 * Idioma: invoice.language → 'es' | 'en'. Cambia labels.
 * Moneda: formato 'USD $X.XX' (Going opera en USD en Ecuador).
 */
import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice, InvoiceLanguage } from '../../domain/models/invoice.model';

type L10n = Record<string, string>;

const L10N_ES: L10n = {
  invoice: 'FACTURA',
  number: 'Número',
  status: 'Estado',
  from: 'Emisor',
  billTo: 'Cliente',
  taxId: 'RUC',
  phone: 'Teléfono',
  email: 'Email',
  issueDate: 'Fecha emisión',
  dueDate: 'Fecha vencimiento',
  description: 'Descripción',
  qty: 'Cant.',
  unit: 'Precio unit.',
  tax: 'IVA %',
  lineTotal: 'Subtotal',
  taxAmount: 'IVA',
  subtotal: 'Subtotal',
  discount: 'Descuento',
  total: 'TOTAL',
  bankDetails: 'Datos bancarios',
  bankHolder: 'Titular',
  bankName: 'Banco',
  accountNumber: 'Nº de cuenta',
  iban: 'IBAN',
  swift: 'SWIFT',
  notes: 'Notas',
  terms: 'Términos y condiciones',
};

const L10N_EN: L10n = {
  invoice: 'INVOICE',
  number: 'Number',
  status: 'Status',
  from: 'From',
  billTo: 'Bill to',
  taxId: 'Tax ID',
  phone: 'Phone',
  email: 'Email',
  issueDate: 'Issue date',
  dueDate: 'Due date',
  description: 'Description',
  qty: 'Qty',
  unit: 'Unit price',
  tax: 'Tax %',
  lineTotal: 'Subtotal',
  taxAmount: 'Tax',
  subtotal: 'Subtotal',
  discount: 'Discount',
  total: 'TOTAL',
  bankDetails: 'Bank details',
  bankHolder: 'Account holder',
  bankName: 'Bank',
  accountNumber: 'Account number',
  iban: 'IBAN',
  swift: 'SWIFT',
  notes: 'Notes',
  terms: 'Terms and conditions',
};

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Genera el buffer PDF de una factura.
   * Usa pdfkit en modo streaming: recolecta chunks en un array y los
   * concatena cuando termina (evita escribir a disco).
   */
  async generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Invoice ${invoice.invoiceNumber}`,
            Author: invoice.company?.name ?? 'Going',
            Subject: `Invoice ${invoice.invoiceNumber}`,
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.renderInvoice(doc, invoice);
        doc.end();
      } catch (err) {
        this.logger.error(`PDF generation failed: ${(err as Error).message}`);
        reject(err);
      }
    });
  }

  // ── Render ──────────────────────────────────────────────────────────

  private renderInvoice(doc: PDFKit.PDFDocument, invoice: Invoice): void {
    const t = invoice.language === InvoiceLanguage.SPANISH ? L10N_ES : L10N_EN;
    const currency = (invoice as any).currency ?? 'USD';

    // Header
    doc
      .fontSize(20)
      .fillColor('#111')
      .text(t.invoice, { align: 'right' });
    doc
      .fontSize(10)
      .fillColor('#555')
      .text(`${t.number}: ${invoice.invoiceNumber}`, { align: 'right' })
      .text(`${t.status}: ${invoice.status}`, { align: 'right' });
    doc.moveDown(2);

    // Bloques From / Bill to (lado a lado)
    const topY = doc.y;
    this.drawPartyBlock(doc, t.from, invoice.company, 50, topY, t);
    this.drawPartyBlock(doc, t.billTo, invoice.client, 320, topY, t);
    doc.moveDown(8);

    // Fechas
    const localeFn = invoice.language === InvoiceLanguage.SPANISH ? 'es-EC' : 'en-US';
    doc
      .fontSize(10)
      .fillColor('#111')
      .text(
        `${t.issueDate}: ${new Date(invoice.issueDate).toLocaleDateString(localeFn)}`,
        50,
        doc.y,
      )
      .text(
        `${t.dueDate}: ${new Date(invoice.dueDate).toLocaleDateString(localeFn)}`,
        50,
        doc.y,
      );
    doc.moveDown(1.5);

    // Tabla de items
    this.drawLineItemsTable(doc, invoice, t, currency);

    // Totales
    doc.moveDown(1);
    this.drawTotals(doc, invoice, t, currency);

    // Datos bancarios
    if (invoice.bankDetails) {
      doc.moveDown(2);
      doc
        .fontSize(11)
        .fillColor('#111')
        .text(t.bankDetails, { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#444');
      if (invoice.bankDetails.accountHolder)
        doc.text(`${t.bankHolder}: ${invoice.bankDetails.accountHolder}`);
      if (invoice.bankDetails.bankName)
        doc.text(`${t.bankName}: ${invoice.bankDetails.bankName}`);
      if (invoice.bankDetails.accountNumber)
        doc.text(`${t.accountNumber}: ${invoice.bankDetails.accountNumber}`);
      if (invoice.bankDetails.iban)
        doc.text(`${t.iban}: ${invoice.bankDetails.iban}`);
      if (invoice.bankDetails.swiftCode)
        doc.text(`${t.swift}: ${invoice.bankDetails.swiftCode}`);
    }

    // Notas
    if (invoice.notes) {
      doc.moveDown(1.5);
      doc
        .fontSize(11)
        .fillColor('#111')
        .text(t.notes, { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#444').text(invoice.notes);
    }

    // Términos
    if (invoice.terms) {
      doc.moveDown(1);
      doc
        .fontSize(11)
        .fillColor('#111')
        .text(t.terms, { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor('#444').text(invoice.terms);
    }
  }

  private drawPartyBlock(
    doc: PDFKit.PDFDocument,
    label: string,
    party: { name?: string; email?: string; phone?: string; taxId?: string; address?: any },
    x: number,
    y: number,
    t: L10n,
  ): void {
    doc
      .fontSize(10)
      .fillColor('#888')
      .text(label.toUpperCase(), x, y);

    doc.fontSize(11).fillColor('#111').text(party.name ?? '—', x, y + 14);
    let cursor = y + 30;
    if (party.address) {
      const addr = party.address;
      const line1 = [addr.street].filter(Boolean).join(', ');
      const line2 = [addr.city, addr.zipCode, addr.country].filter(Boolean).join(', ');
      if (line1) {
        doc.fontSize(9).fillColor('#444').text(line1, x, cursor);
        cursor += 12;
      }
      if (line2) {
        doc.fontSize(9).fillColor('#444').text(line2, x, cursor);
        cursor += 12;
      }
    }
    if (party.phone) {
      doc.fontSize(9).fillColor('#444').text(`${t.phone}: ${party.phone}`, x, cursor);
      cursor += 12;
    }
    if (party.email) {
      doc.fontSize(9).fillColor('#444').text(`${t.email}: ${party.email}`, x, cursor);
      cursor += 12;
    }
    if (party.taxId) {
      doc.fontSize(9).fillColor('#444').text(`${t.taxId}: ${party.taxId}`, x, cursor);
    }
  }

  private drawLineItemsTable(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    t: L10n,
    currency: string,
  ): void {
    const startX = 50;
    const startY = doc.y;
    const colW = { desc: 200, qty: 40, unit: 80, tax: 50, sub: 80, ivat: 50 };

    // Header
    doc
      .fontSize(9)
      .fillColor('#fff')
      .rect(startX, startY, 500, 18)
      .fill('#333')
      .fillColor('#fff');
    doc.text(t.description, startX + 5, startY + 5, { width: colW.desc });
    doc.text(t.qty, startX + colW.desc + 5, startY + 5, { width: colW.qty, align: 'right' });
    doc.text(t.unit, startX + colW.desc + colW.qty + 5, startY + 5, { width: colW.unit, align: 'right' });
    doc.text(t.tax, startX + colW.desc + colW.qty + colW.unit + 5, startY + 5, { width: colW.tax, align: 'right' });
    doc.text(t.lineTotal, startX + colW.desc + colW.qty + colW.unit + colW.tax + 5, startY + 5, { width: colW.sub, align: 'right' });
    doc.text(t.taxAmount, startX + colW.desc + colW.qty + colW.unit + colW.tax + colW.sub + 5, startY + 5, { width: colW.ivat, align: 'right' });

    // Rows
    let y = startY + 22;
    doc.fillColor('#111').fontSize(9);
    for (const item of invoice.lineItems) {
      doc.text(item.description, startX + 5, y, { width: colW.desc });
      doc.text(String(item.quantity), startX + colW.desc + 5, y, { width: colW.qty, align: 'right' });
      doc.text(this.fmt(item.unitPrice, currency), startX + colW.desc + colW.qty + 5, y, { width: colW.unit, align: 'right' });
      doc.text(`${item.taxRate}%`, startX + colW.desc + colW.qty + colW.unit + 5, y, { width: colW.tax, align: 'right' });
      doc.text(this.fmt(item.total, currency), startX + colW.desc + colW.qty + colW.unit + colW.tax + 5, y, { width: colW.sub, align: 'right' });
      doc.text(this.fmt(item.taxAmount, currency), startX + colW.desc + colW.qty + colW.unit + colW.tax + colW.sub + 5, y, { width: colW.ivat, align: 'right' });
      y += 16;
      // Hoja nueva si nos pasamos
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
    }

    doc.moveTo(startX, y).lineTo(startX + 500, y).strokeColor('#ddd').stroke();
    doc.y = y + 5;
  }

  private drawTotals(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    t: L10n,
    currency: string,
  ): void {
    const rightX = 400;
    const baseY = doc.y;
    doc.fontSize(10).fillColor('#444');
    doc.text(`${t.subtotal}: ${this.fmt(invoice.subtotal, currency)}`, rightX, baseY, { width: 150, align: 'right' });

    let y = baseY + 14;
    if (invoice.discountAmount && invoice.discountAmount > 0) {
      doc.text(
        `${t.discount}: -${this.fmt(invoice.discountAmount, currency)}`,
        rightX,
        y,
        { width: 150, align: 'right' },
      );
      y += 14;
    }
    doc.text(
      `${t.taxAmount}: ${this.fmt(invoice.taxAmount, currency)}`,
      rightX,
      y,
      { width: 150, align: 'right' },
    );
    y += 18;

    doc
      .fontSize(13)
      .fillColor('#111')
      .text(
        `${t.total}: ${this.fmt(invoice.total, currency)}`,
        rightX,
        y,
        { width: 150, align: 'right' },
      );
  }

  /** Formatea centavos → "$X.XX" o "USD $X.XX" según moneda. */
  private fmt(cents: number, currency: string): string {
    const amount = (cents / 100).toFixed(2);
    return `${currency === 'USD' ? '$' : currency + ' '}${amount}`;
  }
}
