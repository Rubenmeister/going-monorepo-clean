'use client';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">Trabaja con Nosotros</h1>
        <div className="bg-white rounded-xl shadow-md p-8">
          <p className="text-gray-600 mb-6">Únete a nuestro equipo de viajeros apasionados y crea el futuro de los viajes en Ecuador.</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Ver Posiciones Abiertas
          </button>
        </div>
      </div>
    </div>
  );
}
