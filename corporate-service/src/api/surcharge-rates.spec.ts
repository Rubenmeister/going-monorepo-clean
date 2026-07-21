import {
  resolverRecargo,
  validarRecargos,
  precioCorporativo,
  RECARGO_CORPORATIVO_POR_DEFECTO,
} from './surcharge-rates';

describe('recargo corporativo por empresa y servicio', () => {
  it('usa el 25% estándar cuando la empresa no tiene nada negociado', () => {
    expect(resolverRecargo(undefined, 'transport')).toBe(0.25);
    expect(resolverRecargo({}, 'tour')).toBe(RECARGO_CORPORATIVO_POR_DEFECTO);
  });

  it('respeta una tasa distinta por servicio', () => {
    const rates = { default: 0.25, transport: 0.18, tour: 0.3 };
    expect(resolverRecargo(rates, 'transport')).toBe(0.18);
    expect(resolverRecargo(rates, 'tour')).toBe(0.3);
    // envíos no tiene tasa propia → cae al default de la empresa
    expect(resolverRecargo(rates, 'parcel')).toBe(0.25);
  });

  it('el default de la empresa gana sobre el estándar del sistema', () => {
    expect(resolverRecargo({ default: 0.15 }, 'accommodation')).toBe(0.15);
  });

  it('admite recargo 0 (empresa sin sobreprecio negociado)', () => {
    // 0 es un valor legítimo, no "ausente": no debe caer al 25%.
    expect(resolverRecargo({ transport: 0 }, 'transport')).toBe(0);
  });

  it('ante un dato corrupto cobra el estándar, no cualquier cosa', () => {
    const sucio: any = { transport: 'mucho', default: -1 };
    expect(resolverRecargo(sucio, 'transport')).toBe(RECARGO_CORPORATIVO_POR_DEFECTO);
  });

  it('ignora un recargo absurdo y cae al siguiente nivel', () => {
    // 30 sería +3000%: se descarta y manda el default de la empresa.
    expect(resolverRecargo({ transport: 30, default: 0.2 }, 'transport')).toBe(0.2);
  });
});

describe('validación al guardar', () => {
  it('acepta un conjunto correcto', () => {
    expect(validarRecargos({ default: 0.25, transport: 0.18 })).toHaveLength(0);
  });

  it('rechaza servicios inventados', () => {
    const e = validarRecargos({ helicoptero: 0.3 });
    expect(e[0]).toContain('no es un servicio válido');
  });

  it('detecta el error de escribir 30 en vez de 0.30', () => {
    const e = validarRecargos({ transport: 30 });
    expect(e[0]).toContain('3000%');
    expect(e[0]).toContain('0.3');
  });

  it('rechaza negativos y no numéricos', () => {
    expect(validarRecargos({ transport: -0.1 })[0]).toContain('no puede ser negativo');
    expect(validarRecargos({ tour: 'alto' as any })[0]).toContain('debe ser un número');
  });
});

describe('cálculo del precio corporativo', () => {
  it('aplica el recargo sobre el precio privado', () => {
    expect(precioCorporativo(220, 0.25)).toBe(275);
    expect(precioCorporativo(220, 0.18)).toBe(259.6);
    expect(precioCorporativo(50, 0.25)).toBe(62.5);
  });

  it('con recargo 0 el precio corporativo es el privado', () => {
    expect(precioCorporativo(220, 0)).toBe(220);
  });

  it('redondea a centavos, no deja colas de coma flotante', () => {
    expect(precioCorporativo(33.33, 0.25)).toBe(41.66);
  });
});
