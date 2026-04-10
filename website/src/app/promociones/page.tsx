import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Promociones — Going Ecuador',
  description: 'Descuentos y ofertas especiales en viajes compartidos, privados y envíos por Ecuador.',
};

const PROMOS = [
  {
    code: 'GOING20',
    discount: '20% OFF',
    title: 'Tu primer viaje compartido',
    desc: 'Válido para nuevos usuarios en cualquier ruta de viaje compartido.',
    expires: '30 Abr 2026',
    tag: '🎉 Nuevo usuario',
    color: '#ff4c41',
  },
  {
    code: 'SIERRA10',
    discount: '10% OFF',
    title: 'Ruta Sierra Centro',
    desc: 'Quito · Latacunga · Ambato · Baños. Todos los viajes de abril.',
    expires: '30 Abr 2026',
    tag: '🏔 Ruta destacada',
    color: '#6366f1',
  },
  {
    code: 'GRUPO3',
    discount: '3x2',
    title: 'Grupos de 3 o más',
    desc: '¿Viajan en grupo? El tercer pasajero viaja gratis en viaje privado.',
    expires: '30 Jun 2026',
    tag: '👥 Grupos',
    color: '#16a34a',
  },
  {
    code: 'ENVIO15',
    discount: '15% OFF',
    title: 'Envíos interurbanos',
    desc: 'En tu primer envío entre ciudades. Seguimiento en tiempo real incluido.',
    expires: '31 May 2026',
    tag: '📦 Envíos',
    color: '#f59e0b',
  },
  {
    code: 'CORP30',
    discount: '30% OFF',
    title: 'Plan Corporativo — primer mes',
    desc: 'Para empresas con más de 5 empleados. Facturación centralizada.',
    expires: '30 Jun 2026',
    tag: '🏢 Corporativo',
    color: '#0ea5e9',
  },
  {
    code: 'REFERIDO',
    discount: '$5 USD',
    title: 'Programa de referidos',
    desc: 'Invita a un amigo. Cuando complete su primer viaje, ambos ganan $5.',
    expires: 'Sin vencimiento',
    tag: '🤝 Referidos',
    color: '#ff4c41',
  },
];

export default function PromocionesPage() {
  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#011627] to-[#0a2540] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 text-[11px] font-black tracking-[2px] uppercase text-red-400 mb-6">
            🎉 Ofertas exclusivas
          </div>
          <h1 className="font-serif text-5xl font-black text-white leading-tight mb-4">
            Promociones Going
          </h1>
          <p className="text-lg text-white/55 max-w-xl mx-auto">
            Descuentos reales en cada viaje. Copia el código y aplícalo al reservar en la app o la web.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROMOS.map((p) => (
            <div key={p.code} className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-6 hover:border-[#ff4c41]/30 hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <span className="inline-flex items-center gap-1 bg-gray-50 rounded-full px-3 py-1 text-[11px] font-black text-gray-500">
                  {p.tag}
                </span>
                <span className="text-3xl font-black" style={{ color: p.color }}>{p.discount}</span>
              </div>
              <h3 className="text-[17px] font-black text-[#011627] mb-2">{p.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">{p.desc}</p>
              {/* Code pill */}
              <div className="bg-gray-50 border-[1.5px] border-dashed border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                <span className="font-black text-[#011627] tracking-widest text-sm">{p.code}</span>
                <button className="text-[12px] font-black text-[#ff4c41] hover:underline">Copiar</button>
              </div>
              <p className="text-[11px] text-gray-400 font-semibold">Válido hasta: {p.expires}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-[#011627] rounded-3xl p-10 text-center">
          <h2 className="font-serif text-3xl font-black text-white mb-3">¿Tienes un código?</h2>
          <p className="text-white/50 mb-6">Aplícalo directamente al reservar tu viaje en la app de Going.</p>
          <Link href="https://app.goingec.com" className="inline-block px-8 py-4 rounded-xl bg-[#ff4c41] text-white font-black text-[15px] hover:bg-[#e03d32] transition-all">
            Ir a la app →
          </Link>
        </div>
      </div>
    </div>
  );
}
