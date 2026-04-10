'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// ─── Navigation Drawer ───────────────────────────────────────────────────────
// Side menu deslizante (slide-in desde la izquierda).
// Muestra perfil con nivel Going Rewards, accesos rápidos, y ajustes.
// Uso: <NavigationDrawer open={open} onClose={() => setOpen(false)} />
// ────────────────────────────────────────────────────────────────────────────

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { icon: '🏠', label: 'Inicio', href: '/home', section: 'main' },
  { icon: '🗺️', label: 'Mis Viajes', href: '/bookings', section: 'main' },
  { icon: '💳', label: 'Pagos', href: '/payments', section: 'main' },
  { icon: '🎁', label: 'Going Rewards', href: '/rewards', section: 'main', badge: '2,535 pts' },
  { icon: '👥', label: 'Referidos', href: '/referidos', section: 'main' },
  { icon: '🌐', label: 'Idioma', href: '/settings/language', section: 'settings' },
  { icon: '🔔', label: 'Notificaciones', href: '/settings/notifications', section: 'settings' },
  { icon: '🔒', label: 'Privacidad', href: '/settings/privacy', section: 'settings' },
  { icon: '❓', label: 'Ayuda', href: '/help', section: 'settings' },
  { icon: '📋', label: 'Legal', href: '/legal', section: 'settings' },
];

export function NavigationDrawer({ open, onClose }: NavDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[300px] bg-[#0d1117] border-r border-white/8 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Profile header */}
        <div className="bg-gradient-to-br from-[#011627] to-[#0a2540] px-6 pt-14 pb-6">
          <button
            onClick={onClose}
            className="absolute top-5 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <span className="text-white text-sm">✕</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff4c41] to-[#e03d32] flex items-center justify-center">
                <span className="text-[26px]">👤</span>
              </div>
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#ff4c41] border-2 border-[#0d1117]">
                <span className="text-[8px] text-white font-black">GOLD</span>
              </div>
            </div>
            <div>
              <div className="text-[17px] font-black text-white">Ruben</div>
              <div className="text-[12px] text-white/40">rubenmeister@gmail.com</div>
            </div>
          </div>

          {/* Rewards summary */}
          <div className="bg-white/5 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/40 font-bold uppercase tracking-wide">Going Rewards</span>
              <span className="text-[13px] font-black text-[#ff4c41]">2,535 pts</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-[#ff4c41] to-[#ff8c41] rounded-full" style={{ width: '84.5%' }} />
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-white/25">Explorador Sierra Nv.4</span>
              <span className="text-[10px] text-white/25">465 pts → Platino</span>
            </div>
          </div>
        </div>

        {/* SOS quick button */}
        <div className="px-4 py-3 border-b border-white/5">
          <Link
            href="/sos"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl active:scale-98 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-[#ff4c41] flex items-center justify-center flex-shrink-0">
              <span className="text-[16px]">🆘</span>
            </div>
            <div>
              <div className="text-[14px] font-black text-[#ff4c41]">Botón SOS</div>
              <div className="text-[11px] text-red-400/50">Emergencia inmediata</div>
            </div>
          </Link>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Main section */}
          <div className="px-4 mb-1">
            <span className="text-[10px] font-black tracking-[2px] text-white/20 uppercase px-2">Principal</span>
          </div>
          {MENU_ITEMS.filter(i => i.section === 'main').map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 mx-2 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/8 transition-colors"
            >
              <span className="text-[20px] w-7 flex-shrink-0">{item.icon}</span>
              <span className="text-[14px] font-bold text-white/80 flex-1">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-[#ff4c41]/15 text-[10px] font-black text-[#ff4c41]">
                  {item.badge}
                </span>
              )}
              <span className="text-white/20 text-sm">›</span>
            </Link>
          ))}

          <div className="h-px bg-white/5 mx-4 my-3" />

          {/* Settings section */}
          <div className="px-4 mb-1">
            <span className="text-[10px] font-black tracking-[2px] text-white/20 uppercase px-2">Ajustes</span>
          </div>
          {MENU_ITEMS.filter(i => i.section === 'settings').map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 mx-2 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/8 transition-colors"
            >
              <span className="text-[20px] w-7 flex-shrink-0">{item.icon}</span>
              <span className="text-[14px] font-bold text-white/80 flex-1">{item.label}</span>
              <span className="text-white/20 text-sm">›</span>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="px-4 pb-8 pt-3 border-t border-white/5">
          <button className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors">
            <span className="text-[20px] w-7">🚪</span>
            <span className="text-[14px] font-bold">Cerrar sesión</span>
          </button>
          <div className="text-center mt-3">
            <span className="text-[10px] text-white/15">Going Ecuador · v1.0.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
