/**
 * Tipos para el canal Empresas
 * Consolidación de corporate-portal al frontend-webapp
 * Fase 1: 2026-04-20
 */

// Tipos de cuenta de empresa
export type TipoCuenta = "grande" | "negocio" | "agencia";

// Estados de la cuenta
export type EstadoCuenta =
  | "prospect"
  | "activa"
  | "suspendida"
  | "cancelada";

// Roles en el sistema corporativo
export type RolEmpresa =
  | "admin"
  | "aprobador"
  | "solicitante"
  | "financiero"
  | "agente";

// Usuario corporativo
export interface CorporateUser {
  _id?: string;
  id?: string;
  email: string;
  nombre: string;
  apellido?: string;
  companyId: string;
  roles: RolEmpresa[];
  activo?: boolean;
  ultimoAcceso?: Date;
  creadoEn?: Date;
}

// Sesión de usuario
export interface SessionUser extends CorporateUser {
  companyName?: string;
  tipoCuenta?: TipoCuenta;
}

export interface Session {
  user: SessionUser;
  accessToken: string;
  refreshToken?: string;
}

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

// Empresa/Company
export interface Company {
  _id?: string;
  id?: string;
  razonSocial: string;
  ruc: string;
  tipoCuenta: TipoCuenta;
  estadoCuenta: EstadoCuenta;
  email: string;
  telefono?: string;
  ubicacion?: string;
  industria?: string;

  // Campos condicionales por tipoCuenta
  creditoAutorizado?: number; // grande
  plazoFacturacion?: number; // días
  comisionAgencia?: number; // % (agencia)

  // Wallet consolidada (grande)
  walletConsolidada?: {
    saldo: number;
    movimientos?: Array<{
      fecha: Date;
      tipo: "carga" | "gasto" | "ajuste";
      monto: number;
      referencia: string;
    }>;
  };

  // Límites de gasto por departamento (grande)
  deptosConLimitesGasto?: Array<{
    departamento: string;
    limite: number;
    gastado: number;
  }>;

  creadaEn?: Date;
  actualizadaEn?: Date;
}

// Solicitud de cuenta (pre-onboarding)
export interface SolicitudEmpresa {
  _id?: string;
  id?: string;
  tipoCuenta: TipoCuenta;
  estado: "prospect" | "evaluada" | "aprobada" | "rechazada";
  razonSocial: string;
  ruc: string;
  contactoEmail: string;
  contactoNombre: string;
  contactoTelefono: string;
  descripcionUso: string;
  empleadosEstimados: number;
  industria: string;
  ubicacion: string;
  notas?: string;
  documentosAdjuntos?: Array<{
    url: string;
    tipo: string;
  }>;
  creadaEn?: Date;
  actualizadaEn?: Date;
  asignadoA?: string; // Usuario de ventas/onboarding
}

// Viaje/Booking corporativo
export interface CorporateBooking {
  _id?: string;
  id?: string;
  companyId: string;
  solicitanteId: string;
  solicitanteNombre: string;
  origen: string;
  destino: string;
  fechaSalida: Date;
  fechaRegreso?: Date;
  pasajeros: number;
  tipo: "aéreo" | "terrestre" | "alojamiento";
  estado:
    | "solicitado"
    | "pendiente_aprobacion"
    | "aprobado"
    | "contratado"
    | "completado"
    | "cancelado";
  costo?: number;
  aprobadoPor?: string;
  aprobadoEn?: Date;
  creadoEn?: Date;
  actualizadoEn?: Date;
}

// Flujo de aprobación
export interface ApprovalWorkflow {
  _id?: string;
  id?: string;
  bookingId: string;
  companyId: string;
  nivel: number;
  aprobadorId: string;
  aprobadorNombre: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  notas?: string;
  creadoEn?: Date;
  respondidoEn?: Date;
}

// Factura consolidada
export interface ConsolidatedInvoice {
  _id?: string;
  id?: string;
  companyId: string;
  numero: string;
  periodo: string;
  estado: "pendiente" | "emitida" | "pagada" | "vencida";
  items: Array<{
    descripcion: string;
    cantidad: number;
    unitario: number;
    subtotal: number;
  }>;
  subtotal: number;
  impuestos: number;
  total: number;
  plazoVencimiento: number; // días
  fechaEmision?: Date;
  fechaVencimiento?: Date;
  fechaPago?: Date;
  creadaEn?: Date;
}

// TODO: Integrar con sistema global de auth en Fase 2
// TODO: Revisar desfase entre corporate-portal auth y frontend-webapp auth
