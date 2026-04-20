'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-gateway-780842550857.us-central1.run.app/api';

interface Experience {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  duration: string;
  rating?: number;
  tags?: string[];
}

const TAGS = ['Todas', 'Aventura', 'Cultural', 'Gastronómica', 'Naturaleza', 'Familiar'];

const FALLBACK: Experience[] = [
  { id: '1', name: 'Rafting en el río Toachi',    description: 'Adrenalina pura en aguas bravas de nivel 3-4',       location: 'Santo Domingo', price: 45,  duration: '4 horas', rating: 4.9, tags: ['Aventura'] },
  { id: '2', name: 'Cacao farm to bar',           description: 'Conoce el chocolate fino de aroma ecuatoriano',      location: 'Esmeraldas',   price: 35,  duration: '3 horas', rating: 4.8, tags: ['Cultural', 'Gastronómica'] },
  { id: '3', name: 'Parapente en Cuenca',         description: 'Vuela sobre las montañas de la Atenas del Ecuador',  location: 'Cuenca',       price: 80,  duration: '2 horas', rating: 4.7, tags: ['Aventura'] },
  { id: '4', name: 'Cocina andina con una abuela',description: 'Aprende recetas ancestrales en familia',             location: 'Otavalo',      price: 40,  duration: '3 horas', rating: 5.0, tags: ['Cultural', 'Gastronómica', 'Familiar'] },
  { id: '5', name: 'Nado con tortugas marinas',   description: 'Snorkeling en las aguas cristalinas del Pacífico',  location: 'Puerto López', price: 55,  duration: '5 horas', rating: 4.9, tags: ['Naturaleza', 'Aventura'] },
  { id: '6', name: 'Taller de sombrero de paja',  description: 'Aprende a tejer el mundialmente famoso sombrero ecuatoriano', location: 'Montecristi', price: 30, duration: '2 horas', rating: 4.6, tags: ['Cultural', 'Familiar'] },
];

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tag, setTag]                 = useState('Todas');
  const [search, setSearch]           = useState('');

  useEffect(() => {
    fetch(`${API_URL}/experiences`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = data?.experiences ?? data?.data ?? data ?? [];
        setExperiences(Array.isArray(list) && list.length > 0 ? list : FALLBACK);
      })
      .catch(() => setExperiences(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const filtered = experiences.filter(e => {
    const matchTag = tag === 'Todas' || (e.tags ?? []).includes(tag);
    const matchQ   = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchQ;
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
          <h1 className="text-xl font-bold text-gray-900">🎭 Experiencias</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="rounded-3xl p-6 text-white mb-6" style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>
          <p className="text-white/70 text-sm mb-1">Vivencias únicas en Ecuador</p>
          <h2 className="text-2xl font-black mb-2">Experiencias auténticas</h2>
          <p className="text-white/60 text-sm">Cocina, aventura, cultura — momentos que no olvidarás</p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar experiencia o ciudad…"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm" />
        </div>

        {/* Tags */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                tag === t ? 'bg-purple-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
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
            <p className="text-4xl mb-3">🎭</p>
            <p className="text-gray-500">No hay experiencias en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(exp => (
              <div key={exp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 flex items-center justify-center text-6xl" style={{ background: 'linear-gradient(135deg, #f3e8ff, #ddd6fe)' }}>
                  🎭
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{exp.name}</h3>
                    {exp.rating && <span className="text-yellow-500 text-xs flex-shrink-0">★ {exp.rating}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{exp.description}</p>
                  {exp.tags && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {exp.tags.map(tg => (
                        <span key={tg} className="px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-600 font-medium">{tg}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span>📍 {exp.location}</span>
                    <span>·</span>
                    <span>⏱ {exp.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-purple-600">${exp.price}</p>
                    <Link href={`/auth/login?from=/experiences`}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors">
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
