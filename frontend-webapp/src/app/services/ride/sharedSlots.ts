/**
 * Slots de viajes compartidos (carpool intercity).
 *
 * USA el endpoint unificado `/search` de transport-service
 * (UnifiedSearchUseCase). El response trae `scheduledOptions[]` con los
 * trips programados que matchean el corridor (origen → destino) en la
 * ventana de la fecha pedida. Cada option es un ScheduledTrip real con
 * cupos disponibles.
 *
 * Lo consume:
 *  1. RideRequestForm acordeón "Ver otras salidas hoy".
 *  2. RideTrackingPanel vista no_driver (fallback compartido).
 *
 * Cambio histórico (2026-05-26): este servicio antes llamaba a
 * `/transport/shared/schedules` (endpoint que NO existe en el backend
 * desplegado). Caía al catch y devolvía mocks hardcodeados — los precios
 * y horarios mostrados al usuario eran inventados, lo cual rompía el
 * flujo de reserva (intent al "Reservar" iba a un trip inexistente).
 * Ahora consume el endpoint real `/search` y si no hay viajes
 * disponibles devolvemos array vacío (UI muestra "no hay viajes
 * disponibles" — honesto).
 */

export interface TimeSlot {
  /** scheduledTripId real (lo necesita el caller para reservar). */
  id: string;
  time: string;         // "08:00"
  seatsLeft: number;
  price: number;
  label?: string;       // "Recomendado", "Último asiento"
  /** city IDs FARES (los pasa el backend en cada ScheduledOption). */
  originCity?: string;
  destCity?: string;
  /** ISO 8601 completo del departureTime — útil si el caller necesita armar el booking. */
  departureTime?: string;
}

export interface SearchLocation {
  address: string;
  lat: number;
  lon: number;
}

/**
 * Estado de cobertura de la ruta (espejo de `CoverageStatus` del backend,
 * transport-service/src/api/dtos/search-query.dto.ts):
 *  - 'available'       → hay opción inmediata y/o salidas programadas.
 *  - 'route_not_yet'   → la zona está cubierta pero la ruta aún no opera
 *                        (mostrar "ruta próximamente + días/horas").
 *  - 'out_of_coverage' → una ubicación está fuera de la zona de servicio.
 */
export type CoverageStatus = 'available' | 'route_not_yet' | 'out_of_coverage';

/**
 * Resultado completo de `/search` que necesita el webapp para alinear el
 * flujo PROGRAMADO: los slots compartidos + el estado de cobertura + los
 * avisos legibles que arma el backend (unified-search `notices`).
 */
export interface ScheduledSearchResult {
  slots: TimeSlot[];
  /** null si no se pudo consultar el backend (sin coords, 401, error). */
  coverageStatus: CoverageStatus | null;
  /** Mensajes de cobertura/disponibilidad ya redactados por el backend. */
  notices: string[];
}

/**
 * Helper: marca etiquetas legibles para UX (Recomendado / Último asiento).
 * Ordena por seatsLeft + criterio de hora.
 */
function decorateLabels(slots: TimeSlot[]): TimeSlot[] {
  if (slots.length === 0) return slots;
  // Encontrar el "más recomendado" — mid-morning con >=3 cupos.
  const recIdx = slots.findIndex((s) => {
    const h = parseInt(s.time.slice(0, 2), 10);
    return h >= 7 && h <= 10 && s.seatsLeft >= 3;
  });
  return slots.map((s, i) => {
    if (s.seatsLeft === 1) return { ...s, label: 'Último asiento' };
    if (i === recIdx) return { ...s, label: 'Recomendado' };
    const h = parseInt(s.time.slice(0, 2), 10);
    if (h >= 17) return { ...s, label: 'Tarde' };
    return s;
  });
}

/**
 * Consulta `/search` (UnifiedSearchUseCase) para una ruta intercity.
 * Devuelve los slots compartidos + el estado de cobertura + los avisos.
 *
 * - `date` es opcional: en PRIVADO programado basta con la ruta para saber la
 *   cobertura (el backend usa "ahora" si no mandamos `scheduledDateTime`); en
 *   COMPARTIDO se pasa el día elegido para listar las salidas de esa fecha.
 * - Sin coords reales (lat/lon = 0) NO llamamos al backend → resultado vacío
 *   con `coverageStatus: null` (la UI muestra "selecciona origen y destino").
 */
export async function searchScheduledTrips(
  pickup: SearchLocation,
  destination: SearchLocation,
  date?: string,
): Promise<ScheduledSearchResult> {
  const empty: ScheduledSearchResult = { slots: [], coverageStatus: null, notices: [] };
  if (!pickup?.lat || !pickup?.lon || !destination?.lat || !destination?.lon) {
    return empty;
  }

  try {
    const API = process.env.NEXT_PUBLIC_API_BASE_URL ||
                process.env.NEXT_PUBLIC_API_URL ||
                'https://api.goingec.com';
    // El backend espera ISO 8601 con hora; usamos medianoche del día pedido.
    // El UnifiedSearchUseCase cascadea horarios del día + ±1 día. Si no hay
    // fecha (privado consultando cobertura), omitimos scheduledDateTime.
    const scheduledDateTime = date ? `${date}T00:00:00.000Z` : undefined;
    // /search está protegido por JwtAuthGuard — leemos token de localStorage
    // si existe. Si el usuario NO está logueado, el backend devuelve 401 y
    // mostramos lista vacía con CTA a login (el carpool browsing público
    // requiere que el usuario se registre primero — aceptable porque
    // /reserve también lo requiere).
    // La key 'authToken' es la canónica (frontend-webapp/src/lib/providers/auth-client.ts).
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('authToken') || ''
      : '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        pickup: { lat: pickup.lat, lng: pickup.lon, address: pickup.address },
        destination: { lat: destination.lat, lng: destination.lon, address: destination.address },
        temporalPreference: 'scheduled',
        // Solo incluimos la fecha si el caller la pasó (compartido). Omitirla
        // deja que el backend clasifique la cobertura con "ahora" (privado).
        ...(scheduledDateTime ? { scheduledDateTime } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      // 401: el endpoint requiere JWT — el caller debe loguearse.
      // Otros: error del backend. En ambos casos devolvemos vacío.
      // eslint-disable-next-line no-console
      console.warn(`[sharedSlots] /search ${res.status}`);
      return empty;
    }
    const data = await res.json() as {
      route?: { coverageStatus?: CoverageStatus };
      scheduledOptions?: Array<{
        scheduledTripId: string;
        routeLabel?: string;
        originCity?: string;
        destCity?: string;
        departureTime: string;
        availableSeats: number;
        pricePerSeat: number;
      }>;
      alternativeSchedules?: Array<any>;
      notices?: string[];
    };
    const combined = [
      ...(data.scheduledOptions ?? []),
      ...(data.alternativeSchedules ?? []),
    ];
    const slots: TimeSlot[] = combined.map((s) => {
      // departureTime ISO → "HH:MM" en zona local del browser. Para EC (UTC-5)
      // el backend ya retorna timestamps que pueden estar en UTC; el
      // Date local del browser hace la conversión automática.
      const d = new Date(s.departureTime);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return {
        id: s.scheduledTripId,
        time: `${hh}:${mm}`,
        seatsLeft: s.availableSeats,
        price: s.pricePerSeat,
        originCity: s.originCity,
        destCity: s.destCity,
        departureTime: s.departureTime,
      };
    });
    return {
      slots: decorateLabels(slots),
      coverageStatus: data.route?.coverageStatus ?? null,
      notices: data.notices ?? [],
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[sharedSlots] fetch fallo:', (e as Error).message);
    return empty;
  }
}

/**
 * Wrapper legacy: devuelve SOLO los slots compartidos (sin cobertura).
 * Lo usa RideTrackingPanel para el fallback "no_driver". Los callers que
 * necesiten `coverageStatus`/`notices` deben usar `searchScheduledTrips`.
 */
export async function fetchSharedSlots(
  pickup: SearchLocation,
  destination: SearchLocation,
  date: string,
  _basePriceUnused?: number,
): Promise<TimeSlot[]> {
  const { slots } = await searchScheduledTrips(pickup, destination, date);
  return slots;
}
