'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';

const COURSES = [
  {
    id: 1,
    icon: '🚗',
    category: 'Conductores',
    title: 'Cómo ser conductor Going',
    description:
      'Aprende todo lo que necesitas para empezar a generar ingresos como conductor en nuestra plataforma.',
    lessons: 8,
    duration: '2h 30min',
    level: 'Principiante',
    levelColor: 'bg-green-100 text-green-700',
    progress: 0,
    students: 5234,
    rating: 4.8,
  },
  {
    id: 2,
    icon: '🏨',
    category: 'Anfitriones',
    title: 'Gestiona tu alojamiento',
    description:
      'Maximiza tus ingresos como anfitrión: fotografía, precios, atención al huésped y más.',
    lessons: 12,
    duration: '4h 15min',
    level: 'Intermedio',
    levelColor: 'bg-yellow-100 text-yellow-700',
    progress: 35,
    students: 3421,
    rating: 4.9,
  },
  {
    id: 3,
    icon: '🗺️',
    category: 'Guías',
    title: 'Crea experiencias únicas',
    description:
      'Diseña tours y experiencias memorables que atraigan a viajeros de todo el mundo.',
    lessons: 10,
    duration: '3h 00min',
    level: 'Avanzado',
    levelColor: 'bg-red-100 text-red-700',
    progress: 70,
    students: 1823,
    rating: 4.7,
  },
  {
    id: 4,
    icon: '📦',
    category: 'Envíos',
    title: 'Optimiza tus envíos',
    description:
      'Guía completa para usar el servicio de envíos Going: tarifas, embalaje y seguimiento.',
    lessons: 6,
    duration: '1h 45min',
    level: 'Principiante',
    levelColor: 'bg-green-100 text-green-700',
    progress: 100,
    students: 2910,
    rating: 4.8,
  },
  {
    id: 5,
    icon: '💳',
    category: 'Pagos',
    title: 'Pagos y facturación',
    description:
      'Todo sobre métodos de pago, facturación electrónica y gestión financiera en Going.',
    lessons: 5,
    duration: '1h 20min',
    level: 'Principiante',
    levelColor: 'bg-green-100 text-green-700',
    progress: 0,
    students: 8934,
    rating: 4.9,
  },
  {
    id: 6,
    icon: '🌍',
    category: 'Viajeros',
    title: 'Viaja inteligente con Going',
    description:
      'Consejos, trucos y guías para aprovechar al máximo todos los servicios de la plataforma.',
    lessons: 9,
    duration: '2h 50min',
    level: 'Principiante',
    levelColor: 'bg-green-100 text-green-700',
    progress: 20,
    students: 6102,
    rating: 4.7,
  },
];

const CATEGORIES = [
  'Todos',
  'Conductores',
  'Anfitriones',
  'Guías',
  'Envíos',
  'Pagos',
  'Viajeros',
];

export default function AcademyPage() {
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filtered =
    activeCategory === 'Todos'
      ? COURSES
      : COURSES.filter((c) => c.category === activeCategory);

  const inProgress = COURSES.filter((c) => c.progress > 0 && c.progress < 100);
  const completed = COURSES.filter((c) => c.progress === 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#ff4c41] to-[#e63a2f] text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">📚 Academia Going</h1>
          <p className="text-indigo-100 text-lg">
            Aprende, crece y maximiza tu experiencia en la plataforma
          </p>
          <div className="flex gap-8 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{COURSES.length}</div>
              <div className="text-indigo-200 text-sm">Cursos disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{inProgress.length}</div>
              <div className="text-indigo-200 text-sm">En progreso</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{completed.length}</div>
              <div className="text-indigo-200 text-sm">Completados</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* In Progress */}
        {inProgress.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🔥 Continúa aprendiendo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgress.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{course.icon}</span>
                    <div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.levelColor}`}
                      >
                        {course.level}
                      </span>
                      <h3 className="font-semibold text-gray-900 mt-1">
                        {course.title}
                      </h3>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div
                      className="bg-[#ff4c41] h-2 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{course.progress}% completado</span>
                    <button className="text-[#ff4c41] font-semibold hover:underline">
                      Continuar →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#ff4c41] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:text-[#ff4c41]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 text-center">
                <span className="text-5xl">{course.icon}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#ff4c41] font-semibold uppercase tracking-wide">
                    {course.category}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.levelColor}`}
                  >
                    {course.level}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-sm text-gray-500 flex-1 mb-4">
                  {course.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-1">
                  <span>📖 {course.lessons} lecciones</span>
                  <span>⏱️ {course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <span>⭐ {course.rating}</span>
                  <span>({course.students.toLocaleString()} estudiantes)</span>
                </div>
                {course.progress === 100 ? (
                  <div className="w-full py-2 bg-green-50 text-green-700 font-semibold rounded-lg text-sm text-center">
                    ✓ Completado
                  </div>
                ) : course.progress > 0 ? (
                  <div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                      <div
                        className="bg-[#ff4c41] h-1.5 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <button className="w-full py-2 bg-[#ff4c41] text-white font-semibold rounded-lg text-sm hover:bg-[#e63a2f] transition-colors">
                      Continuar ({course.progress}%)
                    </button>
                  </div>
                ) : (
                  <button className="w-full py-2 bg-[#ff4c41] text-white font-semibold rounded-lg text-sm hover:bg-[#e63a2f] transition-colors">
                    Comenzar curso
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Success stories */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            💬 Historias de éxito
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Carlos M.',
                role: 'Conductor',
                text: 'Después del curso aumenté mis ingresos en un 40% en solo 3 meses.',
              },
              {
                name: 'María L.',
                role: 'Anfitriona',
                text: 'Aprendí a optimizar mi alojamiento y ahora tengo 98% de ocupación.',
              },
              {
                name: 'Pedro R.',
                role: 'Guía Turístico',
                text: 'Mis tours ahora están completamente reservados con semanas de anticipación.',
              },
            ].map((story) => (
              <div key={story.name} className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">
                    👤
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{story.name}</p>
                    <p className="text-xs text-[#ff4c41]">{story.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm italic">"{story.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
