import {
  esCedulaValida,
  esRucValido,
  esIdentificacionValida,
} from './identificacion.validator';

/**
 * 1710034065 es una cédula estructuralmente válida: provincia 17 (Pichincha),
 * tercer dígito 1 (persona natural) y verificador que cuadra con el módulo 10.
 * Se usa como base de los casos porque el checksum se puede comprobar a mano.
 */
const CEDULA_OK = '1710034065';

describe('validación de cédula', () => {
  it('acepta una cédula con verificador correcto', () => {
    expect(esCedulaValida(CEDULA_OK)).toBe(true);
  });

  it('rechaza si el último dígito no cuadra', () => {
    expect(esCedulaValida('1710034066')).toBe(false);
  });

  it('rechaza provincias inexistentes (00 y 25+)', () => {
    expect(esCedulaValida('0010034065')).toBe(false);
    expect(esCedulaValida('2510034065')).toBe(false);
  });

  it('rechaza longitudes que no sean 10 dígitos', () => {
    expect(esCedulaValida('171003406')).toBe(false);
    expect(esCedulaValida('17100340650')).toBe(false);
    expect(esCedulaValida('')).toBe(false);
  });

  it('rechaza texto y separadores', () => {
    expect(esCedulaValida('17100340AB')).toBe(false);
    expect(esCedulaValida('171-003-4065')).toBe(false);
  });

  it('rechaza el tercer dígito de no-persona-natural', () => {
    // 6 = entidad pública, 9 = sociedad: no son cédulas.
    expect(esCedulaValida('1760034065')).toBe(false);
    expect(esCedulaValida('1790034065')).toBe(false);
  });
});

describe('validación de RUC', () => {
  it('acepta RUC de persona natural (cédula + 001)', () => {
    expect(esRucValido(`${CEDULA_OK}001`)).toBe(true);
  });

  it('rechaza RUC de persona natural con establecimiento 000', () => {
    expect(esRucValido(`${CEDULA_OK}000`)).toBe(false);
  });

  it('rechaza si la cédula base tiene mal el verificador', () => {
    expect(esRucValido('1710034066001')).toBe(false);
  });

  it('rechaza longitudes distintas de 13', () => {
    expect(esRucValido(CEDULA_OK)).toBe(false);
    expect(esRucValido(`${CEDULA_OK}0011`)).toBe(false);
  });
});

describe('validación según el tipo declarado', () => {
  it('no acepta un RUC cuando se declaró cédula, ni al revés', () => {
    expect(esIdentificacionValida('cedula', `${CEDULA_OK}001`)).toBe(false);
    expect(esIdentificacionValida('ruc', CEDULA_OK)).toBe(false);
  });

  it('acepta cada uno con su tipo correcto', () => {
    expect(esIdentificacionValida('cedula', CEDULA_OK)).toBe(true);
    expect(esIdentificacionValida('ruc', `${CEDULA_OK}001`)).toBe(true);
  });
});
