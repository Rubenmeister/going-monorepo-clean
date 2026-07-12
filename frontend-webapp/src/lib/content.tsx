import React from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

export interface Source { title?: string; url?: string }
export interface ContentItem {
  id: string; channel: string; title: string; summary: string; body: string;
  outline: string[]; category: string; sources: (string | Source)[];
  author: string; publishedAt: string | null;
  coverUrl?: string | null; videoUrl?: string | null;
}

/** Extrae el ID de un video de YouTube desde varias formas de URL. */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : /^[A-Za-z0-9_-]{11}$/.test(url) ? url : null;
}

/** Trae un item publicado por id desde el endpoint público /content/:id. */
export async function getContentItem(id: string): Promise<ContentItem | null> {
  try {
    const res = await fetch(`${API_URL}/content/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ContentItem;
  } catch {
    return null;
  }
}

/** Vista de artículo compartida (blog / noticias / revista). */
export function ArticleView({
  item,
  backHref,
  backLabel,
}: {
  item: ContentItem;
  backHref: string;
  backLabel: string;
}) {
  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const sources = (item.sources ?? []).map((s) =>
    typeof s === 'string'
      ? { text: s, url: /^https?:\/\//.test(s) ? s : undefined }
      : { text: s.title || s.url || 'fuente', url: s.url },
  );

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href={backHref} className="text-primary-100 hover:text-white mb-4 inline-block">
            ← {backLabel}
          </Link>
          {item.category && (
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full mb-3">
              {item.category}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-bold mb-3 text-balance">{item.title}</h1>
          <div className="flex items-center gap-3 text-primary-100 text-sm">
            <span>{item.author}</span>
            {date && (
              <>
                <span>•</span>
                <span>{date}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {item.coverUrl && (
        <div className="container mx-auto px-4 max-w-3xl -mt-8 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.coverUrl}
            alt={item.title}
            className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg"
          />
        </div>
      )}

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {item.summary && (
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {item.summary}
          </p>
        )}

        {youtubeId(item.videoUrl) && (
          <div className="relative w-full mb-8 rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId(item.videoUrl)}`}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {item.body && (
          <div className="max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-lg">
            {item.body}
          </div>
        )}

        {item.outline?.length > 0 && !item.body && (
          <ul className="space-y-2">
            {item.outline.map((o, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300 flex gap-2">
                <span className="text-primary-400">›</span>
                {o}
              </li>
            ))}
          </ul>
        )}

        {sources.length > 0 && (
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Fuentes</p>
            <ul className="space-y-1">
              {sources.map((s, i) => (
                <li key={i} className="text-sm text-gray-500 dark:text-gray-400 break-words">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:underline"
                    >
                      {s.text}
                    </a>
                  ) : (
                    s.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </main>
  );
}
