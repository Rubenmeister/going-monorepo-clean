import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl mb-4">🗺️</p>
      <h1 className="text-3xl font-black text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-xs">
        Esta ruta no existe o fue movida. Vuelve al inicio y continúa explorando Ecuador.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm shadow-sm hover:shadow-md transition-all"
          style={{ backgroundColor: '#ff4c41' }}
        >
          Ir al inicio
        </Link>
        <Link
          href="/search"
          className="px-5 py-2.5 rounded-xl font-bold text-gray-700 text-sm bg-white border border-gray-200 hover:border-gray-300 transition-all"
        >
          Buscar servicios
        </Link>
      </div>
    </div>
  );
}
