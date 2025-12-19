'use client';

import React from 'react';
import { Calendar, Users, MapPin, Filter } from 'lucide-react';

export function FilterBar() {
  return (
    <div className="bg-neutral-900 border-b border-white/5 p-4 flex flex-wrap items-center gap-4">
      
      {/* From -> To */}
      <div className="flex items-center bg-neutral-800 rounded-md border border-neutral-700 p-1 flex-1 min-w-[300px]">
        <div className="flex items-center px-2 flex-1 border-r border-neutral-700">
          <MapPin size={14} className="text-primary mr-2" />
          <input 
            type="text" 
            placeholder="Desde..." 
            className="bg-transparent border-none text-sm text-white placeholder:text-neutral-500 focus:outline-none w-full"
          />
        </div>
        <div className="px-2 text-neutral-500">→</div>
        <div className="flex items-center px-2 flex-1">
          <MapPin size={14} className="text-secondary mr-2" />
          <input 
             type="text" 
             placeholder="Hacia..." 
             className="bg-transparent border-none text-sm text-white placeholder:text-neutral-500 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="flex items-center bg-neutral-800 rounded-md border border-neutral-700 px-3 py-2 w-48">
        <Calendar size={14} className="text-neutral-400 mr-2" />
        <span className="text-sm text-white">Hoy, 06:00 - 18:00</span>
      </div>

      {/* Seats */}
      <div className="flex items-center bg-neutral-800 rounded-md border border-neutral-700 px-3 py-2 w-24">
        <Users size={14} className="text-neutral-400 mr-2" />
        <input 
          type="number" 
          placeholder="Pax" 
          className="bg-transparent border-none text-sm text-white placeholder:text-neutral-500 focus:outline-none w-full"
          min={1}
        />
      </div>

      {/* Status Select */}
      <div className="w-32">
        <select className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white focus:ring-primary focus:border-primary">
          <option value="all">Todos</option>
          <option value="requested">Solicitados</option>
          <option value="assigned">Asignados</option>
          <option value="in_progress">En curso</option>
          <option value="completed">Completados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Type Switch */}
      <div className="flex bg-neutral-800 rounded-md p-1 border border-neutral-700">
        <button className="px-3 py-1 text-xs font-medium rounded bg-primary text-white">Viajes</button>
        <button className="px-3 py-1 text-xs font-medium rounded text-neutral-400 hover:text-white">Envíos</button>
      </div>

      <button className="p-2 text-neutral-400 hover:text-primary transition-colors ml-auto">
        <Filter size={18} />
      </button>
    </div>
  );
}
