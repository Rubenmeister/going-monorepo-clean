'use client';

export default function ExperiencesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">🎭 Experiencias</h1>
          <p className="text-xl text-gray-600">
            Vive momentos inolvidables en Ecuador
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Experiencias Únicas
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-2 border-orange-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-orange-600 mb-3">🤿 Buceo</h3>
              <p className="text-gray-600">Sumérgete en las aguas de las Galápagos</p>
            </div>

            <div className="border-2 border-orange-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-orange-600 mb-3">🍽️ Gastronomía</h3>
              <p className="text-gray-600">Degusta la cocina ecuatoriana e internacional</p>
            </div>

            <div className="border-2 border-orange-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-orange-600 mb-3">🎨 Talleres</h3>
              <p className="text-gray-600">Aprende arte, música y artesanía local</p>
            </div>

            <div className="border-2 border-orange-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-orange-600 mb-3">🌳 Ecoturismo</h3>
              <p className="text-gray-600">Conecta con la naturaleza de forma sostenible</p>
            </div>
          </div>
        </div>

        <button className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg">
          Descubrir Experiencias
        </button>
      </div>
    </div>
  );
}
