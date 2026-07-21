/**
 * Comparación entre dos listas de tarifas.
 *
 * Es la pieza que convierte "subí el Excel" en una decisión informada: antes de
 * publicar, quien aprueba ve EXACTAMENTE qué rutas cambian, cuánto, y en qué
 * dirección. Sin esto, una celda mal escrita en una hoja de cálculo se convierte
 * en el precio que paga un cliente y nadie lo nota hasta que alguien reclama.
 *
 * Función pura y con pruebas a propósito: no toca base de datos ni red, así que
 * su comportamiento se puede verificar entero.
 */

/** Tarifas por asiento (compartido): ruta → precio. */
export type SharedFares = Record<string, number>;
/** Tarifas privadas: ruta → vehículo → precio. */
export type PrivateFares = Record<string, Record<string, number>>;

export interface CambioPrecio {
  ruta: string;
  /** `null` en tarifas de asiento compartido, que no distinguen vehículo. */
  vehiculo: string | null;
  antes: number;
  despues: number;
  delta: number;
  /** Variación porcentual redondeada a un decimal. */
  deltaPct: number;
}

export interface EntradaTarifa {
  ruta: string;
  vehiculo: string | null;
  precio: number;
}

export interface DiffTarifas {
  resumen: {
    cambios: number;
    nuevas: number;
    eliminadas: number;
    sinCambio: number;
    /** Variación porcentual promedio de lo que cambió (0 si nada cambió). */
    variacionPromedioPct: number;
    mayorSubida: CambioPrecio | null;
    mayorBajada: CambioPrecio | null;
  };
  cambios: CambioPrecio[];
  nuevas: EntradaTarifa[];
  eliminadas: EntradaTarifa[];
}

export interface ListaComparable {
  shared?: SharedFares;
  privateFares?: PrivateFares;
}

const redondear = (n: number, dec = 2) => {
  const f = Math.pow(10, dec);
  return Math.round(n * f) / f;
};

/** Aplana una lista a `ruta|vehiculo → precio` para poder compararla entrada a entrada. */
function aplanar(lista: ListaComparable): Map<string, EntradaTarifa> {
  const out = new Map<string, EntradaTarifa>();

  for (const [ruta, precio] of Object.entries(lista.shared ?? {})) {
    if (typeof precio !== 'number' || !Number.isFinite(precio)) continue;
    out.set(`${ruta}|`, { ruta, vehiculo: null, precio });
  }

  for (const [ruta, porVehiculo] of Object.entries(lista.privateFares ?? {})) {
    if (!porVehiculo || typeof porVehiculo !== 'object') continue;
    for (const [vehiculo, precio] of Object.entries(porVehiculo)) {
      if (typeof precio !== 'number' || !Number.isFinite(precio)) continue;
      out.set(`${ruta}|${vehiculo}`, { ruta, vehiculo, precio });
    }
  }

  return out;
}

/**
 * Compara la lista `propuesta` contra la `actual`.
 *
 * El orden importa: `actual` es lo que se está cobrando hoy, `propuesta` es lo
 * que pasaría a cobrarse. Un delta positivo significa que el precio SUBE.
 */
export function compararListas(
  actual: ListaComparable,
  propuesta: ListaComparable,
): DiffTarifas {
  const a = aplanar(actual);
  const b = aplanar(propuesta);

  const cambios: CambioPrecio[] = [];
  const nuevas: EntradaTarifa[] = [];
  const eliminadas: EntradaTarifa[] = [];
  let sinCambio = 0;

  for (const [clave, entradaB] of b) {
    const entradaA = a.get(clave);
    if (!entradaA) {
      nuevas.push(entradaB);
      continue;
    }
    if (entradaA.precio === entradaB.precio) {
      sinCambio++;
      continue;
    }
    const delta = redondear(entradaB.precio - entradaA.precio);
    cambios.push({
      ruta: entradaB.ruta,
      vehiculo: entradaB.vehiculo,
      antes: entradaA.precio,
      despues: entradaB.precio,
      delta,
      // Si el precio anterior era 0 el porcentaje no significa nada; se informa 0
      // y el delta absoluto queda como la señal útil.
      deltaPct: entradaA.precio === 0 ? 0 : redondear((delta / entradaA.precio) * 100, 1),
    });
  }

  for (const [clave, entradaA] of a) {
    if (!b.has(clave)) eliminadas.push(entradaA);
  }

  // Orden por impacto: lo que más se mueve, primero. Quien aprueba mira arriba.
  cambios.sort((x, y) => Math.abs(y.deltaPct) - Math.abs(x.deltaPct));

  const variacionPromedioPct = cambios.length
    ? redondear(cambios.reduce((s, c) => s + c.deltaPct, 0) / cambios.length, 1)
    : 0;

  const subidas = cambios.filter((c) => c.delta > 0);
  const bajadas = cambios.filter((c) => c.delta < 0);

  return {
    resumen: {
      cambios: cambios.length,
      nuevas: nuevas.length,
      eliminadas: eliminadas.length,
      sinCambio,
      variacionPromedioPct,
      mayorSubida: subidas.length
        ? subidas.reduce((m, c) => (c.deltaPct > m.deltaPct ? c : m))
        : null,
      mayorBajada: bajadas.length
        ? bajadas.reduce((m, c) => (c.deltaPct < m.deltaPct ? c : m))
        : null,
    },
    cambios,
    nuevas,
    eliminadas,
  };
}

/**
 * Señales de que una lista propuesta puede estar mal armada.
 *
 * No bloquean la publicación —hay promociones agresivas legítimas— pero se
 * muestran destacadas. El caso que importa es el dedo torpe: una celda con
 * 22 en vez de 220 pasa desapercibida en una tabla de 124 rutas.
 */
export function alertasDeDiff(
  diff: DiffTarifas,
  opciones: { umbralPct?: number; vaciadoPct?: number } = {},
): string[] {
  const umbral = opciones.umbralPct ?? 30;
  const vaciado = opciones.vaciadoPct ?? 20;
  const alertas: string[] = [];

  const bruscos = diff.cambios.filter((c) => Math.abs(c.deltaPct) >= umbral);
  if (bruscos.length) {
    alertas.push(
      `${bruscos.length} tarifa(s) cambian más de ${umbral}% — revisa que no sea un error de tipeo.`,
    );
  }

  const totalPrevio = diff.resumen.cambios + diff.resumen.sinCambio + diff.resumen.eliminadas;
  if (totalPrevio > 0 && diff.resumen.eliminadas / totalPrevio > vaciado / 100) {
    alertas.push(
      `Desaparecen ${diff.resumen.eliminadas} de ${totalPrevio} tarifas. ` +
        `Si la hoja venía incompleta, publicar dejaría rutas SIN precio.`,
    );
  }

  if (!diff.resumen.cambios && !diff.resumen.nuevas && !diff.resumen.eliminadas) {
    alertas.push('La lista propuesta es idéntica a la que ya está en producción.');
  }

  return alertas;
}
