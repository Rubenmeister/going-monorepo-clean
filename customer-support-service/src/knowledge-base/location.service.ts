import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dataset = require('./ecuador-parishes.json') as ParishDataset;

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface ParishCentroid {
  lat: number;
  lng: number;
}

export interface Parish {
  ine_code:   string;
  parroquia:  string;
  canton:     string;
  provincia:  string;
  centroid:   ParishCentroid;
  altitude_m: number | null;
  area_km2:   number;
  population: number | null;
  neighbors:  string[];   // ine_codes
  aliases:    string[];
  history:    string;
  tourism: {
    highlights:  string[];
    climate:     string;
    best_season: string;
  };
}

export interface ParishDataset {
  generated_at: string;
  source:       string;
  totals:       { provinces: number; cantons: number; parishes: number };
  parishes:     Parish[];
}

export interface LocationMatch {
  /** Granularidad alcanzada */
  level:    'parroquia' | 'canton' | 'provincia';
  parishes: Parish[];        // 1..N (N>1 = ambigüedad)
  /** Nombre que el cliente escribió originalmente */
  query:    string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normaliza para comparación tolerante: minúsculas, sin tildes/eñes,
 * sin puntuación, espacios colapsados.
 *   "Cumbayá" -> "cumbaya"
 *   "El Carmen" -> "el carmen"
 *   "San Miguel de los Bancos" -> "san miguel de los bancos"
 */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, '')   // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function haversineKm(a: ParishCentroid, b: ParishCentroid): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ─── Servicio ────────────────────────────────────────────────────────────────

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  private readonly parishes: Parish[];
  private readonly byCode:    Map<string, Parish>;
  /** Nombres normalizados (parroquia/canton/provincia/aliases) → matches */
  private readonly nameIndex: Map<string, { level: 'parroquia' | 'canton' | 'provincia'; parishes: Parish[] }>;

  constructor() {
    this.parishes  = dataset.parishes;
    this.byCode    = new Map(this.parishes.map(p => [p.ine_code, p]));
    this.nameIndex = this.buildNameIndex();
    this.logger.log(
      `Loaded ${dataset.totals.parishes} parishes / ${dataset.totals.cantons} cantons / ${dataset.totals.provinces} provinces`,
    );
  }

  /**
   * Construye un índice por nombre normalizado:
   * - Parroquia (exact name + aliases) → 1+ parishes (puede haber colisión: "El Carmen")
   * - Cantón → todas las parroquias de ese cantón
   * - Provincia → todas las parroquias de esa provincia
   */
  private buildNameIndex(): Map<string, { level: 'parroquia' | 'canton' | 'provincia'; parishes: Parish[] }> {
    const idx = new Map<string, { level: 'parroquia' | 'canton' | 'provincia'; parishes: Parish[] }>();

    const add = (name: string, level: 'parroquia' | 'canton' | 'provincia', parish: Parish) => {
      const key = normalize(name);
      if (!key) return;
      const existing = idx.get(key);
      if (existing) {
        existing.parishes.push(parish);
      } else {
        idx.set(key, { level, parishes: [parish] });
      }
    };

    for (const p of this.parishes) {
      add(p.parroquia, 'parroquia', p);
      for (const alias of p.aliases) add(alias, 'parroquia', p);
      add(p.canton, 'canton', p);
      add(p.provincia, 'provincia', p);
    }

    return idx;
  }

  // ── API pública ───────────────────────────────────────────────────────────

  /** Lookup directo por código INE/GADM. */
  findByCode(code: string): Parish | undefined {
    return this.byCode.get(code);
  }

  /**
   * Búsqueda por nombre con normalización (ignora tildes/case/puntuación).
   * Devuelve el match más específico disponible (parroquia > cantón > provincia).
   */
  findByName(name: string): LocationMatch | null {
    const key = normalize(name);
    if (!key) return null;
    const hit = this.nameIndex.get(key);
    if (!hit) return null;
    return {
      level:    hit.level,
      parishes: hit.parishes,
      query:    name,
    };
  }

  /**
   * Extrae menciones de lugares desde texto libre con cascada:
   * prueba n-gramas de 1, 2, 3 palabras buscando matches en el índice.
   * Si una mención de mayor longitud cubre otra, la corta gana.
   */
  extractMentions(text: string): LocationMatch[] {
    const tokens = normalize(text).split(' ').filter(Boolean);
    const matches: LocationMatch[] = [];
    const used = new Set<number>(); // índices de tokens ya consumidos

    // De largo a corto para que matches multi-palabra ganen sobre individuales
    for (const ngramLen of [4, 3, 2, 1]) {
      for (let i = 0; i <= tokens.length - ngramLen; i++) {
        if ([...Array(ngramLen).keys()].some(k => used.has(i + k))) continue;
        const candidate = tokens.slice(i, i + ngramLen).join(' ');
        const hit = this.nameIndex.get(candidate);
        if (hit) {
          matches.push({
            level:    hit.level,
            parishes: hit.parishes,
            query:    candidate,
          });
          for (let k = 0; k < ngramLen; k++) used.add(i + k);
        }
      }
    }

    return matches;
  }

  /** Distancia en km entre los centroides de dos parroquias (línea recta). */
  distanceKm(a: Parish, b: Parish): number {
    return haversineKm(a.centroid, b.centroid);
  }

  /**
   * Convierte una parroquia a una línea legible para inyectar en el system
   * prompt del agente cuando se detecta una mención.
   */
  describe(parish: Parish): string {
    const parts = [
      `${parish.parroquia} (parroquia de ${parish.canton}, ${parish.provincia})`,
      `coords: ${parish.centroid.lat.toFixed(4)},${parish.centroid.lng.toFixed(4)}`,
      `área: ${parish.area_km2} km²`,
    ];
    if (parish.population) parts.push(`población: ${parish.population.toLocaleString('es-EC')}`);
    if (parish.altitude_m) parts.push(`altitud: ${parish.altitude_m} m`);
    if (parish.tourism.highlights.length) {
      parts.push(`atractivos: ${parish.tourism.highlights.join(', ')}`);
    }
    if (parish.history) parts.push(`historia: ${parish.history.slice(0, 200)}`);
    return parts.join(' · ');
  }

  /** Lista de provincias disponibles. Útil para validación o UI dropdowns. */
  getProvinces(): string[] {
    return [...new Set(this.parishes.map(p => p.provincia))].sort();
  }

  /** Cantones de una provincia. */
  getCantonsForProvince(provincia: string): string[] {
    const norm = normalize(provincia);
    return [
      ...new Set(
        this.parishes
          .filter(p => normalize(p.provincia) === norm)
          .map(p => p.canton),
      ),
    ].sort();
  }
}
