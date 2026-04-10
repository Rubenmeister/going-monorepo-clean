import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Quiénes Somos — Going Ecuador',
  description: 'Conoce la historia, misión y equipo detrás de Going Ecuador, la plataforma de movilidad más segura del país.',
};

export default function QuienesSomosPage() {
  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="relative bg-[#011627] py-28 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=85" alt="Ecuador" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#011627] to-[#011627]/70" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-4">Nuestra historia</div>
          <h1 className="font-serif text-5xl font-black text-white leading-tight mb-5">
            Una empresa ecuatoriana<br />con propósito
          </h1>
          <p className="text-lg text-white/55 max-w-xl leading-relaxed">
            Going nació en 2026 con una misión clara: democratizar la movilidad en Ecuador. Tecnología, seguridad e impacto local — hecho en Ecuador para Ecuador.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Misión */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-3">Nuestra misión</div>
            <h2 className="font-serif text-4xl font-black text-[#011627] leading-tight mb-4">
              Conectar a Ecuador,<br />ciudad por ciudad
            </h2>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-4">
              Creemos que viajar de forma segura, cómoda y asequible es un derecho, no un privilegio. Going existe para hacer esa realidad posible en cada rincón del Ecuador.
            </p>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Somos una plataforma tecnológica que conecta pasajeros con conductores verificados, usando inteligencia para hacer cada viaje mejor que el anterior.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🛡️', title: 'Seguridad primero', sub: 'PIN verificado, conductores evaluados en cada viaje.' },
              { icon: '🌱', title: 'Impacto local', sub: 'Generamos empleo de calidad en Ecuador.' },
              { icon: '♻️', title: 'Sostenibilidad', sub: 'Viajes compartidos = menos emisiones de CO₂.' },
              { icon: '💡', title: 'Innovación', sub: 'Tecnología 100% desarrollada en Ecuador.' },
            ].map(v => (
              <div key={v.title} className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-5 hover:border-[#ff4c41]/30 transition-all">
                <div className="text-3xl mb-3">{v.icon}</div>
                <div className="text-[14px] font-black text-[#011627] mb-1.5">{v.title}</div>
                <div className="text-[12px] text-gray-500 leading-relaxed">{v.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Numbers */}
        <div className="bg-[#011627] rounded-3xl p-10 mb-24">
          <h2 className="font-serif text-3xl font-black text-white text-center mb-10">Going en números</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { val: '2026', label: 'Año de fundación', icon: '🚀' },
              { val: '50k+', label: 'Usuarios activos', icon: '👥' },
              { val: '50+', label: 'Rutas en Ecuador', icon: '🗺️' },
              { val: '1,200+', label: 'Conductores', icon: '🚗' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-3xl font-black text-[#ff4c41] mb-1">{s.val}</div>
                <div className="text-[13px] text-white/50 font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Careers */}
        <div id="careers" className="text-center">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-3">Trabaja con nosotros</div>
          <h2 className="font-serif text-4xl font-black text-[#011627] leading-tight mb-4">
            Construye Going<br />con nosotros
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed max-w-xl mx-auto mb-8">
            Somos un equipo joven y apasionado. Buscamos personas que quieran resolver problemas reales con tecnología y construir el futuro de la movilidad en Ecuador.
          </p>
          <Link href="mailto:hola@goingec.com" className="inline-block px-8 py-4 rounded-xl bg-[#ff4c41] text-white font-black text-[15px] hover:bg-[#e03d32] transition-all">
            Escríbenos →
          </Link>
        </div>
      </div>
    </div>
  );
}
