import { useParams } from 'react-router-dom';
import { ActivityList } from './ActivityList';

export function CustomerTrips() {
  const { id } = useParams();

  if (id) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Viaje #{id}
            </h1>
          </header>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Detalles del Viaje</h2>
            <div className="space-y-2 text-gray-600">
              <p><strong>ID:</strong> {id}</p>
              <p><strong>Estado:</strong> En progreso</p>
              <p><strong>Origen:</strong> Centro</p>
              <p><strong>Destino:</strong> Norte</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ActivityList />;
}
