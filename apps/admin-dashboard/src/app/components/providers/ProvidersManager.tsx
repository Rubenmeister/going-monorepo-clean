'use client';

import { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  Compass,
  Briefcase
} from 'lucide-react';
import { Badge, Button } from '@going/shared-ui';

interface Provider {
  id: string;
  name: string;
  type: 'driver' | 'host' | 'tour_operator' | 'local_creator';
  status: 'verified' | 'pending' | 'flagged';
  rating: number;
  location: string;
  commission: number;
  lastActive: string;
}

const MOCK_PROVIDERS: Provider[] = [
  { id: 'PR-001', name: 'Alfonso Torres', type: 'driver', status: 'verified', rating: 4.9, location: 'Quito', commission: 20, lastActive: '2m ago' },
  { id: 'PR-002', name: 'Casa del Sol', type: 'host', status: 'verified', rating: 4.8, location: 'Baños', commission: 20, lastActive: '1h ago' },
  { id: 'PR-003', name: 'Explora Ecuador', type: 'tour_operator', status: 'verified', rating: 4.5, location: 'Mindo', commission: 20, lastActive: '5m ago' },
  { id: 'PR-004', name: 'Chef María', type: 'local_creator', status: 'pending', rating: 5.0, location: 'Quito', commission: 20, lastActive: '10m ago' },
];

export function ProvidersManager() {
  const [filter, setFilter] = useState<Provider['type'] | 'all'>('all');

  const filteredProviders = filter === 'all' 
    ? MOCK_PROVIDERS 
    : MOCK_PROVIDERS.filter(p => p.type === filter);

  const getStatusBadge = (status: Provider['status']) => {
    switch (status) {
      case 'verified': return <Badge variant="default" className="bg-success/20 text-success gap-1 border-success/30"><CheckCircle2 size={12}/> Verificado</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-going-yellow/20 text-going-yellow gap-1 border-going-yellow/30"><Clock size={12}/> Pendiente</Badge>;
      case 'flagged': return <Badge variant="destructive" className="gap-1"><AlertCircle size={12}/> Alerta</Badge>;
    }
  };

  const getTypeIcon = (type: Provider['type']) => {
    switch (type) {
      case 'driver': return <Briefcase size={16} className="text-primary"/>;
      case 'host': return <Building2 size={16} className="text-blue-400"/>;
      case 'tour_operator': return <Compass size={16} className="text-green-400"/>;
      case 'local_creator': return <Users size={16} className="text-purple-400"/>;
    }
  };

  return (
    <div className="bg-neutral-900 border border-border rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-bold text-white">Gestión de Proveedores B2B</h3>
          <p className="text-sm text-neutral-500">Administra flotas, anfitriones y creadores locales</p>
        </div>
        <div className="flex bg-neutral-800 p-1 rounded-lg gap-1 border border-border/50">
          {['all', 'driver', 'host', 'tour_operator', 'local_creator'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${filter === t ? 'bg-primary text-white' : 'text-neutral-500 hover:text-white'}`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProviders.map(provider => (
          <div key={provider.id} className="bg-neutral-950 border border-border p-4 rounded-xl hover:border-primary/50 transition-colors group relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
               {getTypeIcon(provider.type)}
            </div>

            <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-neutral-900 rounded-lg">
                  {getTypeIcon(provider.type)}
               </div>
               {getStatusBadge(provider.status)}
            </div>

            <div className="mb-4">
              <h4 className="text-white font-bold group-hover:text-primary transition-colors">{provider.name}</h4>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                <MapPin size={12}/> {provider.location}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-y border-border/50 mb-4">
               <div>
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">Rating</p>
                  <div className="flex items-center gap-1 text-sm text-going-yellow font-bold">
                    <Star size={14} fill="currentColor"/> {provider.rating}
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">Comisión</p>
                  <p className="text-sm text-white font-bold">{provider.commission}%</p>
               </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-neutral-600">
               <span>Activo: {provider.lastActive}</span>
               <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 hover:bg-primary/20 hover:text-primary">Gestionar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
