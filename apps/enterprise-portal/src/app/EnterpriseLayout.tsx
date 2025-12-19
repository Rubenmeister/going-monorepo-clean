import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEnterpriseAuth } from './EnterpriseAuthContext';
import { 
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  Car,
  Package,
  Building,
  Map,
  Ticket,
  ChevronRight,
  Menu
} from 'lucide-react';

export function EnterpriseLayout() {
  const { user, tenantName, logout, isAdmin } = useEnterpriseAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const verticals = [
    { id: 'mobility', path: '/e/mobility', label: 'Mobility', icon: Car, color: 'text-blue-400' },
    { id: 'logistics', path: '/e/shipments', label: 'Logistics', icon: Package, color: 'text-orange-400' },
    { id: 'stays', path: '/e/stays', label: 'Stays', icon: Building, color: 'text-purple-400' },
    { id: 'tours', path: '/e/tours', label: 'Tours', icon: Map, color: 'text-green-400' },
    { id: 'activities', path: '/e/activities', label: 'Activities', icon: Ticket, color: 'text-pink-400' },
  ];

  const coreNav = [
    { path: '/e/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/e/billing', label: 'Billing', icon: CreditCard },
    { path: '/e/reports', label: 'Reports', icon: FileText },
  ];

  const adminNav = [
    { path: '/e/admin/users', label: 'Team', icon: Users },
    { path: '/e/admin/policies', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-body text-slate-900">
      {/* Sidebar */}
      <aside 
        className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col transition-all duration-300 shadow-2xl z-20`}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
           <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-white font-bold shrink-0">
                G
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <h1 className="font-heading font-bold text-lg leading-none">Going</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Enterprise</p>
                </div>
              )}
           </div>
        </div>

        {/* Tenant Info */}
        {!collapsed && (
          <div className="px-4 py-6">
            <h2 className="text-xs uppercase text-slate-500 font-bold mb-1">Organization</h2>
            <div className="flex items-center justify-between text-slate-200 font-medium">
               <span>{tenantName || 'Going Corp'}</span>
               <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            </div>
          </div>
        )}

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Core */}
          <div className="space-y-1">
             {coreNav.map(item => (
               <NavItem key={item.path} item={item} collapsed={collapsed} />
             ))}
          </div>

          {/* Verticals */}
          <div>
            {!collapsed && <h3 className="px-3 text-[10px] uppercase text-slate-500 font-bold mb-2">Services</h3>}
            <div className="space-y-1">
              {verticals.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden
                    ${isActive ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  
                  {/* Subtle hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </NavLink>
              ))}
            </div>
          </div>

          {/* Admin */}
          {isAdmin && (
            <div>
              {!collapsed && <h3 className="px-3 text-[10px] uppercase text-slate-500 font-bold mb-2">Management</h3>}
              <div className="space-y-1">
                 {adminNav.map(item => (
                   <NavItem key={item.path} item={item} collapsed={collapsed} />
                 ))}
              </div>
            </div>
          )}
          
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/30">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
             <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white/10">
               {user?.name?.charAt(0).toUpperCase() || 'U'}
             </div>
             {!collapsed && (
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-medium truncate">{user?.name}</p>
                 <button onClick={logout} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                   <LogOut size={10} /> Sign Out
                 </button>
               </div>
             )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
        {/* Topbar (Search & Actions) would go here */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
           <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-slate-600">
             <Menu size={20} />
           </button>
           
           <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-slate-500">Corporate Portal v2.0</span>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
           <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ item, collapsed }: any) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2 rounded-md transition-colors
        ${isActive ? 'bg-primary text-white font-medium shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      <item.icon size={18} />
      {!collapsed && <span className="text-sm">{item.label}</span>}
    </NavLink>
  )
}

export default EnterpriseLayout;
