'use client';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function UsersManagementPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) {
      router.push('/login');
      return;
    }

    const loadUsers = async () => {
      try {
        // TODO: Fetch users from backend
        setUsers([
          {
            id: '1',
            email: 'user1@example.com',
            firstName: 'Juan',
            lastName: 'Pérez',
            roles: ['customer'],
            status: 'active',
            createdAt: '2025-01-15',
          },
          {
            id: '2',
            email: 'host@example.com',
            firstName: 'María',
            lastName: 'García',
            roles: ['host'],
            status: 'active',
            createdAt: '2025-01-20',
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setLoading(false);
      }
    };

    loadUsers();
  }, [auth.user, router]);

  if (auth.isLoading) {
    return <div className="p-10 text-xl text-center">Cargando...</div>;
  }

  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="p-10 text-center text-red-600">
        ACCESO DENEGADO - Se requiere rol de administrador
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">
        <div className="flex-grow p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#0033A0]">
            Gestión de Usuarios
          </h1>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Usuarios del Sistema</h2>
              <Button variant="primary" className="text-sm">
                + Crear Usuario
              </Button>
            </div>

            {loading ? (
              <p>Cargando usuarios...</p>
            ) : (
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-2 text-left">Email</th>
                    <th className="border border-gray-300 p-2 text-left">Nombre</th>
                    <th className="border border-gray-300 p-2 text-left">Roles</th>
                    <th className="border border-gray-300 p-2 text-left">Estado</th>
                    <th className="border border-gray-300 p-2 text-left">Fecha de Registro</th>
                    <th className="border border-gray-300 p-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="border border-gray-300 p-2">{user.email}</td>
                      <td className="border border-gray-300 p-2">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {user.roles.join(', ')}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {user.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2">{user.createdAt}</td>
                      <td className="border border-gray-300 p-2">
                        <Button variant="primary" className="text-sm">
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Button
            onClick={() => router.push('/')}
            variant="secondary"
            className="mt-8"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
