'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Términos de Servicio</h1>
        <div className="bg-white rounded-xl shadow-md p-8 space-y-6 text-gray-600">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introducción</h2>
            <p>Estos términos y condiciones regulan el uso de la plataforma Going.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Aceptación de Términos</h2>
            <p>Al usar nuestra plataforma, aceptas todos estos términos y condiciones.</p>
          </section>
          <p className="text-sm italic">Última actualización: 2026-02-18</p>
        </div>
      </div>
    </div>
  );
}
