'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-gateway-780842550857.us-central1.run.app/api';

interface Accommodation {
  id: string;
  name: string;
  description: string;
  location: string;
  pricePerNight: number;
  rating?: number;
  type?: string;
  amenities?: string[];
}

const TYPES = ['Todos', 'Hotel', 'Hostal', 'Cabaña', 'Resort', 'Glamping'];

const FALLBACK: Accommodation[] = [
  { id: '1', name: 'Hotel Quito Palace',       description: 'Vista panorámica al Pichincha en el corazón del centro histórico', location: 'Quito',        pricePerNight: 95,  rating: 4.7, type: 'Hotel',   amenities: ['WiFi', 'Piscina', 'Spa'] },
  { id: '2', name: 'Hacienda El Porvenir',     description: 'Caballos, cóndores y paisajes andinos a 3600m de altitud',         location: 'Cotopaxi',     pricePerNight: 180, rating: 4.9, type: 'Cabaña',  amenities: ['Desayuno', 'Caballos', 'Trekking'] },
  { id: '3', name: 'Selva Lodge Napo',         description: 'Cabaña sobre el río Napo rodeada de selva primaria',               location: 'Napo',         pricePerNight: 220, rating: 4.8, type: 'Cabaña',  amenities: ['Todo incluido', 'Canoa', 'Guía'] },
  { id: '4', name: 'Hostal El Morro',          description: 'Ambiente bohemio y playa a 100m en la costa ecuatoriana',          location: 'Montañita',    pricePerNight: 35,  rating: 4.5, type: 'Hostal',  amenities: ['WiFi', 'Cocina', 'Surf'] },
  { id: '5', name: 'Glamping Mindo',           description: 'Domos transparentes bajo las estrellas en el bosque nublado',       location: 'Mindo',        pricePerNight: 120, rating: 5.0, type: 'Glamping', amenities: ['Desayuno', 'Bañera', 'Jacuzzi'] },
  { id: '6', name: 'Resort Galápagos Bay',     description: 'Frente al mar con tortugas y iguanas marinas como vecinos',        location: 'Santa Cruz, Galápagos', pricePerNight: 350, rating: 4.9, type: 'Resort', amenities: ['Snorkeling', 'Buceo', 'Piscina'] },
];

export default function AccommodationPage() {
  const [places, setPlaces]   = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType]       = useState('Todos');
  const [search, setSearch]   = useState('');
  const [guests, setGuests]   = useState(1);

  useEffect(() => {
    fetch(`${API_URL}/accommodation`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = data?.accommodations ?? data?.data ?? data ?? [];
        setPlaces(Array.isArray(list) && list.length > 0 ? list : FALLBACK);
      })
      .catch(() => setPlaces(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const filtered = places.filter(p => {
    const matchType = type === 'Todos' || p.type === type;
    const matchQ    = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchQ;
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
          <h1 className="text-xl font-bold text-gray-900">🏨 Hospedaje</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="rounded-3xl p-6 text-white mb-6" style={{ background: 'linear-gradient(135deg, #059669, #064e3b)' }}>
          <p className="text-white/70 text-sm mb-1">Alojamiento en Ecuador</p>
          <h2 className="text-2xl font-black mb-2">Duerme como en casa</h2>
          <p className="text-white/60 text-sm">Desde hostales hasta eco-lodges en la Amazonía</p>
        </div>

        {/* Search + guests */}
        <div className="flex gap-3 mb-4">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Destino o nombre…"
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white shadow-sm" />
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 shadow-sm">
            <button onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-7 h-7 rounded-xl bg-gray-100 text-gray-600 font-bold">−</button>
            <span className="text-sm font-bold text-gray-700 w-6 text-center">{guests}</span>
            <button onClick={() => setGuests(g => g + 1)} className="w-7 h-7 rounded-xl bg-gray-100 text-gray-600 font-bold">+</button>
            <span className="text-xs text-gray-400">pax</span>
          </div>
        </div>

        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                type === t ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={type === t ? { backgroundColor: '#059669' } : {}}>
              {t}
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
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">🏨</p>
            <p className="text-gray-500">Sin alojamientos en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(place => (
              <div key={place.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 flex items-center justify-center text-6xl" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                  🏨
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{place.name}</h3>
                    {place.rating && <span className="text-yellow-500 text-xs flex-shrink-0">★ {place.rating}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{place.description}</p>
                  {place.amenities && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {place.amenities.slice(0, 3).map(a => (
                        <span key={a} className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 font-medium">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span>📍 {place.location}</span>
                    {place.type && <><span>·</span><span>{place.type}</span></>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black" style={{ color: '#059669' }}>${place.pricePerNight}</p>
                      <p className="text-xs text-gray-400">/ noche</p>
                    </div>
                    <Link href={`/auth/login?from=/accommodation`}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: '#059669' }}>
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
