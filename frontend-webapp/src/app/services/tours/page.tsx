'use client';

export default function ToursPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🎫 Tours</h1>
          <p className="text-xl text-gray-600">
            Descubre experiencias de viaje guiadas y emocionantes
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Tours Disponibles
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-green-600 mb-3">🏔️ Tours de Montaña</h3>
              <p className="text-gray-600">Escaladas a volcanes y caminatas en las alturas ecuatorianas</p>
            </div>

            <div className="border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-green-600 mb-3">🌴 Tours Amazónicos</h3>
              <p className="text-gray-600">Aventuras en la selva tropical más biodiversa del mundo</p>
            </div>

            <div className="border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-green-600 mb-3">🏖️ Tours de Playa</h3>
              <p className="text-gray-600">Relajación en hermosas playas y reservas marinas</p>
            </div>

            <div className="border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-green-600 mb-3">🗺️ Tours Culturales</h3>
              <p className="text-gray-600">Conoce la historia, arte y tradiciones ecuatorianas</p>
            </div>
          </div>
        </div>

        <button className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg">
          Explorar Tours
        </button>
      </div>
    </div>
  );
}
