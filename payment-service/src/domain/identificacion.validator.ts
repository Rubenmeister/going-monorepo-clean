/**
 * Validación de cédula y RUC ecuatorianos (formato + dígito verificador).
 *
 * Para pagar por transferencia el banco exige la identificación del titular, y
 * un dígito mal tipeado hace que el banco RECHACE la línea del archivo — o peor,
 * que la transferencia caiga en otra cuenta. Validar al capturar el dato es
 * mucho más barato que descubrirlo el martes con el lote cargado.
 *
 * No consulta al SRI ni al Registro Civil: valida estructura y checksum, que
 * atrapa la enorme mayoría de números inventados o mal escritos.
 *
 * OJO: `corporate-service/src/api/ruc.validator.ts` tiene la misma lógica de RUC
 * para el alta de empresas. Están duplicadas a propósito por ahora — las reglas
 * de frontera de Nx impiden que un servicio importe de otro, y mover esto a una
 * lib compartida es un cambio aparte. Si se corrige el algoritmo, tocar ambas.
 */

export type TipoDocumento = 'cedula' | 'ruc';

/** Cédula: 10 dígitos, provincia 01–24, módulo 10 con coeficientes 212121212. */
export function esCedulaValida(valor: string): boolean {
  const cedula = (valor ?? '').trim();
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.slice(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  // El tercer dígito de una cédula de persona natural es 0–5.
  const tercero = parseInt(cedula[2]!, 10);
  if (tercero > 5) return false;

  return mod10Cedula(cedula.split('').map((d) => parseInt(d, 10)));
}

/** RUC: 13 dígitos = identificación (10 u 11) + establecimiento (001 / 0001). */
export function esRucValido(valor: string): boolean {
  const ruc = (valor ?? '').trim();
  if (!/^\d{13}$/.test(ruc)) return false;

  const provincia = parseInt(ruc.slice(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercero = parseInt(ruc[2] ?? '', 10);
  const digitos = ruc.split('').map((d) => parseInt(d, 10));

  if (tercero >= 0 && tercero <= 5) {
    if (parseInt(ruc.slice(10), 10) < 1) return false;
    return mod10Cedula(digitos.slice(0, 10));
  }
  if (tercero === 6) {
    if (parseInt(ruc.slice(9), 10) < 1) return false;
    return mod11(digitos.slice(0, 8), [3, 2, 7, 6, 5, 4, 3, 2], digitos[8]!);
  }
  if (tercero === 9) {
    if (parseInt(ruc.slice(10), 10) < 1) return false;
    return mod11(digitos.slice(0, 9), [4, 3, 2, 7, 6, 5, 4, 3, 2], digitos[9]!);
  }
  return false;
}

/** Valida según el tipo declarado. */
export function esIdentificacionValida(tipo: TipoDocumento, valor: string): boolean {
  return tipo === 'cedula' ? esCedulaValida(valor) : esRucValido(valor);
}

function mod10Cedula(primeros10: number[]): boolean {
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let p = primeros10[i]! * coef[i]!;
    if (p > 9) p -= 9;
    suma += p;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === primeros10[9];
}

function mod11(digitos: number[], coef: number[], esperado: number): boolean {
  let suma = 0;
  for (let i = 0; i < coef.length; i++) suma += digitos[i]! * coef[i]!;
  const r = 11 - (suma % 11);
  const verificador = r === 11 ? 0 : r;
  if (verificador === 10) return false;
  return verificador === esperado;
}
