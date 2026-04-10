import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Destinos — Going Ecuador',
  description: 'Explora los mejores destinos de Ecuador con Going. Baños, Cuenca, Otavalo, Guayaquil y más.',
};

const DESTINOS = [
  { name: 'Baños de Agua Santa', region: 'Sierra Centro', tag: '🌋 Aventura', hours: '3h', price: 'Desde $8', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=700&q=85', desc: 'La capital de la aventura ecuatoriana. Cascadas, volcán Tungurahua, taffy y adrenalina.' },
  { name: 'Cuenca', region: 'Sierra Sur', tag: '🏛️ Patrimonio', hours: '8h', price: 'Desde $18', img: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=700&q=85', desc: 'Ciudad Patrimonio de la Humanidad. Arquitectura colonial, mercados y gastronomía única.' },
  { name: 'Otavalo', region: 'Sierra Norte', tag: '🧶 Cultura', hours: '2h', price: 'Desde $6', img: 'https://images.unsplash.com/photo-1581349437898-cebbe9831942?w=700&q=85', desc: 'El mercado artesanal más famoso de Sudamérica. Textiles, cultura kichwa y Laguna de San Pablo.' },
  { name: 'Guayaquil', region: 'Costa', tag: '🌆 Ciudad', hours: '8h', price: 'Desde $15', img: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=700&q=85', desc: 'La ciudad puerto. El Malecón, Las Peñas, gastronomía costeña y energía urbana.' },
  { name: 'Ambato', region: 'Sierra Centro', tag: '🌸 Ciudad', hours: '2.5h', price: 'Desde $7', img: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=700&q=85', desc: 'La ciudad de las flores y las frutas. Portal de acceso a la ruta del Quilotoa y Baños.' },
  { name: 'Ibarra', region: 'Sierra Norte', tag: '🚂 Histórico', hours: '2.5h', price: 'Desde $7', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=700&q=85', desc: 'Ciudad blanca del Ecuador. Helados de paila, tren de la libertad y Laguna de Yahuarcocha.' },
];

export default function DestinosPage() {
  return (
    <div className="pt-[68px]">
      {/* Hero */}
      <div className="relative bg-[#011627] py-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85" alt="Ecuador" fill className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#011627]/95 to-[#011627]/60" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-4">Destinos Going</div>
          <h1 className="font-serif text-5xl font-black text-white leading-tight mb-4">
            Ecuador te espera
          </h1>
          <p className="text-lg text-white/55 max-w-xl">
            Desde los Andes hasta la Costa, Going te lleva a los destinos más increíbles del país con seguridad y comodidad.
          </p>
        </div>
      </div>

      {/* Destinos grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DESTINOS.map((d) => (
            <Link key={d.name} href="https://app.goingec.com/search" className="group bg-white border-[1.5px] border-gray-100 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="relative h-52 overflow-hidden">
                <Image src={d.img} alt={d.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#011627]/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <span className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">{d.tag} · {d.hours}</span>
                  <span className="bg-[#ff4c41] rounded-xl px-2.5 py-1 text-[12px] font-black text-white">{d.price}</span>
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
