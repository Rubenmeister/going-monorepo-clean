export default function AcademyPage() {
  const courses = [
    {
      title: 'Getting Started with Going',
      instructor: 'Going Team',
      duration: '2 hours',
      level: 'Beginner',
      icon: '🚀',
    },
    {
      title: 'Maximizing Your Travel Experience',
      instructor: 'Travel Expert',
      duration: '3 hours',
      level: 'Intermediate',
      icon: '🌍',
    },
    {
      title: 'Safety & Best Practices',
      instructor: 'Safety Team',
      duration: '1.5 hours',
      level: 'Beginner',
      icon: '🛡️',
    },
    {
      title: 'Advanced Booking Strategies',
      instructor: 'Booking Specialist',
      duration: '2.5 hours',
      level: 'Advanced',
      icon: '📊',
    },
    {
      title: 'Cultural Tips for Ecuador',
      instructor: 'Local Guide',
      duration: '2 hours',
      level: 'Beginner',
      icon: '🎭',
    },
    {
      title: 'Environmental Responsibility',
      instructor: 'Sustainability Team',
      duration: '1.5 hours',
      level: 'Intermediate',
      icon: '♻️',
    },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-going-primary mb-2">
            Going Academy
          </h1>
          <p className="text-gray-600">
            Learn and grow with our comprehensive courses and educational content
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8">
          <button className="px-4 py-2 bg-going-primary text-white rounded-lg font-medium">
            All Courses
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            My Learning
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Certificates
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.title}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
            >
              <div className="text-4xl mb-3">{course.icon}</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                by {course.instructor}
              </p>
              <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                <span>{course.duration}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    course.level === 'Beginner'
                      ? 'bg-going-success text-white'
                      : course.level === 'Intermediate'
                      ? 'bg-going-warning text-white'
                      : 'bg-going-danger text-white'
                  }`}
                >
                  {course.level}
                </span>
              </div>
              <button className="w-full px-4 py-2 border border-going-primary text-going-primary rounded-lg hover:bg-going-primary hover:text-white transition-colors font-medium">
                Enroll Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
