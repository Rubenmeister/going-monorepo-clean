'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-gateway-780842550857.us-central1.run.app/api';

interface Tour {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  duration: string;
  image?: string;
  rating?: number;
  category?: string;
}

const CATEGORIES = ['Todos', 'Galápagos', 'Sierra', 'Costa', 'Amazonía'];

const FALLBACK_TOURS: Tour[] = [
  { id: '1', name: 'Tour Islas Galápagos 5D', description: 'Visita las islas más biodiversas del planeta', location: 'Galápagos', price: 1200, duration: '5 días', rating: 4.9, category: 'Galápagos' },
  { id: '2', name: 'Ruta de los Volcanes',    description: 'Avistamiento de cóndores y volcanes andinos', location: 'Sierra', price: 180, duration: '2 días', rating: 4.7, category: 'Sierra' },
  { id: '3', name: 'Selva Amazónica',         description: 'Comunidades indígenas y fauna exótica',       location: 'Tena, Napo', price: 220, duration: '3 días', rating: 4.8, category: 'Amazonía' },
  { id: '4', name: 'Ruta del Spondylus',      description: 'Playas, gastronomía y cultura manteña',      location: 'Costa',  price: 150, duration: '2 días', rating: 4.6, category: 'Costa' },
  { id: '5', name: 'Ciudad de Quito Colonial', description: 'Patrimonio UNESCO y arte colonial andino',  location: 'Quito',  price: 60,  duration: '1 día',  rating: 4.8, category: 'Sierra' },
  { id: '6', name: 'Mindo Cloud Forest',      description: 'Avistamiento de aves y mariposas exóticas', location: 'Mindo',  price: 80,  duration: '1 día',  rating: 4.7, category: 'Sierra' },
];

export default function ToursPage() {
  const [tours, setTours]       = useState<Tour[]>([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('Todos');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    fetch(`${API_URL}/tours`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list: Tour[] = data?.tours ?? data?.data ?? data ?? [];
        setTours(Array.isArray(list) && list.length > 0 ? list : FALLBACK_TOURS);
      })
      .catch(() => setTours(FALLBACK_TOURS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tours.filter(t => {
    const matchCat = category === 'Todos' || t.category === category || t.location?.includes(category);
    const matchQ   = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.location?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard/pasajero"
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">🗺️ Tours en Ecuador</h1>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="rounded-3xl p-6 text-white mb-6" style={{ background: 'linear-gradient(135deg, #0033A0, #001f6b)' }}>
          <p className="text-white/70 text-sm mb-1">Descubre Ecuador con Going</p>
          <h2 className="text-2xl font-black mb-2">Tours y aventuras</h2>
          <p className="text-white/60 text-sm">Desde Galápagos hasta la Amazonía — con transporte incluido</p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar destino o tour…"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0] bg-white shadow-sm"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                category === c ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={category === c ? { backgroundColor: '#0033A0' } : {}}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="h-36 bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-gray-500">No hay tours en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(tour => (
              <div key={tour.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Image placeholder */}
                <div className="h-40 flex items-center justify-center text-6xl" style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)' }}>
                  🗺️
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{tour.name}</h3>
                    {tour.rating && (
                      <span className="text-yellow-500 text-xs flex-shrink-0">★ {tour.rating}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{tour.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span>📍 {tour.location}</span>
                    <span>·</span>
                    <span>⏱ {tour.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black" style={{ color: '#ff4c41' }}>${tour.price}</p>
                    <Link href={`/auth/login?from=/tours`}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: '#0033A0' }}>
                      Reservar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
