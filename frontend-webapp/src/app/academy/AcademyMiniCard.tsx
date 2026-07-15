'use client';

/**
 * Tarjeta compacta del progreso de Academia para el perfil/cuenta: nivel Aliado
 * actual, nº de cursos completados e insignias ganadas. Se auto-carga; si no hay
 * progreso (o backend caído) no renderiza nada (degradación silenciosa).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { COLORS } from '../components/design-tokens';
import { getAcademyProgress, ProgressView } from '../../lib/academy/api';

const LEVEL_COLOR: Record<string, string> = {
  none: '#9CA3AF',
  bronce: '#B45309',
  plata: '#6B7280',
  oro: '#D97706',
};

export function AcademyMiniCard() {
  const [p, setP] = useState<ProgressView | null>(null);
  useEffect(() => {
    let active = true;
    getAcademyProgress().then((res) => { if (active) setP(res); });
    return () => { active = false; };
  }, []);

  if (!p || (p.completedCount === 0 && p.badges.length === 0)) return null;

  const color = LEVEL_COLOR[p.level.level] ?? '#9CA3AF';

  return (
    <Link href="/academy?tab=niveles"
      className="block w-full rounded-xl p-4 mb-2 border border-gray-100 hover:shadow-sm transition-shadow"
      style={{ background: `linear-gradient(135deg, ${color}12, ${color}05)` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg" style={{ backgroundColor: color }}>
            🏅
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">{p.level.label}</p>
            <p className="text-xs text-gray-500">
              {p.completedCount}/{p.totalCourses} cursos · {p.badges.length} insignia{p.badges.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold" style={{ color: COLORS.brand.red }}>Ver →</span>
      </div>
    </Link>
  );
}
