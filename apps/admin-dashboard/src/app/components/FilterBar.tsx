'use client';

import React, { useState } from 'react';

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  from: string;
  to: string;
  date: string;
  timeRange: { start: string; end: string };
  passengers: number | null;
  status: string[];
  tripType: 'shared' | 'private' | 'all';
}

const STATUS_OPTIONS = [
  { value: 'requested', label: 'Solicitados' },
  { value: 'assigned', label: 'Asignados' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
];

const PRESET_ROUTES = [
  { from: 'Aeropuerto', to: 'Centro' },
  { from: 'Centro', to: 'Zona Norte' },
  { from: 'Quito', to: 'Cuenca' },
];

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    timeRange: { start: '06:00', end: '22:00' },
    passengers: null,
    status: ['in_progress'],
    tripType: 'all',
  });

  const [showPresets, setShowPresets] = useState(false);

  const updateFilter = (key: keyof FilterState, value: unknown) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const applyPreset = (preset: { from: string; to: string }) => {
    const newFilters = { ...filters, from: preset.from, to: preset.to };
    setFilters(newFilters);
    setShowPresets(false);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* From → To */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">Desde</label>
            <input
              type="text"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
              placeholder="Origen"
              className="w-32 bg-charcoal border border-border rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-1 focus:ring-going-red focus:border-going-red outline-none"
            />
          </div>
          <span className="text-white/40 mt-5">→</span>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">Hacia</label>
            <input
              type="text"
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
              placeholder="Destino"
              className="w-32 bg-charcoal border border-border rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:ring-1 focus:ring-going-red focus:border-going-red outline-none"
            />
          </div>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="mt-5 px-2 py-2 text-white/40 hover:text-going-yellow transition"
            title="Rutas frecuentes"
          >
            ⭐
          </button>
        </div>

        {/* Presets dropdown */}
        {showPresets && (
          <div className="absolute mt-1 bg-surface border border-border rounded-lg shadow-xl z-10 p-2">
            <p className="text-[10px] uppercase text-white/40 px-2 py-1">Rutas frecuentes</p>
            {PRESET_ROUTES.map((route, i) => (
              <button
                key={i}
                onClick={() => applyPreset(route)}
                className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-surface-hover rounded"
              >
                {route.from} → {route.to}
              </button>
            ))}
          </div>
        )}

        {/* Date & Time */}
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">Fecha</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => updateFilter('date', e.target.value)}
            className="bg-charcoal border border-border rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-going-red outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">Hora inicio</label>
            <input
              type="time"
              value={filters.timeRange.start}
              onChange={(e) => updateFilter('timeRange', { ...filters.timeRange, start: e.target.value })}
              className="bg-charcoal border border-border rounded px-2 py-2 text-sm text-white focus:ring-1 focus:ring-going-red outline-none"
            />
          </div>
          <span className="text-white/40 mt-5">-</span>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">Hora fin</label>
            <input
              type="time"
              value={filters.timeRange.end}
              onChange={(e) => updateFilter('timeRange', { ...filters.timeRange, end: e.target.value })}
              className="bg-charcoal border border-border rounded px-2 py-2 text-sm text-white focus:ring-1 focus:ring-going-red outline-none"
            />
          </div>
        </div>

        {/* Passengers */}
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">Personas</label>
          <select
            value={filters.passengers || ''}
            onChange={(e) => updateFilter('passengers', e.target.value ? Number(e.target.value) : null)}
            className="bg-charcoal border border-border rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-going-red outline-none"
          >
            <option value="">Todos</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">Estado</label>
          <select
            multiple
            value={filters.status}
            onChange={(e) => updateFilter('status', Array.from(e.target.selectedOptions, o => o.value))}
            className="bg-charcoal border border-border rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-going-red outline-none h-[38px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Trip Type Toggle */}
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-white/40 mb-1">Tipo</label>
          <div className="flex bg-charcoal border border-border rounded overflow-hidden">
            {['all', 'shared', 'private'].map((type) => (
              <button
                key={type}
                onClick={() => updateFilter('tripType', type)}
                className={`px-3 py-2 text-sm transition ${
                  filters.tripType === type
                    ? 'bg-going-red text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {type === 'all' ? 'Todos' : type === 'shared' ? 'Compartido' : 'Privado'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
