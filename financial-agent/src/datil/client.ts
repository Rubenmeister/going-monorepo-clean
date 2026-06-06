// ============================================================
// Datil API Client – Facturación Electrónica Ecuador (SRI)
// Base URL: https://link.datil.co
// Docs:     http://datil.dev/  (developers.datil.co)
//
// Auth:     header X-Key con DATIL_API_KEY
// Cert:     header X-Password con DATIL_CERT_PASSWORD (opcional —
//           solo necesario si el RUC en Datil tiene cert propio
//           configurado, no si usa el cert default de Datil)
// ============================================================

import { Firestore } from '@google-cloud/firestore';

const DATIL_API = 'https://link.datil.co';

interface DatilRequestOptions {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  idempotencyKey?: string;
}

async function datilRequest<T>(opts: DatilRequestOptions): Promise<T> {
  const apiKey = process.env.DATIL_API_KEY;
  if (!apiKey) throw new Error('DATIL_API_KEY not configured');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Key':        apiKey,
  };
  // X-Password solo si el cert está configurado a nivel de cuenta Datil
  if (process.env.DATIL_CERT_PASSWORD) {
    headers['X-Password'] = process.env.DATIL_CERT_PASSWORD;
  }
  if (opts.idempotencyKey) {
    headers['Idempotency-key'] = opts.idempotencyKey;
  }

  const res = await fetch(`${DATIL_API}${opts.path}`, {
    method:  opts.method,
    headers,
    body:    opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Datil API error ${res.status}: ${errText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Validación temprana de env vars críticas ─────────────────
const GOING_RUC = process.env.GOING_RUC;
if (!GOING_RUC) {
  throw new Error('[datil] GOING_RUC es requerido — el RUC no puede estar vacío (las facturas serían rechazadas por el SRI)');
}

const DATIL_ENV_RAW = process.env.DATIL_ENV;
if (!DATIL_ENV_RAW) {
  throw new Error('[datil] DATIL_ENV es requerido — usar "1" para pruebas o "2" para producción');
}
const DATIL_AMBIENTE = parseInt(DATIL_ENV_RAW, 10);
if (DATIL_AMBIENTE !== 1 && DATIL_AMBIENTE !== 2) {
  throw new Error(`[datil] DATIL_ENV debe ser "1" (pruebas) o "2" (producción), recibido: "${DATIL_ENV_RAW}"`);
}

// ─── Emisor (Going App Ecuador) ───────────────────────────────────
const ESTABLECIMIENTO_CODIGO  = process.env.GOING_ESTABLECIMIENTO || '001';
const ESTABLECIMIENTO_PUNTO   = process.env.GOING_PUNTO_EMISION  || '001';
const EMISOR = {
  ruc:                  GOING_RUC,
  razon_social:         process.env.GOING_RAZON_SOCIAL    || 'GOING ECUADOR',
  nombre_comercial:     process.env.GOING_NOMBRE_COMERCIAL || 'Going App',
  direccion:            process.env.GOING_ADDRESS         || 'Quito, Ecuador',
  obligado_contabilidad: true,
  contribuyente_especial: '',
  establecimiento: {
    codigo:        ESTABLECIMIENTO_CODIGO,
    direccion:     process.env.GOING_ADDRESS || 'Quito, Ecuador',
    punto_emision: ESTABLECIMIENTO_PUNTO,
  },
};

// ─── Counter de secuencial atómico (Firestore) ────────────────
//
// Datil exige `secuencial` como entero 1-999999999. Mantenemos un
// contador por establecimiento+punto en Firestore que se incrementa
// atómicamente cada emisión.
const fsdb = new Firestore({ projectId: process.env.GCP_PROJECT || 'going-5d1ae' });

async function nextSecuencial(): Promise<number> {
  const counterId = `${ESTABLECIMIENTO_CODIGO}-${ESTABLECIMIENTO_PUNTO}-${DATIL_AMBIENTE}`;
  const ref = fsdb.collection('invoice_counters').doc(counterId);

  const newValue = await fsdb.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data()?.value || 0) : 0;
    const next    = current + 1;
    tx.set(ref, { value: next, updatedAt: new Date() }, { merge: true });
    return next;
  });
  return newValue;
}

// ─── Crear factura por viaje ──────────────────────────────────
export interface InvoiceInput {
  rideId: string;
  passengerName: string;
  passengerEmail: string;
  passengerIdentification: string;  // cédula, RUC o consumidor final (9999999999999)
  identificationType: '04' | '05' | '06' | '07' | '08'; // 04=RUC, 05=cédula, 06=pasaporte, 07=consumidor final
  fareSubtotal: number;             // Sin IVA
  ivaAmount: number;                // IVA 15%
  fareTotal: number;                // Total con IVA
  description: string;
  paymentMedio?: string;            // 'efectivo' | 'tarjeta_credito' | 'tarjeta_debito' | 'transferencia' (default 'efectivo')
  date?: Date;
}

export interface DatilInvoiceResponse {
  id:           string;
  secuencial?:  string;
  clave_acceso?: string;
  estado?:      string;
  pdf?:         string;
  xml?:         string;
}

export async function createInvoice(input: InvoiceInput): Promise<DatilInvoiceResponse> {
  const date    = input.date || new Date();
  const fechaEmision = date.toISOString();
  const secuencial   = await nextSecuencial();
  const medio        = mapPaymentMedio(input.paymentMedio);

  const payload: Record<string, unknown> = {
    ambiente:      DATIL_AMBIENTE,        // 1=pruebas, 2=producción
    tipo_emision:  1,
    secuencial,
    fecha_emision: fechaEmision,
    emisor:        EMISOR,
    moneda:        'USD',
    info_adicional: [
      { nombre: 'ride_id',       valor: input.rideId },
      { nombre: 'passenger_email', valor: input.passengerEmail },
    ],
    totales: {
      total_sin_impuestos: round2(input.fareSubtotal),
      descuento:           0,
      propina:             0,
      importe_total:       round2(input.fareTotal),
      impuestos: [
        {
          codigo:            '2',           // IVA
          codigo_porcentaje: '4',           // 15%
          base_imponible:    round2(input.fareSubtotal),
          valor:             round2(input.ivaAmount),
        },
      ],
    },
    comprador: {
      razon_social:        input.passengerName,
      identificacion:      input.passengerIdentification,
      tipo_identificacion: input.identificationType,
      email:               input.passengerEmail,
      telefono:            '',
      direccion:           'Ecuador',
    },
    items: [
      {
        cantidad:                  1,
        codigo_principal:          `VIAJE-${input.rideId.slice(-6).toUpperCase()}`,
        codigo_auxiliar:           'TRANSPORTE',
        descripcion:               input.description,
        precio_unitario:           round2(input.fareSubtotal),
        descuento:                 0,
        precio_total_sin_impuestos: round2(input.fareSubtotal),
        impuestos: [
          {
            codigo:            '2',
            codigo_porcentaje: '4',
            tarifa:            15,
            base_imponible:    round2(input.fareSubtotal),
            valor:             round2(input.ivaAmount),
          },
        ],
      },
    ],
    pagos: [
      {
        medio,
        total: round2(input.fareTotal),
      },
    ],
  };

  console.log(`[datil] Creating invoice for ride ${input.rideId} | sec ${secuencial} | env ${DATIL_AMBIENTE}`);
  const result = await datilRequest<DatilInvoiceResponse>({
    method:         'POST',
    path:           '/invoices/issue',
    body:           payload,
    idempotencyKey: `ride-${input.rideId}-${secuencial}`,
  });

  console.log(`[datil] Invoice created: ${result.id} | clave: ${result.clave_acceso || '(pending)'}`);
  return result;
}

function mapPaymentMedio(method?: string): string {
  switch (method) {
    case 'card':     return 'tarjeta_credito';
    case 'transfer': return 'transferencia';
    case 'cash':
    default:         return 'efectivo';
  }
}

// ─── Consultar estado de factura ──────────────────────────────
export async function getInvoiceStatus(invoiceId: string): Promise<{ estado: string; clave_acceso: string }> {
  return datilRequest({ method: 'GET', path: `/invoices/${invoiceId}` });
}

// ─── Anular factura ───────────────────────────────────────────
export async function cancelInvoice(invoiceId: string): Promise<void> {
  await datilRequest({ method: 'DELETE', path: `/invoices/${invoiceId}` });
  console.log(`[datil] Invoice ${invoiceId} cancelled`);
}

// ─── Listar facturas por rango de fecha ───────────────────────
export async function listInvoices(from: Date, to: Date): Promise<DatilInvoiceResponse[]> {
  const params = new URLSearchParams({
    fecha_emision_inicio: from.toISOString().slice(0, 10),
    fecha_emision_fin:    to.toISOString().slice(0, 10),
  });
  return datilRequest({ method: 'GET', path: `/invoices?${params}` });
}

// ─── Helper ───────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
