'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // SUV approaching splash animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user.role !== 'ADMIN' && data.user.role !== 'ops_admin') {
        throw new Error('Acceso denegado: Solo administradores');
      }

      localStorage.setItem('admin_token', data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Splash Screen with SUV approaching
  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#ff4c41] flex flex-col items-center justify-center overflow-hidden">
        {/* Logo - horizontal white version */}
        <div className="mb-8 animate-pulse">
          <img 
            src="/assets/logo_horizontal.png" 
            alt="Going" 
            className="h-16 w-auto brightness-0 invert"
          />
        </div>
        
        {/* SUV Animation */}
        <div className="relative w-full max-w-md h-32 overflow-hidden">
          <div className="suv-approaching absolute top-1/2 -translate-y-1/2">
            <img 
              src="/assets/suv_black_right_v2.png" 
              alt="SUV" 
              className="h-24 w-auto drop-shadow-2xl"
            />
          </div>
        </div>
        
        {/* Tagline */}
        <p className="text-white/80 text-lg mt-8 font-body">Panel de Operaciones</p>
        
        <style jsx>{`
          .suv-approaching {
            animation: approach 2s ease-out forwards;
          }
          @keyframes approach {
            0% {
              left: -150px;
              transform: translateY(-50%) scale(0.5);
            }
            100% {
              left: calc(50% - 60px);
              transform: translateY(-50%) scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff4c41]/20 via-black to-[#ffd253]/10"></div>
      
      <div className="relative w-full max-w-md">
        {/* Logo - White version */}
        <div className="text-center mb-8">
          <img 
            src="/assets/logo_horizontal.png" 
            alt="Going" 
            className="h-12 w-auto mx-auto mb-4 brightness-0 invert"
          />
          <p className="text-white/50 font-body">Panel de Operaciones</p>
        </div>

        {/* Login Card */}
        <div className="card bg-[#141414] border border-[#333]">
          {error && (
            <div className="bg-[#ff4c41]/20 text-[#ff4c41] p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/60 text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1f1f1f] border border-[#333] rounded-lg p-3 text-white focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent outline-none transition"
                placeholder="admin@going.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1f1f1f] border border-[#333] rounded-lg p-3 text-white focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff4c41] hover:bg-[#e63e34] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Iniciando...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
          
          <p className="text-center text-white/30 text-sm mt-6">
            Solo personal autorizado
          </p>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-[#333] space-y-3">
            <a 
              href="/forgot-password" 
              className="block text-center text-white/50 text-sm hover:text-[#ff4c41] transition"
            >
              ¿Olvidaste tu contraseña?
            </a>
            <p className="text-center text-white/40 text-sm">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="text-[#ffd253] hover:text-[#e6b845] transition">
                Regístrate
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
