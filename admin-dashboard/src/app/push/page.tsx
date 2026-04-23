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
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface SentNotification {
  id: string; title: string; body: string;
  segment: string; sentAt: string;
  recipientCount?: number; openRate?: number;
}

const SEGMENTS = [
  { key:'all_users',       label:'Todos los usuarios',          icon:'👥', desc:'Toda la base de usuarios activos' },
  { key:'all_drivers',     label:'Todos los conductores',       icon:'🚗', desc:'Conductores activos en plataforma' },
  { key:'new_users',       label:'Usuarios nuevos (30 días)',   icon:'🆕', desc:'Registrados en el último mes' },
  { key:'corporate',       label:'Usuarios corporativos',       icon:'🏢', desc:'Empleados de empresas activas' },
  { key:'inactive_users',  label:'Usuarios inactivos',          icon:'💤', desc:'Sin actividad en los últimos 60 días' },
  { key:'pending_drivers', label:'Conductores pendientes',      icon:'⏳', desc:'Conductores sin aprobar documentos' },
];

const TEMPLATES = [
  { label:'Oferta especial',   title:'¡Oferta exclusiva para ti! 🎉', body:'Usa el código PROMO20 y obtén 20% de descuento en tu próximo viaje. ¡Solo por hoy!' },
  { label:'Actualiza docs',    title:'Actualiza tus documentos 📄',   body:'Tienes documentos por vencer. Actualiza tu SOAT y matrícula para seguir operando.' },
  { label:'Nueva función',     title:'¡Novedad en la app! 🚀',        body:'Hemos lanzado una nueva función. Descubre cómo mejorar tu experiencia Going.' },
  { label:'Recordatorio',      title:'Te echamos de menos 👋',        body:'Hace tiempo que no usas Going. Vuelve y disfruta de nuestros servicios.' },
];

export default function PushPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [segment, setSegment] = useState('all_users');
  const [title,   setTitle]   = useState('');
  const [body,    setBody]     = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [loadingH,setLoadingH]= useState(true);
  const [toast,   setToast]   = useState<{msg:string;ok:boolean}|null>(null);

  const notify = (msg: string, ok = true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 4000); };

  const loadHistory = useCallback(async () => {
    setLoadingH(true);
    try {
      const res = await req<any>(token, '/notifications/history?limit=20');
      setHistory(Array.isArray(res) ? res : res?.data ?? res?.items ?? []);
    } catch { setHistory([]); }
    finally { setLoadingH(false); }
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function send() {
    if (!title.trim() || !body.trim()) { notify('El título y el mensaje son obligatorios', false); return; }
    setSending(true);
    try {
      const res = await req<any>(token, '/notifications/broadcast', {
        method: 'POST', body: JSON.stringify({ segment, title, body }),
      });
      notify(`✓ Enviado a ${res?.recipientCount ?? 'los'} destinatarios`);
      setHistory(prev => [{ id: res?.id ?? Date.now().toString(), title, body, segment, sentAt: new Date().toISOString(), recipientCount: res?.recipientCount }, ...prev]);
      setTitle(''); setBody('');
    } catch { notify('Error al enviar la notificación', false); }
    finally { setSending(false); }
  }

  const selectedSeg = SEGMENTS.find(s => s.key === segment);
  const charLeft = 160 - body.length;

  if (auth.isLoading) return <Loading fullHeight size="lg" message="Cargando…" />;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow text-sm font-medium text-white ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones Push</h1>
        <p className="text-sm text-gray-500 mt-1">Envía mensajes directos a segmentos de usuarios y conductores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Composer — 3 cols */}
        <div className="lg:col-span-3 space-y-5">

          {/* Segment selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">👥 Destinatarios</h3>
            <div className="grid grid-cols-2 gap-2">
              {SEGMENTS.map(s => (
                <button key={s.key} onClick={() => setSegment(s.key)}
                  className={`text-left p-3 rounded-xl border transition-all ${segment === s.key ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="text-sm font-semibold text-gray-800">{s.icon} {s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Message composer */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">✏️ Mensaje</h3>
              <div className="flex gap-2 flex-wrap">
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => { setTitle(t.title); setBody(t.body); }}
                    className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Título *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
                  placeholder="Título de la notificación…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                <p className="text-xs text-gray-400 mt-1 text-right">{80-title.length} caracteres restantes</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Mensaje *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={160} rows={4}
                  placeholder="Escribe el mensaje aquí…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                <p className={`text-xs mt-1 text-right ${charLeft < 20 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {charLeft} caracteres restantes
                </p>
              </div>
            </div>
          </div>

          {/* Preview + Send */}
          {(title || body) && (
            <div className="bg-gray-900 rounded-2xl p-5 text-white">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Vista previa</p>
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{backgroundColor:'#ff4c41'}}>G</div>
                <div>
                  <p className="text-sm font-bold">{title || '(sin título)'}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{body || '(sin mensaje)'}</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={send} disabled={sending || !title.trim() || !body.trim()}
            className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm disabled:opacity-40 transition-opacity"
            style={{ backgroundColor:'#ff4c41' }}>
            {sending ? 'Enviando…' : `📤 Enviar a "${selectedSeg?.label}"`}
          </button>
        </div>

        {/* History — 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">📋 Historial</h3>
              <button onClick={loadHistory} className="text-xs text-gray-400 hover:text-gray-600">↺</button>
            </div>
            {loadingH ? (
              <div className="p-8 text-center text-gray-400 text-sm">Cargando…</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Sin envíos registrados</div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {history.map(n => {
                  const seg = SEGMENTS.find(s => s.key === n.segment);
                  return (
                    <div key={n.id} className="p-4">
                      <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{seg?.icon} {seg?.label ?? n.segment}</span>
                        {n.recipientCount && <span className="text-xs text-gray-400">{n.recipientCount} dest.</span>}
                        {n.openRate && <span className="text-xs text-green-600 font-semibold">{n.openRate}% apertura</span>}
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{new Date(n.sentAt).toLocaleString('es-EC')}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
