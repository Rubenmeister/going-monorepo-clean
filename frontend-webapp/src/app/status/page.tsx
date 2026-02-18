'use client';

export default function StatusPage() {
  const services = [
    { name: 'API Web', status: '✓ Operativo', color: 'green' },
    { name: 'App Android', status: '✓ Operativo', color: 'green' },
    { name: 'App iOS', status: '✓ Operativo', color: 'green' },
    { name: 'Pagos', status: '✓ Operativo', color: 'green' },
    { name: 'Base de Datos', status: '✓ Operativo', color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">Estado del Servicio</h1>
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 font-semibold">✓ Todos los servicios operativos</p>
          </div>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.name} className="flex justify-between items-center p-4 border-b border-gray-200">
                <span className="text-gray-700">{service.name}</span>
                <span className="text-green-600 font-semibold">{service.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
