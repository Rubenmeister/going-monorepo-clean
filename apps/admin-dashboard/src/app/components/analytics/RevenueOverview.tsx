'use client';

import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon } from 'lucide-react';
import { Badge } from '@going/shared-ui';

interface RevenueSource {
  name: string;
  amount: number;
  growth: number;
  commission: number;
  bookings: number;
}

const REVENUE_DATA: RevenueSource[] = [
  { name: 'Transporte (SUV/VAN)', amount: 12450.50, growth: 12.5, commission: 20, bookings: 450 },
  { name: 'Alojamiento (Hosts)', amount: 8200.00, growth: 5.2, commission: 20, bookings: 85 },
  { name: 'Tours & Actividades', amount: 5600.00, growth: -2.1, commission: 20, bookings: 120 },
  { name: 'Experiencias Locales', amount: 2100.00, growth: 18.4, commission: 20, bookings: 45 },
];

export function RevenueOverview() {
  const totalRevenue = REVENUE_DATA.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCommission = REVENUE_DATA.reduce((acc, curr) => acc + (curr.amount * curr.commission / 100), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Revenue Chart Area */}
      <div className="lg:col-span-2 bg-neutral-900 border border-border p-6 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-heading font-bold text-white">Resumen de Ingresos Reales</h3>
            <p className="text-sm text-neutral-500">Distribución de ingresos por vertical de negocio</p>
          </div>
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">Octubre 2024</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REVENUE_DATA.map((source) => (
            <div key={source.name} className="bg-neutral-950/50 border border-border/50 p-4 rounded-xl hover:bg-neutral-800 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{source.name}</span>
                <span className={`flex items-center gap-1 text-[10px] font-bold ${source.growth >= 0 ? 'text-success' : 'text-error'}`}>
                  {source.growth >= 0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                  {Math.abs(source.growth)}%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">${source.amount.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-600 font-mono">({source.bookings} res.)</span>
              </div>
              <div className="mt-3 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${(source.amount / totalRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute -right-12 -top-12 text-primary opacity-5 rotate-12">
           <TrendingUp size={160}/>
        </div>
        
        <div className="relative z-10">
          <Badge variant="default" className="bg-primary text-white mb-4">Going Financials</Badge>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-neutral-400 mb-1">Volumen Total Transaccionado (GMV)</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">${totalRevenue.toLocaleString()}</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm py-2 border-t border-primary/10">
                <span className="text-neutral-400">Net Revenue (20%)</span>
                <span className="text-success font-bold">${totalCommission.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-t border-primary/10">
                <span className="text-neutral-400">Gastos Op/Acq</span>
                <span className="text-neutral-300 font-bold">$3,120.00</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-t border-primary/10">
                <span className="text-neutral-400">Margen Bruto</span>
                <span className="text-primary font-bold">~62%</span>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full mt-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-lg transition-all active:scale-95 group flex items-center justify-center gap-2">
           <DollarSign size={18}/>
           Descargar Reporte Financiero
           <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
        </button>
      </div>
    </div>
  );
}
