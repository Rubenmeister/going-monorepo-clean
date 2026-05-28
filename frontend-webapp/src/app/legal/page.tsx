'use client';

import Link from 'next/link';
import { COLORS } from '../components/design-tokens';
import {
  IconBook,
  IconLock,
  IconShield,
  IconArrowRight,
  IconUsers,
  IconCar,
  IconPackage,
  IconUser,
  IconGlobe,
} from '../components/icons';

/**
 * Hub legal de Going — índice del Marco Legal público.
 *
 * Estructura derivada del Marco Legal Integral (33 documentos en 4 etapas).
 * Esta vista pública expone 26 documentos organizados por audiencia + tema.
 * Los instrumentos internos (Going Legal institucional, Manual de Operaciones
 * CIIU, contratos templates, SLA corporativos, NDA) NO se incluyen aquí.
 *
 * Fragmentación resuelta:
 *   · Privacidad: Aviso (doc 12) + Términos (doc 13) → /legal/privacy unificada
 *   · Envíos: Condiciones (21) + T&C (22) + Normativas (23) → /legal/envios-condiciones consolidada
 *
 * Brand v6: rojo Going como acento principal · sin emojis · SVG icons del
 * library · paleta Going Branding Guidelines 2024.
 */
const HIGHLIGHTS = [
  {
    href: '/legal/terms',
    title: 'Términos y Condiciones',
    desc: 'Las reglas generales que rigen el uso de la plataforma Going.',
    Icon: IconBook,
    bg: COLORS.brand.redBg,
    color: COLORS.brand.red,
  },
  {
    href: '/legal/privacy',
    title: 'Política de Privacidad',
    desc: 'Cómo recopilamos, usamos y protegemos tus datos personales (LOPDP Ecuador).',
    Icon: IconLock,
    bg: COLORS.brand.yellowBg,
    color: COLORS.brand.yellowDark,
  },
  {
    href: '/legal/cookies',
    title: 'Política de Cookies',
    desc: 'Qué cookies usa nuestro sitio web, para qué sirven y cómo gestionarlas.',
    Icon: IconShield,
    bg: COLORS.gray[100],
    color: COLORS.brand.black,
  },
];

interface SectionGroup {
  label: string;
  Icon: typeof IconUsers;
  color: string;
  bg: string;
  docs: Array<{ href: string; title: string; desc: string }>;
}

const SECTIONS: SectionGroup[] = [
  {
    label: 'Comunidad y conducta',
    Icon: IconUsers,
    color: COLORS.brand.red,
    bg: COLORS.brand.redBg,
    docs: [
      {
        href: '/legal/comunidad',
        title: 'Normas Comunitarias',
        desc: 'Comportamiento esperado: respeto, inclusión, no discriminación.',
      },
      {
        href: '/legal/cero-tolerancia',
        title: 'Política de Cero Tolerancia',
        desc: 'Conductas inaceptables y consecuencias inmediatas.',
      },
      {
        href: '/legal/aceptacion-datos',
        title: 'Aceptación de Uso de Datos',
        desc: 'Consentimiento expreso sobre datos personales (LOPDP).',
      },
      {
        href: '/legal/contenido-usuario',
        title: 'Contenido Generado por Usuarias y Usuarios',
        desc: 'Reglas para reseñas, comentarios, fotos y multimedia.',
      },
    ],
  },
  {
    label: 'Para conductoras y conductores',
    Icon: IconCar,
    color: COLORS.brand.yellowDark,
    bg: COLORS.brand.yellowBg,
    docs: [
      {
        href: '/legal/conductores',
        title: 'Normativa de Conductoras y Conductores',
        desc: 'Requisitos, derechos y obligaciones de quienes conducen para Going.',
      },
      {
        href: '/legal/conductores-app',
        title: 'Guías de la Driver App',
        desc: 'Procedimientos operativos diarios en la app de conducción.',
      },
      {
        href: '/legal/conductores-seguridad',
        title: 'Estándares Mínimos de Seguridad',
        desc: 'Requisitos técnicos de vehículos y operación segura.',
      },
      {
        href: '/legal/conductores-elegirnos',
        title: 'Por Qué Elegirnos',
        desc: 'Propuesta de valor de Going para conductoras y conductores.',
      },
    ],
  },
  {
    label: 'Para usuarias y usuarios',
    Icon: IconUser,
    color: COLORS.brand.red,
    bg: COLORS.brand.redBg,
    docs: [
      {
        href: '/legal/usuarios',
        title: 'Normativa de Usuarias y Usuarios',
        desc: 'Reglas para quienes usan Going para reservar viajes y envíos.',
      },
      {
        href: '/legal/usuarios-primer-viaje',
        title: 'Tu Primer Viaje con Going',
        desc: 'Guía paso a paso para tu primera experiencia.',
      },
      {
        href: '/legal/usuarios-asistencia',
        title: 'Asistencia al Usuario',
        desc: 'Canales de soporte: WhatsApp, chat en app, email.',
      },
      {
        href: '/legal/usuarios-emergencia',
        title: 'Compartir en caso de Emergencia',
        desc: 'Funciones SOS, compartir viaje, protocolo de emergencia.',
      },
    ],
  },
  {
    label: 'Going Envíos',
    Icon: IconPackage,
    color: COLORS.brand.black,
    bg: COLORS.gray[100],
    docs: [
      {
        href: '/legal/envios-condiciones',
        title: 'Condiciones de Going Envíos',
        desc: 'T&C consolidados: cobertura, peso, valor, seguros y responsabilidades.',
      },
      {
        href: '/legal/envios-prohibidos',
        title: 'Artículos Prohibidos',
        desc: 'Lista detallada de productos que no pueden enviarse por Going.',
      },
      {
        href: '/legal/envios-manejo',
        title: 'Manejo de Envíos',
        desc: 'Protocolo de recolección, transporte y entrega con código OTP.',
      },
    ],
  },
  {
    label: 'Pagos y programas',
    Icon: IconGlobe,
    color: COLORS.brand.yellowDark,
    bg: COLORS.brand.yellowBg,
    docs: [
      {
        href: '/legal/pagos',
        title: 'Términos de Pago del Servicio',
        desc: 'Medios habilitados en Ecuador, facturación SRI, reembolsos y disputas.',
      },
      {
        href: '/legal/referidos',
        title: 'Programa de Referidos',
        desc: 'Cómo invitar amistades y ganar crédito Going Cash.',
      },
      {
        href: '/legal/tarjeta-regalo',
        title: 'Tarjeta de Regalo Going',
        desc: 'Condiciones de compra, canje y vigencia (físicas y digitales).',
      },
    ],
  },
  {
    label: 'Plataforma, propiedad intelectual y empleo',
    Icon: IconShield,
    color: COLORS.brand.red,
    bg: COLORS.brand.redBg,
    docs: [
      {
        href: '/legal/seguridad-tecnologia',
        title: 'Tecnología y Seguridad de la Plataforma',
        desc: 'Verificación de identidad, encriptación, monitoreo.',
      },
      {
        href: '/legal/glosario',
        title: 'Glosario de Servicios Going',
        desc: 'Definiciones oficiales: Transfers, Destinos, Envíos, Cash.',
      },
      {
        href: '/legal/derechos-autor',
        title: 'Política de Derechos de Autor',
        desc: 'Procedimiento DMCA y notificaciones de infracción.',
      },
      {
        href: '/legal/marcas',
        title: 'Política de Marcas Registradas',
        desc: 'Protección de la marca Going y reporte de uso no autorizado.',
      },
      {
        href: '/legal/privacy-empleados',
        title: 'Privacidad: Aspirantes y Empleados',
        desc: 'Tratamiento de datos en procesos de selección y empleo.',
      },
    ],
  },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Inicio</Link>
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
            Todos los documentos que regulan el uso de la plataforma Going, los
            derechos y obligaciones de la comunidad, y el tratamiento de los
            datos personales conforme a la legislación ecuatoriana.
          </p>
        </div>
      </div>

      {/* Cards destacadas (3 principales) */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Documentos principales
        </p>
        <div className="grid gap-4 md:grid-cols-3 mb-12">
          {HIGHLIGHTS.map((doc) => {
            const Icon = doc.Icon;
            return (
              <Link
                key={doc.href}
                href={doc.href}
                className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 flex flex-col"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: doc.bg, color: doc.color }}
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
                <span
                  className="inline-flex items-center gap-1 font-bold text-sm group-hover:gap-2 transition-all"
                  style={{ color: doc.color }}
                >
                  Leer documento
                  <IconArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>

        {/* Secciones agrupadas */}
        {SECTIONS.map((section) => {
          const SectionIcon = section.Icon;
          return (
            <div key={section.label} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: section.bg, color: section.color }}
                >
                  <SectionIcon size={20} />
                </div>
                <h3
                  className="text-lg font-black text-gray-900"
                  style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
                >
                  {section.label}
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.docs.map((doc) => (
                  <Link
                    key={doc.href}
                    href={doc.href}
                    className="group bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-gray-900 leading-tight mb-1">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {doc.desc}
                      </p>
                    </div>
                    <IconArrowRight
                      size={14}
                      className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1 transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bloque empresa */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
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
            Para consultas generales:{' '}
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
      <div className="max-w-5xl mx-auto px-6 pb-16">
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
