'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Alta de administradora/administrador PROTEGIDA.
 *
 * SEGURIDAD: esta página antes posteaba a /api/auth/register, que inyectaba
 * roles:['admin'] sin verificación → cualquiera podía crear un admin. Ahora
 * exige el "token de autorización" (bootstrap-token) que solo tiene el equipo
 * de plataforma; el alta va por POST /api/auth/bootstrap-admin, que lo valida
 * en tiempo constante en el backend. Sin token válido no se crea nada.
 */
export default function CrearAdminPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    token: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.token.trim()) {
      setError('Ingresa el token de autorización provisto por el equipo de plataforma.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/bootstrap-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bootstrapToken: form.token.trim(),
          firstName: form.firstName,
          lastName:  form.lastName,
          email:     form.email.trim().toLowerCase(),
          password:  form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 403) {
          setError('Token de autorización inválido. Verifica el token con el equipo de plataforma.');
        } else if (res.status === 503) {
          setError('La creación de administradores no está habilitada en el servidor (falta BOOTSTRAP_TOKEN). Contacta al equipo de plataforma.');
        } else {
          setError(data?.message || 'No se pudo crear la cuenta. Intenta de nuevo.');
        }
        return;
      }

      // bootstrap-admin NO devuelve token: el alta no inicia sesión sola.
      // La administradora o el administrador debe iniciar sesión normalmente.
      setSuccess(true);
    } catch {
      setError('No se pudo conectar al servidor. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cuenta de administración lista</h2>
          <p className="text-gray-500 mb-6">
            La cuenta de administración <strong>{form.email}</strong> quedó activa. Ahora inicia sesión con tu correo y contraseña.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 text-white font-bold rounded-lg text-center transition-colors"
            style={{ backgroundColor: '#ff4c41' }}
          >
            Iniciar sesión →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta de administración</h1>
          <p className="text-gray-500 mt-1 text-sm">Acceso exclusivo para personal de Going App</p>
        </div>

        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs leading-relaxed">
          🔒 La creación de cuentas de administración requiere un <strong>token de autorización</strong>.
          Si no lo tienes, pídelo al equipo de plataforma — no es público.
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre</label>
              <input
                type="text" required value={form.firstName} onChange={set('firstName')}
                placeholder="Nombre"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Apellido</label>
              <input
                type="text" required value={form.lastName} onChange={set('lastName')}
                placeholder="Apellido"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
            <input
              type="email" required value={form.email} onChange={set('email')}
              placeholder="admin@goingec.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Contraseña</label>
            <input
              type="password" required minLength={12} value={form.password} onChange={set('password')}
              placeholder="Mínimo 12 caracteres"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Confirmar contraseña</label>
            <input
              type="password" required value={form.confirm} onChange={set('confirm')}
              placeholder="Repite la contraseña"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Token de autorización</label>
            <input
              type="password" required value={form.token} onChange={set('token')}
              placeholder="Provisto por el equipo de plataforma"
              autoComplete="off"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm mt-2"
            style={{ backgroundColor: '#4f46e5' }}
          >
            {loading ? '🔄 Creando cuenta...' : 'Crear cuenta de administración'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
