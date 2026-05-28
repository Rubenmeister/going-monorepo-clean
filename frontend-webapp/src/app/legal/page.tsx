'use client';

import Link from 'next/link';
import { COLORS } from '../components/design-tokens';
import {
  IconBook,
  IconLock,
  IconShield,
  IconArrowRight,
} from '../components/icons';

/**
 * Hub legal de Going — índice con las 3 políticas vigentes.
 * Linkeable desde footer, registro y términos cruzados.
 *
 * Brand v6 (28-may-2026):
 *   - Rojo Going como acento principal
 *   - Sin emojis, solo SVG icons del library
 *   - Razón social oficial: Thorn AI Technologies S.A.S.
 */
const docs = [
  {
    title: 'Términos y Condiciones',
    desc: 'Reglas que rigen el uso de la plataforma Going: registro, reservas, pagos, cancelaciones, obligaciones y responsabilidades.',
    href: '/legal/terms',
    updated: '28 mayo 2026',
    Icon: IconBook,
    bg: COLORS.brand.redBg,
    iconColor: COLORS.brand.red,
  },
  {
    title: 'Política de Privacidad',
    desc: 'Cómo recopilamos, usamos y protegemos tus datos personales según la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).',
    href: '/legal/privacy',
    updated: '28 mayo 2026',
    Icon: IconLock,
    bg: COLORS.brand.yellowBg,
    iconColor: COLORS.brand.yellowDark,
  },
  {
    title: 'Política de Cookies',
    desc: 'Qué cookies usa nuestro sitio web, para qué sirven y cómo podés controlarlas desde tu navegador.',
    href: '/legal/cookies',
    updated: '28 mayo 2026',
    Icon: IconShield,
    bg: COLORS.gray[100],
    iconColor: COLORS.brand.black,
  },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">
              Inicio
            </Link>
            <span>›</span>
            <span className="text-gray-700 font-medium">Legal</span>
          </div>
          <h1
            className="text-4xl font-black text-gray-900 mb-3"
            style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
          >
            Centro Legal Going
          </h1>
          <p className="text-base text-gray-600 max-w-2xl">
            Los documentos que regulan el uso de la plataforma Going y el
            tratamiento de tus datos personales. Te recomendamos leerlos para
            conocer tus derechos y obligaciones.
          </p>
        </div>
      </div>

      {/* Cards de documentos */}
      <div className="max-w-4xl mx-auto px-6 py-10 grid gap-4 md:grid-cols-3">
        {docs.map((doc) => {
          const Icon = doc.Icon;
          return (
            <Link
              key={doc.href}
              href={doc.href}
              className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 flex flex-col"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: doc.bg, color: doc.iconColor }}
              >
                <Icon size={28} />
              </div>
              <h2
                className="text-lg font-black text-gray-900 mb-2"
                style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
              >
                {doc.title}
              </h2>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed flex-1">
                {doc.desc}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Vigente desde {doc.updated}
                </span>
                <span
                  className="inline-flex items-center gap-1 font-bold text-sm group-hover:gap-2 transition-all"
                  style={{ color: doc.iconColor }}
                >
                  Leer
                  <IconArrowRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bloque empresa */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div
          className="rounded-2xl p-6 text-sm text-gray-700"
          style={{
            backgroundColor: COLORS.brand.redBg,
            border: `1px solid ${COLORS.brand.red}33`,
          }}
        >
          <p className="font-bold text-gray-900 mb-2">
            Empresa responsable y contacto
          </p>
          <p className="mb-3 leading-relaxed">
            Going es una marca operada por{' '}
            <strong>Thorn AI Technologies S.A.S.</strong>, RUC{' '}
            <strong>1793176925001</strong>, con domicilio en Echeverría N2-170 y
            Crespo Toral, Quito, Ecuador.
          </p>
          <p className="leading-relaxed">
            Para consultas:{' '}
            <a
              href="mailto:soporte@goingec.com"
              className="font-medium hover:underline"
              style={{ color: COLORS.brand.red }}
            >
              soporte@goingec.com
            </a>{' '}
            · Privacidad / DPO:{' '}
            <a
              href="mailto:privacidad@goingec.com"
              className="font-medium hover:underline"
              style={{ color: COLORS.brand.red }}
            >
              privacidad@goingec.com
            </a>{' '}
            · WhatsApp{' '}
            <a
              href="https://wa.me/593984037949"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: COLORS.brand.red }}
            >
              +593 98 403 7949
            </a>
          </p>
        </div>
      </div>

      {/* Jurisdicción */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="text-sm text-gray-500 leading-relaxed">
          <p className="font-semibold text-gray-700 mb-1">
            Jurisdicción y legislación aplicable
          </p>
          <p>
            Todos los documentos legales de Going se rigen por las leyes de la
            República del Ecuador, incluyendo la Ley Orgánica de Protección de
            Datos Personales (LOPDP), regulaciones de la Agencia Nacional de
            Tránsito (ANT) y normativa tributaria del Servicio de Rentas
            Internas (SRI). Para cualquier controversia, las partes se someten
            a los jueces y tribunales competentes de la ciudad de Quito.
          </p>
        </div>
      </div>

    </div>
  );
}
