/**
 * Validación offline de RUC ecuatoriano (formato + dígito verificador). No
 * consulta el SRI (eso queda como mejora futura); valida estructura y checksum,
 * que atrapa la gran mayoría de RUC inventados/mal tipeados.
 *
 * RUC = 13 dígitos: cédula/id (10 u 11) + establecimiento (001, 0001…).
 *   - Provincia (dos primeros): 01–24.
 *   - Tercer dígito determina el tipo y el algoritmo del verificador:
 *       0–5  persona natural  → módulo 10 sobre los 9 primeros, verif = 10º
 *       6    entidad pública  → módulo 11 (coef 3765432) sobre 8, verif = 9º
 *       9    sociedad privada → módulo 11 (coef 432765432) sobre 9, verif = 10º
 */
export function isValidEcuadorianRuc(rucRaw: string): boolean {
  const ruc = (rucRaw ?? '').trim();
  if (!/^\d{13}$/.test(ruc)) return false;

  const province = parseInt(ruc.slice(0, 2), 10);
  if (province < 1 || province > 24) return false;

  const third = parseInt(ruc[2] ?? '', 10);
  const digits = ruc.split('').map((d) => parseInt(d, 10));

  if (third >= 0 && third <= 5) {
    // Persona natural — los tres últimos deben ser establecimiento (>=001).
    if (parseInt(ruc.slice(10), 10) < 1) return false;
    return mod10Cedula(digits.slice(0, 10));
  }
  if (third === 6) {
    if (parseInt(ruc.slice(9), 10) < 1) return false; // '0001'
    return mod11(digits.slice(0, 8), [3, 2, 7, 6, 5, 4, 3, 2], digits[8]!);
  }
  if (third === 9) {
    if (parseInt(ruc.slice(10), 10) < 1) return false; // '001'
    return mod11(digits.slice(0, 9), [4, 3, 2, 7, 6, 5, 4, 3, 2], digits[9]!);
  }
  return false;
}

/** Cédula: módulo 10 con coeficientes 212121212 (productos > 9 restan 9). */
function mod10Cedula(first10: number[]): boolean {
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let p = first10[i]! * coef[i]!;
    if (p > 9) p -= 9;
    sum += p;
  }
  const verifier = (10 - (sum % 10)) % 10;
  return verifier === first10[9];
}

/** Módulo 11 genérico. verifier = 11 - (sum%11); 11→0; 10→inválido. */
function mod11(digits: number[], coef: number[], expected: number): boolean {
  let sum = 0;
  for (let i = 0; i < coef.length; i++) sum += digits[i]! * coef[i]!;
  const r = 11 - (sum % 11);
  const verifier = r === 11 ? 0 : r;
  if (verifier === 10) return false;
  return verifier === expected;
}
