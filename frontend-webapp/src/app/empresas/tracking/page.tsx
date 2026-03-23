'use client';

import EmpresasLayout from '../EmpresasLayout';

const TRIPS = [
  { id: 't-001', traveler: 'Carlos Rodríguez', route: 'Quito → Guayaquil',   status: 'in_progress', vehicle: 'Toyota Fortuner · ABC-1234', driver: 'Juan Quispe',   eta: '2:30 PM', progress: 65 },
  { id: 't-002', traveler: 'Ana Martínez',     route: 'Guayaquil → Hotel',   status: 'completed',   vehicle: 'Hyundai Accent · XYZ-5678', driver: 'Pedro Mora',    eta: 'Llegó',   progress: 100 },
  { id: 't-003', traveler: 'Luis Pérez',       route: 'Quito → Aeropuerto',  status: 'pending',     vehicle: 'Por asignar',               driver: 'Por asignar',   eta: '6:00 PM', progress: 0 },
];

const STATUS = {
  in_progress: { label: 'En camino',  color: '#0ea5e9', bg: 'bg-blue-100 text-blue-800'   },
  completed:   { label: 'Completado', color: '#22C55E', bg: 'bg-green-100 text-green-800'  },
  pending:     { label: 'Pendiente',  color: '#F59E0B', bg: 'bg-yellow-100 text-yellow-800'},
};

export default function TrackingPage() {
  return (
    <EmpresasLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>
          <p className="text-gray-500 mt-1 text-sm">Monitorea los viajes activos de tu equipo en tiempo real</p>
        </div>

        <div className="space-y-4">
          {TRIPS.map(trip => {
            const s = STATUS[trip.status as keyof typeof STATUS];
            return (
              <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{trip.traveler}</span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${s.bg}`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">📍 {trip.route}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">ETA: {trip.eta}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${trip.progress}%`, backgroundColor: s.color }} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Vehículo</p>
                    <p className="font-medium text-gray-700">{trip.vehicle}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Conductor</p>
                    <p className="font-medium text-gray-700">{trip.driver}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
          📍 El seguimiento GPS en tiempo real estará disponible próximamente. Contacta a <a href="mailto:empresas@goingec.com" className="underline font-medium">empresas@goingec.com</a> para más información.
        </div>
      </div>
    </EmpresasLayout>
  );
}
