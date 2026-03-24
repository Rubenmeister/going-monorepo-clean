'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

export default function RecuperarPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Siempre mostrar éxito para no revelar si el email existe
      setSent(true);
    } catch {
      setError('No se pudo conectar al servidor. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Recibirás un enlace en tu correo para restablecerla
          </p>
        </div>

        {!sent ? (
          <>
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email de administrador
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@goingec.com" required autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50"
                />
              </div>

              <button
                type="submit" disabled={loading || !email.trim()}
                className="w-full py-3 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#4f46e5' }}
              >
                {loading ? '🔄 Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">📬</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Revisa tu correo!</h2>
            <p className="text-gray-500 text-sm mb-2">
              Si existe una cuenta con <strong>{email}</strong>, recibirás las instrucciones.
            </p>
            <p className="text-gray-400 text-xs mb-6">Revisa también la carpeta de spam.</p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-indigo-500 hover:text-indigo-700 text-sm font-semibold underline"
            >
              Intentar con otro correo
            </button>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
