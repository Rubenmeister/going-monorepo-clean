'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

interface Invoice {
  id: string;
  companyName?: string;
  amount: number;
  currency?: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate?: string;
  paidAt?: string;
  createdAt?: string;
  serviceType?: string;
  description?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency?: string;
  status: string;
  method?: string;
  serviceType?: string;
  createdAt?: string;
}

const METHOD_LABELS: Record<string, string> = {
  card:         '💳 Tarjeta',
  bank_transfer:'🏦 Transferencia',
  cash:         '💵 Efectivo',
  wallet:       '📱 Wallet',
  corporate:    '🏢 Corporativo',
};

const STATUS_STYLE: Record<string, string> = {
  paid:      'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  overdue:   'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};
const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagada', pending: 'Pendiente', overdue: 'Vencida', cancelled: 'Cancelada',
};

const SERVICE_COLORS: Record<string, string> = {
  transporte:   '#0033A0',
  envios:       '#f59e0b',
  tours:        '#16a34a',
  experiencias: '#8b5cf6',
  alojamientos: '#ec4899',
  otros:        '#6b7280',
};

function fmt(v: number, currency = 'PEN') {
  return `${currency} ${v.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function pct(v: number, total: number) {
  return total > 0 ? ((v / total) * 100).toFixed(1) + '%' : '0%';
}

function downloadCSV(invoices: Invoice[]) {
  const header = ['ID','Empresa','Monto','Moneda','Estado','Vence','Pagado','Servicio'];
  const lines = invoices.map(inv => [
    inv.id, inv.companyName??'', inv.amount, inv.currency??'PEN',
    inv.status, inv.dueDate?.slice(0,10)??'', inv.paidAt?.slice(0,10)??'', inv.serviceType??'',
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
  const blob = new Blob(['\uFEFF'+[header.join(','),...lines].join('\n')],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='ingresos.csv'; a.click();
  URL.revokeObjectURL(url);
}

type Period = '7d' | '30d' | '90d' | 'all';

export default function IngresosPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [invoices,  setInvoices]  = useState<Invoice[]>([]);
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [period,    setPeriod]    = useState<Period>('30d');
  const [filterSvc, setFilterSvc] = useState('');
  const [search,    setSearch]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, payRes, statsRes] = await Promise.all([
      safeGet<any>(token, '/invoices?limit=200'),
      safeGet<any>(token, '/payments?status=paid&limit=200'),
      safeGet<any>(token, '/invoices/stats/summary'),
    ]);

    const invList: Invoice[] = Array.isArray(invRes) ? invRes
      : invRes?.data ?? invRes?.invoices ?? invRes?.items ?? [];
    const payList: Payment[] = Array.isArray(payRes) ? payRes
      : payRes?.data ?? payRes?.items ?? [];

    setInvoices(invList);
    setPayments(payList);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  /* Period filter */
  const cutoff = period === '7d'  ? Date.now() - 7*86400000
               : period === '30d' ? Date.now() - 30*86400000
               : period === '90d' ? Date.now() - 90*86400000
               : 0;

  const inPeriod = (dateStr?: string) => cutoff === 0 || new Date(dateStr??0).getTime() >= cutoff;

  const filteredInv = invoices.filter(inv =>
    inPeriod(inv.createdAt) &&
    (!filterSvc || inv.serviceType === filterSvc) &&
    (!search || (inv.companyName??'').toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredPay = payments.filter(p => inPeriod(p.createdAt) && (!filterSvc || p.serviceType === filterSvc));

  /* ── KPIs ── */
  const totalRevenue   = filteredInv.filter(i=>i.status==='paid').reduce((s,i)=>s+i.amount,0);
  const pendingRevenue = filteredInv.filter(i=>i.status==='pending').reduce((s,i)=>s+i.amount,0);
  const overdueRev     = filteredInv.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.amount,0);
  const goingFee       = totalRevenue * 0.20;
  const netProviders   = totalRevenue * 0.80;
  const payRevenue     = filteredPay.reduce((s,p)=>s+p.amount,0);

  /* ── Breakdown by service ── */
  const byService = Object.entries(
    filteredPay.reduce<Record<string,number>>((acc,p) => {
      const k = p.serviceType ?? 'otros'; acc[k]=(acc[k]??0)+p.amount; return acc;
    }, {})
  ).sort((a,b)=>b[1]-a[1]);

  const totalSvc = byService.reduce((s,[,v])=>s+v,0);

  /* ── Breakdown by method ── */
  const byMethod = Object.entries(
    filteredPay.reduce<Record<string,number>>((acc,p) => {
      const k = p.method ?? 'otros'; acc[k]=(acc[k]??0)+p.amount; return acc;
    }, {})
  ).sort((a,b)=>b[1]-a[1]);

  const totalMeth = byMethod.reduce((s,[,v])=>s+v,0);

  /* ── Monthly trend (from invoices) ── */
  const monthMap: Record<string,{paid:number;pending:number}> = {};
  filteredInv.forEach(inv => {
    const k = (inv.createdAt??'').slice(0,7); if (!k) return;
    if (!monthMap[k]) monthMap[k] = {paid:0,pending:0};
    if (inv.status==='paid') monthMap[k].paid += inv.amount;
    else monthMap[k].pending += inv.amount;
  });
  const monthTrend = Object.entries(monthMap).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);
  const maxMonth = Math.max(...monthTrend.map(([,v])=>v.paid+v.pending), 1);

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando ingresos..." />;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ingresos</h1>
          <p className="text-sm text-gray-500 mt-1">Desglose financiero completo de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadCSV(filteredInv)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ⬇ Exportar CSV
          </button>
          <button onClick={load}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ↺ Actualizar
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {([['7d','7 días'],['30d','30 días'],['90d','90 días'],['all','Todo']] as [Period,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period===k?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {label:'Total cobrado',   value:fmt(totalRevenue),   color:'text-green-600',  sub:`${filteredInv.filter(i=>i.status==='paid').length} facturas`},
          {label:'Comisión Going App',  value:fmt(goingFee),       color:'text-red-600',    sub:'20% del cobrado'},
          {label:'Neto proveedores',value:fmt(netProviders),   color:'text-blue-700',   sub:'85% del cobrado'},
          {label:'Por cobrar',      value:fmt(pendingRevenue), color:'text-amber-600',  sub:`${overdueRev>0?`+ ${fmt(overdueRev)} vencido`:'sin vencidos'}`},
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Alert for overdue */}
      {overdueRev > 0 && (
        <div className="mb-6 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <span className="text-red-500 text-xl">⚠</span>
          <div>
            <p className="text-sm font-semibold text-red-800">Facturas vencidas por {fmt(overdueRev)}</p>
            <p className="text-xs text-red-600">{filteredInv.filter(i=>i.status==='overdue').length} facturas requieren seguimiento inmediato.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Revenue by service */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">🏷️ Por servicio</h3>
          {byService.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos de pagos</p>
          ) : (
            <div className="space-y-3">
              {byService.map(([svc, amount]) => (
                <div key={svc}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium capitalize">{svc}</span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{fmt(amount)}</span>
                      <span className="text-xs text-gray-400 ml-2">({pct(amount,totalSvc)})</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full"
                      style={{width:pct(amount,totalSvc), backgroundColor:SERVICE_COLORS[svc]??'#6b7280'}} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">💳 Por método de pago</h3>
          {byMethod.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos de pagos</p>
          ) : (
            <div className="space-y-3">
              {byMethod.map(([method, amount]) => (
                <div key={method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{METHOD_LABELS[method] ?? method}</span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{fmt(amount)}</span>
                      <span className="text-xs text-gray-400 ml-2">({pct(amount,totalMeth)})</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-indigo-500"
                      style={{width:pct(amount,totalMeth)}} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">📅 Tendencia mensual</h3>
          {monthTrend.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos por período</p>
          ) : (
            <div className="flex items-end gap-1.5 h-32">
              {monthTrend.map(([month,v]) => {
                const total_ = v.paid+v.pending;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-gray-500">{total_>0?Math.round(total_/1000)+'k':''}</span>
                    <div className="w-full flex flex-col justify-end" style={{height:'96px'}}>
                      <div className="w-full rounded-t-sm bg-yellow-300"
                        style={{height:`${Math.max((v.pending/maxMonth)*96,0)}px`}} />
                      <div className="w-full rounded-t-sm bg-green-500"
                        style={{height:`${Math.max((v.paid/maxMonth)*96,2)}px`}} />
                    </div>
                    <span className="text-[9px] text-gray-400">{month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/> Cobrado</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-300 inline-block"/> Pendiente</span>
          </div>
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <h3 className="text-base font-bold text-gray-900 flex-1">📋 Facturas</h3>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa o ID…"
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-red-400" />
          <select value={filterSvc} onChange={e => setFilterSvc(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm">
            <option value="">Todos los servicios</option>
            {['transporte','envios','tours','experiencias','alojamientos'].map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>

        {filteredInv.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Sin facturas en este período</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['ID','Empresa','Servicio','Monto','Estado','Vence','Pagado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInv.slice(0, 100).map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">#{inv.id.slice(-8)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.companyName ?? '—'}</td>
                  <td className="px-4 py-3">
                    {inv.serviceType && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={{backgroundColor:SERVICE_COLORS[inv.serviceType]+'20', color:SERVICE_COLORS[inv.serviceType]??'#6b7280'}}>
                        {inv.serviceType}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{fmt(inv.amount, inv.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[inv.status]??'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABEL[inv.status]??inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {inv.dueDate
                      ? <span className={new Date(inv.dueDate)<new Date()&&inv.status!=='paid'?'text-red-600 font-semibold':''}>{inv.dueDate.slice(0,10)}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inv.paidAt?.slice(0,10) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400">{filteredInv.length} facturas · mostrando primeras 100</p>
          <p className="text-xs text-gray-500 font-semibold">
            Total cobrado: <span className="text-green-600">{fmt(totalRevenue)}</span>
          </p>
        </div>
      </div>

    </AdminLayout>
  );
}
