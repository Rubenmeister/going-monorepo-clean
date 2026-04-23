'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

async function req<T>(token: string, path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}`, ...(opts?.headers??{}) },
  });
  if (\!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface TicketMessage { id:string; body:string; authorName:string; isAdmin:boolean; createdAt:string; }
interface Ticket {
  id:string; subject:string; status:'open'|'in_progress'|'resolved'|'closed';
  priority:'low'|'medium'|'high'|'urgent';
  category?:string; userName:string; userEmail:string;
  createdAt:string; updatedAt?:string; messages?:TicketMessage[];
  assignedTo?:string;
}

const STATUS_CFG: Record<string,{label:string;color:string;bg:string}> = {
  open:        {label:'Abierto',      color:'text-blue-700',  bg:'bg-blue-100'},
  in_progress: {label:'En proceso',   color:'text-amber-700', bg:'bg-amber-100'},
  resolved:    {label:'Resuelto',     color:'text-green-700', bg:'bg-green-100'},
  closed:      {label:'Cerrado',      color:'text-gray-500',  bg:'bg-gray-100'},
};
const PRIORITY_CFG: Record<string,{label:string;color:string}> = {
  low:    {label:'Baja',    color:'text-gray-400'},
  medium: {label:'Media',   color:'text-blue-500'},
  high:   {label:'Alta',    color:'text-amber-500'},
  urgent: {label:'Urgente', color:'text-red-600'},
};

const STATUS_FLOW: Record<string, string[]> = {
  open:        ['in_progress','closed'],
  in_progress: ['resolved','open'],
  resolved:    ['closed','open'],
  closed:      ['open'],
};

function TicketPanel({ ticket, token, onClose, onUpdate }: {
  ticket: Ticket; token: string; onClose: () => void;
  onUpdate: (t: Ticket) => void;
}) {
  const [messages, setMessages] = useState<TicketMessage[]>(ticket.messages ?? []);
  const [reply,    setReply]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    req<any>(token, `/support/tickets/${ticket.id}`).then(t => {
      if (t?.messages) setMessages(t.messages);
    }).catch(() => {});
  }, [ticket.id, token]);

  async function sendReply() {
    if (\!reply.trim()) return;
    setLoading(true);
    try {
      const msg = await req<TicketMessage>(token, `/support/tickets/${ticket.id}/reply`, {
        method:'POST', body: JSON.stringify({ body: reply, isAdmin: true }),
      });
      setMessages(p => [...p, msg]);
      setReply('');
      notify('Respuesta enviada');
    } catch { notify('Error al enviar'); }
    finally { setLoading(false); }
  }

  async function changeStatus(newStatus: string) {
    try {
      const updated = await req<Ticket>(token, `/support/tickets/${ticket.id}`, {
        method:'PATCH', body: JSON.stringify({ status: newStatus }),
      });
      onUpdate({ ...ticket, status: updated.status ?? newStatus as any });
      notify(`Estado → ${STATUS_CFG[newStatus]?.label ?? newStatus}`);
    } catch { notify('Error al cambiar estado'); }
  }

  const svc = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
  const pri = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.medium;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[520px] bg-white h-full flex flex-col shadow-2xl">
        {toast && <div className="fixed top-4 right-4 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl z-50">{toast}</div>}

        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">#{ticket.id.slice(-8)}</p>
            <h2 className="text-base font-bold text-gray-900 truncate">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${svc.bg} ${svc.color}`}>{svc.label}</span>
              <span className={`text-xs font-semibold ${pri.color}`}>▲ {pri.label}</span>
              {ticket.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ticket.category}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl ml-4">×</button>
        </div>

        <div className="px-6 py-3 border-b bg-gray-50">
          <p className="text-sm font-semibold text-gray-800">{ticket.userName}</p>
          <p className="text-xs text-gray-400">{ticket.userEmail}</p>
          <p className="text-xs text-gray-400 mt-0.5">Abierto {new Date(ticket.createdAt).toLocaleString('es-EC')}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && <p className="text-sm text-gray-400 text-center mt-8">Sin mensajes aún</p>}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.isAdmin ? 'text-white' : 'bg-gray-100 text-gray-800'}`}
                style={m.isAdmin ? {backgroundColor:'#ff4c41'} : {}}>
                <p className="text-xs font-semibold mb-1 opacity-70">{m.authorName}</p>
                <p className="text-sm">{m.body}</p>
                <p className="text-xs opacity-50 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString('es-EC', {hour:'2-digit',minute:'2-digit'})}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply box */}
        {ticket.status \!== 'closed' && (
          <div className="p-4 border-t">
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3}
              placeholder="Escribe una respuesta…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-2" />
            <button onClick={sendReply} disabled={loading || \!reply.trim()}
              className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40"
              style={{backgroundColor:'#ff4c41'}}>
              {loading ? 'Enviando…' : '📤 Enviar respuesta'}
            </button>
          </div>
        )}

        {/* Status actions */}
        <div className="p-4 border-t bg-gray-50 flex gap-2 flex-wrap">
          {(STATUS_FLOW[ticket.status] ?? []).map(s => (
            <button key={s} onClick={() => changeStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                s === 'resolved' ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' :
                s === 'closed'   ? 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200' :
                'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
              }`}>
              → {STATUS_CFG[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window \!== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected,setSelected]  = useState<Ticket|null>(null);
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterPri,    setFilterPri]    = useState('');
  const [search,       setSearch]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await req<any>(token, '/support/tickets?limit=200');
      setTickets(Array.isArray(res) ? res : res?.data ?? res?.tickets ?? res?.items ?? []);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (\!q || t.subject.toLowerCase().includes(q) || t.userName.toLowerCase().includes(q) || t.userEmail.toLowerCase().includes(q)) &&
           (\!filterStatus || t.status === filterStatus) &&
           (\!filterPri    || t.priority === filterPri);
  });

  const counts = { open:0, in_progress:0, resolved:0, closed:0 } as Record<string,number>;
  tickets.forEach(t => { counts[t.status] = (counts[t.status]??0)+1; });

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando tickets…" />;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      {selected && (
        <TicketPanel ticket={selected} token={token} onClose={() => setSelected(null)}
          onUpdate={t => { setTickets(p => p.map(tk => tk.id===t.id?t:tk)); setSelected(t); }} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Soporte</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de tickets de atención al usuario</p>
        </div>
        <button onClick={load} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
          ↺ Actualizar
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {[['','Todos'],['open','Abiertos'],['in_progress','En proceso'],['resolved','Resueltos'],['closed','Cerrados']].map(([k,l]) => (
          <button key={k} onClick={() => setFilterStatus(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus===k?'bg-white shadow text-gray-900':'text-gray-500 hover:text-gray-700'}`}>
            {l}
            {k && <span className="ml-1.5 text-xs text-gray-400">({counts[k]??0})</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por asunto, nombre o email…"
          className="flex-1 min-w-[220px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        <select value={filterPri} onChange={e => setFilterPri(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="">Toda prioridad</option>
          {Object.entries(PRIORITY_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">🎫</p>
            <p className="font-semibold">Sin tickets</p>
            <p className="text-sm mt-1">No hay tickets que coincidan con los filtros</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#','Asunto','Usuario','Prioridad','Estado','Fecha',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(t => {
                const s = STATUS_CFG[t.status] ?? STATUS_CFG.open;
                const p = PRIORITY_CFG[t.priority] ?? PRIORITY_CFG.medium;
                const isUrgent = t.priority === 'urgent' || t.priority === 'high';
                return (
                  <tr key={t.id} className={`hover:bg-gray-50 cursor-pointer ${isUrgent && t.status==='open'?'bg-red-50/40':''}`}
                    onClick={() => setSelected(t)}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{t.id.slice(-6)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 truncate max-w-[200px]">{t.subject}</p>
                      {t.category && <p className="text-xs text-gray-400">{t.category}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 font-medium">{t.userName}</p>
                      <p className="text-xs text-gray-400">{t.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${p.color}`}>▲ {p.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.bg} ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('es-EC')}</td>
                    <td className="px-4 py-3 text-gray-400">›</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">{filtered.length} tickets</div>
      </div>
    </AdminLayout>
  );
}
