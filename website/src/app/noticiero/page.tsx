import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Noticiero Going — Actualidad y Noticias',
  description: 'Las últimas noticias de Going Ecuador: nuevas rutas, actualizaciones de la app y noticias de movilidad.',
};

const NEWS = [
  { title: 'Going lanza nueva ruta Quito–Ambato–Baños con frecuencias cada 30 minutos', excerpt: 'Más de 200 asientos disponibles diariamente con conductores verificados y vehículos 2023 en adelante. La ruta conecta la Sierra Centro de lunes a domingo.', date: '8 Abr 2026', img: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=700&q=80', cat: 'Rutas', featured: true },
  { title: 'Nueva función: comparte tu tracking en tiempo real con familia y amigos', excerpt: 'La versión 2.4 de la app de Going incluye la posibilidad de compartir un link de seguimiento con cualquier persona.', date: '5 Abr 2026', img: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80', cat: 'App', featured: false },
  { title: 'Going supera los 50,000 usuarios activos en Ecuador', excerpt: 'En menos de 6 meses de operación, la plataforma consolida su presencia en la Sierra ecuatoriana.', date: '2 Abr 2026', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', cat: 'Empresa', featured: false },
  { title: 'Pago con DeUna disponible en Going a partir de mayo', excerpt: 'Los usuarios podrán pagar sus viajes con el sistema de pagos de billetera móvil del BCE.', date: '28 Mar 2026', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', cat: 'Pagos', featured: false },
  { title: 'Going Corporativo: movilidad empresarial para Quito y Guayaquil', excerpt: 'Las empresas ya pueden gestionar la movilidad de su equipo desde el portal corporativo con facturación centralizada.', date: '20 Mar 2026', img: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=400&q=80', cat: 'Corporativo', featured: false },
];

export default function NoticeroPage() {
  return (
    <div className="pt-[68px]">
      {/* Header */}
      <div className="bg-[#011627] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-3">Actualidad</div>
          <h1 className="font-serif text-5xl font-black text-white mb-3">Noticiero Going</h1>
          <p className="text-[16px] text-white/50">Noticias, actualizaciones y todo lo que pasa en Going Ecuador.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Featured */}
        {NEWS.filter(n => n.featured).map(n => (
          <Link key={n.title} href="#" className="group grid lg:grid-cols-5 gap-0 bg-white border-[1.5px] border-gray-100 rounded-3xl overflow-hidden mb-10 hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="lg:col-span-3 relative h-72 lg:h-auto overflow-hidden">
              <Image src={n.img} alt={n.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-4 left-4"><span className="bg-[#ff4c41] rounded-lg px-3 py-1 text-[11px] font-black text-white uppercase tracking-wider">{n.cat}</span></div>
            </div>
            <div className="lg:col-span-2 p-10 flex flex-col justify-center">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">📰 Noticia destacada</span>
              <h2 className="font-serif text-2xl font-black text-[#011627] leading-tight mb-4">{n.title}</h2>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-5">{n.excerpt}</p>
              <p className="text-[12px] text-gray-400 font-semibold">{n.date}</p>
            </div>
          </Link>
        ))}

        {/* News list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {NEWS.filter(n => !n.featured).map(n => (
            <Link key={n.title} href="#" className="group flex gap-4 bg-white border-[1.5px] border-gray-100 rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={n.img} alt={n.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex-1">
                <span className="inline-block bg-gray-50 rounded-lg px-2 py-0.5 text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">{n.cat}</span>
                <h3 className="text-[14px] font-black text-[#011627] leading-tight mb-1.5">{n.title}</h3>
                <p className="text-[12px] text-gray-400 font-semibold">{n.date}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
