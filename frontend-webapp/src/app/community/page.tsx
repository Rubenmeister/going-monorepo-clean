import React from 'react';

export const metadata = {
  title: 'Going Community - Connect & Share',
  description:
    'Join the Going community to share experiences and learn from others.',
};

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Going Community
          </h1>
          <p className="text-xl text-primary-100">
            Connect with drivers, riders, and partners worldwide
          </p>
        </div>
      </section>

      {/* Communities */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
          Join a Community
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              name: '👨‍🚗 Driver Community',
              members: 800000,
              desc: 'For drivers and professionals',
            },
            {
              name: '👤 Rider Community',
              members: 5000000,
              desc: 'For passengers and users',
            },
            {
              name: '🏢 Host Community',
              members: 50000,
              desc: 'For hosts and businesses',
            },
            {
              name: '🤝 Partner Community',
              members: 10000,
              desc: 'For partners and integrators',
            },
          ].map((comm, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {comm.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {comm.desc}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                {comm.members.toLocaleString()} members
              </p>
              <button className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors">
                Join Community
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Forums Preview */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">
            Forums
          </h2>
          <div className="space-y-4">
            {[
              { title: 'Ask & Answer', posts: 12500, members: 250000 },
              { title: 'Tips & Tricks', posts: 8900, members: 180000 },
              { title: 'Local Meetups', posts: 3400, members: 95000 },
              { title: 'General Chat', posts: 45600, members: 800000 },
            ].map((forum, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-700 p-4 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {forum.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {forum.posts.toLocaleString()} posts •{' '}
                    {forum.members.toLocaleString()} members
                  </p>
                </div>
                <span className="text-primary-500 font-semibold">→</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
