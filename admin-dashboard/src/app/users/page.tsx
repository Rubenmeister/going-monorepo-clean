'use client';
export const dynamic = 'force-dynamic';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
} from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  AdminLayout,
  DataTable,
  renderStatusBadge,
  type ColumnDef,
} from '../components';
import {
  Loading,
  EmptyState,
  ErrorState,
} from '@going-monorepo-clean/shared-ui';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: string;
  createdAt: string;
}

export default function UsersManagementPage() {
  const { auth, domain } = useMonorepoApp();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    if (!auth.user) {
      router.push('/login');
      return;
    }

    const loadUsers = async () => {
      try {
        // Datos reales del backend (mismo origen que /clients).
        const res = await domain.admin.getUsers({ limit: 100 });
        setUsers((res?.users ?? []) as User[]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setError('Error al cargar usuarios');
        setLoading(false);
      }
    };

    loadUsers();
  }, [auth.user, router, domain]);

  if (auth.isLoading) {
    return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  }

  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState
          title="Acceso Denegado"
          description="Se requiere rol de administrador para acceder a esta sección"
          action={<Button onClick={() => router.push('/')}>Volver</Button>}
        />
      </div>
    );
  }

  const columns: ColumnDef<User>[] = [
    { key: 'email', label: 'Email' },
    {
      key: 'firstName',
      label: 'Nombre',
      render: (_, user) => `${user.firstName} ${user.lastName}`,
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (roles) => roles.join(', '),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (status) => renderStatusBadge(status),
    },
    {
      key: 'createdAt',
      label: 'Fecha de Registro',
      render: (date) => new Date(date).toLocaleDateString('es-ES'),
    },
  ];

  if (error) {
    return (
      <AdminLayout userName={auth.user.firstName}>
        <ErrorState
          title="Error al cargar usuarios"
          description={error}
          action={
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reintentar
            </Button>
          }
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600">
              Administra todas las personas usuarias registradas en la plataforma
            </p>
          </div>
          <Button variant="primary" size="lg">
            + Crear Usuario
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card shadow="sm">
          <CardBody className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total de Usuarios</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="text-center">
            <p className="text-sm text-gray-600 mb-1">Activos</p>
            <p className="text-3xl font-bold text-green-600">
              {users.filter((u) => u.status === 'active').length}
            </p>
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="text-center">
            <p className="text-sm text-gray-600 mb-1">Inactivos</p>
            <p className="text-3xl font-bold text-yellow-600">
              {users.filter((u) => u.status !== 'active').length}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Table */}
      <DataTable<User>
        columns={columns}
        data={users}
        rowKey="id"
        loading={loading}
        emptyMessage="No hay personas usuarias registradas"
        actions={(user) => (
          <Button
            variant="primary"
            size="sm"
            onClick={() => console.log('Edit user:', user.id)}
          >
            Editar
          </Button>
        )}
      />

      {/* Back Button */}
      <div className="mt-8">
        <Button variant="ghost" onClick={() => router.push('/')}>
          ← Volver al Dashboard
        </Button>
      </div>
    </AdminLayout>
  );
}
