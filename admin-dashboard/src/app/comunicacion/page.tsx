'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';

/**
 * Panel de Comunicación — revisión editorial (Killa) + redes sociales (Sumak).
 *
 * Dos pestañas, mismo gesto: los agentes dejan propuestas en 'review'; el
 * equipo aprueba o descarta. Editorial publicado → /blog,/revista,/noticias.
 * Social aprobado → Sumak lo publica a la plataforma en su próxima corrida.
 * Consume el BFF same-origin /api/content/* que reenvía el JWT admin.
 */

type Tab = 'editorial' | 'social';

interface Editorial {
  id: string; channel: string; title: string; summary: string; body: string;
  outline: string[]; category: string; sources: (string | { title?: string; url?: string })[];
  cta: string; author: string; createdAt: string | null;
}

interface Social {
  id: string; platform: string; contentType: string; topic: string; caption: string;
  hashtags: string[]; needsMedia: boolean; imagePrompt: string | null;
  contextData: Record<string, string | number> | null; createdAt: string | null;
}

const CHANNEL_META: Record<string, { label: string; color: string; emoji: string }> = {
  blog:     { label: 'Blog',     color: '#2563eb', emoji: '✍️' },
  revista:  { label: 'Revista',  color: '#7c3aed', emoji: '📖' },
  noticias: { label: 'Noticias', color: '#dc2626', emoji: '📰' },
};

const PLATFORM_META: Record<string, { label: string; color: string; emoji: string }> = {
  telegram_channel: { label: 'Telegram', color: '#229ED9', emoji: '✈️' },
  facebook:         { label: 'Facebook', color: '#1877F2', emoji: '👍' },
  instagram:        { label: 'Instagram', color: '#E1306C', emoji: '📸' },
  x:                { label: 'X',        color: '#111111', emoji: '𝕏' },
  tiktok:           { label: 'TikTok',   color: '#000000', emoji: '🎵' },
  threads:          { label: 'Threads',  color: '#000000', emoji: '@' },
  linkedin:         { label: 'LinkedIn', color: '#0A66C2', emoji: '💼' },
  youtube:          { label: 'YouTube',  color: '#FF0000', emoji: '▶️' },
};

function Badge({ meta }: { meta: { label: string; color: string; emoji: string } }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: meta.color }}>
      {meta.emoji} {meta.label}
    </span>
  );
}

function sourceLabel(s: string | { title?: string; url?: string }): { text: string; url?: string } {
  if (typeof s === 'string') return { text: s, url: /^https?:\/\//.test(s) ? s : undefined };
  return { text: s.title || s.url || 'fuente', url: s.url };
}

export default function ComunicacionPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [tab, setTab] = useState<Tab>('editorial');
  const [editorial, setEditorial] = useState<Editorial[]>([]);
  const [social, setSocial] = useState<Social[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ed, so] = await Promise.all([
        fetch('/api/content/pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/content/social/pending', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (ed.status === 401 || so.status === 401) {
        setError('Sesión no autorizada. Vuelve a iniciar sesión como administrador.');
        setEditorial([]); setSocial([]);
        return;
      }
      const edData = ed.ok ? await ed.json() : { items: [] };
      const soData = so.ok ? await so.json() : { items: [] };
      setEditorial((edData?.items ?? []) as Editorial[]);
      setSocial((soData?.items ?? []) as Social[]);
    } catch (e) {
      setError(`No se pudieron cargar las propuestas: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
    else setLoading(false);
  }, [token, load]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const decideEditorial = async (id: string, action: 'publish' | 'reject') => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      const res = await fetch(`/api/content/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditorial((l) => l.filter((it) => it.id !== id));
      flash(action === 'publish' ? '✅ Publicado — ya aparece en la webapp.' : '🗑️ Propuesta descartada.');
    } catch (e) {
      flash(`⚠️ No se pudo ${action === 'publish' ? 'publicar' : 'descartar'}: ${(e as Error).message}`);
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const decideSocial = async (id: string, action: 'approve' | 'reject') => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      const res = await fetch(`/api/content/social/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSocial((l) => l.filter((it) => it.id !== id));
      flash(action === 'approve'
        ? '✅ Aprobado — Sumak lo publicará en su próxima corrida.'
        : '🗑️ Propuesta descartada.');
    } catch (e) {
      flash(`⚠️ No se pudo ${action === 'approve' ? 'aprobar' : 'descartar'}: ${(e as Error).message}`);
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const TabBtn = ({ id, label, count }: { id: Tab; label: string; count: number }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        tab === id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label} {count > 0 && <span className="ml-1 opacity-80">({count})</span>}
    </button>
  );

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Comunicación — Revisión</h1>
          <button onClick={load} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            ↻ Actualizar
          </button>
        </div>
        <p className="text-gray-500 mb-4">
          Propuestas de los agentes pendientes de aprobación.
        </p>

        <div className="flex gap-2 mb-6">
          <TabBtn id="editorial" label="Editorial" count={editorial.length} />
          <TabBtn id="social" label="Redes sociales" count={social.length} />
        </div>

        {toast && <div className="mb-4 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm">{toast}</div>}

        {loading ? (
          <Loading />
        ) : error ? (
          <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        ) : tab === 'editorial' ? (
          editorial.length === 0 ? (
            <Empty text="No hay propuestas editoriales pendientes." sub="Cuando Killa genere contenido, aparecerá aquí." />
          ) : (
            <div className="space-y-4">
              {editorial.map((it) => {
                const isOpen = !!expanded[it.id];
                const cm = CHANNEL_META[it.channel] ?? { label: it.channel, color: '#6b7280', emoji: '📄' };
                return (
                  <article key={it.id} className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge meta={cm} />
                      {it.category && <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{it.category}</span>}
                      {it.createdAt && <span className="text-xs text-gray-400 ml-auto">{new Date(it.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1.5">{it.title}</h2>
                    {it.summary && <p className="text-gray-600 mb-3">{it.summary}</p>}
                    {it.outline?.length > 0 && (
                      <ul className="mb-3 space-y-1">
                        {it.outline.map((o, i) => <li key={i} className="text-sm text-gray-500 flex gap-2"><span className="text-gray-300">›</span>{o}</li>)}
                      </ul>
                    )}
                    {isOpen && it.body && (
                      <div className="mt-3 mb-3 p-4 rounded-xl bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{it.body}</div>
                    )}
                    {it.sources?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Fuentes</p>
                        <ul className="space-y-0.5">
                          {it.sources.map((s, i) => {
                            const { text, url } = sourceLabel(s);
                            return <li key={i} className="text-xs text-gray-500 truncate">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{text}</a> : text}</li>;
                          })}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      {it.body && <button onClick={() => setExpanded((e) => ({ ...e, [it.id]: !isOpen }))} className="text-sm px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50">{isOpen ? 'Ocultar cuerpo' : 'Ver cuerpo completo'}</button>}
                      <div className="ml-auto flex gap-2">
                        <button disabled={busy[it.id]} onClick={() => decideEditorial(it.id, 'reject')} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Descartar</button>
                        <button disabled={busy[it.id]} onClick={() => decideEditorial(it.id, 'publish')} className="text-sm px-4 py-1.5 rounded-lg font-semibold text-white disabled:opacity-40" style={{ backgroundColor: '#FF4C41' }}>{busy[it.id] ? '...' : 'Aprobar y publicar'}</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : social.length === 0 ? (
          <Empty text="No hay propuestas de redes pendientes." sub="Cuando Sumak genere posts, aparecerán aquí." />
        ) : (
          <div className="space-y-4">
            {social.map((it) => {
              const pm = PLATFORM_META[it.platform] ?? { label: it.platform, color: '#6b7280', emoji: '📱' };
              return (
                <article key={it.id} className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge meta={pm} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{it.topic?.replace(/_/g, ' ')}</span>
                    {it.needsMedia && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">requiere imagen/video</span>}
                    {it.createdAt && <span className="text-xs text-gray-400 ml-auto">{new Date(it.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                  <p className="text-gray-800 mb-3 whitespace-pre-wrap leading-relaxed">{it.caption}</p>
                  {it.hashtags?.length > 0 && (
                    <p className="text-sm text-blue-600 mb-3">{it.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}</p>
                  )}
                  {it.contextData && (
                    <p className="text-xs text-gray-400 mb-3">
                      {Object.entries(it.contextData).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <div className="ml-auto flex gap-2">
                      <button disabled={busy[it.id]} onClick={() => decideSocial(it.id, 'reject')} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Descartar</button>
                      <button disabled={busy[it.id]} onClick={() => decideSocial(it.id, 'approve')} className="text-sm px-4 py-1.5 rounded-lg font-semibold text-white disabled:opacity-40" style={{ backgroundColor: '#FF4C41' }}>{busy[it.id] ? '...' : 'Aprobar para publicar'}</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Empty({ text, sub }: { text: string; sub: string }) {
  return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-5xl mb-3">📭</div>
      <p>{text}</p>
      <p className="text-sm mt-1">{sub}</p>
    </div>
  );
}
