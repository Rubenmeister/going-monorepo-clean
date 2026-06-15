import { Result, ok, err } from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * Zone — geocerca administrable que delimita áreas de servicio.
 *
 * Tipos de zona:
 *   - service_area : Área donde Going opera. Si el pickup cae fuera de
 *                    cualquier service_area, rechazamos el pedido.
 *   - no_service   : Explícitamente excluida (ej. aeropuerto militar,
 *                    zonas con ordenanzas restrictivas).
 *   - priority     : Sobrecargo por zona premium (ej. Aeropuerto Tababela
 *                    +15%). Se suma al tarifario normal.
 *   - restricted   : Sólo permite a conductores con credenciales
 *                    específicas (ej. driver con VTC autorizado).
 *   - danger       : Zona roja / peligrosa. NO bloquea el servicio, pero el
 *                    sistema ALERTA al conductor (y opcionalmente al pasajero)
 *                    para prevenir. El texto del riesgo va en `notes`.
 */

export type ZoneKind = 'service_area' | 'no_service' | 'priority' | 'restricted' | 'danger';

/**
 * Coordenada como [lng, lat] siguiendo convención GeoJSON.
 * Nota: el orden es INVERTIDO vs lo que muchos mapas (Google Maps) muestran.
 */
export type LngLat = [number, number];

/**
 * Polígono simple: primer y último punto deben coincidir (ring cerrado),
 * mínimo 4 puntos (3 únicos + cierre).
 *
 * No soportamos multipolygons ni polygons con agujeros en esta iteración.
 */
export type PolygonRing = LngLat[];

export interface ZoneProps {
  id: UUID;
  name: string;
  kind: ZoneKind;
  polygon: PolygonRing;
  /** Surcharge en fracción (0.15 = +15%). Sólo aplica para kind='priority'. */
  surchargePct?: number;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Zone {
  readonly id: UUID;
  readonly name: string;
  readonly kind: ZoneKind;
  readonly polygon: PolygonRing;
  readonly surchargePct?: number;
  readonly notes?: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: ZoneProps) {
    this.id = props.id;
    this.name = props.name;
    this.kind = props.kind;
    this.polygon = props.polygon;
    this.surchargePct = props.surchargePct;
    this.notes = props.notes;
    this.active = props.active;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Factory: valida invariantes y construye la zona. */
  static create(props: {
    name: string;
    kind: ZoneKind;
    polygon: PolygonRing;
    surchargePct?: number;
    notes?: string;
  }): Result<Zone, Error> {
    const trimmedName = props.name?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return err(new Error('Zone name must be at least 2 characters'));
    }
    if (trimmedName.length > 80) {
      return err(new Error('Zone name exceeds 80 characters'));
    }

    const ringValid = Zone.validatePolygonRing(props.polygon);
    if (ringValid.isErr()) return err(ringValid.error);

    if (props.kind === 'priority') {
      if (props.surchargePct == null) {
        return err(new Error("kind='priority' requires surchargePct (e.g. 0.15)"));
      }
      if (props.surchargePct <= 0 || props.surchargePct > 1) {
        return err(new Error('surchargePct must be between 0 and 1 (exclusive)'));
      }
    } else if (props.surchargePct != null) {
      return err(new Error('surchargePct only allowed for kind=priority'));
    }

    const now = new Date();
    return ok(
      new Zone({
        id: uuidv4() as UUID,
        name: trimmedName,
        kind: props.kind,
        polygon: props.polygon,
        surchargePct: props.surchargePct,
        notes: props.notes?.trim() || undefined,
        active: true,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  /** Valida que el polígono sea un ring simple cerrado con ≥ 4 puntos. */
  static validatePolygonRing(ring: PolygonRing): Result<void, Error> {
    if (!Array.isArray(ring) || ring.length < 4) {
      return err(
        new Error('Polygon must have at least 4 points (3 unique + closing point)'),
      );
    }
    for (const [i, pt] of ring.entries()) {
      if (!Array.isArray(pt) || pt.length !== 2) {
        return err(new Error(`Point ${i} must be [lng, lat]`));
      }
      const [lng, lat] = pt;
      if (typeof lng !== 'number' || lng < -180 || lng > 180) {
        return err(new Error(`Point ${i} lng ${lng} out of range [-180, 180]`));
      }
      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        return err(new Error(`Point ${i} lat ${lat} out of range [-90, 90]`));
      }
    }
    // Verificar que el ring esté cerrado (primer y último punto iguales).
    const [fst, lst] = [ring[0], ring[ring.length - 1]];
    if (fst[0] !== lst[0] || fst[1] !== lst[1]) {
      return err(new Error('Polygon ring must be closed (first point === last point)'));
    }
    return ok(undefined);
  }

  // ── Behaviors ─────────────────────────────────────────────────────────

  /** Devuelve una copia con nuevos valores (immutable update). */
  public update(
    changes: Partial<{
      name: string;
      kind: ZoneKind;
      polygon: PolygonRing;
      surchargePct?: number;
      notes?: string;
      active: boolean;
    }>,
  ): Result<Zone, Error> {
    const next = {
      ...this.toPrimitives(),
      ...changes,
      updatedAt: new Date(),
    };

    if (next.polygon) {
      const v = Zone.validatePolygonRing(next.polygon);
      if (v.isErr()) return err(v.error);
    }
    if (next.kind === 'priority' && next.surchargePct == null) {
      return err(new Error("kind='priority' requires surchargePct"));
    }
    if (next.kind !== 'priority' && next.surchargePct != null) {
      // Limpieza automática si cambias de priority a otro tipo.
      next.surchargePct = undefined;
    }

    return ok(
      new Zone({
        ...next,
        id: this.id,
        createdAt: this.createdAt,
      }),
    );
  }

  public deactivate(): Zone {
    return new Zone({
      ...this.toPrimitives(),
      active: false,
      updatedAt: new Date(),
    });
  }

  // ── Serialization ─────────────────────────────────────────────────────

  public toPrimitives(): ZoneProps {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      polygon: this.polygon,
      surchargePct: this.surchargePct,
      notes: this.notes,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static fromPrimitives(props: ZoneProps): Zone {
    return new Zone(props);
  }

  /**
   * Representación GeoJSON estándar del polígono.
   * Útil para retornar al frontend con Mapbox GL Draw.
   */
  public toGeoJSON(): {
    type: 'Feature';
    geometry: { type: 'Polygon'; coordinates: PolygonRing[] };
    properties: {
      id: string;
      name: string;
      kind: ZoneKind;
      surchargePct?: number;
      active: boolean;
    };
  } {
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [this.polygon],
      },
      properties: {
        id: this.id,
        name: this.name,
        kind: this.kind,
        surchargePct: this.surchargePct,
        active: this.active,
      },
    };
  }
}
