import React from 'react';

const jobs = [
  {
    title: 'Desarrollador/a Full-Stack Senior',
    location: 'Quito, Ecuador',
    dept: 'Tecnología',
  },
  { title: 'Product Manager', location: 'Quito, Ecuador', dept: 'Producto' },
  { title: 'Diseñador/a UX/UI', location: 'Quito, Ecuador', dept: 'Diseño' },
  { title: 'Analista de Datos', location: 'Quito, Ecuador', dept: 'Datos' },
  { title: 'Ingeniero/a DevOps', location: 'Quito, Ecuador', dept: 'Infraestructura' },
  { title: 'Ejecutivo/a de Ventas', location: 'Quito, Ecuador', dept: 'Ventas' },
];

export const metadata = {
  title: 'Trabaja en Going — Únete al Equipo',
  description:
    'Explora oportunidades de carrera y únete al equipo Going. Ayúdanos a transformar la movilidad en Ecuador.',
};

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Únete al Equipo</h1>
          <p className="text-xl text-primary-100">
            Ayúdanos a transformar la movilidad en Ecuador
          </p>
        </div>
      </section>

      {/* Por qué Going */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
          ¿Por qué trabajar en Going?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🚀',
              title: 'Innovación',
              desc: 'Trabaja en soluciones de movilidad de vanguardia para Ecuador',
            },
            {
              icon: '🌍',
              title: 'Impacto local',
              desc: 'Transforma la manera en que las personas se mueven en el país',
            },
            {
              icon: '💼',
              title: 'Crecimiento',
              desc: 'Desarrolla tu carrera en una startup de alto crecimiento',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Posiciones abiertas */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Posiciones Abiertas
          </h2>
          <div className="space-y-4">
            {jobs.map((job, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-700 p-6 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {job.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    📍 {job.location} • {job.dept}
                  </p>
                </div>
                <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors">
                  Postularme
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
          Beneficios y Ventajas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            '💊 Seguro médico',
            '📚 Presupuesto para aprendizaje',
            '🏠 Trabajo flexible',
            '💰 Salario competitivo',
            '📈 Participación accionaria',
            '🏖️ Vacaciones',
          ].map((benefit, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center"
            >
              {benefit}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
