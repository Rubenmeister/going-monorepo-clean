import React from 'react';

const jobs = [
  {
    title: 'Senior Full-Stack Developer',
    location: 'Remote',
    dept: 'Engineering',
  },
  { title: 'Product Manager', location: 'San Francisco, CA', dept: 'Product' },
  { title: 'UX/UI Designer', location: 'London, UK', dept: 'Design' },
  { title: 'Data Scientist', location: 'Berlin, Germany', dept: 'Data' },
  { title: 'DevOps Engineer', location: 'Singapore', dept: 'Infrastructure' },
  { title: 'Sales Manager', location: 'New York, NY', dept: 'Sales' },
];

export const metadata = {
  title: 'Careers at Going - Join Our Team',
  description:
    'Explore careers and join the Going team. Help us transform mobility.',
};

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-primary-100">
            Help us transform mobility and create opportunities
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
          Why Join Going?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🚀',
              title: 'Innovation',
              desc: 'Work on cutting-edge mobility solutions',
            },
            {
              icon: '🌍',
              title: 'Global Impact',
              desc: 'Reach millions of users worldwide',
            },
            {
              icon: '💼',
              title: 'Growth',
              desc: 'Grow your career in a fast-paced startup',
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

      {/* Open Positions */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Open Positions
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
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
          Benefits & Perks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            '💊 Health Insurance',
            '📚 Learning Budget',
            '🏠 Remote Work',
            '💰 Competitive Salary',
            '📈 Equity',
            '🏖️ Vacation',
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
