'use client';

import Link from 'next/link';
import { COLORS } from '../../components/design-tokens';
import { IconArrowLeft, IconBook } from '../../components/icons';

/**
 * Componente común para páginas legales con resumen ejecutivo público.
 *
 * Cada sub-page del Centro Legal muestra:
 *   1. Breadcrumb + título con ícono brand
 *   2. Resumen ejecutivo (qué cubre el documento, alcance, audiencia)
 *   3. Canal de contacto para consultar el texto completo o solicitar copia
 *   4. Pie con datos de Thorn AI Technologies (RUC + domicilio)
 *
 * El texto completo de cada política se libera por lotes desde el Marco Legal
 * Integral de Going App (33 documentos en 4 etapas). Esta vista pública mantiene
 * la información esencial visible mientras se finaliza la versión definitiva
 * con el equipo jurídico.
 *
 * Diseño: brand-aligned (rojo Going App como acento), Going App Branding Guidelines.
 */
export interface LegalPlaceholderProps {
  /** Título principal mostrado en H1 (ej. "Normas Comunitarias"). */
  title: string;
  /** Descripción corta de qué cubre el documento. */
  summary: string;
  /** Breadcrumb adicional opcional (ej. "Para Conductores › Por qué elegirnos"). */
  breadcrumb?: string;
}

export function LegalPlaceholder({ title, summary, breadcrumb }: LegalPlaceholderProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
          <span>›</span>
          <Link href="/legal" className="hover:text-gray-600">Legal</Link>
          {breadcrumb && (
            <>
              <span>›</span>
              <span className="text-gray-500">{breadcrumb}</span>
            </>
          )}
          <span>›</span>
          <span className="text-gray-700 font-medium">{title}</span>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
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
            <p className="text-base text-gray-600 leading-relaxed">{summary}</p>
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-8">
          <h2
            className="text-lg font-bold text-gray-900 mb-3"
            style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
          >
            Resumen ejecutivo
          </h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Esta política forma parte del Marco Legal Integral de Going App. El
            resumen anterior describe el propósito, alcance y audiencia del
            documento. El texto completo se libera por lotes y cualquier
            actualización se notifica a las personas usuarias registradas con
            al menos 15 días de anticipación.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Para solicitar la versión completa, recibir aclaraciones o
            ejercer derechos sobre tus datos personales (LOPDP Ecuador),
            escríbenos por los canales oficiales.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:soporte@goingec.com"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: COLORS.brand.red }}
            >
              soporte@goingec.com
            </a>
            <a
              href="https://wa.me/593984037949"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-colors border border-gray-200"
            >
              WhatsApp +593 98 403 7949
            </a>
          </div>
        </div>

        {/* Volver al centro legal */}
        <div className="mt-8">
          <Link
            href="/legal"
            className="inline-flex items-center gap-2 font-bold text-sm hover:gap-3 transition-all"
            style={{ color: COLORS.brand.red }}
          >
            <IconArrowLeft size={16} />
            Volver al Centro Legal
          </Link>
        </div>

        {/* Pie con datos empresa */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 leading-relaxed">
            Going App es una marca operada por{' '}
            <strong>Thorn AI Technologies S.A.S.</strong>, RUC{' '}
            <strong>1793176925001</strong>, con domicilio en Echeverría N2-170 y
            Crespo Toral, Quito, Ecuador.
          </p>
        </div>

      </div>
    </div>
  );
}
