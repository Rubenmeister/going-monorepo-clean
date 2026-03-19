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
              <li>Compensa de carbono en todos los vuelos</li>
              <li>Asociaciones con operadores ecoturísticos</li>
              <li>Apoyo a comunidades indígenas y locales</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
