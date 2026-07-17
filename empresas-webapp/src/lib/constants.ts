/**
 * Constantes y enums para Empresas
 * Traducciones al español Ecuador
 */

export const TIPOS_CUENTA = {
  grande: {
    label: "Empresa Grande",
    descripcion: "Para empresas grandes con crédito, aprobaciones multinivel y wallet consolidada",
    plazo: 40, // días
    requiereAprobaciones: true,
  },
  negocio: {
    label: "Negocio/PyME",
    descripcion: "Para pequeñas y medianas empresas, pago por viaje",
    plazo: 0, // inmediato
    requiereAprobaciones: false,
  },
  agencia: {
    label: "Agencia de Viajes",
    descripcion: "Programa especial para agencias con comisiones a 15 días",
    plazo: 15, // días
    requiereAprobaciones: false,
    comisionDefault: 10, // %
  },
};

export const ROLES = {
  admin: {
    label: "Administrador",
    descripcion: "Acceso total a la cuenta",
    permisos: ["*"],
  },
  aprobador: {
    label: "Aprobador",
    descripcion: "Aprueba viajes y aprobaciones",
    permisos: ["approve_bookings", "view_approvals", "view_bookings"],
  },
  solicitante: {
    label: "Solicitante",
    descripcion: "Solicita y gestiona viajes",
    permisos: ["create_bookings", "view_bookings", "view_team"],
  },
  financiero: {
    label: "Financiero",
    descripcion: "Gestiona facturación y reportes",
    permisos: ["view_invoices", "view_reports", "export_data"],
  },
  agente: {
    label: "Agente",
    descripcion: "Reserva viajes a nombre de terceros (solo agencias)",
    permisos: ["create_bookings_external", "view_bookings", "view_team"],
  },
};

export const ESTADOS_CUENTA = {
  prospect: {
    label: "Prospecto",
    descripcion: "Solicitud pendiente de evaluación",
  },
  activa: {
    label: "Activa",
    descripcion: "Cuenta operativa",
  },
  suspendida: {
    label: "Suspendida",
    descripcion: "Cuenta temporalmente suspendida",
  },
  cancelada: {
    label: "Cancelada",
    descripcion: "Cuenta cancelada",
  },
};

export const ESTADOS_BOOKING = {
  solicitado: {
    label: "Solicitado",
    color: "bg-blue-100 text-blue-800",
  },
  pendiente_aprobacion: {
    label: "Pendiente de aprobación",
    color: "bg-yellow-100 text-yellow-800",
  },
  aprobado: {
    label: "Aprobado",
    color: "bg-green-100 text-green-800",
  },
  contratado: {
    label: "Contratado",
    color: "bg-green-100 text-green-800",
  },
  completado: {
    label: "Completado",
    color: "bg-gray-100 text-gray-800",
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
  },
};

export const INDUSTRY_OPTIONS = [
  "Financiero",
  "Tecnología",
  "Retail",
  "Manufactura",
  "Educación",
  "Salud",
  "Construcción",
  "Logística",
  "Hospitalidad",
  "Otro",
];

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.goingec.com";

export const AUTH_TOKEN_KEY = "empresas_authToken";
export const REFRESH_TOKEN_KEY = "empresas_refreshToken";
export const USER_INFO_KEY = "empresas_userInfo";
export const SESSION_COOKIE = "going_empresas_session";

// TODO: Extraer strings a sistema i18n para soporte multiidioma (Fase 2)
// TODO: Configurar moneda según zona geográfica (Fase 2)
