import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../store';

/**
 * Pantalla 0 — Going Splash
 * Se muestra al arrancar la app antes de redirigir a login o home.
 * Animación: logo aparece, barra de progreso avanza, luego redirige.
 */
export default function SplashScreen() {
  const router = useRouter();
  const { init, token, isReady } = useAuth();
  const initiated = useRef(false);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    init();
  }, [init]);

  useEffect(() => {
    if (!isReady) return;
    // Esperar mínimo 2.5s para que se vea el splash
    const timer = setTimeout(() => {
      router.replace(token ? '/home' : '/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [isReady, token, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#080a0e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Fondo con gradiente tipo carretera */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 70%, rgba(255,76,65,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Corner brackets — top-left */}
      <div style={{
        position: 'absolute', top: 40, left: 36,
        width: 44, height: 44,
        borderTop: '1.5px solid rgba(255,255,255,0.2)',
        borderLeft: '1.5px solid rgba(255,255,255,0.2)',
        borderRadius: '2px 0 0 0',
      }} />
      {/* Corner brackets — top-right */}
      <div style={{
        position: 'absolute', top: 40, right: 36,
        width: 44, height: 44,
        borderTop: '1.5px solid rgba(255,255,255,0.2)',
        borderRight: '1.5px solid rgba(255,255,255,0.2)',
        borderRadius: '0 2px 0 0',
      }} />
      {/* Corner brackets — bottom-left */}
      <div style={{
        position: 'absolute', bottom: 80, left: 36,
        width: 44, height: 44,
        borderBottom: '1.5px solid rgba(255,255,255,0.2)',
        borderLeft: '1.5px solid rgba(255,255,255,0.2)',
        borderRadius: '0 0 0 2px',
      }} />
      {/* Corner brackets — bottom-right */}
      <div style={{
        position: 'absolute', bottom: 80, right: 36,
        width: 44, height: 44,
        borderBottom: '1.5px solid rgba(255,255,255,0.2)',
        borderRight: '1.5px solid rgba(255,255,255,0.2)',
        borderRadius: '0 0 2px 0',
      }} />

      {/* Centro: logo + wordmark + tagline */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>

        {/* Ícono Going */}
        <svg width="88" height="88" viewBox="0 0 100 100" fill="none"
          style={{ marginBottom: 18, filter: 'drop-shadow(0 0 28px rgba(255,76,65,0.6))' }}>
          <circle cx="72" cy="18" r="7" fill="#ff4c41"/>
          <path
            d="M68 25 C68 25 60 28 52 36 C40 48 36 62 40 74 C44 86 58 92 70 88 C82 84 88 72 84 60 C80 48 70 44 62 46 C54 48 50 56 52 64 C54 72 62 74 68 70"
            stroke="#ff4c41" strokeWidth="6.5" strokeLinecap="round" fill="none"
          />
        </svg>

        {/* Wordmark */}
        <p style={{
          fontSize: 50, fontWeight: 900, letterSpacing: -1.5,
          color: '#ffffff', marginBottom: 24, lineHeight: 1,
        }}>
          Going
        </p>

        {/* Tagline */}
        <p style={{
          fontSize: 12, fontWeight: 600,
          letterSpacing: 6, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.65)',
        }}>
          Nos movemos contigo
        </p>
      </div>

      {/* EST. MMXXVI */}
      <div style={{
        position: 'absolute', bottom: 52,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        zIndex: 10,
      }}>
        {/* Línea roja */}
        <div style={{
          width: 56, height: 1.5,
          background: 'linear-gradient(to right, transparent, #ff4c41, transparent)',
        }} />
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 4,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
        }}>
          Est. MMXXVI
        </p>
      </div>

      {/* Barra de carga sutil */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
      }}>
        <div style={{
          height: '100%', backgroundColor: '#ff4c41', width: '100%',
          transformOrigin: 'left',
          animation: 'none',
          // Se anima vía CSS class abajo — aquí solo la base
        }} className="splash-loader" />
      </div>

      <style>{`
        @keyframes splashLoad {
          0%   { transform: scaleX(0); }
          30%  { transform: scaleX(0.35); }
          65%  { transform: scaleX(0.7); }
          90%  { transform: scaleX(0.9); }
          100% { transform: scaleX(1); }
        }
        .splash-loader {
          animation: splashLoad 2.5s ease forwards;
        }
      `}</style>
    </div>
  );
}
