import { Firestore, Timestamp } from '@google-cloud/firestore';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// SRI Reports – Ecuador
// 1. Reporte mensual IVA (Formulario 104)
// 2. Archivo ATS (Anexo Transaccional Simplificado)
// 3. Alertas de vencimiento de declaraciones
//
// IVA Ecuador: 15% (vigente desde 2024)
// Retenido en fuente: 1% servicios de transporte
// Formulario 104: IVA mensual — vence día 20 del mes siguiente
// Formulario 103: Retenciones — vence día 20 del mes siguiente
// ============================================================

const db = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

// ─── Tipos ────────────────────────────────────────────────────
export interface MonthlyIVAReport {
  year: number;
  month: number;           // 1–12
  monthName: string;

  // Ventas (Going como vendedor)
  totalSalesWithIVA: number;
  totalSalesSubtotal: number;
  ivaCollected: number;    // IVA cobrado a pasajeros (15%)
  totalInvoices: number;
  cancelledInvoices: number;

  // Compras/Gastos (Going como comprador) — para crédito tributario
  totalPurchases: number;
  ivaOnPurchases: number;  // IVA pagado en gastos

  // Liquidación
  ivaPayable: number;      // ivaCollected - ivaOnPurchases
  retentionCredit: number; // Retenciones recibidas

  // SRI
  deadlineDate: Date;      // Fecha límite declaración
  daysUntilDeadline: number;

  generatedAt: Date;
}

export interface ATSRecord {
  tipo: 'venta' | 'compra';
  fechaEmision: string;   // DD/MM/YYYY
  numeroFactura: string;
  razonSocial: string;
  identificacion: string;
  tipoIdent: string;      // '04'=RUC, '05'=cédula
  baseImponible: number;
  iva: number;
  total: number;
  formaPago: string;      // '20'=otros
  estado: 'AUTORIZADO' | 'ANULADO';
  claveAcceso: string;
}

// ─── Reporte mensual IVA ──────────────────────────────────────
export async function generateMonthlyIVAReport(year: number, month: number): Promise<MonthlyIVAReport> {
  const from = new Date(year, month - 1, 1, 0, 0, 0);
  const to   = new Date(year, month, 0, 23, 59, 59);   // Último día del mes

  console.log(`[sri] Generating IVA report for ${month}/${year}`);

  // Obtener facturas autorizadas del mes
  const invoicesSnap = await db.collection('invoices')
    .where('status', '==', 'authorized')
    .where('createdAt', '>=', Timestamp.fromDate(from))
    .where('createdAt', '<=', Timestamp.fromDate(to))
    .get();

  const cancelledSnap = await db.collection('invoices')
    .where('status', '==', 'cancelled')
    .where('createdAt', '>=', Timestamp.fromDate(from))
    .where('createdAt', '<=', Timestamp.fromDate(to))
    .get();

  const invoices = invoicesSnap.docs.map(d => d.data());

  const totalSalesSubtotal = invoices.reduce((s, i) => s + (i.subtotal || 0), 0);
  const ivaCollected       = invoices.reduce((s, i) => s + (i.iva || 0), 0);
  const totalSalesWithIVA  = invoices.reduce((s, i) => s + (i.total || 0), 0);

  // Gastos del mes (compras, servicios contratados)
  const purchasesSnap = await db.collection('expenses')
    .where('date', '>=', Timestamp.fromDate(from))
    .where('date', '<=', Timestamp.fromDate(to))
    .get();

  const expenses = purchasesSnap.docs.map(d => d.data());
  const totalPurchases  = expenses.reduce((s, e) => s + (e.subtotal || 0), 0);
  const ivaOnPurchases  = expenses.reduce((s, e) => s + (e.iva || 0), 0);
  const retentionCredit = expenses.reduce((s, e) => s + (e.retentionReceived || 0), 0);

  const ivaPayable = Math.max(0, round2(ivaCollected - ivaOnPurchases - retentionCredit));

  // Fecha límite: día 20 del mes siguiente
  const deadlineDate = new Date(year, month, 20);
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000);

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const report: MonthlyIVAReport = {
    year,
    month,
    monthName: monthNames[month - 1],
    totalSalesWithIVA: round2(totalSalesWithIVA),
    totalSalesSubtotal: round2(totalSalesSubtotal),
    ivaCollected: round2(ivaCollected),
    totalInvoices: invoicesSnap.size,
    cancelledInvoices: cancelledSnap.size,
    totalPurchases: round2(totalPurchases),
    ivaOnPurchases: round2(ivaOnPurchases),
    ivaPayable,
    retentionCredit: round2(retentionCredit),
    deadlineDate,
    daysUntilDeadline,
    generatedAt: new Date(),
  };

  // Guardar en Firestore
  await db.collection('iva_reports').doc(`${year}-${String(month).padStart(2, '0')}`).set({
    ...report,
    deadlineDate: Timestamp.fromDate(deadlineDate),
    generatedAt: Timestamp.now(),
  });

  console.log(`[sri] IVA report done: ventas $${report.totalSalesWithIVA}, IVA a pagar $${report.ivaPayable}`);
  return report;
}

// ─── Generar archivo ATS (XML para SRI) ───────────────────────
export async function generateATS(year: number, month: number): Promise<string> {
  const from = new Date(year, month - 1, 1, 0, 0, 0);
  const to   = new Date(year, month, 0, 23, 59, 59);

  console.log(`[sri] Generating ATS for ${month}/${year}`);

  const invoicesSnap = await db.collection('invoices')
    .where('createdAt', '>=', Timestamp.fromDate(from))
    .where('createdAt', '<=', Timestamp.fromDate(to))
    .get();

  const records: ATSRecord[] = invoicesSnap.docs.map(doc => {
    const i = doc.data();
    const date = i.createdAt?.toDate?.() || new Date();
    return {
      tipo: 'venta',
      fechaEmision: `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`,
      numeroFactura: i.sequential || '',
      razonSocial: i.passengerName || 'Consumidor Final',
      identificacion: i.passengerIdentification || '9999999999999',
      tipoIdent: i.identificationType || '05',
      baseImponible: i.subtotal || 0,
      iva: i.iva || 0,
      total: i.total || 0,
      formaPago: '20',
      estado: i.status === 'cancelled' ? 'ANULADO' : 'AUTORIZADO',
      claveAcceso: i.accessKey || '',
    };
  });

  // Generar XML ATS
  const xml = buildATSXML(year, month, records);

  // Guardar archivo
  const fileName = `ATS_${year}_${String(month).padStart(2,'0')}.xml`;
  const filePath = path.join('/tmp', fileName);
  fs.writeFileSync(filePath, xml, 'utf-8');

  console.log(`[sri] ATS generated: ${records.length} records → ${filePath}`);
  return filePath;
}

function buildATSXML(year: number, month: number, records: ATSRecord[]): string {
  const ventasXML = records
    .filter(r => r.tipo === 'venta')
    .map(r => `
    <detalleVenta>
      <tpIdCliente>${r.tipoIdent}</tpIdCliente>
      <idCliente>${r.identificacion}</idCliente>
      <parteRel>NO</parteRel>
      <tipoComprobante>01</tipoComprobante>
      <tipoEm>E</tipoEm>
      <numeroComprobante>${r.numeroFactura}</numeroComprobante>
      <autorizacion>${r.claveAcceso}</autorizacion>
      <fechaEmision>${r.fechaEmision}</fechaEmision>
      <establecimiento>001</establecimiento>
      <puntoEmision>001</puntoEmision>
      <secuencial>${r.numeroFactura.split('-').pop() || ''}</secuencial>
      <fechaEntRegCont>${r.fechaEmision}</fechaEntRegCont>
      <tpRenta>331</tpRenta>
      <baseNoGraIva>0.00</baseNoGraIva>
      <baseImponible>0.00</baseImponible>
      <baseImpGrav>${r.baseImponible.toFixed(2)}</baseImpGrav>
      <montoIva>${r.iva.toFixed(2)}</montoIva>
      <montoIce>0.00</montoIce>
      <valorRetIva>0.00</valorRetIva>
      <valorRetRenta>0.00</valorRetRenta>
      <formaPago>${r.formaPago}</formaPago>
    </detalleVenta>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<iva id="ruc" version="2.11">
  <TipoIDInformante>RUC</TipoIDInformante>
  <IdInformante>${process.env.GOING_RUC || '9999999999001'}</IdInformante>
  <razonSocial>GOING ECUADOR</razonSocial>
  <Anio>${year}</Anio>
  <Mes>${String(month).padStart(2, '0')}</Mes>
  <numEstabRuc>001</numEstabRuc>
  <totalVentas>${records.reduce((s,r) => s + r.total, 0).toFixed(2)}</totalVentas>
  <codigoOperativo>IVA</codigoOperativo>
  <ventas>${ventasXML}
  </ventas>
  <compras/>
</iva>`;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
