/**
 * Going Rewards — programa de fidelidad.
 *
 * Single source of truth para LEVELS + tierFromPoints + HOW_TO_EARN +
 * BENEFITS. Importado por #16 Profile y #17 Puntos para evitar drift
 * (antes había 4 niveles en Puntos pero 3 en Profile — bug detectado
 * 2026-05-23).
 *
 * Decisión brand: 4 tiers con breakpoints amplios para que el progreso
 * a largo plazo se sienta. Un viaje compartido = +10 pts, llegar a
 * Viajero requiere ~50 viajes = uso sostenido.
 *
 * TODO backend: cuando exista /users/me/rewards expondrá puntos reales,
 * canjes históricos, y bonos activos. Hoy los valores vienen del user
 * object si el backend los manda, sino default 0.
 */

import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export interface RewardsLevel {
  id:    'explorador' | 'viajero' | 'aventurero' | 'embajador';
  name:  string;
  min:   number;
  max:   number;
  icon:  string;     // emoji visual
}

/**
 * 4 tiers del programa Going Rewards. Si un usuario nuevo arranca en
 * Explorador, necesita 500 pts (~50 viajes Compartido) para subir a
 * Viajero — progresión sostenida pero alcanzable.
 */
export const REWARDS_LEVELS: ReadonlyArray<RewardsLevel> = [
  { id: 'explorador', name: 'Explorador', min: 0,    max: 499,   icon: '🌱' },
  { id: 'viajero',    name: 'Viajero',    min: 500,  max: 1499,  icon: '🚗' },
  { id: 'aventurero', name: 'Aventurero', min: 1500, max: 2999,  icon: '⭐' },
  { id: 'embajador',  name: 'Embajador',  min: 3000, max: 99999, icon: '👑' },
];

/**
 * Devuelve el tier actual + el siguiente (si hay) según puntos.
 * Usado por:
 *  - ProfileScreen #16: muestra el badge del tier + "X pts para el siguiente"
 *  - PuntosScreen #17:  muestra progress bar al next tier + lista de niveles
 */
export function tierFromPoints(points: number): {
  current: RewardsLevel;
  next?:   RewardsLevel;
  /** Progreso normalizado 0-1 hacia el next tier. */
  progress: number;
} {
  const safePoints = Math.max(0, Math.floor(points || 0));
  const current = REWARDS_LEVELS.find(l => safePoints >= l.min && safePoints <= l.max)
    ?? REWARDS_LEVELS[0];
  const next = REWARDS_LEVELS[REWARDS_LEVELS.indexOf(current) + 1];
  const progress = next
    ? Math.min(1, Math.max(0, (safePoints - current.min) / (next.min - current.min)))
    : 1;
  return { current, next, progress };
}

// ── Cómo ganar puntos ────────────────────────────────────────────────────
export interface EarnRule {
  id:    string;
  label: string;
  /** Puntos otorgados — positivo (ganados). */
  pts:   number;
  icon:  ComponentProps<typeof Ionicons>['name'];
}

export const HOW_TO_EARN: ReadonlyArray<EarnRule> = [
  { id: 'compartido', label: 'Por cada viaje Compartido', pts: 10,  icon: 'people-outline'       },
  { id: 'privado',    label: 'Por cada viaje Privado',    pts: 20,  icon: 'lock-closed-outline'  },
  { id: 'envio',      label: 'Por cada envío',            pts: 5,   icon: 'cube-outline'         },
  { id: 'regreso',    label: 'Reservar tu regreso',       pts: 50,  icon: 'refresh-outline'      },
  { id: 'rate',       label: 'Calificar un viaje',        pts: 2,   icon: 'star-outline'         },
  { id: 'refer',      label: 'Referir un amigo',          pts: 100, icon: 'person-add-outline'   },
];

// ── Beneficios canjeables ───────────────────────────────────────────────
export type BenefitAccent = 'navy' | 'success' | 'warning' | 'red' | 'purple';

export interface Benefit {
  id:     string;
  pts:    number;
  label:  string;
  icon:   ComponentProps<typeof Ionicons>['name'];
  accent: BenefitAccent;
}

export const BENEFITS: ReadonlyArray<Benefit> = [
  {
    id:     'descuento_1usd',
    pts:    100,
    label:  '$1.00 de descuento en tu próximo viaje',
    icon:   'car-outline',
    accent: 'navy',
  },
  {
    id:     'asiento_delantero',
    pts:    250,
    label:  'Asiento delantero gratis (compartido)',
    icon:   'medal-outline',
    accent: 'purple',
  },
  {
    id:     'envio_gratis',
    pts:    500,
    label:  '1 envío gratis (paquete pequeño)',
    icon:   'cube-outline',
    accent: 'red',
  },
  {
    id:     'viaje_compartido_gratis',
    pts:    1000,
    label:  'Viaje Compartido gratis',
    icon:   'gift-outline',
    accent: 'warning',
  },
];
