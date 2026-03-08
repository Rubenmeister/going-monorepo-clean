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
    },
    {
      id: '2',
      title: 'Aventura en el Cotopaxi',
      price: 85,
      location: 'Cotopaxi',
      duration: '8h',
      icon: '🏔️',
    },
    {
      id: '3',
      title: 'Ruta del Chocolate',
      price: 50,
      location: 'Mindo',
      duration: '6h',
      icon: '🍫',
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
    },
    {
      id: '2',
      title: 'Mashpi Lodge',
      price: 280,
      location: 'Pichincha',
      type: 'Eco Lodge',
      icon: '🌿',
    },
    {
      id: '3',
      title: 'Hotel Patio Andaluz',
      price: 95,
      location: 'Quito',
      type: 'Hotel Heritage',
      icon: '🏰',
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
    },
    {
      id: '2',
      title: 'Canopy Mindo',
      price: 30,
      location: 'Mindo',
      duration: '2h',
      icon: '🌳',
    },
    {
      id: '3',
      title: 'Cocina Ecuatoriana',
      price: 60,
      location: 'Quito',
      duration: '4h',
      icon: '🍽️',
    },
  ],
};

function SearchContent() {
  const { token, isReady, init } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'tours'
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>(FALLBACK.tours);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  useEffect(() => {
    setResults(FALLBACK[activeTab]);
    const fetchData = async () => {
      setLoading(true);
      try {
        const ep =
          activeTab === 'accommodation'
            ? '/accommodations/search'
            : `/${activeTab}/search`;
        const res = await authFetch(`${ep}?limit=10`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) setResults(data);
        }
      } catch {
        /* use fallback */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const filtered = query
    ? results.filter((r: any) =>
        (r.title || r.name || '').toLowerCase().includes(query.toLowerCase())
      )
    : results;

  return (
    <AppShell title="Buscar">
      <div className="p-4">
        {/* Search bar */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
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
        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">
                Sin resultados
              </p>
            ) : (
              filtered.map((item: any, i: number) => (
                <div
                  key={item.id || i}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {item.icon || '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {item.title || item.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.location?.city || item.location}
                    </p>
                    {(item.duration || item.type) && (
                      <p className="text-xs text-gray-400">
                        {item.duration || item.type}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p
                      className="text-sm font-bold"
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
