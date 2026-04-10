import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Revista Going — Cultura y Turismo en Ecuador',
  description: 'La revista de Going Ecuador. Destinos, cultura, gastronomía y estilo de vida ecuatoriano.',
};

const FEATURED = {
  title: 'Los 7 paisajes andinos que te quitarán el aliento en Ecuador',
  excerpt: 'De Cotopaxi a Chimborazo, de Quilotoa a Cajas — una guía visual de los rincones más impresionantes de la Sierra ecuatoriana.',
  date: '5 Abr 2026',
  read: '8 min',
  img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85',
  cat: 'Naturaleza',
};

const ARTICLES = [
  { title: 'Gastronomía en ruta: lo que debes comer antes de llegar a Baños', cat: 'Gastronomía', date: '3 Abr 2026', read: '5 min', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80' },
  { title: 'Mercados artesanales: Otavalo y el orgullo del tejido kichwa', cat: 'Cultura', date: '1 Abr 2026', read: '6 min', img: 'https://images.unsplash.com/photo-1581349437898-cebbe9831942?w=400&q=80' },
  { title: 'Cuenca: guía completa para un fin de semana perfecto', cat: 'Destinos', date: '28 Mar 2026', read: '7 min', img: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=400&q=80' },
  { title: 'El tren más hermoso del Ecuador y cómo llegar', cat: 'Aventura', date: '25 Mar 2026', read: '4 min', img: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=400&q=80' },
  { title: 'Fotografía de viaje: tips para capturar los Andes', cat: 'Tips', date: '20 Mar 2026', read: '5 min', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
  { title: 'Ibarra: la ciudad blanca que debes visitar este año', cat: 'Destinos', date: '18 Mar 2026', read: '4 min', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
];

const CATS = ['Todo', 'Destinos', 'Gastronomía', 'Cultura', 'Aventura', 'Tips', 'Naturaleza'];

export default function RevistaPage() {
  return (
    <div className="pt-[68px]">
      {/* Header */}
      <div className="bg-[#011627] py-16 px-6 border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-3">Publicación mensual</div>
          <h1 className="font-serif text-5xl font-black text-white mb-3">Revista Going</h1>
          <p className="text-[16px] text-white/50">Cultura, destinos y estilo de vida ecuatoriano.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-10">
          {CATS.map((cat, i) => (
            <button key={cat} className={`px-4 py-2 rounded-full text-[12px] font-black transition-all ${i === 0 ? 'bg-[#ff4c41] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Featured */}
        <Link href="#" className="group grid lg:grid-cols-2 gap-0 bg-white border-[1.5px] border-gray-100 rounded-3xl overflow-hidden mb-10 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="relative h-80 lg:h-auto overflow-hidden">
            <Image src={FEATURED.img} alt={FEATURED.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-red-50 text-[#ff4c41] rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider">📖 {FEATURED.cat}</span>
              <span className="text-[12px] text-gray-400 font-semibold">Artículo destacado</span>
            </div>
            <h2 className="font-serif text-3xl font-black text-[#011627] leading-tight mb-4">{FEATURED.title}</h2>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-5">{FEATURED.excerpt}</p>
            <p className="text-[12px] text-gray-400 font-semibold">{FEATURED.date} · {FEATURED.read} lectura</p>
          </div>
        </Link>

        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTICLES.map((a) => (
            <Link key={a.title} href="#" className="group bg-white border-[1.5px] border-gray-100 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="relative h-48 overflow-hidden">
                <Image src={a.img} alt={a.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <span className="text-[11px] font-black text-[#ff4c41] uppercase tracking-widest">{a.cat}</span>
                <h3 className="text-[15px] font-black text-[#011627] leading-tight mt-2 mb-2">{a.title}</h3>
                <p className="text-[12px] text-gray-400 font-semibold">{a.date} · {a.read} lectura</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
