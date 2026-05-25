import {
  DriverHybridContext,
  DEFAULT_REST_BUFFER_MINUTES,
  InvalidHybridTransitionError,
  type DriverHybridState,
} from './driver-hybrid-context.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

const driverId = '11111111-1111-1111-1111-111111111111' as UUID;
const outboundTripId = '22222222-2222-2222-2222-222222222222' as UUID;
const returnTripId = '33333333-3333-3333-3333-333333333333' as UUID;

/** Helper: crea un contexto en un estado específico para testear transiciones aisladas. */
function ctxIn(state: DriverHybridState, overrides: Partial<Parameters<typeof DriverHybridContext.fromPrimitives>[0]> = {}) {
  const now = new Date('2026-06-01T10:00:00Z');
  return DriverHybridContext.fromPrimitives({
    id: 'ctx-1' as UUID,
    driverId,
    state,
    outboundScheduledTripId: state === 'IDLE' ? null : outboundTripId,
    returnScheduledTripId: state === 'IDLE' || state === 'LONG_TRIP_OUTBOUND' ? null : returnTripId,
    destinationCity: state === 'IDLE' || state === 'LONG_TRIP_OUTBOUND' ? null : 'santo_domingo',
    nextLongTripStartTime: state === 'IDLE' || state === 'LONG_TRIP_OUTBOUND'
      ? null
      : new Date('2026-06-01T15:00:00Z'),
    restWindowStartsAt: state === 'IDLE' || state === 'LONG_TRIP_OUTBOUND'
      ? null
      : new Date('2026-06-01T14:15:00Z'),
    restBufferMinutes: DEFAULT_REST_BUFFER_MINUTES,
    lastTransitionReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe('DriverHybridContext', () => {
  describe('create', () => {
    it('arranca en IDLE con buffer default 45min', () => {
      const r = DriverHybridContext.create({ driverId });
      expect(r.isOk()).toBe(true);
      const ctx = r._unsafeUnwrap();
      expect(ctx.state).toBe('IDLE');
      expect(ctx.restBufferMinutes).toBe(45);
      expect(ctx.outboundScheduledTripId).toBeNull();
      expect(ctx.nextLongTripStartTime).toBeNull();
    });

    it('rechaza driverId vacio', () => {
      const r = DriverHybridContext.create({ driverId: '' as UUID });
      expect(r.isErr()).toBe(true);
    });
  });

  describe('transición: IDLE -> LONG_TRIP_OUTBOUND', () => {
    it('outbound_started válido desde IDLE', () => {
      const ctx = ctxIn('IDLE');
      const r = ctx.transition({ kind: 'outbound_started', outboundScheduledTripId: outboundTripId });
      expect(r.isOk()).toBe(true);
      const next = r._unsafeUnwrap();
      expect(next.state).toBe('LONG_TRIP_OUTBOUND');
      expect(next.outboundScheduledTripId).toBe(outboundTripId);
      // returnScheduledTripId aún no se conoce
      expect(next.returnScheduledTripId).toBeNull();
    });

    it('outbound_started desde estados no-IDLE es inválido', () => {
      for (const fromState of ['LONG_TRIP_OUTBOUND', 'AVAILABLE_LOCAL', 'BLOCKED_REST', 'LONG_TRIP_RETURN'] as DriverHybridState[]) {
        const r = ctxIn(fromState).transition({
          kind: 'outbound_started',
          outboundScheduledTripId: outboundTripId,
        });
        expect(r.isErr()).toBe(true);
        expect(r._unsafeUnwrapErr()).toBeInstanceOf(InvalidHybridTransitionError);
      }
    });
  });

  describe('transición: LONG_TRIP_OUTBOUND -> AVAILABLE_LOCAL', () => {
    it('outbound_completed con retorno >45min adelante → AVAILABLE_LOCAL + restWindowStartsAt calculado', () => {
      const ctx = ctxIn('LONG_TRIP_OUTBOUND');
      const now = new Date('2026-06-01T10:00:00Z');
      const nextLongTrip = new Date('2026-06-01T15:00:00Z'); // 5h adelante
      const r = ctx.transition(
        {
          kind: 'outbound_completed',
          destinationCity: 'santo_domingo',
          returnScheduledTripId: returnTripId,
          nextLongTripStartTime: nextLongTrip,
        },
        now,
      );
      expect(r.isOk()).toBe(true);
      const next = r._unsafeUnwrap();
      expect(next.state).toBe('AVAILABLE_LOCAL');
      expect(next.destinationCity).toBe('santo_domingo');
      expect(next.returnScheduledTripId).toBe(returnTripId);
      expect(next.nextLongTripStartTime).toEqual(nextLongTrip);
      // restWindowStartsAt = nextLongTripStartTime - 45min = 14:15
      expect(next.restWindowStartsAt).toEqual(new Date('2026-06-01T14:15:00Z'));
      expect(next.restBufferMinutes).toBe(45);
    });

    it('edge case: retorno muy cerca (<45min) → salta directo a BLOCKED_REST', () => {
      const ctx = ctxIn('LONG_TRIP_OUTBOUND');
      const now = new Date('2026-06-01T14:30:00Z');
      const nextLongTrip = new Date('2026-06-01T15:00:00Z'); // 30 min — menos que el buffer
      const r = ctx.transition(
        {
          kind: 'outbound_completed',
          destinationCity: 'santo_domingo',
          returnScheduledTripId: returnTripId,
          nextLongTripStartTime: nextLongTrip,
        },
        now,
      );
      expect(r.isOk()).toBe(true);
      expect(r._unsafeUnwrap().state).toBe('BLOCKED_REST');
    });

    it('soporta override de restBufferMinutes', () => {
      const ctx = ctxIn('LONG_TRIP_OUTBOUND');
      const now = new Date('2026-06-01T10:00:00Z');
      const nextLongTrip = new Date('2026-06-01T15:00:00Z');
      const r = ctx.transition(
        {
          kind: 'outbound_completed',
          destinationCity: 'ibarra',
          returnScheduledTripId: returnTripId,
          nextLongTripStartTime: nextLongTrip,
          restBufferMinutes: 30, // operador "express" con buffer reducido
        },
        now,
      );
      expect(r.isOk()).toBe(true);
      const next = r._unsafeUnwrap();
      expect(next.restBufferMinutes).toBe(30);
      // restWindowStartsAt = 15:00 - 30min = 14:30
      expect(next.restWindowStartsAt).toEqual(new Date('2026-06-01T14:30:00Z'));
    });
  });

  describe('transición: AVAILABLE_LOCAL -> BLOCKED_REST', () => {
    it('rest_window_entered es válido', () => {
      const ctx = ctxIn('AVAILABLE_LOCAL');
      const r = ctx.transition({ kind: 'rest_window_entered' });
      expect(r.isOk()).toBe(true);
      expect(r._unsafeUnwrap().state).toBe('BLOCKED_REST');
    });
  });

  describe('transición: BLOCKED_REST -> LONG_TRIP_RETURN', () => {
    it('return_started es válido', () => {
      const ctx = ctxIn('BLOCKED_REST');
      const r = ctx.transition({ kind: 'return_started' });
      expect(r.isOk()).toBe(true);
      expect(r._unsafeUnwrap().state).toBe('LONG_TRIP_RETURN');
    });
  });

  describe('transición: LONG_TRIP_RETURN -> IDLE', () => {
    it('return_completed limpia todo el contexto', () => {
      const ctx = ctxIn('LONG_TRIP_RETURN');
      const r = ctx.transition({ kind: 'return_completed' });
      expect(r.isOk()).toBe(true);
      const next = r._unsafeUnwrap();
      expect(next.state).toBe('IDLE');
      expect(next.outboundScheduledTripId).toBeNull();
      expect(next.returnScheduledTripId).toBeNull();
      expect(next.destinationCity).toBeNull();
      expect(next.nextLongTripStartTime).toBeNull();
      expect(next.restWindowStartsAt).toBeNull();
    });
  });

  describe('return_cancelled', () => {
    it('desde AVAILABLE_LOCAL → IDLE con audit reason', () => {
      const ctx = ctxIn('AVAILABLE_LOCAL');
      const r = ctx.transition({ kind: 'return_cancelled' });
      expect(r.isOk()).toBe(true);
      const next = r._unsafeUnwrap();
      expect(next.state).toBe('IDLE');
      expect(next.lastTransitionReason).toContain('return_cancelled');
    });

    it('desde BLOCKED_REST → IDLE', () => {
      const ctx = ctxIn('BLOCKED_REST');
      const r = ctx.transition({ kind: 'return_cancelled' });
      expect(r.isOk()).toBe(true);
      expect(r._unsafeUnwrap().state).toBe('IDLE');
    });

    it('desde estados sin retorno asignado (IDLE/LONG_TRIP_OUTBOUND) es inválido', () => {
      for (const fromState of ['IDLE', 'LONG_TRIP_OUTBOUND', 'LONG_TRIP_RETURN'] as DriverHybridState[]) {
        const r = ctxIn(fromState).transition({ kind: 'return_cancelled' });
        expect(r.isErr()).toBe(true);
      }
    });
  });

  describe('abort (failsafe)', () => {
    it('desde cualquier estado lleva a IDLE con reason en audit', () => {
      for (const fromState of ['IDLE', 'LONG_TRIP_OUTBOUND', 'AVAILABLE_LOCAL', 'BLOCKED_REST', 'LONG_TRIP_RETURN'] as DriverHybridState[]) {
        const r = ctxIn(fromState).transition({ kind: 'abort', reason: 'admin override' });
        expect(r.isOk()).toBe(true);
        const next = r._unsafeUnwrap();
        expect(next.state).toBe('IDLE');
        expect(next.lastTransitionReason).toBe('abort: admin override');
        // Todos los campos derivados deben estar limpios
        expect(next.outboundScheduledTripId).toBeNull();
        expect(next.nextLongTripStartTime).toBeNull();
      }
    });
  });

  describe('canAcceptLocalRide', () => {
    it('30min ride a las 12:00 con retorno 15:00 → cabe (30+45=75 ≤ 180)', () => {
      const ctx = ctxIn('AVAILABLE_LOCAL'); // retorno 15:00
      const now = new Date('2026-06-01T12:00:00Z');
      expect(ctx.canAcceptLocalRide(30, now)).toBe(true);
    });

    it('60min ride a las 13:30 con retorno 15:00 → NO cabe (60+45=105 > 90)', () => {
      const ctx = ctxIn('AVAILABLE_LOCAL');
      const now = new Date('2026-06-01T13:30:00Z');
      expect(ctx.canAcceptLocalRide(60, now)).toBe(false);
    });

    it('en estados distintos a AVAILABLE_LOCAL siempre devuelve false', () => {
      for (const s of ['IDLE', 'LONG_TRIP_OUTBOUND', 'BLOCKED_REST', 'LONG_TRIP_RETURN'] as DriverHybridState[]) {
        expect(ctxIn(s).canAcceptLocalRide(10)).toBe(false);
      }
    });
  });

  describe('minutesUntilRestWindow', () => {
    it('AVAILABLE_LOCAL a las 12:00, rest window a las 14:15 → 135 min', () => {
      const ctx = ctxIn('AVAILABLE_LOCAL');
      const now = new Date('2026-06-01T12:00:00Z');
      expect(ctx.minutesUntilRestWindow(now)).toBe(135);
    });

    it('clampea a 0 cuando ya pasó la ventana', () => {
      const ctx = ctxIn('AVAILABLE_LOCAL');
      const now = new Date('2026-06-01T14:30:00Z');
      expect(ctx.minutesUntilRestWindow(now)).toBe(0);
    });

    it('estados distintos a AVAILABLE_LOCAL → null', () => {
      expect(ctxIn('IDLE').minutesUntilRestWindow()).toBeNull();
      expect(ctxIn('BLOCKED_REST').minutesUntilRestWindow()).toBeNull();
    });
  });

  describe('inmutabilidad', () => {
    it('transition NO muta el contexto original', () => {
      const original = ctxIn('IDLE');
      const result = original.transition({
        kind: 'outbound_started',
        outboundScheduledTripId: outboundTripId,
      });
      expect(result.isOk()).toBe(true);
      // Original sigue en IDLE
      expect(original.state).toBe('IDLE');
      expect(original.outboundScheduledTripId).toBeNull();
      // El nuevo está en LONG_TRIP_OUTBOUND
      expect(result._unsafeUnwrap().state).toBe('LONG_TRIP_OUTBOUND');
    });
  });

  describe('flujo completo: jornada Quito → Santo Domingo → Quito', () => {
    it('IDLE → OUTBOUND → AVAILABLE_LOCAL → BLOCKED_REST → LONG_TRIP_RETURN → IDLE', () => {
      let ctx = DriverHybridContext.create({ driverId })._unsafeUnwrap();
      expect(ctx.state).toBe('IDLE');

      // 1. Arranca outbound 8:00
      ctx = ctx.transition(
        { kind: 'outbound_started', outboundScheduledTripId: outboundTripId },
        new Date('2026-06-01T08:00:00Z'),
      )._unsafeUnwrap();
      expect(ctx.state).toBe('LONG_TRIP_OUTBOUND');

      // 2. Llega a Santo Domingo 10:00; retorno programado 15:00
      ctx = ctx.transition(
        {
          kind: 'outbound_completed',
          destinationCity: 'santo_domingo',
          returnScheduledTripId: returnTripId,
          nextLongTripStartTime: new Date('2026-06-01T15:00:00Z'),
        },
        new Date('2026-06-01T10:00:00Z'),
      )._unsafeUnwrap();
      expect(ctx.state).toBe('AVAILABLE_LOCAL');
      expect(ctx.canAcceptLocalRide(30, new Date('2026-06-01T10:00:00Z'))).toBe(true);

      // 3. Llegan las 14:15, cron dispara rest window
      ctx = ctx.transition({ kind: 'rest_window_entered' }, new Date('2026-06-01T14:15:00Z'))._unsafeUnwrap();
      expect(ctx.state).toBe('BLOCKED_REST');
      expect(ctx.canAcceptLocalRide(30, new Date('2026-06-01T14:15:00Z'))).toBe(false);

      // 4. Arranca retorno 15:00
      ctx = ctx.transition({ kind: 'return_started' }, new Date('2026-06-01T15:00:00Z'))._unsafeUnwrap();
      expect(ctx.state).toBe('LONG_TRIP_RETURN');

      // 5. Llega Quito 17:00, completado
      ctx = ctx.transition({ kind: 'return_completed' }, new Date('2026-06-01T17:00:00Z'))._unsafeUnwrap();
      expect(ctx.state).toBe('IDLE');
      expect(ctx.outboundScheduledTripId).toBeNull();
    });
  });

  describe('serialización (toPrimitives / fromPrimitives)', () => {
    it('round-trip preserva estado', () => {
      const original = ctxIn('AVAILABLE_LOCAL');
      const primitives = original.toPrimitives();
      const restored = DriverHybridContext.fromPrimitives(primitives);
      expect(restored.toPrimitives()).toEqual(primitives);
    });
  });
});
