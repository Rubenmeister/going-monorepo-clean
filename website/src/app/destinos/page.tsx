import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Destinos — Going App Ecuador',
  description: 'Viaja con Going App entre Quito, el Aeropuerto de Quito y Riobamba, Santo Domingo e Ibarra. Viajes compartidos puerta a puerta.',
};

// Rutas activas hoy: Quito y Aeropuerto de Quito ↔ Riobamba, Santo Domingo e Ibarra.
// Precios "Desde" = tarifa compartida por persona desde Quito (libs/pricing FARES).
// Nota: imágenes son placeholders (Unsplash) pendientes de fotos reales de Ecuador.
const DESTINOS = [
  { name: 'Ibarra', region: 'Sierra Norte', tag: '🚂 Histórico', hours: '2.5h', price: 'Desde $15', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=700&q=85', desc: 'Ciudad blanca del Ecuador. Helados de paila, tren de la libertad y Laguna de Yahuarcocha.' },
  { name: 'Santo Domingo', region: 'Trópico', tag: '🌿 Naturaleza', hours: '3h', price: 'Desde $15', img: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=700&q=85', desc: 'La puerta de entrada a la Costa. Clima cálido, naturaleza exuberante y la cultura Tsáchila.' },
  { name: 'Riobamba', region: 'Sierra Centro', tag: '🏔️ Andes', hours: '4h', price: 'Desde $20', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=85', desc: 'La Sultana de los Andes. Puerta al volcán Chimborazo, el punto más cercano al sol del planeta.' },
];

export default function DestinosPage() {
  return (
    <div className="pt-[88px]">
      {/* Hero */}
      <div className="relative bg-[#011627] py-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85" alt="Ecuador" fill className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#011627]/95 to-[#011627]/60" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-4">Destinos Going App</div>
          <h1 className="font-serif text-5xl font-black text-white leading-tight mb-4">
            Ecuador te espera
          </h1>
          <p className="text-lg text-white/55 max-w-xl">
            Desde los Andes hasta la Costa, Going App te lleva a los destinos más increíbles del país con seguridad y comodidad.
          </p>
        </div>
      </div>

      {/* Destinos grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DESTINOS.map((d) => (
            <Link key={d.name} href={`https://app.goingec.com/ride?type=shared&from=Quito&to=${encodeURIComponent(d.name)}`} className="group bg-white border-[1.5px] border-gray-100 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="relative h-52 overflow-hidden">
                <Image src={d.img} alt={d.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#011627]/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <span className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">{d.tag} · {d.hours}</span>
                  {d.price && <span className="bg-[#ff4c41] rounded-xl px-2.5 py-1 text-[12px] font-black text-white">{d.price}</span>}
                </div>
              </div>
              <div className="p-5">
                <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">{d.region}</div>
                <h3 className="text-[18px] font-black text-[#011627] mb-2">{d.name}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-4">{d.desc}</p>
                <span className="text-[13px] font-black text-[#ff4c41] group-hover:underline">Reservar →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
