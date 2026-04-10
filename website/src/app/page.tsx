import Link from 'next/link';
import Image from 'next/image';

/* ── Going SVG Logo ──────────────────────────────────────────── */
const GoingIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="72" cy="18" r="8" fill="#ff4c41" />
    <path d="M68 26 C68 26 58 30 50 40 C38 54 34 68 38 80 C42 92 58 96 70 90 C82 84 86 70 82 58 C78 46 66 42 58 46 C50 50 48 60 52 68 C56 76 64 76 70 70"
      stroke="#ff4c41" strokeWidth="7" strokeLinecap="round" fill="none" />
  </svg>
);

/* ── Data ─────────────────────────────────────────────────────── */
const SERVICES = [
  { icon: '🚍', title: 'Viaje Compartido', sub: 'La forma más inteligente de viajar. Divide el costo y llega seguro.', badge: '⭐ Lo más popular', featured: true },
  { icon: '🚗', title: 'Privado en SUV', sub: 'Tu propio vehículo premium. Máxima comodidad, horario flexible.', badge: 'Desde $45', featured: false },
  { icon: '📦', title: 'Envíos', sub: 'Envía paquetes entre ciudades con tracking en tiempo real.', badge: 'Tracking live', featured: false },
  { icon: '🏢', title: 'Corporativo', sub: 'Soluciones de movilidad para empresas con facturación centralizada.', badge: 'Para empresas', featured: false },
];

const DESTINOS = [
  { name: 'Baños de Agua Santa', region: '🌋 Aventura · 3h desde Quito', price: 'Desde $8', img: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=700&q=85', featured: true },
  { name: 'Cuenca', region: '🏛️ Patrimonio · 8h', price: 'Desde $18', img: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=500&q=85', featured: false },
  { name: 'Otavalo', region: '🧶 Cultura · 2h', price: 'Desde $6', img: 'https://images.unsplash.com/photo-1581349437898-cebbe9831942?w=500&q=85', featured: false },
  { name: 'Guayaquil', region: '🌆 Ciudad · 8h', price: 'Desde $15', img: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=500&q=85', featured: false },
];

const ARTICLES = [
  {
    cat: '📰 Noticiero', catHref: '/noticiero',
    title: 'Going lanza nueva ruta Quito–Ambato–Baños con frecuencias cada 30 minutos',
    excerpt: 'Más de 200 asientos disponibles diariamente con conductores verificados y vehículos 2023 en adelante.',
    date: '8 Abr 2026', read: '3 min',
    img: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=700&q=80', featured: true,
  },
  {
    cat: '📖 Revista', catHref: '/revista',
    title: 'Los 7 paisajes andinos que te quitarán el aliento',
    date: '5 Abr 2026', read: '5 min',
    img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80', featured: false,
  },
  {
    cat: '✍️ Blog', catHref: '/blog',
    title: 'Cómo viajar seguro en Ecuador: guía completa 2026',
    date: '2 Abr 2026', read: '7 min',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', featured: false,
  },
];

const TESTIMONIALS = [
  { stars: 5, text: 'El PIN de seguridad me dio mucha confianza. Supe exactamente a qué vehículo subir.', name: 'Ana Rodríguez', route: 'Quito → Baños', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80' },
  { stars: 5, text: 'Como conductor, Going me da estabilidad y un ingreso justo. La app es muy fácil de usar.', name: 'Carlos Mendoza', route: 'Conductor · 847 viajes', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80' },
  { stars: 5, text: 'Mejor que el bus y más barato que el taxi. Siempre viajo Going de Latacunga a Quito.', name: 'María Toapanta', route: 'Latacunga → Quito', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80' },
  { stars: 5, text: 'El tracking en vivo me tranquiliza cuando viaja mi hija. Sé exactamente dónde está.', name: 'Rosa Guerrero', route: 'Ibarra → Quito', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80' },
];

/* ── Main component ───────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      {/* ══ HERO ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-[#011627] pt-[68px]">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1526397751294-331021109fbd?w=1600&q=85"
            alt="Ecuador"
            fill
            className="object-cover object-center opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#011627]/98 via-[#011627]/70 to-[#011627]/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-20 items-center w-full">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 text-[11px] font-black tracking-[2px] uppercase text-red-400 mb-7">
              🇪🇨 Ecuador de norte a sur
            </div>
            <h1 className="font-serif text-[clamp(42px,5.5vw,70px)] font-black text-white leading-[1.04] mb-5 tracking-tight">
              Nos movemos<br /><span className="text-[#ff4c41]">contigo</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed mb-9 max-w-lg">
              Viajes compartidos, privados, envíos y más — con los estándares más altos de seguridad y servicio del país.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="https://app.goingec.com"
                className="px-7 py-4 rounded-xl font-black text-white bg-[#ff4c41] shadow-[0_4px_20px_rgba(255,76,65,0.4)] hover:bg-[#e03d32] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,76,65,0.5)] transition-all text-[15px]"
              >
                Reservar un viaje
              </Link>
              <Link
                href="/descargar"
                className="px-7 py-4 rounded-xl font-black text-white bg-white/8 border border-white/20 hover:bg-white/14 transition-all text-[15px]"
              >
                📱 Descargar app
              </Link>
            </div>
            <div className="flex gap-7">
              {[
                { icon: '⭐', val: '4.92', label: 'Rating promedio' },
                { icon: '🛡️', val: 'PIN verificado', label: '100% seguro' },
                { icon: '🚍', val: '50+ rutas', label: 'En Ecuador' },
              ].map((b) => (
                <div key={b.val} className="flex items-center gap-2.5">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <div className="text-sm font-black text-white">{b.val}</div>
                    <div className="text-xs text-white/40 font-semibold">{b.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking widget */}
          <div className="bg-white rounded-3xl p-7 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
              {['🚍 Compartido', '🚗 Privado', '📦 Envío'].map((tab, i) => (
                <button
                  key={tab}
                  className={`flex-1 py-2.5 rounded-lg text-[12px] font-black transition-all ${i === 0 ? 'bg-white text-[#ff4c41] shadow-sm' : 'text-gray-500'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {[
              { label: '📍 Origen', placeholder: '¿Desde dónde sales?' },
              { label: '🏁 Destino', placeholder: '¿A dónde vas?' },
            ].map((f) => (
              <div key={f.label} className="mb-4">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-[1px] mb-1.5">{f.label}</div>
                <input
                  className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-[#ff4c41] transition-colors"
                  placeholder={f.placeholder}
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-[1px] mb-1.5">📅 Fecha</div>
                <input type="date" className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-[#ff4c41] transition-colors" />
              </div>
              <div>
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-[1px] mb-1.5">👥 Pasajeros</div>
                <input className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-[#ff4c41] transition-colors" placeholder="1 pasajero" />
              </div>
            </div>
            <Link
              href="https://app.goingec.com/search"
              className="block w-full py-3.5 rounded-xl bg-[#ff4c41] text-white text-center font-black text-[15px] shadow-[0_4px_16px_rgba(255,76,65,0.35)] hover:bg-[#e03d32] hover:-translate-y-0.5 transition-all"
            >
              Buscar viajes →
            </Link>
            <p className="text-center text-[11px] text-gray-400 font-semibold mt-3">🔒 Pago seguro · Sin comisiones ocultas</p>
          </div>
        </div>
      </section>

      {/* ══ PROMO STRIP ════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#ff4c41] to-[#cc2a20]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-5 flex-wrap">
          <span className="bg-white/20 rounded-full px-3 py-1 text-[11px] font-black text-white tracking-widest uppercase flex-shrink-0">
            🎉 Promo activa
          </span>
          <p className="text-[15px] font-black text-white flex-1 text-center">
            20% OFF en tu primer viaje con código <strong>GOING20</strong>
            <span className="font-semibold text-white/75"> · válido hasta el 30 de abril</span>
          </p>
          <Link href="/promociones" className="border border-white/40 rounded-lg px-4 py-2 text-[13px] font-black text-white hover:bg-white/15 transition-all flex-shrink-0">
            Ver todas →
          </Link>
        </div>
      </div>

      {/* ══ SERVICIOS ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-2.5">Nuestros servicios</div>
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-black text-[#011627] leading-tight">
            Todo lo que necesitas<br />en un solo lugar
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s) => (
            <Link
              key={s.title}
              href="https://app.goingec.com"
              className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-7 hover:border-[#ff4c41] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(255,76,65,0.12)] transition-all group"
            >
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-[17px] font-black text-[#011627] mb-2">{s.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-4">{s.sub}</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${s.featured ? 'bg-red-50 text-[#ff4c41]' : 'bg-gray-50 text-gray-500'}`}>
                {s.badge}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ DESTINOS ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-2.5">Destinos Going</div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-black text-[#011627] leading-tight">Ecuador te espera</h2>
          </div>
          <Link href="/destinos" className="text-[13px] font-black text-[#ff4c41] hover:underline">Ver todos →</Link>
        </div>
        <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[440px]">
          {DESTINOS.map((d, i) => (
            <Link
              key={d.name}
              href="/destinos"
              className={`relative rounded-2xl overflow-hidden group cursor-pointer ${d.featured ? 'row-span-2 col-span-1' : ''}`}
            >
              <Image
                src={d.img}
                alt={d.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#011627]/85 via-[#011627]/10 to-transparent" />
              <div className="absolute top-3 right-3 bg-[#ff4c41] rounded-xl px-2.5 py-1 text-[12px] font-black text-white">
                {d.price}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className={`font-black text-white mb-1.5 ${d.featured ? 'text-2xl' : 'text-[17px]'}`}>{d.name}</h3>
                <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
                  {d.region}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ APP DOWNLOAD ════════════════════════════════════════ */}
      <section className="bg-[#011627] py-20 px-6 overflow-hidden relative">
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#ff4c41]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-3">Descarga Going</div>
            <h2 className="font-serif text-[clamp(32px,4.5vw,52px)] font-black text-white leading-tight mb-4">
              Tu viaje en la palma<br />de tu mano
            </h2>
            <p className="text-[16px] text-white/50 leading-relaxed mb-9">
              Reserva, rastrea y paga desde la app. PIN de seguridad verificado, conductor calificado y soporte 24/7.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: '🍎', sub: 'Disponible en', name: 'App Store' },
                { icon: '▶️', sub: 'Disponible en', name: 'Google Play' },
              ].map((store) => (
                <Link
                  key={store.name}
                  href="/descargar"
                  className="flex items-center gap-3 bg-white/[0.07] border border-white/[0.12] rounded-2xl px-5 py-3.5 hover:bg-white/12 hover:border-white/25 transition-all"
                >
                  <span className="text-3xl">{store.icon}</span>
                  <div>
                    <div className="text-[10px] text-white/45 font-bold uppercase tracking-wider">{store.sub}</div>
                    <div className="text-[17px] font-black text-white">{store.name}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { val: '50k+', label: 'Usuarios activos' },
                { val: '4.9★', label: 'Rating en stores' },
                { val: '99%', label: 'Viajes seguros' },
              ].map((stat) => (
                <div key={stat.val} className="bg-white/[0.05] rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black text-white mb-1">{stat.val}</div>
                  <div className="text-[11px] text-white/35 font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockups */}
          <div className="flex gap-5 justify-center items-end">
            {[
              { img: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=85', rotate: '-rotate-[4deg] translate-y-6' },
              { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=85', rotate: 'rotate-[4deg] translate-y-6' },
            ].map(({ img, rotate }, i) => (
              <div key={i} className={`w-[170px] rounded-[32px] bg-[#0d1117] border-2 border-white/[0.08] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] ${rotate}`}>
                <Image src={img} alt="App Going" width={170} height={306} className="w-full" style={{ aspectRatio: '9/18', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EDITORIAL ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-2.5">Editorial Going</div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-black text-[#011627] leading-tight">
              Cultura, destinos<br />y actualidad
            </h2>
          </div>
          <div className="flex gap-2">
            {[{ label: '📰 Noticiero', href: '/noticiero' }, { label: '📖 Revista', href: '/revista' }, { label: '✍️ Blog', href: '/blog' }].map((tab) => (
              <Link key={tab.label} href={tab.href} className="px-4 py-2 rounded-full text-[12px] font-black bg-gray-100 text-gray-500 hover:bg-[#ff4c41] hover:text-white transition-all">
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {ARTICLES.map((a) => (
            <Link
              key={a.title}
              href={a.catHref}
              className={`bg-white border-[1.5px] border-gray-100 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all group`}
            >
              <div className={`relative overflow-hidden ${a.featured ? 'h-[260px]' : 'h-[200px]'}`}>
                <Image src={a.img} alt={a.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <Link href={a.catHref} className="text-[11px] font-black text-[#ff4c41] uppercase tracking-widest mb-2.5 block">{a.cat}</Link>
                <h3 className={`font-black text-[#011627] leading-tight mb-2 ${a.featured ? 'text-[19px]' : 'text-[15px]'}`}>{a.title}</h3>
                {a.excerpt && <p className="text-[13px] text-gray-500 leading-relaxed mb-2">{a.excerpt}</p>}
                <p className="text-[12px] text-gray-400 font-semibold">{a.date} · {a.read} lectura</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ COMUNIDAD ══════════════════════════════════════════ */}
      <section className="bg-[#faf8f5] py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-2.5">Comunidad Going</div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-black text-[#011627] leading-tight mb-4">
              Somos más que<br />un servicio
            </h2>
            <p className="text-[16px] text-gray-500 leading-relaxed mb-8">
              Una comunidad de viajeros, conductores y emprendedores ecuatorianos que construyen juntos una mejor movilidad.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { val: '50k+', label: 'Usuarios activos', sub: 'En todo Ecuador' },
                { val: '1,200+', label: 'Conductores', sub: 'Verificados y calificados' },
                { val: '50+', label: 'Rutas activas', sub: 'Sierra y Costa' },
                { val: '4.92★', label: 'Rating promedio', sub: 'De 10,000+ reseñas' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-5">
                  <div className="text-3xl font-black text-[#ff4c41] mb-1">{stat.val}</div>
                  <div className="text-[13px] font-black text-[#011627] mb-0.5">{stat.label}</div>
                  <div className="text-[12px] text-gray-400">{stat.sub}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="https://app.goingec.com/register" className="px-6 py-3 rounded-xl bg-[#ff4c41] text-white font-black text-[14px] hover:bg-[#e03d32] transition-all">
                Unirme como pasajero
              </Link>
              <Link href="/comunidad#conductores" className="px-6 py-3 rounded-xl bg-[#011627] text-white font-black text-[14px] hover:bg-[#0a2540] transition-all">
                Quiero ser conductor
              </Link>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-2 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border-[1.5px] border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-yellow-400 text-sm mb-3">{'★'.repeat(t.stars)}</div>
                <p className="text-[14px] text-[#1a1a2e] leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <Image src={t.avatar} alt={t.name} width={36} height={36} className="rounded-full object-cover border-2 border-gray-100" />
                  <div>
                    <div className="text-[13px] font-black text-[#011627]">{t.name}</div>
                    <div className="text-[11px] text-gray-400">{t.route}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ QUIÉNES SOMOS ══════════════════════════════════════ */}
      <section className="bg-[#011627] py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="grid grid-cols-2 gap-3">
            {[
              { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=85', mt: 'mt-8' },
              { img: 'https://images.unsplash.com/photo-1526397751294-331021109fbd?w=400&q=85', mt: '' },
            ].map(({ img, mt }, i) => (
              <div key={i} className={`${mt} rounded-2xl overflow-hidden`} style={{ aspectRatio: '3/4' }}>
                <Image src={img} alt="Going Ecuador" width={300} height={400} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div>
            <div className="text-[11px] font-black tracking-[3px] uppercase text-[#ff4c41] mb-2.5">Quiénes somos</div>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-black text-white leading-tight mb-5">
              Una empresa<br />ecuatoriana<br />con propósito
            </h2>
            <p className="text-[15px] text-white/50 leading-relaxed mb-7">
              Going nació en 2026 con una misión clara: democratizar la movilidad en Ecuador. Somos un equipo joven, apasionado por la tecnología y el turismo, comprometido con la seguridad y el impacto local.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-7">
              {[
                { icon: '🛡️', title: 'Seguridad primero', sub: 'PIN verificado, conductores evaluados' },
                { icon: '🌱', title: 'Impacto local', sub: 'Generamos empleo ecuatoriano' },
                { icon: '♻️', title: 'Sostenibilidad', sub: 'Menos autos, menos emisiones' },
                { icon: '💡', title: 'Innovación', sub: 'Tecnología hecha en Ecuador' },
              ].map((v) => (
                <div key={v.title} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4">
                  <div className="text-2xl mb-2">{v.icon}</div>
                  <div className="text-[13px] font-black text-white mb-1">{v.title}</div>
                  <div className="text-[12px] text-white/40 leading-relaxed">{v.sub}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Link href="/quienes-somos" className="px-6 py-3 rounded-xl bg-[#ff4c41] text-white font-black text-[14px] hover:bg-[#e03d32] transition-all">
                Conocer más
              </Link>
              <Link href="/quienes-somos#careers" className="px-6 py-3 rounded-xl border border-white/20 text-white/70 font-black text-[14px] hover:bg-white/[0.07] transition-all">
                Trabaja con nosotros
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
