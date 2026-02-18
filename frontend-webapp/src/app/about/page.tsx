'use client';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Quiénes Somos</h1>
        <p className="text-xl text-gray-600 mb-8">
          La plataforma líder en viajes y experiencias en Ecuador
        </p>

        <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
            <p className="text-gray-600">
              Conectar viajeros con experiencias auténticas y sostenibles en Ecuador, facilitando el acceso a transporte, alojamiento, tours y experiencias de calidad.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Visión</h2>
            <p className="text-gray-600">
              Ser la plataforma más confiable y completa para viajeros que desean explorar Ecuador de forma segura y responsable.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestros Valores</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Sostenibilidad y responsabilidad ambiental</li>
              <li>Confianza y transparencia</li>
              <li>Innovación continua</li>
              <li>Compromiso con las comunidades locales</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
