'use client';

export default function BlogPage() {
  const posts = [
    { title: '10 Lugares Imprescindibles en Ecuador', date: '2026-02-15', excerpt: 'Descubre los lugares más bellos del país' },
    { title: 'Guía de Viaje a las Galápagos', date: '2026-02-10', excerpt: 'Todo lo que necesitas saber para visitar estas islas mágicas' },
    { title: 'Aventura en la Amazonía', date: '2026-02-05', excerpt: 'Experiencias y consejos para explorar la selva' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">Blog Going</h1>
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.title} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-sm text-gray-500 mb-3">{post.date}</p>
              <p className="text-gray-600">{post.excerpt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
