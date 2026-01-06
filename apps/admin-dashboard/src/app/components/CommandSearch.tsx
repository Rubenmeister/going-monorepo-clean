'use client';

import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input, useTransport } from '@going/shared-ui';

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { searchTrips, results, loading, error } = useTransport();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) searchTrips(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open, searchTrips]);

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-9 h-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus-visible:ring-primary focus-visible:border-primary" 
          placeholder="Buscar conductor, viaje, placa... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-1.5 font-mono text-[10px] font-medium text-neutral-400 opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
      
      {/* Dropdown Results */}
      {open && (
        <div className="absolute top-12 left-0 w-full bg-neutral-900 border border-neutral-700 rounded-md shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-medium text-neutral-500 uppercase flex justify-between">
              <span>Resultados</span>
              {loading && <span className="text-primary animate-pulse">Buscando...</span>}
            </div>
            
            {error && (
              <div className="px-2 py-2 text-red-400 text-xs bg-red-500/10 rounded mb-1 border border-red-500/20">
                {error} (Verifique conexión con Backend)
              </div>
            )}

            <div className="space-y-1 max-h-[300px] overflow-y-auto">
               {results.length === 0 && !loading && (
                 <div className="p-4 text-center text-sm text-neutral-500">Sin resultados</div>
               )}
               
               {results.map((trip) => (
                 <button key={trip.id} className="w-full flex items-center justify-between px-2 py-2 text-sm text-neutral-300 rounded hover:bg-primary/10 hover:text-primary transition-colors text-left group">
                   <div>
                     <span className="font-mono text-xs text-neutral-500 mr-2 group-hover:text-primary/70">{trip.id}</span>
                     <span>{trip.from} → {trip.to}</span>
                   </div>
                   <span className="text-xs text-neutral-600 group-hover:text-primary/70">{trip.driver || 'Sin Conductor'}</span>
                 </button>
               ))}
            </div>
          </div>
          <div className="border-t border-neutral-800 p-2 bg-neutral-950/50">
             <div className="flex items-center justify-between text-xs text-neutral-500 px-2">
               <span>{results.length} registros encontrados</span>
               <span>Un sistema de <strong>Going</strong></span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
