'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { authFetch, getStoredToken, redirectToLogin } from '@/lib/providers/auth-client';

interface Space {
  id: string;
  title: string;
  description?: string;
  status?: string; // 'draft' | 'published' | 'archived'
  location?: any;
  pricePerNight?: any;
  capacity?: number;
}

function priceOf(p: any): string {
  const n = typeof p === 'number' ? p : p?.amount;
  return typeof n === 'number' ? `$${n}` : '—';
}
function cityOf(loc: any): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  return loc.city ?? loc.address ?? '';
}

export default function MisEspaciosPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const load = useCallback(async () => {
    if (!apiUrl) return;
    setLoading(true);
    try {
      const res = await authFetch(`${apiUrl}/accommodations/mine`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data ?? data.results ?? []);
      setSpaces(list);
      setError(null);
    } catch {
      setError('No pudimos cargar tus espacios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { redirectToLogin('/services/anfitriones/espacios'); return; }
    load();
  }, [load]);

  const publish = async (id: string) => {
    if (!apiUrl) return;
    setPublishing(id);
    try {
      const res = await authFetch(`${apiUrl}/accommodations/${id}/publish`, { method: 'PATCH' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Refrescar el estado desde el backend.
      await load();
    } catch {
      setError('No se pudo publicar el espacio. Intenta de nuevo.');
    } finally {
      setPublishing(null);
    }
  };

  const isPublished = (s: Space) => (s.status ?? '').toLowerCase() === 'published';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/services/anfitriones" className="text-xs text-gray-400 hover:text-gray-600">← Panel</Link>
            <h1 className="text-xl font-black text-gray-900 mt-1">Mis espacios</h1>
          </div>
          <Link href="/services/anfitriones/espacios/nuevo"
            className="bg-[#ff4c41] text-white text-sm font-bold rounded-xl px-4 py-2.5 hover:bg-[#e63e34] transition-colors">
            ➕ Nuevo espacio
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && spaces.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">🏡</p>
            <p className="font-semibold text-gray-700 mb-1">Aún no tienes espacios</p>
            <p className="text-sm text-gray-400 mb-6">Publica tu primer alojamiento para empezar a recibir reservas.</p>
            <Link href="/services/anfitriones/espacios/nuevo"
              className="inline-block bg-[#ff4c41] text-white text-sm font-bold rounded-xl px-5 py-2.5">
              Crear mi primer espacio →
            </Link>
          </div>
        )}

        {!loading && spaces.length > 0 && (
          <div className="space-y-3">
            {spaces.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#16a34a15] flex items-center justify-center text-2xl flex-shrink-0">🏡</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.title || 'Sin título'}</p>
                    {isPublished(s) ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold flex-shrink-0">Publicado</span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold flex-shrink-0">Borrador</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {cityOf(s.location)}{s.capacity ? ` · ${s.capacity} huésped(es)` : ''} · {priceOf(s.pricePerNight)}/noche
                  </p>
                </div>
                {!isPublished(s) && (
                  <button
                    onClick={() => publish(s.id)}
                    disabled={publishing === s.id}
                    className="bg-[#16a34a] text-white text-xs font-bold rounded-xl px-3.5 py-2 hover:bg-[#12833c] transition-colors disabled:opacity-50 flex-shrink-0">
                    {publishing === s.id ? 'Publicando…' : 'Publicar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
