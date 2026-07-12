import Link from 'next/link';

export const metadata = {
  title: 'Revista — Going App',
  description:
    'La revista de Going App: historias de viaje, destinos y cultura del Ecuador. Muy pronto.',
};

const teasers = [
  { emoji: '🏔️', title: 'Destinos', desc: 'Guías de los lugares que conecta Going, de la Sierra a la Costa.' },
  { emoji: '🚗', title: 'Historias al volante', desc: 'Las conductoras y conductores que mueven al Ecuador.' },
  { emoji: '🎒', title: 'Viaje colaborativo', desc: 'Consejos para viajar compartido, más barato y con propósito.' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

async function getRevistaArticles() {
  try {
    const res = await fetch(`${API_URL}/content?channel=revista&limit=12`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.items ?? []) as any[];
  } catch {
    return [];
  }
}

export default async function RevistaPage() {
  const articles = await getRevistaArticles();

  // Ya hay ediciones publicadas → mostrarlas.
  if (articles.length) {
    return (
      <main className="min-h-[72vh] bg-white">
        <section className="mx-auto max-w-5xl px-6 py-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            Revista <span style={{ color: '#FF4C41' }}>Going</span>
          </h1>
          <p className="text-gray-500 mb-10">Historias de viaje, destinos y cultura del Ecuador — contadas desde la carretera.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/revista/${a.id}`}
                className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm block hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-gradient-to-br from-[#FF4C41] to-[#FF8A3D] flex items-center justify-center text-white text-4xl">📖</div>
                <div className="p-5">
                  {a.category && <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C41]">{a.category}</span>}
                  <h2 className="font-bold text-gray-900 mt-1 mb-2 line-clamp-2">{a.title}</h2>
                  <p className="text-sm text-gray-500 line-clamp-4">{a.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    );
  }

  // Todavía sin ediciones → placeholder "Próximamente".
  return (
    <main className="min-h-[72vh] bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="inline-block text-[11px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full mb-6"
                style={{ backgroundColor: '#FFF3CC', color: '#8A6D00' }}>
            Próximamente
          </span>
          <div className="text-6xl mb-5">📖</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight text-balance">
            Revista <span style={{ color: '#FF4C41' }}>Going</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Historias de viaje, destinos y cultura del Ecuador — contadas desde la carretera.
            Estamos preparando la primera edición. 🇪🇨
          </p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/blog"
                  className="px-5 py-2.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#FF4C41' }}>
              Leer el Blog
            </Link>
            <Link href="/news"
                  className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
              Ver Noticias
            </Link>
          </div>
        </div>
      </section>

      {/* Qué traerá */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
          Lo que vas a encontrar
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          {teasers.map((t) => (
            <div key={t.title} className="rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <div className="text-3xl mb-3">{t.emoji}</div>
              <h3 className="font-bold text-gray-900">{t.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
