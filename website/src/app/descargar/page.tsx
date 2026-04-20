import type { Metadata } from 'next';
import Link from 'next/link';
import { GoingLogo } from '../components/GoingLogo';

export const metadata: Metadata = {
  title: 'Descarga Going — App para iOS y Android',
  description: 'Descarga la app de Going Ecuador en App Store y Google Play. Reserva viajes compartidos, privados y envíos desde tu celular.',
};

const STORES = [
  {
    name: 'App Store',
    sub: 'Disponible en',
    icon: '🍎',
    href: 'https://apps.apple.com/ec/app/going-ecuador',
    badge: 'iOS 15+',
  },
  {
    name: 'Google Play',
    sub: 'Disponible en',
    icon: '▶️',
    href: 'https://play.google.com/store/apps/details?id=com.goingec.app',
    badge: 'Android 8+',
  },
];

const FEATURES = [
  { icon: '🛡️', title: 'PIN de seguridad verificado', sub: 'Confirma que subes al vehículo correcto.' },
  { icon: '📍', title: 'Tracking en tiempo real', sub: 'Tú y tus familiares saben dónde estás.' },
  { icon: '💳', title: 'Pago seguro en la app', sub: 'Tarjeta, transferencia o efectivo.' },
  { icon: '⭐', title: 'Conductores calificados', sub: 'Solo conductores verificados y con rating.' },
  { icon: '🚍', title: '50+ rutas en Ecuador', sub: 'Sierra y Costa, frecuencias cada 30 min.' },
  { icon: '🎧', title: 'Soporte 24/7', sub: 'Atención en cualquier momento del viaje.' },
];

export default function DescargarPage() {
  return (
    <div className="min-h-screen bg-[#011627] pt-[68px]">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-6">
          <GoingLogo size={56} />
        </div>
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 text-[11px] font-black tracking-[2px] uppercase text-red-400 mb-6">
          🇪🇨 Hecha en Ecuador
        </div>
        <h1 className="font-serif text-[clamp(36px,5vw,60px)] font-black text-white leading-tight mb-4">
          Going en tu celular
        </h1>
        <p className="text-lg text-white/50 leading-relaxed mb-10 max-w-xl mx-auto">
          Reserva, rastrea y paga desde la app. Disponible gratis para iPhone y Android.
        </p>

        {/* Store buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          {STORES.map((store) => (
            <Link
              key={store.name}
              href={store.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white/[0.07] border border-white/[0.15] rounded-2xl px-6 py-4 hover:bg-white/12 hover:border-white/30 transition-all group"
            >
              <span className="text-4xl">{store.icon}</span>
              <div className="text-left">
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{store.sub}</div>
                <div className="text-[20px] font-black text-white group-hover:text-[#ff4c41] transition-colors">{store.name}</div>
                <div className="text-[11px] text-white/30 font-semibold mt-0.5">{store.badge}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-16">
          {[
            { val: '50k+', label: 'Descargas' },
            { val: '4.9★', label: 'Rating promedio' },
            { val: 'Gratis', label: 'Sin costo' },
          ].map((s) => (
            <div key={s.val} className="bg-white/[0.05] rounded-2xl p-4 text-center">
              <div className="text-xl font-black text-white mb-1">{s.val}</div>
              <div className="text-[11px] text-white/35 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white/[0.03] border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-center font-serif text-[clamp(24px,3.5vw,36px)] font-black text-white mb-10">
            Todo lo que necesitas en un viaje
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="text-[14px] font-black text-white mb-1">{f.title}</div>
                <div className="text-[12px] text-white/40 leading-relaxed">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="text-white/40 text-sm mb-4">¿Prefieres reservar desde el navegador?</p>
        <Link
          href="https://app.goingec.com"
          className="inline-block px-8 py-3.5 rounded-xl bg-[#ff4c41] text-white font-black text-[15px] hover:bg-[#e03d32] transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(255,76,65,0.4)]"
        >
          Abrir app web →
        </Link>
      </section>
    </div>
  );
}
