'use client';

import { Users, UserPlus, UserCheck, Map as MapIcon, MousePointer2 } from 'lucide-react';
import { Badge } from '@going/shared-ui';

interface Metric {
  label: string;
  value: string;
  trend: string;
  status: 'up' | 'down';
}

const ANALYTICS_METRICS: Metric[] = [
  { label: 'DAU (Uso Diario)', value: '1,420', trend: '+15.2%', status: 'up' },
  { label: 'MAU (Mensual)', value: '12,500', trend: '+8.4%', status: 'up' },
  { label: 'Costo Adquisición (CAC)', value: '$8.50', trend: '-2.1%', status: 'down' },
  { label: 'Tasa Conversión', value: '24.2%', trend: '+4.5%', status: 'up' },
];

export function UserAnalytics() {
  return (
    <div className="bg-neutral-900 border border-border rounded-xl p-6 shadow-2xl overflow-hidden relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-heading font-bold text-white">Análisis de Usuarios & Retención</h3>
          <p className="text-sm text-neutral-500">Comportamiento en tiempo real por rol y zona</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="text-neutral-400 border-neutral-700 bg-neutral-800/50">Driver App</Badge>
           <Badge variant="outline" className="text-neutral-400 border-neutral-700 bg-neutral-800/50">User App</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {ANALYTICS_METRICS.map((metric) => (
          <div key={metric.label} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800/50 group hover:border-primary transition-all">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 group-hover:text-neutral-400">{metric.label}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-white">{metric.value}</span>
              <span className={`text-[10px] font-bold ${metric.status === 'up' ? 'text-success' : 'text-going-yellow'}`}>
                {metric.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention / Roles Chart Area Placeholder */}
        <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800/50 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"/>
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <Users size={16} className="text-primary"/> Distribución por Rol
              </h4>
           </div>
           
           <div className="space-y-4">
              {[
                { label: 'Usuarios Finales', val: 75, color: 'bg-primary' },
                { label: 'Conductores', val: 12, color: 'bg-green-500' },
                { label: 'Anfitriones', val: 8, color: 'bg-blue-500' },
                { label: 'Creadores', val: 5, color: 'bg-purple-500' },
              ].map(role => (
                <div key={role.label} className="space-y-1.5">
                   <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-neutral-400">{role.label}</span>
                      <span className="text-white">{role.val}%</span>
                   </div>
                   <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div className={`h-full ${role.color} transition-all duration-1000`} style={{ width: `${role.val}%` }}/>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Behavioral Heat Map Placeholder */}
        <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800/50 relative overflow-hidden group flex flex-col items-center justify-center min-h-[250px]">
           <MapIcon size={64} className="text-neutral-800/50 group-hover:text-primary transition-all duration-700 group-hover:scale-110 mb-4"/>
           <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-2">Heatmap de Rutas</h4>
           <p className="text-[10px] text-neutral-600 font-mono text-center max-w-[200px]">Visualización de alta demanda en Quito, Guayaquil y Cuenca</p>
           
           <div className="absolute top-4 right-4 animate-pulse">
              <Badge variant="destructive" className="h-2 w-2 rounded-full p-0 border-0 shadow-[0_0_8px_var(--status-error)]"/>
           </div>

           <button className="mt-8 px-6 py-2 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/10 transition-colors">
              Explorar Mapa Detallado
           </button>
        </div>
      </div>
    </div>
  );
}
