import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useEnterpriseAuth } from './EnterpriseAuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  permission?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/e/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/e/request', label: 'Solicitar', icon: '➕', permission: 'request_ride' },
  { path: '/e/trips', label: 'Viajes', icon: '🚗' },
  { path: '/e/shipments', label: 'Envíos', icon: '📦' },
  { path: '/e/billing', label: 'Facturación', icon: '💳', permission: 'view_billing' },
  { path: '/e/reports', label: 'Reportes', icon: '📈', permission: 'view_reports' },
];

const adminNavItems: NavItem[] = [
  { path: '/e/admin/users', label: 'Usuarios', icon: '👥', adminOnly: true },
  { path: '/e/admin/cost-centers', label: 'Centros de costo', icon: '🏢', adminOnly: true },
  { path: '/e/admin/policies', label: 'Políticas', icon: '📋', adminOnly: true },
];

export function EnterpriseLayout() {
  const { user, tenantName, logout, hasPermission, isAdmin } = useEnterpriseAuth();

  const visibleNavItems = navItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="red">Going</span> Enterprise
          </div>
          <div className="sidebar-tenant">{tenantName}</div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Main Nav */}
          <div className="nav-section">
            <div className="nav-section-title">Principal</div>
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Admin Nav */}
          {isAdmin && (
            <div className="nav-section">
              <div className="nav-section-title">Administración</div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-enterprise-blue flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user?.name}</p>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 px-3 text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition text-left"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default EnterpriseLayout;
