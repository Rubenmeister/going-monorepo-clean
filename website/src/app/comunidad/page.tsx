import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Comunidad Going App — Viajeras y Viajeros, Conductoras y Conductores de Ecuador',
  description: 'Súmate a la comunidad de Going App Ecuador. Pasajeras y pasajeros, conductoras y conductores, y anfitriones que construyen una mejor movilidad.',
};

export default function ComunidadPage() {
  return (
    <div className="pt-[88px]">
      {/* Hero */}
      <div className="relative bg-[#011627] py-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85" alt="Ecuador" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#011627]/95 to-[#0a2540]/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-4">Comunidad Going App</div>
          <h1 className="font-serif text-5xl font-black text-white leading-tight mb-4">
            Somos más que un servicio
          </h1>
          <p className="text-lg text-white/55 max-w-xl mx-auto mb-10">
            Una comunidad de viajeras y viajeros, conductoras y conductores, y emprendedores ecuatorianos construyendo la movilidad del futuro.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="https://app.goingec.com/register" className="px-7 py-3.5 rounded-xl bg-[#ff4c41] text-white font-black text-[15px] hover:bg-[#e03d32] transition-all">
              Unirme como pasajero
            </Link>
            <Link href="#conductores" className="px-7 py-3.5 rounded-xl border border-white/25 text-white font-black text-[15px] hover:bg-white/10 transition-all">
              Ser conductora o conductor
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {[
            { val: 'Verificados', label: 'Conductoras y conductores', sub: 'Antecedentes y vehículo al día', icon: '🚗' },
            { val: 'PIN', label: 'Seguridad en cada viaje', sub: 'Subís al vehículo correcto', icon: '🛡️' },
            { val: '3 rutas', label: 'Para empezar', sub: 'Y llegando a todo el país', icon: '🗺️' },
            { val: 'Precio fijo', label: 'Sin sorpresas', sub: 'Lo ves antes de confirmar', icon: '🏷️' },
          ].map((s) => (
            <div key={s.label} className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="text-3xl font-black text-[#ff4c41] mb-1">{s.val}</div>
              <div className="text-[14px] font-black text-[#011627] mb-1">{s.label}</div>
              <div className="text-[12px] text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Conductores section */}
        <div id="conductores" className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-3">Para conductores</div>
            <h2 className="font-serif text-4xl font-black text-[#011627] leading-tight mb-4">
              Genera ingresos<br />manejando Going App
            </h2>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
              Súmate a las primeras conductoras y conductores de Going App. Tú eliges tus horarios, tus rutas y cuánto quieres ganar.
            </p>
            <div className="space-y-3 mb-8">
              {['✅ Tú decides tus horarios y rutas', '✅ Pagos semanales puntuales', '✅ Soporte 24/7 y comunidad de conductoras y conductores', '✅ App fácil de usar, sin complicaciones'].map(b => (
                <p key={b} className="text-[14px] text-gray-700 font-semibold">{b}</p>
              ))}
            </div>
            <Link href="https://app.goingec.com/conductores" className="inline-block px-7 py-3.5 rounded-xl bg-[#011627] text-white font-black text-[15px] hover:bg-[#0a2540] transition-all">
              Quiero ser conductora o conductor →
            </Link>
          </div>
          <div className="relative h-[400px] rounded-3xl overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=700&q=85" alt="Conductora o conductor de Going App" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#011627]/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <p className="text-white font-black text-[16px] mb-1">Manejá con Going App</p>
              <p className="text-white/60 text-[13px]">Horarios flexibles · Pagos semanales · Soporte 24/7</p>
            </div>
          </div>
        </div>

        {/* Pre-lanzamiento (sin testimonios inventados — todavía no salimos al aire) */}
        <div className="bg-[#011627] rounded-3xl p-10 md:p-14 text-center">
          <div className="text-[11px] font-black tracking-[2px] uppercase text-[#ff4c41] mb-3">Pre-lanzamiento 2026</div>
          <h2 className="font-serif text-3xl font-black text-white mb-4 leading-tight">Sé de las primeras personas en viajar con Going App</h2>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-xl mx-auto mb-8">
            Empezamos con 3 rutas — Riobamba, Santo Domingo e Ibarra, desde Quito y el Aeropuerto de Quito — y vamos llegando a todo el país. Creá tu cuenta y te avisamos en cuanto tu ruta esté lista.
          </p>
          <Link href="https://app.goingec.com/register" className="inline-block px-8 py-3.5 rounded-xl bg-[#ff4c41] text-white font-black text-[15px] hover:bg-[#e03d32] transition-all">
            Crear cuenta gratis →
          </Link>
        </div>
      </div>
    </div>
  );
}
