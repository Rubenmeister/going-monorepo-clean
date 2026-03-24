'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';

export default function SettingsPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();

  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.next !== form.confirm) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (form.next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: form.current,
          newPassword: form.next,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (data?.message || '').toLowerCase();
        if (msg.includes('incorrect') || msg.includes('wrong') || msg.includes('invalid') || msg.includes('current')) {
          setError('La contraseña actual es incorrecta.');
        } else {
          setError(data?.message || 'No se pudo cambiar la contraseña. Intenta de nuevo.');
        }
        return;
      }

      setSuccess('✅ Contraseña actualizada correctamente.');
      setForm({ current: '', next: '', confirm: '' });
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gestiona tu cuenta de administrador</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Info de cuenta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">📋 Información de cuenta</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Nombre</span>
              <span className="font-semibold text-gray-800">
                {auth.user?.firstName} {auth.user?.lastName}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Email</span>
              <span className="font-semibold text-gray-800">{auth.user?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Rol</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                Administrador
              </span>
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">🔐 Cambiar contraseña</h2>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Contraseña actual
              </label>
              <input
                type="password" required value={form.current} onChange={set('current')}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Nueva contraseña
              </label>
              <input
                type="password" required minLength={8} value={form.next} onChange={set('next')}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password" required value={form.confirm} onChange={set('confirm')}
                placeholder="Repite la nueva contraseña"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm"
              style={{ backgroundColor: '#4f46e5' }}
            >
              {loading ? '🔄 Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 md:col-span-2">
          <h2 className="text-base font-bold text-red-700 mb-3">⚠️ Zona de peligro</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Cerrar sesión en todos los dispositivos</p>
              <p className="text-xs text-gray-500 mt-0.5">Elimina la sesión activa en todos los navegadores</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                document.cookie = 'going_admin_session=; path=/; max-age=0; SameSite=Strict';
                window.location.href = '/login';
              }}
              className="px-4 py-2 text-sm font-bold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
