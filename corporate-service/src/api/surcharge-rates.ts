/**
 * Recargo corporativo negociado, por empresa y por servicio.
 *
 * Reglas del negocio (definidas por Rubén, 20-jul-2026):
 *  - El precio corporativo es el privado MÁS un recargo. No es una lista aparte.
 *  - Ese recargo se negocia con cada empresa y PUEDE SER DISTINTO por servicio:
 *    transporte, envíos, tours, alojamientos y experiencias.
 *  - Si no hay nada negociado, rige el 25% estándar.
 *
 * Función pura a propósito: decide cuánto se le cobra de más a un cliente real,
 * así que su comportamiento tiene que poder verificarse entero.
 */

/** Recargo estándar cuando la empresa no tiene nada negociado. */
export const RECARGO_CORPORATIVO_POR_DEFECTO = 0.25;

/** Servicios que admiten tasa propia. `default` cubre a los demás. */
export const SERVICIOS_TARIFABLES = [
  'transport',
  'parcel',
  'tour',
  'accommodation',
  'experience',
] as const;

export type ServicioTarifable = (typeof SERVICIOS_TARIFABLES)[number];

/**
 * Techo de cordura. No es una regla de negocio: es una red contra el dedo
 * torpe. Alguien que quiera escribir 0.30 y teclee 30 estaría cobrando
 * 3000% de recargo, y sin este límite nadie lo vería hasta la factura.
 */
const RECARGO_MAXIMO = 1; // +100%

/**
 * Recargo aplicable a un servicio de una empresa.
 *
 * Orden: tasa del servicio → `default` de la empresa → estándar del sistema.
 * Un valor inválido (texto, negativo, fuera de rango) se IGNORA y se cae al
 * siguiente nivel: ante un dato corrupto se cobra el estándar, nunca cualquier
 * cosa.
 */
export function resolverRecargo(
  rates: Record<string, number> | null | undefined,
  servicio: string,
): number {
  const r = rates ?? {};
  const candidatos = [r[servicio], r['default'], RECARGO_CORPORATIVO_POR_DEFECTO];
  for (const c of candidatos) {
    if (esRecargoValido(c)) return c as number;
  }
  return RECARGO_CORPORATIVO_POR_DEFECTO;
}

/** Un recargo válido es un número finito entre 0 y +100%. */
export function esRecargoValido(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= RECARGO_MAXIMO;
}

/**
 * Revisa un conjunto de tasas antes de guardarlo. Devuelve los problemas en
 * español, listos para mostrar a quien está editando.
 */
export function validarRecargos(rates: Record<string, unknown>): string[] {
  const errores: string[] = [];
  const permitidas = new Set<string>([...SERVICIOS_TARIFABLES, 'default']);

  for (const [clave, valor] of Object.entries(rates ?? {})) {
    if (!permitidas.has(clave)) {
      errores.push(
        `"${clave}" no es un servicio válido. Usa: ${[...permitidas].join(', ')}.`,
      );
      continue;
    }
    if (typeof valor !== 'number' || !Number.isFinite(valor)) {
      errores.push(`El recargo de "${clave}" debe ser un número (0.25 = +25%).`);
      continue;
    }
    if (valor < 0) {
      errores.push(`El recargo de "${clave}" no puede ser negativo.`);
      continue;
    }
    if (valor > RECARGO_MAXIMO) {
      errores.push(
        `El recargo de "${clave}" es ${(valor * 100).toFixed(0)}%. ` +
          `¿Querías escribir ${valor / 100}? Se expresa como fracción: 0.25 = +25%.`,
      );
    }
  }
  return errores;
}

/** Aplica el recargo a un precio privado. Redondea a centavos. */
export function precioCorporativo(precioPrivado: number, recargo: number): number {
  return Math.round(precioPrivado * (1 + recargo) * 100) / 100;
}
