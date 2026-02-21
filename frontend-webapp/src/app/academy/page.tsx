import React from 'react';
import Link from 'next/link';

const courses = [
  {
    id: 1,
    title: 'Getting Started with Going',
    level: 'Beginner',
    duration: '2 hours',
    students: 5234,
    rating: 4.8,
    description: 'Learn the basics of the Going platform.',
  },
  {
    id: 2,
    title: 'Pro Driver Tips',
    level: 'Intermediate',
    duration: '3 hours',
    students: 3421,
    rating: 4.9,
    description: 'Advanced techniques for professional drivers.',
  },
  {
    id: 3,
    title: 'Business Growth',
    level: 'Advanced',
    duration: '4 hours',
    students: 1823,
    rating: 4.7,
    description: 'Strategies to grow your earning potential.',
  },
  {
    id: 4,
    title: 'Safety & Best Practices',
    level: 'All Levels',
    duration: '2.5 hours',
    students: 8934,
    rating: 4.9,
    description: 'Essential safety knowledge for all users.',
  },
];

export const metadata = {
  title: 'Going Academy - Learn & Master',
  description:
    'Master the Going Platform with our comprehensive academy courses.',
};

export default function AcademyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Going Academy</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Master Going Platform skills with our expert-led courses
          </p>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
          Our Courses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-3xl">
                🎓
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {course.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {course.level} • {course.duration}
                </p>
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <span>⭐ {course.rating}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ({course.students.toLocaleString()})
                  </span>
                </div>
                <button className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors">
                  Start Learning
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Success Stories */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Success Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-700 p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center">
                    👤
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      John Doe
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Driver
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  "The academy courses helped me increase my earnings by 40% in
                  just 3 months!"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
