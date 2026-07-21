import { compararListas, alertasDeDiff } from './fare-diff';

describe('comparación de listas de tarifas', () => {
  const actual = {
    shared: { 'quito-cuenca': 44, 'quito-guayaquil': 50 },
    privateFares: {
      'cuenca-quito': { suv: 242, van: 275 },
      'quito-ambato': { suv: 70 },
    },
  };

  it('detecta el cambio real que se vio en producción (242 → 220)', () => {
    const d = compararListas(actual, {
      ...actual,
      privateFares: { ...actual.privateFares, 'cuenca-quito': { suv: 220, van: 275 } },
    });

    expect(d.resumen.cambios).toBe(1);
    expect(d.cambios[0]).toMatchObject({
      ruta: 'cuenca-quito',
      vehiculo: 'suv',
      antes: 242,
      despues: 220,
      delta: -22,
      deltaPct: -9.1,
    });
  });

  it('separa nuevas, eliminadas y sin cambio', () => {
    const d = compararListas(actual, {
      shared: { 'quito-cuenca': 44, 'quito-loja': 60 }, // -guayaquil, +loja
      privateFares: { 'cuenca-quito': { suv: 242, van: 275 } }, // -ambato
    });

    expect(d.resumen.nuevas).toBe(1);
    expect(d.nuevas[0]).toMatchObject({ ruta: 'quito-loja', vehiculo: null, precio: 60 });
    expect(d.resumen.eliminadas).toBe(2); // quito-guayaquil (shared) + quito-ambato/suv
    expect(d.resumen.cambios).toBe(0);
    expect(d.resumen.sinCambio).toBe(3);
  });

  it('ordena los cambios por impacto: el más brusco primero', () => {
    const d = compararListas(actual, {
      shared: { 'quito-cuenca': 46, 'quito-guayaquil': 100 }, // +4.5% y +100%
      privateFares: actual.privateFares,
    });

    expect(d.cambios[0].ruta).toBe('quito-guayaquil');
    expect(d.cambios[0].deltaPct).toBe(100);
    expect(d.resumen.mayorSubida?.ruta).toBe('quito-guayaquil');
    expect(d.resumen.mayorBajada).toBeNull();
  });

  it('un delta positivo significa que el precio SUBE', () => {
    const d = compararListas(
      { shared: { 'a-b': 100 } },
      { shared: { 'a-b': 120 } },
    );
    expect(d.cambios[0].delta).toBe(20);
    expect(d.cambios[0].deltaPct).toBe(20);
  });

  it('no revienta si el precio anterior era 0', () => {
    const d = compararListas({ shared: { 'a-b': 0 } }, { shared: { 'a-b': 50 } });
    expect(d.cambios[0].delta).toBe(50);
    expect(d.cambios[0].deltaPct).toBe(0); // el porcentaje no significa nada
  });

  it('ignora valores no numéricos en vez de propagarlos', () => {
    // Una hoja de cálculo puede traer texto o celdas vacías en la columna de
    // precio; el diff debe descartarlas, nunca convertirlas en una tarifa.
    const propuestaSucia: any = { shared: { 'a-b': 'ochenta', 'c-d': NaN } };
    const d = compararListas({ shared: { 'a-b': 100 } }, propuestaSucia);
    expect(d.resumen.eliminadas).toBe(1); // 'a-b' no llegó como número válido
    expect(d.resumen.nuevas).toBe(0);
  });
});

describe('alertas del diff', () => {
  it('avisa del dedo torpe: 220 escrito como 22', () => {
    const d = compararListas(
      { privateFares: { 'cuenca-quito': { suv: 220 } } },
      { privateFares: { 'cuenca-quito': { suv: 22 } } },
    );
    const a = alertasDeDiff(d);
    expect(a.some((x) => x.includes('más de 30%'))).toBe(true);
  });

  it('avisa si la hoja venía incompleta y vaciaría tarifas', () => {
    const d = compararListas(
      { shared: { 'a-b': 10, 'c-d': 20, 'e-f': 30, 'g-h': 40 } },
      { shared: { 'a-b': 10 } },
    );
    const a = alertasDeDiff(d);
    expect(a.some((x) => x.includes('SIN precio'))).toBe(true);
  });

  it('avisa si no hay ningún cambio', () => {
    const lista = { shared: { 'a-b': 10 } };
    const a = alertasDeDiff(compararListas(lista, lista));
    expect(a.some((x) => x.includes('idéntica'))).toBe(true);
  });

  it('no alerta ante un ajuste normal', () => {
    const d = compararListas({ shared: { 'a-b': 100 } }, { shared: { 'a-b': 105 } });
    expect(alertasDeDiff(d)).toHaveLength(0);
  });
});
