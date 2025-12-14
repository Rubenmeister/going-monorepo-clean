import { useParams } from 'react-router-dom';

export default function ProviderTours() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {id ? `Tour #${id}` : 'Mis Tours'}
          </h1>
          {!id && (
            <button className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
              + Crear Tour
            </button>
          )}
        </header>

        {id ? (
          // Single tour view
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Detalles del Tour</h2>
            <div className="space-y-2 text-gray-600">
              <p><strong>ID:</strong> {id}</p>
              <p><strong>Estado:</strong> Activo</p>
              <p><strong>Capacidad:</strong> 10 personas</p>
              <p><strong>Precio:</strong> $50 USD</p>
            </div>
          </div>
        ) : (
          // Tour list
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Lista de Tours</h2>
            <div className="space-y-3">
              <p className="p-4 bg-gray-50 rounded text-gray-500 text-center">
                No tienes tours creados todavía
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
