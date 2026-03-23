'use client';
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API_GW = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

type Role = 'user' | 'driver' | 'host' | 'guide' | 'operator';

const ROLES = [
  { value: 'user'     as Role, emoji: '🧳', title: 'Usuario',            sub: 'Viajo, envío o recibo paquetes',         color: '#ff4c41', redirect: '/' },
  { value: 'driver'   as Role, emoji: '🚗', title: 'Conductor',          sub: 'Transporte privado/compartido',          color: '#16a34a', redirect: '/conductores/registro' },
  { value: 'host'     as Role, emoji: '🏡', title: 'Anfitrión',          sub: 'Ofrezco alojamiento',                    color: '#7c3aed', redirect: '/anfitriones/registro' },
  { value: 'guide'    as Role, emoji: '🏺', title: 'Promotor Local',     sub: 'Experiencias locales auténticas',        color: '#0891b2', redirect: '/promotores-locales/registro' },
  { value: 'operator' as Role, emoji: '🧗', title: 'Operador de Tours',  sub: 'Organizo y opero tours grupales',        color: '#d97706', redirect: '/operadores/registro' },
];

const BENEFITS: Record<Role, { icon: string; text: string }[]> = {
  user:     [{ icon:'✓', text:'Reserva transporte al instante' }, { icon:'✓', text:'Reserva experiencias y tours' }, { icon:'✓', text:'Envía paquetes en todo Ecuador' }, { icon:'✓', text:'Alojamiento verificado y seguro' }],
  driver:   [{ icon:'💰', text:'Gana hasta $2,800/mes' }, { icon:'⏰', text:'Horario completamente flexible' }, { icon:'📱', text:'App intuitiva y soporte 24/7' }, { icon:'🛡️', text:'Seguro de accidentes incluido' }],
  host:     [{ icon:'🏠', text:'Publica tu espacio en minutos' }, { icon:'📅', text:'Gestiona reservas fácilmente' }, { icon:'💳', text:'Pagos seguros y puntuales' }, { icon:'⭐', text:'Reseñas verificadas' }],
  guide:    [{ icon:'🗺️', text:'Diseña tus propios tours' }, { icon:'🌍', text:'Conecta con viajeros del mundo' }, { icon:'💰', text:'Fija tus propias tarifas' }, { icon:'📚', text:'Academia Going gratuita' }],
  operator: [{ icon:'🎒', text:'Ofrece aventuras y expediciones' }, { icon:'📋', text:'Gestión de grupos y reservas' }, { icon:'🤝', text:'Alianzas con hoteles y guías' }, { icon:'📈', text:'Analytics y ganancias' }],
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const VALID_ROLES: Role[] = ['user', 'driver', 'host', 'guide', 'operator'];
  const paramRole = searchParams.get('rol') as Role | null;
  const initialRole: Role = paramRole && VALID_ROLES.includes(paramRole) ? paramRole : 'user';
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const active = ROLES.find(r => r.value === selectedRole)!;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, roles: [selectedRole] }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (data?.message || '').toLowerCase();
        if (res.status === 409 || msg.includes('already') || msg.includes('exists')) {
          setError('Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión?');
          return;
        } else if (res.status === 400 || msg.includes('invalid') || msg.includes('validation')) {
          setError(data?.message || 'Revisa que todos los campos estén correctamente llenados.');
          return;
        } else if (res.status === 500) {
          // El usuario fue creado pero el servidor tuvo un error interno — redirigir a login
          window.location.href = `/auth/login?registered=1`;
          return;
        } else {
          setError(data?.message || 'Error al crear la cuenta. Intenta nuevamente.');
          return;
        }
      }

      // user-auth-service returns { accessToken, refreshToken, ... }
      const token = data.accessToken || data.token;
      if (token) {
        localStorage.setItem('authToken', token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      }

      window.location.href = active.redirect;

    } catch {
      setError('No se pudo conectar con el servidor. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/MUJERES%20LLEGANDO%20AL%20AERO%20DE%20QUITO.jpg')" }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 opacity-25 transition-colors duration-300" style={{ backgroundColor: active.color }} />

        <div className="relative z-10">
          <Image src="/going-logo-white-h.png" alt="Going" width={180} height={62} className="h-12 w-auto object-contain" priority />
        </div>
        <div className="relative z-10 text-white">
          <div className="text-5xl mb-4">{active.emoji}</div>
          <h2 className="text-3xl font-bold mb-3 leading-tight">
            {selectedRole === 'user'     ? 'Únete a la comunidad Going' :
             selectedRole === 'driver'   ? 'Conviértete en conductor Going' :
             selectedRole === 'host'     ? 'Comparte tu espacio con el mundo' :
             selectedRole === 'guide'    ? 'Muestra lo mejor de Ecuador' :
                                          'Opera aventuras increíbles'}
          </h2>
          <div className="space-y-4">
            {BENEFITS[selectedRole].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <span className="text-white/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/50 text-xs">© 2026 Going · Ecuador</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden mb-6 flex justify-center">
            <Image src="/going-logo-h.png" alt="Going" width={160} height={50} priority />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear tu cuenta</h1>
          <p className="text-gray-500 text-sm mb-5">Es gratis y solo toma un minuto</p>

          {/* Role selector */}
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">¿Cómo quieres usar Going?</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {ROLES.slice(0, 3).map(role => (
                <button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center ${
                    selectedRole === role.value
                      ? `border-current`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                  style={selectedRole === role.value ? { borderColor: role.color, color: role.color, backgroundColor: `${role.color}10` } : {}}>
                  <span className="text-xl">{role.emoji}</span>
                  <span className="text-xs font-bold leading-tight">{role.title}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.slice(3).map(role => (
                <button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center ${
                    selectedRole === role.value ? '' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                  style={selectedRole === role.value ? { borderColor: role.color, color: role.color, backgroundColor: `${role.color}10` } : {}}>
                  <span className="text-xl">{role.emoji}</span>
                  <span className="text-xs font-bold leading-tight">{role.title}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {/* Social */}
          <div className="space-y-2.5 mb-5">
            <a href={`${API_GW}/auth/google?role=${selectedRole}`}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm text-sm">
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/><path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/><path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/><path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/></svg>
              Registrarse con Google
            </a>
            <a href={`${API_GW}/auth/facebook?role=${selectedRole}`}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-sm text-sm"
              style={{ backgroundColor: '#1877F2' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Registrarse con Facebook
            </a>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">o regístrate con email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre</label>
                <input name="firstName" type="text" value={form.firstName} onChange={handleChange} placeholder="Juan" required
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-gray-900 bg-gray-50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Apellido</label>
                <input name="lastName" type="text" value={form.lastName} onChange={handleChange} placeholder="Pérez" required
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-gray-900 bg-gray-50 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" required
                className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-gray-900 bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teléfono</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+593 99 000 0000" required
                className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-gray-900 bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" required minLength={8}
                className="w-full px-3.5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-gray-900 bg-gray-50 text-sm" />
            </div>

            {selectedRole !== 'user' && (
              <div className="p-3 rounded-xl text-xs flex items-start gap-2"
                style={{ backgroundColor: `${active.color}15`, border: `1px solid ${active.color}40`, color: active.color }}>
                <span className="mt-0.5">📋</span>
                <span>Después del registro completarás tu perfil de <strong>{active.title}</strong>: documentos, foto y verificación (1–2 días hábiles).</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 shadow-sm hover:shadow-md active:scale-[0.98] text-sm"
              style={{ backgroundColor: active.color }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : `Crear cuenta como ${active.title} →`}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Al registrarte aceptas nuestros{' '}
              <Link href="/legal/terms" className="text-[#ff4c41] hover:underline">Términos</Link>{' '}y{' '}
              <Link href="/legal/privacy" className="text-[#ff4c41] hover:underline">Política de privacidad</Link>
            </p>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-[#ff4c41] font-semibold hover:underline">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RegisterForm />
    </Suspense>
  );
}
