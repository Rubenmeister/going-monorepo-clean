'use client';

export default function TransportPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">✈️ Transporte</h1>
          <p className="text-xl text-gray-600">
            Explora nuestras opciones de transporte para tus viajes
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Opciones de Transporte
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-3">✈️ Vuelos</h3>
              <p className="text-gray-600">Reserva vuelos nacionales e internacionales con las mejores aerolíneas</p>
            </div>

            <div className="border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-3">🚌 Buses</h3>
              <p className="text-gray-600">Viaja cómodamente en bus entre ciudades ecuatorianas</p>
            </div>

            <div className="border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-3">🚗 Rentals</h3>
              <p className="text-gray-600">Renta vehículos para explorar a tu propio ritmo</p>
            </div>

            <div className="border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-3">🚕 Transfers</h3>
              <p className="text-gray-600">Traslados privados y seguros desde/hacia aeropuertos y hoteles</p>
            </div>
          </div>
        </div>

        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg">
          Buscar Transporte
        </button>
      </div>
    </div>
  );
}
