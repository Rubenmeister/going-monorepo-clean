import { semanaEcuador, semanaACobrar } from './semana-liquidacion';

/**
 * El caso que motivó todo esto es `sábado por la noche en Quito`: con el
 * cálculo viejo (UTC) ese viaje caía en la semana siguiente y se pagaba siete
 * días tarde. Es la primera prueba.
 */
describe('semana de liquidación (hora de Ecuador)', () => {
  // Sábado 18-jul-2026, 23:30 en Quito = domingo 19-jul 04:30 UTC.
  const sabadoNocheQuito = new Date('2026-07-19T04:30:00.000Z');

  it('un viaje del sábado por la noche pertenece a la semana que cierra ese sábado', () => {
    const { weekStart, weekEnd } = semanaEcuador(sabadoNocheQuito);
    // Domingo 12-jul 00:00 Quito = 05:00 UTC
    expect(weekStart.toISOString()).toBe('2026-07-12T05:00:00.000Z');
    // Sábado 18-jul 23:59:59.999 Quito = domingo 19-jul 04:59:59.999 UTC
    expect(weekEnd.toISOString()).toBe('2026-07-19T04:59:59.999Z');
    expect(sabadoNocheQuito >= weekStart && sabadoNocheQuito <= weekEnd).toBe(true);
  });

  it('el domingo por la mañana ya es semana nueva', () => {
    // Domingo 19-jul 08:00 Quito = 13:00 UTC
    const { weekStart } = semanaEcuador(new Date('2026-07-19T13:00:00.000Z'));
    expect(weekStart.toISOString()).toBe('2026-07-19T05:00:00.000Z');
  });

  it('la semana siempre dura exactamente 7 días', () => {
    const { weekStart, weekEnd } = semanaEcuador(sabadoNocheQuito);
    const dias = (weekEnd.getTime() + 1 - weekStart.getTime()) / (24 * 60 * 60 * 1000);
    expect(dias).toBe(7);
  });

  it('da el mismo resultado el lunes, el martes o el miércoles de revisión', () => {
    // Lunes 20-jul, martes 21-jul y miércoles 22-jul, todos 10:00 de Quito.
    const lunes = semanaACobrar(new Date('2026-07-20T15:00:00.000Z'));
    const martes = semanaACobrar(new Date('2026-07-21T15:00:00.000Z'));
    const miercoles = semanaACobrar(new Date('2026-07-22T15:00:00.000Z'));

    expect(martes.weekStart.toISOString()).toBe(lunes.weekStart.toISOString());
    expect(miercoles.weekStart.toISOString()).toBe(lunes.weekStart.toISOString());
    // Y es la semana que cerró el sábado 18-jul.
    expect(lunes.weekEnd.toISOString()).toBe('2026-07-19T04:59:59.999Z');
  });

  it('la semana a cobrar es anterior a la semana en curso, sin solaparse', () => {
    const hoy = new Date('2026-07-20T15:00:00.000Z'); // lunes
    const actual = semanaEcuador(hoy);
    const aCobrar = semanaACobrar(hoy);
    expect(aCobrar.weekEnd.getTime()).toBeLessThan(actual.weekStart.getTime());
    expect(actual.weekStart.getTime() - aCobrar.weekEnd.getTime()).toBe(1);
  });
});
