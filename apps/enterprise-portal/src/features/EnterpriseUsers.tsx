import { useState } from 'react';
import { EnterpriseLayout } from '../components/EnterpriseLayout';

const MOCK_USERS = [
  { id: '1', name: 'Juan García', email: 'juan@acme.com', role: 'enterprise_admin', status: 'active', lastLogin: 'Hoy, 09:24' },
  { id: '2', name: 'María López', email: 'maria@acme.com', role: 'enterprise_user', status: 'active', lastLogin: 'Ayer, 18:30' },
  { id: '3', name: 'Carlos Ruiz', email: 'carlos@acme.com', role: 'enterprise_user', status: 'active', lastLogin: 'Hace 3 días' },
  { id: '4', name: 'Ana Martínez', email: 'ana@acme.com', role: 'enterprise_user', status: 'inactive', lastLogin: 'Hace 1 mes' },
  { id: '5', name: 'Pedro Sánchez', email: 'pedro@acme.com', role: 'enterprise_user', status: 'active', lastLogin: 'Hoy, 11:15' },
];

export default function EnterpriseUsers() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <EnterpriseLayout activeItem="users">
      {/* Header */}
      <header className="top-header">
        <h1 className="page-title">Usuarios</h1>
        <div className="header-actions">
          <button className="btn btn-primary btn-sm">+ Nuevo Usuario</button>
        </div>
      </header>

      {/* Page Content */}
      <div className="page-content">
        {/* Search & Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              type="text" 
              className="form-input pl-10" 
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="form-input w-auto">
            <option>Todos los roles</option>
            <option>Administrador</option>
            <option>Colaborador</option>
          </select>
          <select className="form-input w-auto">
            <option>Todos los estados</option>
            <option>Activos</option>
            <option>Inactivos</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último Acceso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'enterprise_admin' ? 'badge-info' : 'badge-secondary'}`}>
                      {u.role === 'enterprise_admin' ? 'Administrador' : 'Colaborador'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {u.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-sm text-slate-500">{u.lastLogin}</td>
                  <td className="text-right">
                    <button className="text-slate-400 hover:text-slate-600 transition">
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Info Alert */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-bold text-blue-900">Gestión de Roles</h4>
            <p className="text-sm text-blue-700">
              Los <b>Administradores</b> pueden crear solicitudes, ver reportes y gestionar usuarios. 
              Los <b>Colaboradores</b> solo pueden crear y ver sus propias solicitudes asignadas.
            </p>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
}
