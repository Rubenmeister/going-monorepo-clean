import Link from 'next/link';
import { COLORS } from './design-tokens';
import { IconBook } from './icons';

/**
 * GuiaContenido — layout branded para guías/contenido de ayuda (primer viaje,
 * políticas, etc.). Mismo lenguaje visual que LegalPlaceholder pero con CUERPO
 * real: intro + secciones (encabezado + párrafos/viñetas). Server component
 * (estático, bueno para SEO). El contenido viene de los documentos de Operaciones.
 */
export interface GuiaSeccion {
  /** Encabezado de la sección (opcional para bloques introductorios). */
  heading?: string;
  /** Párrafos de texto corrido. */
  paragraphs?: string[];
  /** Viñetas (lista). */
  bullets?: string[];
}

export interface GuiaBreadcrumb {
  label: string;
  href?: string;
}

export interface GuiaContenidoProps {
  title: string;
  intro: string;
  sections: GuiaSeccion[];
  breadcrumbs?: GuiaBreadcrumb[];
  /** Nota/aviso al pie (opcional). */
  footerNote?: string;
  /** Ruta del documento descargable (.docx en /public). Opcional. */
  downloadHref?: string;
}

export function GuiaContenido({
  title,
  intro,
  sections,
  breadcrumbs = [],
  footerNote,
  downloadHref,
}: GuiaContenidoProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
          {breadcrumbs.map((b) => (
            <span key={b.label} className="flex items-center gap-2">
              <span>›</span>
              {b.href ? (
                <Link href={b.href} className="hover:text-gray-600">{b.label}</Link>
              ) : (
                <span className="text-gray-700 font-medium">{b.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: COLORS.brand.redBg, color: COLORS.brand.red }}
          >
            <IconBook size={28} />
          </div>
          <div className="flex-1 pt-1">
            <h1
              className="text-3xl font-black text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
            >
              {title}
            </h1>
            <p className="text-base text-gray-600 leading-relaxed">{intro}</p>
          </div>
        </div>

        {/* Descarga */}
        {downloadHref && (
          <div className="mb-6">
            <a
              href={downloadHref}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: COLORS.brand.red }}
            >
              <span aria-hidden>⬇️</span> Descargar guía (Word)
            </a>
          </div>
        )}

        {/* Cuerpo */}
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
          {sections.map((s, i) => (
            <section key={i} className="space-y-3">
              {s.heading && (
                <h2
                  className="text-lg font-bold text-gray-900 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
                >
                  <span
                    className="inline-block w-1.5 h-5 rounded-full"
                    style={{ backgroundColor: COLORS.brand.red }}
                  />
                  {s.heading}
                </h2>
              )}
              {s.paragraphs?.map((p, j) => (
                <p key={j} className="text-[15px] text-gray-700 leading-relaxed">{p}</p>
              ))}
              {s.bullets && s.bullets.length > 0 && (
                <ul className="space-y-2">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2 text-[15px] text-gray-700 leading-relaxed">
                      <span style={{ color: COLORS.brand.red }} className="mt-0.5 flex-shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        {footerNote && (
          <p className="text-sm text-gray-500 mt-6 text-center max-w-2xl mx-auto">{footerNote}</p>
        )}
      </div>
    </div>
  );
}
