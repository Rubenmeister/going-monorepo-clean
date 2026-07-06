/**
 * API pública de queries del KB.
 *
 * Funciones puras: leen del snapshot cacheado y devuelven resultados
 * estructurados. No tienen side effects, no llaman a la red.
 *
 * Para precios usa `findRoute()` — es la única función que devuelve
 * tarifas. Reemplaza la combinación FARES + pricing.service del antiguo
 * libs/pricing.
 */
import { getKnowledgeBase } from './loader';
import type {
  Modality,
  VehicleId,
  ClientTypeId,
  RouteEntry,
  FareResult,
  FareBreakdownItem,
  LugarInfo,
  ProductDoc,
  VehicleInfo,
  CoverageCity,
  RawDoc,
} from './types';

// ─── Rutas y tarifas ────────────────────────────────────────────────

export interface FindRouteOpts {
  origin: { canton: string; zone?: string };
  destination: { canton: string; zone?: string };
  modality: Modality;
  vehicle: VehicleId;
  /** Hora en zona Ecuador (UTC-5). Si no se pasa, usa Date.now(). */
  when?: Date;
  clientType?: ClientTypeId;
  /** El caller indica si la fecha es feriado en Ecuador. */
  isHoliday?: boolean;
}

/**
 * Busca una ruta y devuelve precio final + breakdown completo.
 *
 * @returns null si la ruta no existe en el catálogo.
 */
export function findRoute(opts: FindRouteOpts): FareResult | null {
  const kb = getKnowledgeBase();

  const route = matchRoute(kb.rutas, opts.origin, opts.destination);
  if (!route) return null;

  const vehicle = opts.vehicle;
  const modality = opts.modality;

  // ── 1) Precio base ──
  const baseTable = modality === 'shared' ? route.shared : route.private;
  const basePrice = baseTable?.[vehicle];
  if (basePrice == null) {
    // La ruta existe pero no tiene tarifa para ese vehículo+modalidad.
    return null;
  }

  const breakdown: FareBreakdownItem[] = [
    { type: 'base', label: `Base ${modality} ${vehicle}`, amount_usd: basePrice },
  ];

  let runningTotal = basePrice;

  // ── 2) Recargo de zona de origen ──
  const originZoneSurcharge = resolveZoneSurcharge(
    opts.origin.canton,
    opts.origin.zone,
  );
  if (originZoneSurcharge > 0) {
    breakdown.push({
      type: 'origin_zone_surcharge',
      label: `Recargo origen ${opts.origin.zone ?? opts.origin.canton}`,
      amount_usd: originZoneSurcharge,
    });
    runningTotal += originZoneSurcharge;
  }

  const when = opts.when ?? new Date();

  // ── 3) Hora del día ──
  const horaRule = matchHoraDelDia(kb.dynamicSurcharges.hora_del_dia, when);
  if (horaRule) {
    const mult = modality === 'private'
      ? horaRule.privado_multiplier
      : horaRule.compartido_multiplier;
    if (mult !== 1) {
      const delta = runningTotal * (mult - 1);
      breakdown.push({
        type: 'hora_del_dia',
        label: horaRule.label,
        amount_usd: delta,
        multiplier: mult,
      });
      runningTotal += delta;
    }
  }

  // ── 4) Día de la semana ──
  const diaRule = matchDiaSemana(kb.dynamicSurcharges.dia_de_la_semana, when);
  if (diaRule) {
    const mult = modality === 'private'
      ? diaRule.privado_multiplier
      : diaRule.compartido_multiplier;
    if (mult !== 1) {
      const delta = runningTotal * (mult - 1);
      breakdown.push({
        type: 'dia_de_la_semana',
        label: diaRule.label,
        amount_usd: delta,
        multiplier: mult,
      });
      runningTotal += delta;
    }
  }

  // ── 5) Feriado ──
  if (opts.isHoliday) {
    const fer = kb.dynamicSurcharges.feriado;
    const mult = modality === 'private'
      ? fer.privado_multiplier
      : fer.compartido_multiplier;
    if (mult !== 1) {
      const delta = runningTotal * (mult - 1);
      breakdown.push({
        type: 'feriado',
        label: 'Feriado nacional',
        amount_usd: delta,
        multiplier: mult,
      });
      runningTotal += delta;
    }
  }

  // ── 6) Tipo de cliente ──
  const clientType = opts.clientType ?? 'retail';
  const ct = kb.clientTypes.find((c) => c.id === clientType);
  if (ct && ct.multiplier !== 1) {
    const delta = runningTotal * (ct.multiplier - 1);
    breakdown.push({
      type: 'client_type',
      label: ct.label,
      amount_usd: delta,
      multiplier: ct.multiplier,
    });
    runningTotal += delta;
  }

  // ── Compose result ──
  const finalPrice = Math.round(runningTotal * 100) / 100;

  return {
    routeId: route.id,
    basePrice,
    finalPrice,
    breakdown,
    modality,
    vehicle,
    clientType,
    revisar: route.revisar || (ct?.revisar ?? false),
    trusted: !route.revisar && !(ct?.revisar ?? false),
  };
}

// ─── Helpers de matching ────────────────────────────────────────────

function matchRoute(
  rutas: RouteEntry[],
  origin: { canton: string; zone?: string },
  destination: { canton: string; zone?: string },
): RouteEntry | null {
  const originZone = origin.zone ?? 'centro_norte'; // default Quito
  return (
    rutas.find(
      (r) =>
        r.origin.canton === origin.canton &&
        (r.origin.zone ?? 'centro_norte') === originZone &&
        r.destination.canton === destination.canton &&
        (destination.zone == null || r.destination.zone === destination.zone),
    ) ?? null
  );
}

function resolveZoneSurcharge(
  canton: string,
  zoneId: string | undefined,
): number {
  if (!zoneId) return 0;
  const kb = getKnowledgeBase();
  const cityZones = kb.zones[canton];
  if (!cityZones) return 0;
  const zone = cityZones.zonas.find((z) => z.id === zoneId);
  return zone?.origin_surcharge_usd ?? 0;
}

function matchHoraDelDia(
  rules: { id: string; label: string; rango_horas?: string[]; privado_multiplier: number; compartido_multiplier: number }[],
  when: Date,
) {
  // Hora en zona Ecuador (UTC-5)
  const hourEc = (when.getUTCHours() - 5 + 24) % 24;
  for (const rule of rules) {
    if (!rule.rango_horas) continue;
    for (const range of rule.rango_horas) {
      const [from, to] = range.split('-').map((s) => parseInt(s.split(':')[0], 10));
      if (Number.isNaN(from) || Number.isNaN(to)) continue;
      if (from <= to) {
        if (hourEc >= from && hourEc < to) return rule;
      } else {
        // rango cruza medianoche (ej. 22-05)
        if (hourEc >= from || hourEc < to) return rule;
      }
    }
  }
  return null;
}

function matchDiaSemana(
  rules: { id: string; label: string; dias?: string[]; privado_multiplier: number; compartido_multiplier: number }[],
  when: Date,
) {
  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  // Día en zona Ecuador (UTC-5)
  const ecDay = new Date(when.getTime() - 5 * 60 * 60 * 1000).getUTCDay();
  const dayName = dayNames[ecDay];
  for (const rule of rules) {
    if (rule.dias?.includes(dayName)) return rule;
  }
  return null;
}

// ─── Lugares ────────────────────────────────────────────────────────

export function getCanton(id: string): LugarInfo | null {
  const kb = getKnowledgeBase();
  return kb.lugares.find((l) => l.id === id || l.canton === id) ?? null;
}

export function listLugares(): LugarInfo[] {
  return getKnowledgeBase().lugares;
}

// ─── Cobertura ──────────────────────────────────────────────────────

export function isCovered(cantonName: string): boolean {
  const kb = getKnowledgeBase();
  const norm = cantonName.toLowerCase().trim();
  return kb.coverage.active_cities.some(
    (c) => c.name.toLowerCase() === norm,
  );
}

export function listActiveCities(): CoverageCity[] {
  return getKnowledgeBase().coverage.active_cities;
}

export function listComingSoonCities(): string[] {
  return getKnowledgeBase().coverage.coming_soon;
}

// ─── Productos ──────────────────────────────────────────────────────

export function getProductInfo(id: string): ProductDoc | null {
  const kb = getKnowledgeBase();
  return kb.products.find((p) => p.id === id) ?? null;
}

export function listProducts(): ProductDoc[] {
  return getKnowledgeBase().products;
}

// ─── Flota ──────────────────────────────────────────────────────────

export function getVehicleInfo(id: VehicleId): VehicleInfo | null {
  return getKnowledgeBase().vehicles[id] ?? null;
}

// ─── Contact / Identity / About ────────────────────────────────────

export function getContactInfo() {
  return getKnowledgeBase().contact;
}

export function getIdentity() {
  return getKnowledgeBase().identity;
}

export function getAboutText(): string {
  return getKnowledgeBase().about;
}

// ─── Diagnostics ────────────────────────────────────────────────────

/**
 * Devuelve warnings producidos al cargar el KB. Útil para que el servicio
 * los loggee al startup y para health checks de monitoring.
 */
export function getKbWarnings(): string[] {
  return getKnowledgeBase().warnings;
}

/**
 * Devuelve cantidad de rutas con flag `revisar: true`. Métrica útil para
 * el ops dashboard ("¿cuántas tarifas falta validar?").
 */
export function countRutasPendientesRevision(): number {
  return getKnowledgeBase().rutas.filter((r) => r.revisar).length;
}

// ─── Consulta de conocimiento (legal / turismo / faq / políticas / guías) ──

/** Formatea una ficha de lugar (turismo + histórico-geográfico) para lectura. */
function formatLugar(l: LugarInfo): string {
  const p: string[] = [];
  p.push(`${l.name} — ${l.province}, región ${l.region}${l.is_country_capital ? ' (capital del Ecuador)' : l.is_canton_capital ? ' (cabecera cantonal)' : ''}.`);
  const g = l.geography;
  if (g) {
    const cl = g.climate;
    p.push(
      `Geografía: altitud ${g.altitude_m} m` +
      (g.population ? `, población ~${g.population.toLocaleString('es-EC')}` : '') +
      (cl ? `. Clima ${cl.zone}, ${cl.avg_temp_c?.min}–${cl.avg_temp_c?.max} °C. Mejor época: ${(cl.best_visit_months || []).join(', ')}.` : '.'),
    );
  }
  if (l.history_es) p.push(`Historia: ${l.history_es.trim()}`);
  if (l.attractions_es?.length) p.push(`Atractivos: ${l.attractions_es.join('; ')}.`);
  if (l.gastronomy_es?.length) p.push(`Gastronomía: ${l.gastronomy_es.join('; ')}.`);
  if (l.events_es?.length) p.push(`Eventos: ${l.events_es.map((e) => `${e.name} (${e.when})`).join('; ')}.`);
  if (l.going_coverage) {
    const c = l.going_coverage;
    p.push(`Cobertura Going: ${c.active ? 'activa' : c.coming_soon ? 'próximamente' : 'aún no'}${c.airport ? `. Aeropuerto: ${c.airport}` : ''}${c.nearest_hub ? `. Hub más cercano: ${c.nearest_hub}` : ''}.`);
  }
  return p.join('\n');
}

/**
 * Devuelve el CONTENIDO de conocimiento de Going para un tema, listo para que
 * el asistente responda. Cubre lo que hoy tiene material real:
 *   - 'legal'      → términos, privacidad, cookies
 *   - 'politicas'  → cancelación, reembolsos, mascotas, corporativo
 *   - 'faq'        → preguntas frecuentes
 *   - 'guias'      → cómo usar / inscribirse / descargar la app
 *   - 'turismo'    → ficha turística + histórico-geográfica de una CIUDAD
 *                    (pasar `ciudad`); sin ciudad, lista las disponibles.
 *
 * Fuente única: el Centro de Información Going (knowledge-base/). El texto se
 * trunca a ~6000 chars para no inflar el contexto del modelo.
 */
export function consultarConocimiento(
  tema: string,
  ciudad?: string,
): { tema: string; contenido: string } | { error: string; temas_disponibles: string[] } {
  const kb = getKnowledgeBase();
  const t = (tema || '').toLowerCase().trim().replace(/\s+/g, '_');
  const joinDocs = (docs: RawDoc[], max = 12000) =>
    docs.map((d) => d.raw).filter(Boolean).join('\n\n---\n\n').slice(0, max);

  switch (t) {
    case 'legal':
    case 'terminos':
    case 'términos':
    case 'privacidad':
    case 'cookies':
    case 'terminos_y_condiciones':
      return { tema: 'legal', contenido: joinDocs(kb.legal) || 'Sin documentos legales cargados.' };

    case 'politicas':
    case 'políticas':
    case 'politica':
    case 'cancelacion':
    case 'cancelación':
    case 'reembolso':
    case 'reembolsos':
    case 'mascotas':
    case 'corporativo':
      return { tema: 'politicas', contenido: joinDocs(kb.policies) || 'Sin políticas cargadas.' };

    case 'faq':
    case 'preguntas':
    case 'preguntas_frecuentes':
      return { tema: 'faq', contenido: joinDocs(kb.faq) || 'Sin FAQ cargado.' };

    case 'guia':
    case 'guias':
    case 'guías':
    case 'ayuda':
    case 'como_usar':
    case 'registro':
    case 'inscripcion':
    case 'inscripción':
    case 'descargar':
    case 'app':
    case 'apps': {
      // Excluir el README (índice con placeholders "por redactar"); devolver las
      // guías reales, con más margen para que no se corten.
      const guias = kb.guiasUso.filter((d) => !/readme/i.test(`${d.id} ${d.filename}`));
      return {
        tema: 'guias',
        contenido:
          joinDocs(guias.length ? guias : kb.guiasUso, 9000) ||
          'Descarga la app Going desde Google Play (o usa la web app.goingec.com). Crea tu cuenta con tu número de celular y verifica por SMS. ' +
          'Para ser conductora o conductor, descarga la app "Going Conductor" y sube tu cédula, licencia y los documentos del vehículo.',
      };
    }

    case 'turismo':
    case 'ciudad':
    case 'lugar':
    case 'atractivos':
    case 'historia':
    case 'geografia':
    case 'geografía': {
      if (ciudad && ciudad.trim()) {
        const key = ciudad.toLowerCase().trim();
        const norm = key.replace(/\s+/g, '_');
        const l = kb.lugares.find(
          (x) =>
            x.id === norm ||
            x.name.toLowerCase() === key ||
            (x.short_name || '').toLowerCase() === key ||
            (x.canton || '').toLowerCase() === key,
        );
        if (l) return { tema: `turismo:${l.name}`, contenido: formatLugar(l) };
        return {
          error: `No tengo ficha turística de "${ciudad}".`,
          temas_disponibles: kb.lugares.map((x) => x.name),
        };
      }
      return {
        tema: 'turismo',
        contenido:
          'Ciudades con ficha turística e histórico-geográfica: ' +
          kb.lugares.map((x) => x.name).join(', ') +
          '. Pide una ciudad específica para el detalle.',
      };
    }

    default:
      return {
        error: `Tema no reconocido: "${tema}".`,
        temas_disponibles: ['legal', 'politicas', 'faq', 'guias', 'turismo (con ciudad)'],
      };
  }
}

// ─── Renta por tiempo (horas / días) ────────────────────────────────

export interface RentalQuoteOpts {
  vehicle: VehicleId;
  mode: 'local' | 'por_dias';
  unit?: 'hora' | 'medio_dia' | 'dia';       // modo local
  hours?: number;                             // modo local: horas específicas (override)
  days?: number;                              // modo por_dias
  origin?: { canton: string; zone?: string }; // modo por_dias
  destination?: { canton: string; zone?: string };
}

/**
 * Cotiza la renta de un vehículo por tiempo. Dos modos:
 *  - 'local' (dentro de la ciudad): tarifa_hora × horas. Día=10h, medio día=5h.
 *  - 'por_dias' (a otra ciudad): 2 × transfer_privado × días, −25% si días>1.
 */
export function getRentalQuote(
  opts: RentalQuoteOpts,
): { mode: string; vehicle: VehicleId; total: number; detalle: string } | { error: string; message: string } {
  const kb = getKnowledgeBase();
  const r = kb.rental;
  const rate = r.por_hora?.[opts.vehicle];

  if (opts.mode === 'local') {
    if (rate == null) return { error: 'sin_tarifa', message: `No hay tarifa por hora para ${opts.vehicle}.` };
    const unit = opts.unit ?? 'dia';
    const hours = opts.hours ?? (unit === 'hora' ? 1 : unit === 'medio_dia' ? r.medio_dia_horas : r.dia_horas);
    const total = Math.round(rate * hours * 100) / 100;
    const label = opts.hours
      ? `${hours} horas`
      : unit === 'hora' ? '1 hora' : unit === 'medio_dia' ? `medio día (${r.medio_dia_horas}h)` : `día completo (${r.dia_horas}h)`;
    return { mode: 'local', vehicle: opts.vehicle, total, detalle: `Renta local ${opts.vehicle}, ${label}: $${total} (a $${rate}/hora).` };
  }

  // por_dias — a otra ciudad; se ancla en 2 transfers (ida y vuelta).
  const days = Math.max(1, Math.floor(opts.days ?? 1));
  if (!opts.origin || !opts.destination) {
    return { error: 'faltan_ubicaciones', message: 'Para renta por días a otra ciudad, indica origen y destino.' };
  }
  let fare = findRoute({ origin: opts.origin, destination: opts.destination, modality: 'private', vehicle: opts.vehicle });
  if (!fare) fare = findRoute({ origin: opts.destination, destination: opts.origin, modality: 'private', vehicle: opts.vehicle });
  if (!fare) return { error: 'ruta_no_listada', message: `No tengo transfer privado ${opts.vehicle} para esa ruta.` };

  const transfer = fare.basePrice; // precio privado EXPLÍCITO (sin recargos)
  const base = r.por_dias.transfers_ida_vuelta * transfer * days;
  const disc = days > 1 ? r.por_dias.descuento_multidia : 0;
  const total = Math.round(base * (1 - disc) * 100) / 100;
  const detalle =
    `Renta ${days} día(s) ${opts.vehicle} (ida y vuelta, transfer $${transfer}): ` +
    `${r.por_dias.transfers_ida_vuelta}×$${transfer}×${days}${disc ? ` −${disc * 100}%` : ''} = $${total}.`;
  return { mode: 'por_dias', vehicle: opts.vehicle, total, detalle };
}

// ─── Envío de paquetes (plano por tamaño, cualquier ruta) ──────────

/**
 * Cotiza un envío de paquete. Precio PLANO por tamaño (no depende de la ruta).
 * Acepta el tamaño ('pequeno'|'mediano'|'grande') o el peso en kg (lo infiere).
 */
export function getShippingQuote(
  tamano?: string,
  pesoKg?: number,
): { tamano: string; precio: number; rango_kg: string; nota: string } | { error: string; opciones: Array<{ tamano: string; rango_kg: string; precio: number }> } {
  const list = getKnowledgeBase().shipping.por_tamano;
  const opciones = list.map((x) => ({ tamano: x.id, rango_kg: x.rango_kg, precio: x.precio }));
  if (!list.length) return { error: 'sin_tarifas_envio', opciones };

  let match: (typeof list)[number] | undefined;
  if (tamano) {
    const t = tamano.toLowerCase().trim();
    match = list.find((x) => x.id === t || x.label.toLowerCase() === t)
      || (t.startsWith('peq') ? list.find((x) => x.id === 'pequeno') : undefined)
      || (t.startsWith('med') ? list.find((x) => x.id === 'mediano') : undefined)
      || (t.startsWith('gra') ? list.find((x) => x.id === 'grande') : undefined);
  }
  if (!match && pesoKg != null && Number.isFinite(pesoKg)) {
    match = pesoKg <= 5 ? list.find((x) => x.id === 'pequeno')
      : pesoKg <= 15 ? list.find((x) => x.id === 'mediano')
      : list.find((x) => x.id === 'grande');
  }
  if (!match) return { error: 'indica_tamano_o_peso', opciones };

  return {
    tamano: match.id,
    precio: match.precio,
    rango_kg: match.rango_kg,
    nota: 'Precio plano puerta a puerta, igual para cualquier ruta interurbana (el paquete viaja en una unidad que ya hace ese trayecto).',
  };
}
