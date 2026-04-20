'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-gateway-780842550857.us-central1.run.app/api';

type Category = 'all' | 'transport' | 'tours' | 'experiences' | 'accommodation' | 'envios';

interface Result {
  id: string;
  category: Category;
  icon: string;
  title: string;
  subtitle: string;
  price?: number;
  priceLabel?: string;
  rating?: number;
  href: string;
  badge?: string;
}

const FALLBACK_RESULTS: Result[] = [
  { id: 't1', category: 'transport',     icon: '🚗', title: 'Transporte privado',      subtitle: 'SUV, VAN o BUS a tu destino',             priceLabel: 'desde $8',   href: '/ride',              badge: 'Inmediato' },
  { id: 't2', category: 'transport',     icon: '🚌', title: 'Bus compartido',           subtitle: 'Viaje con más pasajeros, precio menor', priceLabel: 'desde $3',   href: '/ride?mode=shared'  },
  { id: 'r1', category: 'tours',         icon: '🗺️', title: 'Tour Galápagos', subtitle: 'Islas encantadas, fauna única',       priceLabel: 'desde $299', href: '/tours',    rating: 4.9 },
  { id: 'r2', category: 'tours',         icon: '🌋', title: 'Volcán Cotopaxi',    subtitle: 'Trekking guiado hasta el refugio',          priceLabel: 'desde $45',  href: '/tours',    rating: 4.8 },
  { id: 'e1', category: 'experiences',   icon: '🎭', title: 'Cocina ecuatoriana',       subtitle: 'Clase de ceviche y llapingachos',           priceLabel: 'desde $30',  href: '/experiences', rating: 4.9 },
  { id: 'e2', category: 'experiences',   icon: '🧗', title: 'Escalada en Quilotoa',     subtitle: 'Aventura en el cráter volcánico', priceLabel: 'desde $55',  href: '/experiences', rating: 4.7 },
  { id: 'a1', category: 'accommodation', icon: '🏨', title: 'Hotel Quito Centro',       subtitle: 'Centro histórico, desayuno incluido',  priceLabel: 'desde $65',  href: '/accommodation', rating: 4.6 },
  { id: 'a2', category: 'accommodation', icon: '🏕️', title: 'Glamping Mindo',      subtitle: 'Naturaleza, aves y confort',                priceLabel: 'desde $90',  href: '/accommodation', rating: 4.8 },
  { id: 'p1', category: 'envios',        icon: '📦', title: 'Envío express Quito', subtitle: 'Entrega el mismo día dentro de la ciudad', priceLabel: 'desde $4', href: '/envios', badge: 'Express' },
  { id: 'p2', category: 'envios',        icon: '🚚', title: 'Envío nacional',      subtitle: 'A cualquier provincia del Ecuador',         priceLabel: 'desde $8',   href: '/envios'    },
];

const CATEGORY_CONFIG: Record<Category, { label: string; icon: string; color: string }> = {
  all:           { label: 'Todo',         icon: '🔍', color: '#ff4c41' },
  transport:     { label: 'Transporte',   icon: '🚗', color: '#0033A0' },
  tours:         { label: 'Tours',        icon: '🗺️', color: '#10b981' },
  experiences:   { label: 'Experiencias', icon: '🎭', color: '#7c3aed' },
  accommodation: { label: 'Hospedaje',    icon: '🏨', color: '#059669' },
  envios:        { label: 'Envíos',  icon: '📦', color: '#f59e0b' },
};

async function searchAPI(q: string): Promise<Result[]> {
  if (!q.trim()) return [];
  try {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}&limit=20`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const items: any[] = data.results ?? data.data ?? data ?? [];
    return items.map((item: any): Result => ({
      id:         item.id ?? item._id,
      category:   item.category ?? item.type ?? 'transport',
      icon:       CATEGORY_CONFIG[item.category as Category]?.icon ?? '📌',
      title:      item.name ?? item.title ?? '—',
      subtitle:   item.description ?? item.location ?? item.detail ?? '',
      price:      item.price ?? item.pricePerNight ?? item.totalPrice?.amount,
      rating:     item.rating,
      href:       item.href ?? `/${item.category ?? 'tours'}`,
    }));
  } catch {
    return [];
  }
}

function SearchInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const initialQ = searchParams.get('q') ?? searchParams.get('from') ?? '';
  const [query,    setQuery]    = useState(initialQ);
  const [input,    setInput]    = useState(initialQ);
  const [category, setCategory] = useState<Category>('all');
  const [results,  setResults]  = useState<Result[]>([]);
  const [loading,  setLoading]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getLocalResults = useCallback((q: string): Result[] => {
    if (!q.trim()) return FALLBACK_RESULTS;
    const lower = q.toLowerCase();
    return FALLBACK_RESULTS.filter(r =>
      r.title.toLowerCase().includes(lower) ||
      r.subtitle.toLowerCase().includes(lower)
    );
  }, []);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    const apiResults = await searchAPI(q);
    setResults(apiResults.length > 0 ? apiResults : getLocalResults(q));
    setLoading(false);
  }, [getLocalResults]);

  useEffect(() => { runSearch(initialQ); }, []); // eslint-disable-line

  const handleInput = (val: string) => {
    setInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(val);
      router.replace(`/search?q=${encodeURIComponent(val)}`, { scroll: false });
      runSearch(val);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(input);
    router.replace(`/search?q=${encodeURIComponent(input)}`, { scroll: false });
    runSearch(input);
  };

  const filtered = category === 'all' ? results : results.filter(r => r.category === category);

  const grouped = (Object.keys(CATEGORY_CONFIG) as Category[])
    .filter(c => c !== 'all')
    .map(c => ({ cat: c, items: results.filter(r => r.category === c) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0">
              ←
            </button>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input
                autoFocus
                type="text"
                value={input}
                onChange={e => handleInput(e.target.value)}
                placeholder="Tours, hospedaje, viajes, envíos…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41] bg-gray-50"
              />
              {input && (
                <button type="button" onClick={() => { setInput(''); handleInput(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
                  ×
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setCategory(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                category === key ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={category === key ? { backgroundColor: cfg.color } : {}}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Buscando en todos los servicios…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && query && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-semibold text-gray-700 mb-1">Sin resultados para "{query}"</p>
            <p className="text-sm text-gray-400 mb-6">Intenta con otro término o explora por categoría</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Galápagos', 'Quito', 'Tour', 'Hospedaje', 'Envío'].map(s => (
                <button key={s} onClick={() => handleInput(s)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-[#ff4c41] hover:text-[#ff4c41] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && category !== 'all' && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(r => <ResultCard key={r.id} result={r} />)}
          </div>
        )}

        {!loading && category === 'all' && grouped.length > 0 && (
          <div className="space-y-7">
            {grouped.map(({ cat, items }) => {
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <section key={cat}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <span>{cfg.icon}</span> {cfg.label}
                    </h2>
                    <Link href={`/${cat === 'transport' ? 'ride' : cat === 'envios' ? 'envios' : cat}`}
                      className="text-xs font-semibold hover:underline" style={{ color: cfg.color }}>
                      Ver todos →
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 3).map(r => <ResultCard key={r.id} result={r} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!loading && !query && (
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Búsquedas populares</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Galápagos', 'Quito centro', 'Tour volcanes', 'Rafting', 'Mindo', 'Hotel playa', 'Envío express', 'Viaje compartido'].map(s => (
                <button key={s} onClick={() => handleInput(s)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-100 text-sm text-gray-600 shadow-sm hover:shadow-md hover:border-[#ff4c41] hover:text-[#ff4c41] transition-all">
                  {s}
                </button>
              ))}
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Explorar por categoría</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][])
                .filter(([k]) => k !== 'all')
                .map(([key, cfg]) => (
                  <Link key={key}
                    href={`/${key === 'transport' ? 'ride' : key === 'envios' ? 'envios' : key}`}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-all">
                    <span className="text-2xl">{cfg.icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  const cfg = CATEGORY_CONFIG[result.category];
  return (
    <Link href={result.href}
      className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: cfg.color + '15' }}>
        {result.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-[#ff4c41] transition-colors">
            {result.title}
          </p>
          {result.badge && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold flex-shrink-0">
              {result.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{result.subtitle}</p>
        {result.rating && <p className="text-xs text-yellow-500 mt-0.5">★ {result.rating}</p>}
      </div>
      {result.price !== undefined && (
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black" style={{ color: cfg.color }}>${result.price}</p>
          {result.priceLabel && <p className="text-xs text-gray-400">{result.priceLabel}</p>}
        </div>
      )}
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchInner />
    </Suspense>
  );
}
