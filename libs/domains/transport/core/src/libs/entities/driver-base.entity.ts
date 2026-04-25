import { Result, ok, err } from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * DriverBase — base/depot/parada asignada a un conductor.
 *
 * Permite que el matching engine PRIORICE conductores cuya base esté
 * cerca del pickup ANTES de hacer el GEORADIUS general por GPS actual.
 * Esto asegura que un viaje en Quito Norte se ofrezca primero a drivers
 * registrados en esa zona, aunque haya un driver de Cumbayá circulando
 * más cerca en ese momento.
 *
 * Reglas:
 *  - Un driver puede tener múltiples bases (ej. casa + trabajo) pero
 *    sólo UNA marcada como `isPrimary: true`.
 *  - `radiusKm` define la "zona de operación" del driver alrededor de
 *    su base (default 5 km).
 *  - `shiftStart`/`shiftEnd` opcional — si presente, sólo prioriza al
 *    driver dentro de ese horario.
 */

export interface DriverBaseProps {
  id: UUID;
  driverId: UUID;
  name: string;          // "Casa Quito Norte", "Centro de Quito"
  lat: number;
  lng: number;
  radiusKm: number;
  shiftStart?: string;   // 'HH:MM' formato 24h, ej. '06:00'
  shiftEnd?: string;     // 'HH:MM', ej. '18:00'
  isPrimary: boolean;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DriverBase {
  readonly id: UUID;
  readonly driverId: UUID;
  readonly name: string;
  readonly lat: number;
  readonly lng: number;
  readonly radiusKm: number;
  readonly shiftStart?: string;
  readonly shiftEnd?: string;
  readonly isPrimary: boolean;
  readonly active: boolean;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: DriverBaseProps) {
    this.id = props.id;
    this.driverId = props.driverId;
    this.name = props.name;
    this.lat = props.lat;
    this.lng = props.lng;
    this.radiusKm = props.radiusKm;
    this.shiftStart = props.shiftStart;
    this.shiftEnd = props.shiftEnd;
    this.isPrimary = props.isPrimary;
    this.active = props.active;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    driverId: UUID;
    name: string;
    lat: number;
    lng: number;
    radiusKm?: number;
    shiftStart?: string;
    shiftEnd?: string;
    isPrimary?: boolean;
    notes?: string;
  }): Result<DriverBase, Error> {
    if (!props.driverId) return err(new Error('driverId is required'));

    const trimmedName = props.name?.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
      return err(new Error('name must be 2–80 characters'));
    }

    if (props.lat < -90 || props.lat > 90) {
      return err(new Error('lat out of range'));
    }
    if (props.lng < -180 || props.lng > 180) {
      return err(new Error('lng out of range'));
    }

    const radius = props.radiusKm ?? 5;
    if (radius <= 0 || radius > 50) {
      return err(new Error('radiusKm must be in (0, 50] km'));
    }

    if (props.shiftStart && !DriverBase.isValidTime(props.shiftStart)) {
      return err(new Error('shiftStart must be HH:MM 24h format'));
    }
    if (props.shiftEnd && !DriverBase.isValidTime(props.shiftEnd)) {
      return err(new Error('shiftEnd must be HH:MM 24h format'));
    }

    const now = new Date();
    return ok(
      new DriverBase({
        id: uuidv4() as UUID,
        driverId: props.driverId,
        name: trimmedName,
        lat: props.lat,
        lng: props.lng,
        radiusKm: radius,
        shiftStart: props.shiftStart,
        shiftEnd: props.shiftEnd,
        isPrimary: props.isPrimary ?? false,
        active: true,
        notes: props.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  /**
   * ¿La hora actual del driver está dentro del shift configurado?
   * Si no hay shift, siempre retorna true.
   */
  public isInShift(now: Date = new Date()): boolean {
    if (!this.shiftStart || !this.shiftEnd) return true;

    const cur = now.getHours() * 60 + now.getMinutes();
    const start = DriverBase.timeToMinutes(this.shiftStart);
    const end = DriverBase.timeToMinutes(this.shiftEnd);

    if (start <= end) {
      return cur >= start && cur <= end;
    }
    // Overnight shift (ej. 22:00 a 06:00).
    return cur >= start || cur <= end;
  }

  public update(
    changes: Partial<{
      name: string;
      lat: number;
      lng: number;
      radiusKm: number;
      shiftStart?: string;
      shiftEnd?: string;
      isPrimary: boolean;
      active: boolean;
      notes?: string;
    }>,
  ): Result<DriverBase, Error> {
    const next: DriverBaseProps = {
      ...this.toPrimitives(),
      ...changes,
      updatedAt: new Date(),
    };

    // Re-validate
    if (next.name.length < 2 || next.name.length > 80) {
      return err(new Error('name must be 2–80 characters'));
    }
    if (next.lat < -90 || next.lat > 90 || next.lng < -180 || next.lng > 180) {
      return err(new Error('lat/lng out of range'));
    }
    if (next.radiusKm <= 0 || next.radiusKm > 50) {
      return err(new Error('radiusKm must be in (0, 50] km'));
    }
    if (next.shiftStart && !DriverBase.isValidTime(next.shiftStart)) {
      return err(new Error('shiftStart invalid'));
    }
    if (next.shiftEnd && !DriverBase.isValidTime(next.shiftEnd)) {
      return err(new Error('shiftEnd invalid'));
    }

    return ok(new DriverBase(next));
  }

  public deactivate(): DriverBase {
    return new DriverBase({
      ...this.toPrimitives(),
      active: false,
      updatedAt: new Date(),
    });
  }

  public toPrimitives(): DriverBaseProps {
    return {
      id: this.id,
      driverId: this.driverId,
      name: this.name,
      lat: this.lat,
      lng: this.lng,
      radiusKm: this.radiusKm,
      shiftStart: this.shiftStart,
      shiftEnd: this.shiftEnd,
      isPrimary: this.isPrimary,
      active: this.active,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static fromPrimitives(props: DriverBaseProps): DriverBase {
    return new DriverBase(props);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private static isValidTime(s: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  }

  private static timeToMinutes(s: string): number {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  }
}
