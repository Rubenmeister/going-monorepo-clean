'use client';

import Link from 'next/link';
import { COLORS } from '../../components/design-tokens';
import { IconArrowLeft } from '../../components/icons';

export const dynamic = 'force-static';

export default function LegalContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
          <span>›</span>
          <Link href="/legal" className="hover:text-gray-600">Legal</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Contacto Legal</span>
        </div>

        {/* Header */}
        <h1
          className="text-3xl font-black text-gray-900 mb-3"
          style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
        >
          Contacto Legal
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-8">
          Canales oficiales para consultas legales, ejercicio de derechos sobre
          datos personales (LOPDP Ecuador) y notificaciones formales a Going App.
        </p>

        {/* Canales */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2
            className="text-lg font-bold text-gray-900 mb-4"
            style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
          >
            Canales oficiales
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                Consultas generales y soporte
              </p>
              <a
                href="mailto:soporte@goingec.com"
                className="font-bold text-base hover:underline"
                style={{ color: COLORS.brand.red }}
              >
                soporte@goingec.com
              </a>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                Privacidad y derechos LOPDP (Delegado de Protección de Datos)
              </p>
              <a
                href="mailto:privacidad@goingec.com"
                className="font-bold text-base hover:underline"
                style={{ color: COLORS.brand.red }}
              >
                privacidad@goingec.com
              </a>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                WhatsApp Going App
              </p>
              <a
                href="https://wa.me/593984037949"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-base hover:underline"
                style={{ color: COLORS.brand.red }}
              >
                +593 98 403 7949
              </a>
            </div>
          </div>
        </div>

        {/* Domicilio */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2
            className="text-lg font-bold text-gray-900 mb-4"
            style={{ fontFamily: 'var(--font-nunito-sans), sans-serif' }}
          >
            Domicilio legal
          </h2>
          <p className="text-gray-700 leading-relaxed mb-2">
            <strong>Thorn AI Technologies S.A.S.</strong>
          </p>
          <p className="text-gray-600 leading-relaxed mb-2">
            RUC <strong>1793176925001</strong>
          </p>
          <p className="text-gray-600 leading-relaxed">
            Echeverría N2-170 y Crespo Toral<br />
            Quito, Pichincha, Ecuador
          </p>
        </div>

        {/* Volver */}
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

      </div>
    </div>
  );
}
