/**
 * Semana de liquidación de prestadores, en hora de Ecuador.
 *
 * El ciclo operativo es: la semana corre **domingo 00:00 → sábado 23:59:59**
 * (hora de Quito), se revisa el lunes y se paga el martes.
 *
 * Existe como función aparte —y con pruebas— porque el cálculo anterior usaba
 * `new Date().getDay()` dentro del caso de uso. Cloud Run corre en UTC, así que
 * la semana cortaba el **sábado a las 19:00 de Quito**: los viajes del sábado
 * por la noche entraban a la semana siguiente y se pagaban siete días tarde.
 * Nadie lo habría notado revisando el código del viaje, porque ahí no hay
 * ninguna zona horaria escrita.
 *
 * Ecuador continental es UTC−5 todo el año (no tiene horario de verano), por
 * eso basta un desplazamiento fijo y no hace falta una librería de zonas.
 */

/** UTC−5. Ecuador continental no aplica horario de verano. */
const OFFSET_ECUADOR_MS = 5 * 60 * 60 * 1000;

export interface SemanaLiquidacion {
  /** Domingo 00:00:00.000 de Quito, expresado en UTC. */
  weekStart: Date;
  /** Sábado 23:59:59.999 de Quito, expresado en UTC. */
  weekEnd: Date;
}

/**
 * Semana de liquidación que CONTIENE al instante dado.
 *
 * @param ahora instante de referencia (por defecto, ahora mismo).
 */
export function semanaEcuador(ahora: Date = new Date()): SemanaLiquidacion {
  // Truco: restamos el offset para que los getters UTC devuelvan los campos de
  // la hora de Quito. Calculamos el corte ahí y volvemos a UTC al final.
  const local = new Date(ahora.getTime() - OFFSET_ECUADOR_MS);
  const diaDeLaSemana = local.getUTCDay(); // 0 = domingo

  const inicioLocal = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() - diaDeLaSemana,
    0,
    0,
    0,
    0,
  );
  const finLocal = inicioLocal + 7 * 24 * 60 * 60 * 1000 - 1;

  return {
    weekStart: new Date(inicioLocal + OFFSET_ECUADOR_MS),
    weekEnd: new Date(finLocal + OFFSET_ECUADOR_MS),
  };
}

/**
 * Semana ya CERRADA que toca revisar y pagar hoy.
 *
 * El lunes se revisa la semana que cerró el sábado anterior; el martes se paga
 * esa misma. Se calcula retrocediendo al sábado previo al domingo en curso, en
 * vez de restar 7 días a hoy, para que dé lo mismo llamarla el lunes que el
 * martes o el miércoles.
 */
export function semanaACobrar(ahora: Date = new Date()): SemanaLiquidacion {
  const actual = semanaEcuador(ahora);
  // Un milisegundo antes del inicio de la semana en curso cae, por definición,
  // dentro de la semana anterior.
  return semanaEcuador(new Date(actual.weekStart.getTime() - 1));
}
