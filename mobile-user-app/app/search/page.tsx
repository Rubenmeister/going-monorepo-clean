'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, authFetch } from '../store';
import AppShell from '../components/AppShell';

type Tab = 'tours' | 'accommodation' | 'experiences';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'tours', label: 'Tours', icon: '🎫' },
  { key: 'accommodation', label: 'Alojamiento', icon: '🏠' },
  { key: 'experiences', label: 'Experiencias', icon: '🎭' },
];

const FALLBACK: Record<Tab, any[]> = {
  tours: [
    {
      id: '1',
      title: 'Tour Centro Histórico Quito',
      price: 35,
      location: 'Quito',
      duration: '4h',
      icon: '🏛️',
      rating: 4.8,
    },
    {
      id: '2',
      title: 'Aventura en el Cotopaxi',
      price: 85,
      location: 'Cotopaxi',
      duration: '8h',
      icon: '🏔️',
      rating: 4.9,
    },
    {
      id: '3',
      title: 'Ruta del Chocolate',
      price: 50,
      location: 'Mindo',
      duration: '6h',
      icon: '🍫',
      rating: 4.7,
    },
    {
      id: '4',
      title: 'Tren de la Nariz del Diablo',
      price: 45,
      location: 'Alausí',
      duration: '5h',
      icon: '🚂',
      rating: 4.6,
    },
  ],
  accommodation: [
    {
      id: '1',
      title: 'Casa Gangotena',
      price: 120,
      location: 'Quito',
      type: 'Hotel Boutique',
      icon: '🏨',
      rating: 4.9,
    },
    {
      id: '2',
      title: 'Mashpi Lodge',
      price: 280,
      location: 'Pichincha',
      type: 'Eco Lodge',
      icon: '🌿',
      rating: 5.0,
    },
    {
      id: '3',
      title: 'Hotel Patio Andaluz',
      price: 95,
      location: 'Quito',
      type: 'Hotel Heritage',
      icon: '🏰',
      rating: 4.7,
    },
  ],
  experiences: [
    {
      id: '1',
      title: 'Kayak en Baños',
      price: 45,
      location: 'Baños',
      duration: '3h',
      icon: '🛶',
      rating: 4.7,
    },
    {
      id: '2',
      title: 'Canopy Mindo',
      price: 30,
      location: 'Mindo',
      duration: '2h',
      icon: '🌳',
      rating: 4.6,
    },
    {
      id: '3',
      title: 'Cocina Ecuatoriana',
      price: 60,
      location: 'Quito',
      duration: '4h',
      icon: '🍽️',
      rating: 4.8,
    },
  ],
};

// Normalize API response to a consistent display shape
function normalizeItem(item: any, tab: Tab) {
  const title = item.title || item.name || '';
  const location = item.location?.city || item.location || '';
  const rating = item.averageRating ?? item.rating ?? 4.5;
  let price = item.price;
  if (typeof price === 'object') price = price?.amount ?? price?.value ?? 0;
  if (tab === 'accommodation') {
    price = item.pricePerNight?.amount ?? item.pricePerNight ?? price ?? 0;
  }
  const duration =
    item.durationHours != null ? `${item.durationHours}h` : item.duration ?? '';
  const type = item.type || item.category || item.accommodationType || '';
  return { ...item, title, location, rating, price, duration, type };
}

function SearchContent() {
  const { token, isReady, init } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'tours'
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>(
    FALLBACK[activeTab] ?? FALLBACK.tours
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  useEffect(() => {
    setResults(FALLBACK[activeTab] ?? FALLBACK.tours);
    const fetchData = async () => {
      setLoading(true);
      try {
        const ep =
          activeTab === 'accommodation'
            ? '/accommodations/search'
            : `/${activeTab}/search`;
        const res = await authFetch(ep);
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            setResults(raw.map((item: any) => normalizeItem(item, activeTab)));
          }
        }
      } catch {
        /* use fallback */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const safeResults = results ?? FALLBACK.tours;
  const filtered = query
    ? safeResults.filter((r: any) =>
        (r.title || r.name || '').toLowerCase().includes(query.toLowerCase())
      )
    : safeResults;

  return (
    <AppShell title="Buscar">
      {/* Search hero */}
      <div className="px-4 py-5" style={{ backgroundColor: '#011627' }}>
        <h1 className="text-lg font-black text-white mb-3">Buscar servicios</h1>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tours, hoteles, experiencias..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100 shadow-sm overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0"
            style={
              activeTab === t.key
                ? { backgroundColor: '#ff4c41', color: '#fff' }
                : { backgroundColor: '#f1f5f9', color: '#6b7280' }
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium mb-2">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">
                Sin resultados
              </p>
            ) : (
              filtered.map((item: any, i: number) => (
                <div
                  key={item.id || i}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: '#fff0ef' }}
                  >
                    {item.icon || '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {item.title || item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.location?.city || item.location}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {(item.duration || item.type) && (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          {item.duration || item.type}
                        </span>
                      )}
                      {item.rating && (
                        <span className="text-xs text-yellow-500">
                          ⭐ {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p
                      className="text-base font-black"
                      style={{ color: '#ff4c41' }}
                    >
                      ${item.price?.amount ?? item.price}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activeTab === 'accommodation' ? '/noche' : '/persona'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
