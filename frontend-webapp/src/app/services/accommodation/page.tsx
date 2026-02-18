'use client';

export default function AccommodationPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🏨 Alojamiento</h1>
          <p className="text-xl text-gray-600">
            Encuentra el lugar perfecto para tu estadía
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Tipos de Alojamiento
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-2 border-purple-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-3">🏰 Hoteles</h3>
              <p className="text-gray-600">Hoteles de lujo y confort en toda Ecuador</p>
            </div>

            <div className="border-2 border-purple-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-3">🏡 Hostales</h3>
              <p className="text-gray-600">Opciones económicas y sociables para mochileros</p>
            </div>

            <div className="border-2 border-purple-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-3">🏠 Cabañas</h3>
              <p className="text-gray-600">Estancias rústicas en la naturaleza</p>
            </div>

            <div className="border-2 border-purple-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-3">🏨 Resorts</h3>
              <p className="text-gray-600">Complejos con todo incluido para vacaciones sin preocupaciones</p>
            </div>
          </div>
        </div>

        <button className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg">
          Buscar Alojamiento
        </button>
      </div>
    </div>
  );
}
