'use client';

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">Sostenibilidad</h1>
        <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Nuestro Compromiso Ambiental</h2>
            <p className="text-gray-600">En Going, promovemos viajes sostenibles y responsables que protegen los ecosistemas ecuatorianos.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Iniciativas Verdes</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Compensación de carbono en todos los viajes</li>
              <li>Asociaciones con operadores ecoturísticos certificados</li>
              <li>Apoyo a comunidades indígenas y locales del Ecuador</li>
              <li>Promoción de rutas interurbanas compartidas para reducir emisiones</li>
              <li>Incentivos para conductores con vehículos eléctricos o híbridos</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Movilidad Responsable</h2>
            <p className="text-gray-600">Going impulsa el transporte compartido como alternativa sostenible al vehículo particular. Cada viaje compartido reduce el tráfico vehicular, las emisiones de CO₂ y el consumo de combustible en las ciudades ecuatorianas.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Turismo Consciente</h2>
            <p className="text-gray-600">Trabajamos con guías y operadores locales que respetan los ecosistemas del Ecuador — desde la Amazonía hasta las Islas Galápagos — siguiendo los principios del ecoturismo responsable.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
