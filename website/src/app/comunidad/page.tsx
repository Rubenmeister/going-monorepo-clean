import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Comunidad Going — Viajeros y Conductores de Ecuador',
  description: 'Únete a la comunidad de Going Ecuador. Pasajeros, conductores y anfitriones que construyen una mejor movilidad.',
};

export default function ComunidadPage() {
  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="relative bg-[#011627] py-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85" alt="Ecuador" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#011627]/95 to-[#0a2540]/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-4">Comunidad Going</div>
          <h1 className="font-serif text-5xl font-black text-white leading-tight mb-4">
            Somos más que un servicio
          </h1>
          <p className="text-lg text-white/55 max-w-xl mx-auto mb-10">
            Una comunidad de viajeros, conductores y emprendedores ecuatorianos construyendo la movilidad del futuro.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="https://app.goingec.com/register" className="px-7 py-3.5 rounded-xl bg-[#ff4c41] text-white font-black text-[15px] hover:bg-[#e03d32] transition-all">
              Unirme como pasajero
            </Link>
            <Link href="#conductores" className="px-7 py-3.5 rounded-xl border border-white/25 text-white font-black text-[15px] hover:bg-white/10 transition-all">
              Ser conductor
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {[
            { val: '50k+', label: 'Usuarios activos', sub: 'En todo Ecuador', icon: '👥' },
            { val: '1,200+', label: 'Conductores', sub: 'Verificados y calificados', icon: '🚗' },
            { val: '50+', label: 'Rutas activas', sub: 'Sierra y Costa', icon: '🗺️' },
            { val: '4.92★', label: 'Rating promedio', sub: 'De 10,000+ reseñas', icon: '⭐' },
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
              Genera ingresos<br />manejando Going
            </h2>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
              Únete a más de 1,200 conductores que ya trabajan con Going. Tú eliges tus horarios, tus rutas y cuánto quieres ganar.
            </p>
            <div className="space-y-3 mb-8">
              {['✅ Gana entre $800 y $2,000 al mes', '✅ Tú decides tus horarios y rutas', '✅ Pagos semanales puntuales', '✅ Soporte 24/7 y comunidad de conductores', '✅ App fácil de usar, sin complicaciones'].map(b => (
                <p key={b} className="text-[14px] text-gray-700 font-semibold">{b}</p>
              ))}
            </div>
            <Link href="https://app.goingec.com/conductores" className="inline-block px-7 py-3.5 rounded-xl bg-[#011627] text-white font-black text-[15px] hover:bg-[#0a2540] transition-all">
              Quiero ser conductor →
            </Link>
          </div>
          <div className="relative h-[400px] rounded-3xl overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=700&q=85" alt="Conductor Going" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#011627]/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <p className="text-white font-black text-[16px] mb-1">Carlos Mendoza</p>
              <p className="text-white/60 text-[13px]">Conductor Going · 847 viajes · 4.92 ★</p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div>
          <h2 className="font-serif text-3xl font-black text-[#011627] text-center mb-10">Lo que dice nuestra comunidad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { text: 'El PIN de seguridad me dio mucha confianza. Supe exactamente a qué vehículo subir.', name: 'Ana Rodríguez', route: 'Quito → Baños', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80' },
              { text: 'Como conductor, Going me da estabilidad. La app es muy fácil y los pagos son puntuales.', name: 'Carlos Mendoza', route: 'Conductor · 847 viajes', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80' },
              { text: 'Mejor que el bus y más barato que el taxi. Siempre viajo Going de Latacunga a Quito.', name: 'María Toapanta', route: 'Latacunga → Quito', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80' },
              { text: 'El tracking en vivo me tranquiliza cuando viaja mi hija. Sé exactamente dónde está.', name: 'Rosa Guerrero', route: 'Ibarra → Quito', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80' },
            ].map(t => (
              <div key={t.name} className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all">
                <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
                <p className="text-[13px] text-gray-700 leading-relaxed italic mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <Image src={t.avatar} alt={t.name} width={36} height={36} className="rounded-full object-cover" />
                  <div>
                    <div className="text-[13px] font-black text-[#011627]">{t.name}</div>
                    <div className="text-[11px] text-gray-400">{t.route}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
