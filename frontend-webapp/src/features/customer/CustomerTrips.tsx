import { useParams } from 'react-router-dom';

export default function CustomerTrips() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {id ? `Viaje #${id}` : 'Mis Viajes'}
          </h1>
        </header>

        {id ? (
          // Single trip view
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Detalles del Viaje</h2>
            <div className="space-y-2 text-gray-600">
              <p><strong>ID:</strong> {id}</p>
              <p><strong>Estado:</strong> En progreso</p>
              <p><strong>Origen:</strong> Centro</p>
              <p><strong>Destino:</strong> Norte</p>
            </div>
          </div>
        ) : (
          // Trip list
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Historial de Viajes</h2>
            <div className="space-y-3">
              <p className="p-4 bg-gray-50 rounded text-gray-500 text-center">
                No tienes viajes todavía
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
