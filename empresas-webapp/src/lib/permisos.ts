/**
 * Configuración de funcionalidades por tipo de cuenta
 *
 * Define qué secciones del panel y qué KPIs son relevantes
 * para cada tipo: grande, negocio, agencia.
 *
 * Reglas contractuales:
 *  - grande:  crédito 40 días · aprobaciones multinivel · wallet consolidada
 *  - negocio: pago por viaje (inmediato) · sin aprobaciones · sin crédito
 *  - agencia: comisión 10% · cobro a 15 días · reservas a nombre de terceros
 */

export type TipoCuenta = "grande" | "negocio" | "agencia";

// ─── Navegación ──────────────────────────────────────────────────────────────

export interface NavItem {
  href: string;
  label: string;
}

const NAV_PANEL:        NavItem = { href: "/panel",        label: "Panel de Control" };
const NAV_VIAJES:       NavItem = { href: "/panel/viajes",       label: "Viajes" };
const NAV_SOLICITAR:    NavItem = { href: "/panel/solicitar",    label: "Solicitar Viaje" };
const NAV_APROBACIONES: NavItem = { href: "/panel/aprobaciones", label: "Aprobaciones" };
const NAV_EQUIPO:       NavItem = { href: "/panel/equipo",       label: "Equipo" };
const NAV_ADMINS:       NavItem = { href: "/panel/administradores", label: "Administradores" };
const NAV_FACTURACION:  NavItem = { href: "/panel/facturacion",  label: "Facturación" };
const NAV_REPORTES:     NavItem = { href: "/panel/reportes",     label: "Reportes" };
const NAV_CONFIG:       NavItem = { href: "/panel/configuracion", label: "Configuración" };
const NAV_CONDICIONES:  NavItem = { href: "/panel/condiciones",   label: "Mis Condiciones" };
const NAV_PRESUPUESTO:  NavItem = { href: "/panel/presupuesto",   label: "Presupuesto" };
const NAV_FAVORITOS:    NavItem = { href: "/panel/favoritos",     label: "Favoritos" };
// Seguimiento en Vivo unifica la vista de flota (todos los empleados en un mapa)
// con el detalle por viaje (clic en un viaje → el mapa vuela a su posición).
// Antes eran dos entradas ("Tracking en Vivo" + "Mapa en Vivo") que confundían.
const NAV_SEGUIMIENTO:  NavItem = { href: "/panel/mapa",          label: "Seguimiento en Vivo" };
const NAV_SEGURIDAD:    NavItem = { href: "/panel/seguridad",      label: "Seguridad" };
const NAV_POLITICA:     NavItem = { href: "/panel/politica",       label: "Política de Viajes" };
const NAV_SOSTENIB:     NavItem = { href: "/panel/sostenibilidad",  label: "Sostenibilidad" };
const NAV_RECURRENTES:  NavItem = { href: "/panel/recurrentes",   label: "Recurrentes" };
const NAV_COTIZACION:   NavItem = { href: "/panel/cotizacion",    label: "Cotización Grupos" };
const NAV_LEGAL:        NavItem = { href: "/panel/legal",         label: "Legal Corporativo" };

export const NAV_POR_TIPO: Record<TipoCuenta, NavItem[]> = {
  grande: [
    NAV_PANEL,
    NAV_VIAJES,
    NAV_SOLICITAR,
    NAV_FAVORITOS,
    NAV_RECURRENTES,
    NAV_APROBACIONES,   // ✅ aprobaciones multinivel
    NAV_EQUIPO,
    NAV_ADMINS,
    NAV_PRESUPUESTO,    // ✅ control de gasto por área
    NAV_FACTURACION,
    NAV_REPORTES,
    NAV_SEGUIMIENTO,
    NAV_SEGURIDAD,
    NAV_POLITICA,
    NAV_SOSTENIB,
    NAV_COTIZACION,
    NAV_CONDICIONES,
    NAV_LEGAL,
    NAV_CONFIG,
  ],
  negocio: [
    NAV_PANEL,
    NAV_VIAJES,
    NAV_SOLICITAR,
    NAV_FAVORITOS,
    NAV_RECURRENTES,
    // ❌ sin aprobaciones — pago inmediato
    NAV_EQUIPO,
    NAV_ADMINS,
    NAV_PRESUPUESTO,
    NAV_FACTURACION,
    NAV_REPORTES,
    NAV_SEGUIMIENTO,
    NAV_SEGURIDAD,
    NAV_POLITICA,
    NAV_SOSTENIB,
    NAV_COTIZACION,
    NAV_CONDICIONES,
    NAV_LEGAL,
    NAV_CONFIG,
  ],
  agencia: [
    NAV_PANEL,
    NAV_VIAJES,
    NAV_SOLICITAR,
    NAV_FAVORITOS,
    NAV_RECURRENTES,
    // ❌ sin aprobaciones
    NAV_EQUIPO,
    NAV_ADMINS,
    { href: "/panel/facturacion", label: "Comisiones" }, // mismo endpoint, label distinto
    NAV_REPORTES,
    NAV_SEGUIMIENTO,
    NAV_SEGURIDAD,
    NAV_POLITICA,
    NAV_SOSTENIB,
    NAV_COTIZACION,
    NAV_CONDICIONES,
    NAV_LEGAL,
    NAV_CONFIG,
  ],
};

/** Nav por defecto si tipoCuenta no está definido (muestra todo) */
export const NAV_DEFAULT: NavItem[] = [
  NAV_PANEL, NAV_VIAJES, NAV_SOLICITAR, NAV_FAVORITOS, NAV_RECURRENTES,
  NAV_APROBACIONES, NAV_EQUIPO, NAV_ADMINS, NAV_PRESUPUESTO, NAV_FACTURACION,
  NAV_REPORTES, NAV_SEGUIMIENTO, NAV_SEGURIDAD, NAV_POLITICA, NAV_SOSTENIB, NAV_COTIZACION, NAV_CONDICIONES, NAV_LEGAL, NAV_CONFIG,
];

export function getNavItems(tipoCuenta?: string): NavItem[] {
  if (!tipoCuenta) return NAV_DEFAULT;
  return NAV_POR_TIPO[tipoCuenta as TipoCuenta] ?? NAV_DEFAULT;
}

// ─── KPIs del Dashboard ──────────────────────────────────────────────────────

export interface KPIConfig {
  label: string;
  /** Clave en DashboardStats o valor calculado */
  key: "viajesEsteMes" | "gastoAcumulado" | "aprobacionesPendientes" | "saldoPendiente";
  format: "number" | "money";
  sub: string;
  /** Color de alerta si el valor > 0 */
  alertColor?: string;
}

export const KPIS_POR_TIPO: Record<TipoCuenta, KPIConfig[]> = {
  grande: [
    { label: "Viajes Este Mes",          key: "viajesEsteMes",           format: "number", sub: "del mes en curso" },
    { label: "Gasto Acumulado",          key: "gastoAcumulado",          format: "money",  sub: "total facturado" },
    { label: "Aprobaciones Pendientes",  key: "aprobacionesPendientes",  format: "number", sub: "requieren atención", alertColor: "text-amber-600" },
    { label: "Crédito Utilizado",        key: "saldoPendiente",          format: "money",  sub: "saldo por pagar (40 días)" },
  ],
  negocio: [
    { label: "Viajes Este Mes",   key: "viajesEsteMes",  format: "number", sub: "del mes en curso" },
    { label: "Gasto Este Mes",    key: "gastoAcumulado", format: "money",  sub: "pagado al contado" },
    { label: "Por Pagar",         key: "saldoPendiente", format: "money",  sub: "facturas pendientes" },
    // aprobacionesPendientes no aplica → mostramos viajes de nuevo como confirmados
    { label: "Facturas Emitidas", key: "aprobacionesPendientes", format: "number", sub: "este período" },
  ],
  agencia: [
    { label: "Viajes Gestionados",        key: "viajesEsteMes",          format: "number", sub: "reservados este mes" },
    { label: "Comisiones Generadas",      key: "gastoAcumulado",         format: "money",  sub: "10% sobre viajes" },
    { label: "Comisiones Por Cobrar",     key: "saldoPendiente",         format: "money",  sub: "cobro a 15 días", alertColor: "text-blue-600" },
    { label: "Reservas Pendientes",       key: "aprobacionesPendientes", format: "number", sub: "en proceso" },
  ],
};

export const KPIS_DEFAULT = KPIS_POR_TIPO.grande;

export function getKPIConfig(tipoCuenta?: string): KPIConfig[] {
  if (!tipoCuenta) return KPIS_DEFAULT;
  return KPIS_POR_TIPO[tipoCuenta as TipoCuenta] ?? KPIS_DEFAULT;
}

// ─── Textos contextuales ─────────────────────────────────────────────────────

export const CONTEXTO_POR_TIPO: Record<TipoCuenta, {
  descripcionPanel: string;
  labelFacturacion: string;
  labelSaldo: string;
  bannerInfo?: string;
}> = {
  grande: {
    descripcionPanel: "Movilidad corporativa con crédito a 40 días y aprobaciones multinivel.",
    labelFacturacion: "Facturación",
    labelSaldo: "Crédito disponible",
  },
  negocio: {
    descripcionPanel: "Pago por viaje · Factura inmediata · Sin aprobaciones.",
    labelFacturacion: "Facturación",
    labelSaldo: "Por pagar",
    bannerInfo: "Tu cuenta PyME opera con pago inmediato. No tienes línea de crédito.",
  },
  agencia: {
    descripcionPanel: "Reservas a nombre de terceros · Comisión 10% · Cobro a 15 días.",
    labelFacturacion: "Comisiones",
    labelSaldo: "Comisiones por cobrar",
    bannerInfo: "Tu cuenta de Agencia genera comisiones del 10% sobre cada viaje gestionado, liquidadas a 15 días.",
  },
};

export function getContexto(tipoCuenta?: string) {
  if (!tipoCuenta) return CONTEXTO_POR_TIPO.grande;
  return CONTEXTO_POR_TIPO[tipoCuenta as TipoCuenta] ?? CONTEXTO_POR_TIPO.grande;
}
