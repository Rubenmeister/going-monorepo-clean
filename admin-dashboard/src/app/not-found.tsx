import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#0033A0]">404</h1>
        <p className="text-xl text-gray-600 mt-4">Página no encontrada</p>
        <Link 
          href="/"
          className="mt-6 inline-block px-6 py-2 bg-[#0033A0] text-white rounded-md hover:bg-opacity-90"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
