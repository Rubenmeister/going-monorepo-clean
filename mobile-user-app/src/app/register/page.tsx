'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../store';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange =
    (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      router.replace('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { key: 'firstName', label: 'Nombre', type: 'text', placeholder: 'Juan' },
    { key: 'lastName', label: 'Apellido', type: 'text', placeholder: 'Pérez' },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'tu@email.com',
    },
    {
      key: 'phone',
      label: 'Teléfono',
      type: 'tel',
      placeholder: '+593 99 123 4567',
    },
    {
      key: 'password',
      label: 'Contraseña',
      type: 'password',
      placeholder: '••••••••',
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#011627' }}
    >
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black" style={{ color: '#ff4c41' }}>
            Going
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Crea tu cuenta
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Registro</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            {FIELDS.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  required
                  value={form[key as keyof typeof form]}
                  onChange={handleChange(key)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm mt-2 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-semibold"
              style={{ color: '#ff4c41' }}
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
