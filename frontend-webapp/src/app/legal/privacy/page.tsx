'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
        <div className="bg-white rounded-xl shadow-md p-8 space-y-6 text-gray-600">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Protección de Datos</h2>
            <p>Nos comprometemos a proteger tu información personal.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recopilación de Datos</h2>
            <p>Recopilamos información para mejorar nuestros servicios.</p>
          </section>
          <p className="text-sm italic">Última actualización: 2026-02-18</p>
        </div>
      </div>
    </div>
  );
}
