// ============================================================
// Datil API Client – Facturación Electrónica Ecuador (SRI)
// API Key: Secret DATIL_API_KEY en GCP Secret Manager
// Docs: https://datil.co/api
// ============================================================

const DATIL_API = 'https://app.datil.co/api/v2';

interface DatilRequestOptions {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
}

async function datilRequest<T>(opts: DatilRequestOptions): Promise<T> {
  const apiKey = process.env.DATIL_API_KEY;
  if (!apiKey) throw new Error('DATIL_API_KEY not configured');

  const res = await fetch(`${DATIL_API}${opts.path}`, {
    method: opts.method,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Datil API error ${res.status}: ${errText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Emisor (Going Ecuador) ───────────────────────────────────
// Estos datos vienen del perfil configurado en Datil
const EMISOR = {
  ruc: process.env.GOING_RUC || '',          // RUC de Going Ecuador
  razon_social: 'GOING ECUADOR',
  nombre_comercial: 'Going',
  direccion: process.env.GOING_ADDRESS || 'Quito, Ecuador',
  obligado_contabilidad: true,
  contribuyente_especial: '',
  establecimiento: {
    codigo: '001',
    direccion: process.env.GOING_ADDRESS || 'Quito, Ecuador',
    punto_emision: '001',
  },
};

// ─── Crear factura por viaje ──────────────────────────────────
export interface InvoiceInput {
  rideId: string;
  passengerName: string;
  passengerEmail: string;
  passengerIdentification: string;  // cédula o RUC
  identificationType: '04' | '05' | '06' | '08'; // 04=RUC, 05=cédula, 06=pasaporte
  fareSubtotal: number;             // Sin IVA
  ivaAmount: number;                // IVA 15%
  fareTotal: number;                // Total con IVA
  description: string;              // ej. "Viaje Quito → Guayaquil"
  date?: Date;
}

export interface DatilInvoiceResponse {
  id: string;
  secuencial: string;
  clave_acceso: string;
  estado: string;
  pdf: string;
  xml: string;
}

export async function createInvoice(input: InvoiceInput): Promise<DatilInvoiceResponse> {
  const date = input.date || new Date();
  const dateStr = date.toISOString().slice(0, 10);

  const payload = {
    ambiente: parseInt(process.env.DATIL_ENV || '1'), // 1=pruebas, 2=producción
    tipo_emision: 1,
    secuencia: -1, // Datil auto-asigna
    fecha_inicio_periodo_fiscal: dateStr,
    fecha_fin_periodo_fiscal: dateStr,
    emisor: EMISOR,
    moneda: 'USD',
    informacion_adicional: {
      ride_id: input.rideId,
    },
    totales: {
      total_sin_impuestos: round2(input.fareSubtotal),
      impuestos: [
        {
          codigo: 2,          // IVA
          codigo_porcentaje: '4', // 15%
          base_imponible: round2(input.fareSubtotal),
          valor: round2(input.ivaAmount),
        },
      ],
      importe_total: round2(input.fareTotal),
      propina: 0,
      descuento: 0,
    },
    comprador: {
      razon_social: input.passengerName,
      identificacion: input.passengerIdentification,
      tipo_identificacion: input.identificationType,
      email: input.passengerEmail,
      telefono: '',
      direccion: 'Ecuador',
    },
    items: [
      {
        cantidad: 1,
        codigo_principal: `VIAJE-${input.rideId.slice(-6).toUpperCase()}`,
        codigo_auxiliar: 'TRANSPORTE',
        descripcion: input.description,
        precio_unitario: round2(input.fareSubtotal),
        descuento: 0,
        precio_total_sin_impuestos: round2(input.fareSubtotal),
        impuestos: [
          {
            codigo: 2,
            codigo_porcentaje: '4',
            base_imponible: round2(input.fareSubtotal),
            valor: round2(input.ivaAmount),
            tarifa: 15,
          },
        ],
      },
    ],
  };

  console.log(`[datil] Creating invoice for ride ${input.rideId}`);
  const result = await datilRequest<DatilInvoiceResponse>({
    method: 'POST',
    path: '/facturas/emision',
    body: payload,
  });

  console.log(`[datil] Invoice created: ${result.id} | clave: ${result.clave_acceso}`);
  return result;
}

// ─── Consultar estado de factura ──────────────────────────────
export async function getInvoiceStatus(invoiceId: string): Promise<{ estado: string; clave_acceso: string }> {
  return datilRequest({ method: 'GET', path: `/facturas/${invoiceId}` });
}

// ─── Anular factura ───────────────────────────────────────────
export async function cancelInvoice(invoiceId: string): Promise<void> {
  await datilRequest({ method: 'DELETE', path: `/facturas/${invoiceId}` });
  console.log(`[datil] Invoice ${invoiceId} cancelled`);
}

// ─── Listar facturas por rango de fecha ───────────────────────
export async function listInvoices(from: Date, to: Date): Promise<DatilInvoiceResponse[]> {
  const params = new URLSearchParams({
    fecha_emision_inicio: from.toISOString().slice(0, 10),
    fecha_emision_fin: to.toISOString().slice(0, 10),
  });
  return datilRequest({ method: 'GET', path: `/facturas?${params}` });
}

// ─── Helper ───────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
