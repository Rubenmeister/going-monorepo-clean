'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form:', form);
    alert('Gracias por tu mensaje. Nos pondremos en contacto pronto.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">Contacto</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Información
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900">Dirección</h3>
                <p className="text-gray-600">
                  Calle Principal 123, Quito, Ecuador
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Teléfono</h3>
                <a
                  href="tel:+593123456789"
                  className="text-[#ff4c41] hover:underline"
                >
                  +593 (1) 234-5678
                </a>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Email</h3>
                <a
                  href="mailto:hola@going.com"
                  className="text-[#ff4c41] hover:underline"
                >
                  hola@going.com
                </a>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Horario</h3>
                <p className="text-gray-600">Lunes a Viernes: 9:00 - 18:00</p>
                <p className="text-gray-600">Sábado: 10:00 - 14:00</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md p-8 space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Envíanos un Mensaje
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff4c41] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff4c41] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff4c41] focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-[#ff4c41] text-white rounded-lg hover:bg-[#e63a2f] transition-colors font-semibold"
            >
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
