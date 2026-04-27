/**
 * Slots de viajes compartidos. Se usa en dos lugares:
 *  1. RideRequestForm: acordeón "Ver otras salidas hoy" cuando el usuario
 *     elige modo compartido y una fecha.
 *  2. RideTrackingPanel: vista no_driver, como fallback real cuando no hay
 *     conductor disponible en el modo privado pedido.
 *
 * Si el endpoint del backend falla, devolvemos slots base con precio variado
 * — preferible a no mostrar nada.
 */

export interface TimeSlot {
  id: string;
  time: string;         // "08:00"
  seatsLeft: number;
  price: number;
  label?: string;       // "Recomendado", "Último asiento"
}

const BASE_SLOTS: Omit<TimeSlot, 'id' | 'price'>[] = [
  { time: '05:30', seatsLeft: 4 },
  { time: '07:00', seatsLeft: 3, label: 'Recomendado' },
  { time: '09:00', seatsLeft: 2 },
  { time: '11:00', seatsLeft: 4 },
  { time: '13:30', seatsLeft: 1, label: 'Último asiento' },
  { time: '15:00', seatsLeft: 3 },
  { time: '17:00', seatsLeft: 4, label: 'Tarde' },
  { time: '19:30', seatsLeft: 2 },
];

export async function fetchSharedSlots(
  origin: string, destination: string, date: string, basePrice: number,
): Promise<TimeSlot[]> {
  try {
    const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.goingec.com';
    const params = new URLSearchParams({ origin, destination, date });
    const res = await fetch(`${API}/transport/shared/schedules?${params}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('api_error');
    const data = await res.json() as Array<{ id?: string; departureTime?: string; time?: string; seatsAvailable?: number; seatsLeft?: number; price?: number }>;
    return data.map((s, i) => ({
      id:        s.id ?? `slot-${i}`,
      time:      (s.departureTime ?? s.time ?? '').slice(0, 5),
      seatsLeft: s.seatsAvailable ?? s.seatsLeft ?? 3,
      price:     s.price ?? basePrice,
    }));
  } catch {
    return BASE_SLOTS.map((s, i) => ({
      ...s,
      id:    `slot-${i}`,
      price: Math.round((basePrice * (0.9 + Math.random() * 0.2)) / 5) * 5,
    }));
  }
}
