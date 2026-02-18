'use client';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">Comunidad Going</h1>
        <div className="bg-white rounded-xl shadow-md p-8 space-y-4">
          <p className="text-gray-600">Únete a miles de viajeros en nuestra comunidad.</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Unirse a la Comunidad
          </button>
        </div>
      </div>
    </div>
  );
}
