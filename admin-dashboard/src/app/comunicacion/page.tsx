'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';

/**
 * Panel de Comunicación — revisión editorial.
 *
 * El agente de contenido (Killa) deja propuestas en Firestore con status='review'.
 * Acá el equipo las revisa y decide: PUBLICAR (→ aparecen en /blog, /revista,
 * /noticias de la webapp) o DESCARTAR. Consume el BFF same-origin /api/content/*
 * que reenvía el JWT admin a customer-support-service.
 */

interface Proposal {
  id: string;
  status: string;
  channel: 'blog' | 'revista' | 'noticias' | string;
  title: string;
  summary: string;
  body: string;
  outline: string[];
  category: string;
  sources: (string | { title?: string; url?: string })[];
  cta: string;
  author: string;
  createdAt: string | null;
}

const CHANNEL_META: Record<string, { label: string; color: string; emoji: string }> = {
  blog:     { label: 'Blog',     color: '#2563eb', emoji: '✍️' },
  revista:  { label: 'Revista',  color: '#7c3aed', emoji: '📖' },
  noticias: { label: 'Noticias', color: '#dc2626', emoji: '📰' },
};

function ChannelBadge({ channel }: { channel: string }) {
  const m = CHANNEL_META[channel] ?? { label: channel, color: '#6b7280', emoji: '📄' };
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: m.color }}
    >
      {m.emoji} {m.label}
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

  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/content/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setError('Sesión no autorizada. Vuelve a iniciar sesión como administrador.');
        setItems([]);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems((data?.items ?? []) as Proposal[]);
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

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const decide = async (id: string, action: 'publish' | 'reject') => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      const res = await fetch(`/api/content/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((list) => list.filter((it) => it.id !== id));
      flash(action === 'publish' ? '✅ Publicado — ya aparece en la webapp.' : '🗑️ Propuesta descartada.');
    } catch (e) {
      flash(`⚠️ No se pudo ${action === 'publish' ? 'publicar' : 'descartar'}: ${(e as Error).message}`);
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Comunicación — Revisión editorial</h1>
          <button
            onClick={load}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            ↻ Actualizar
          </button>
        </div>
        <p className="text-gray-500 mb-6">
          Propuestas del agente de contenido pendientes de aprobación. Al publicar aparecen en
          <span className="font-medium"> Blog</span>,<span className="font-medium"> Revista</span> y
          <span className="font-medium"> Noticias</span> de la web.
        </p>

        {toast && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm">{toast}</div>
        )}

        {loading ? (
          <Loading />
        ) : error ? (
          <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p>No hay propuestas pendientes de revisión.</p>
            <p className="text-sm mt-1">Cuando Killa genere contenido nuevo, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => {
              const isOpen = !!expanded[it.id];
              return (
                <article key={it.id} className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <ChannelBadge channel={it.channel} />
                      {it.category && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          {it.category}
                        </span>
                      )}
                      {it.createdAt && (
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(it.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-1.5">{it.title}</h2>
                    {it.summary && <p className="text-gray-600 mb-3">{it.summary}</p>}

                    {it.outline?.length > 0 && (
                      <ul className="mb-3 space-y-1">
                        {it.outline.map((o, i) => (
                          <li key={i} className="text-sm text-gray-500 flex gap-2">
                            <span className="text-gray-300">›</span>
                            {o}
                          </li>
                        ))}
                      </ul>
                    )}

                    {isOpen && it.body && (
                      <div className="mt-3 mb-3 p-4 rounded-xl bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {it.body}
                      </div>
                    )}

                    {it.sources?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Fuentes</p>
                        <ul className="space-y-0.5">
                          {it.sources.map((s, i) => {
                            const { text, url } = sourceLabel(s);
                            return (
                              <li key={i} className="text-xs text-gray-500 truncate">
                                {url ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {text}
                                  </a>
                                ) : (
                                  text
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      {it.body && (
                        <button
                          onClick={() => setExpanded((e) => ({ ...e, [it.id]: !isOpen }))}
                          className="text-sm px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50"
                        >
                          {isOpen ? 'Ocultar cuerpo' : 'Ver cuerpo completo'}
                        </button>
                      )}
                      <div className="ml-auto flex gap-2">
                        <button
                          disabled={busy[it.id]}
                          onClick={() => decide(it.id, 'reject')}
                          className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          Descartar
                        </button>
                        <button
                          disabled={busy[it.id]}
                          onClick={() => decide(it.id, 'publish')}
                          className="text-sm px-4 py-1.5 rounded-lg font-semibold text-white disabled:opacity-40"
                          style={{ backgroundColor: '#FF4C41' }}
                        >
                          {busy[it.id] ? '...' : 'Aprobar y publicar'}
                        </button>
                      </div>
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
