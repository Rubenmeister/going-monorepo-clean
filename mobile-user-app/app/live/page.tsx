import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Pantalla — Going Live
 * Tracking a pantalla completa con fondo SUV premium en carretera.
 * Sin AppShell (full-screen immersive).
 */

const LIVE_DATA = {
  driver: {
    name: 'Carlos Mendoza',
    rating: 4.92,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  },
  vehicle: {
    make: 'Toyota',
    model: 'RAV4',
    plate: 'PBK-3847',
    color: 'Gris Plata',
  },
  stats: {
    speed: 78,       // km/h
    altitude: 2847,  // msnm
    eta: '2h 14min',
    remaining: 124,  // km
    progress: 32,    // %
  },
  route: {
    from: 'Terminal Quitumbe',
    to: 'Centro de Baños',
  },
};

// SUV premium en carretera — inmersivo y on-brand
const LANDSCAPE_URL =
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80';

export default function LivePage() {
  const router = useRouter();
  const [speed, setSpeed] = useState(LIVE_DATA.stats.speed);
  const [cardOpen, setCardOpen] = useState(true);
  const [pulseOn, setPulseOn] = useState(true);
  const [progress, setProgress] = useState(LIVE_DATA.stats.progress);

  // Simular velocidad dinámica
  useEffect(() => {
    const iv = setInterval(() => {
      setSpeed(s => Math.max(60, Math.min(110, s + (Math.random() * 10 - 5))));
      setPulseOn(p => !p);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      backgroundColor: '#080a0e',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* ── Mapa / Landscape de fondo ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url('${LANDSCAPE_URL}')`,
        backgroundSize: 'cover', backgroundPosition: 'center 40%',
      }} />
      {/* Overlay oscuro */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,10,14,0.55) 0%, rgba(8,10,14,0.2) 40%, rgba(8,10,14,0.8) 70%, #080a0e 100%)',
      }} />

      {/* ── Header (back + going logo) ── */}
      <div style={{
        position: 'relative', zIndex: 20,
        padding: '52px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff', fontSize: 20,
          }}
        >‹</button>

        {/* Going logo pill */}
        <div style={{
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24, padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
            <circle cx="72" cy="18" r="7" fill="#ff4c41"/>
            <path d="M68 25 C68 25 60 28 52 36 C40 48 36 62 40 74 C44 86 58 92 70 88 C82 84 88 72 84 60 C80 48 70 44 62 46 C54 48 50 56 52 64 C54 72 62 74 68 70"
              stroke="#ff4c41" strokeWidth="6.5" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: -0.3 }}>Going</span>
          <span style={{
            background: '#ff4c41', borderRadius: 4,
            padding: '1px 6px', fontSize: 9, fontWeight: 800,
            letterSpacing: 1.5, color: '#fff', textTransform: 'uppercase',
          }}>LIVE</span>
        </div>

        <button
          onClick={() => router.push('/trip')}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 18,
          }}
        >🛡️</button>
      </div>

      {/* ── Pulso GPS en el mapa ── */}
      <div style={{
        position: 'absolute', top: '38%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Pulse rings */}
        <div style={{
          position: 'absolute',
          width: pulseOn ? 80 : 60, height: pulseOn ? 80 : 60,
          borderRadius: '50%',
          border: '2px solid rgba(255,76,65,0.3)',
          transition: 'all 1.8s ease',
        }} />
        <div style={{
          position: 'absolute',
          width: pulseOn ? 52 : 40, height: pulseOn ? 52 : 40,
          borderRadius: '50%',
          border: '2px solid rgba(255,76,65,0.5)',
          transition: 'all 1.2s ease',
        }} />
        {/* Car marker */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff4c41, #cc2a20)',
          boxShadow: '0 0 20px rgba(255,76,65,0.7), 0 4px 12px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, zIndex: 2,
        }}>
          🚗
        </div>
      </div>

      {/* ── Route info line ── */}
      <div style={{
        position: 'absolute', top: '55%', left: 0, right: 0,
        zIndex: 16, padding: '0 20px',
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4c41' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
              {LIVE_DATA.route.from}
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>→</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
              {LIVE_DATA.route.to}
            </span>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.5)' }} />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(to right, #ff4c41, #ff7a72)',
            borderRadius: 2,
            transition: 'width 1s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Iniciado</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{progress}% completado</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Destino</span>
        </div>
      </div>

      {/* ── Bottom driver card ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 20,
        background: '#0d1117',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '24px 24px 0 0',
        transition: 'transform 0.35s ease',
        transform: cardOpen ? 'translateY(0)' : 'translateY(calc(100% - 72px))',
      }}>
        {/* Handle / toggle */}
        <div
          onClick={() => setCardOpen(o => !o)}
          style={{
            padding: '14px 0 8px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', cursor: 'pointer', gap: 4,
          }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: 1 }}>
            {cardOpen ? '▼ OCULTAR' : '▲ CONDUCTOR'}
          </span>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          {[
            { icon: '⚡', label: 'Velocidad', value: `${Math.round(speed)} km/h` },
            { icon: '🏔', label: 'Altitud', value: `${LIVE_DATA.stats.altitude} m` },
            { icon: '⏱', label: 'ETA', value: LIVE_DATA.stats.eta },
            { icon: '📍', label: 'Restante', value: `${LIVE_DATA.stats.remaining} km` },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '12px 4px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <p style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</p>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Driver info */}
        {cardOpen && (
          <div style={{ padding: '16px 20px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={LIVE_DATA.driver.photo}
                alt={LIVE_DATA.driver.name}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,76,65,0.4)',
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{LIVE_DATA.driver.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ color: '#f59e0b', fontSize: 12 }}>★ {LIVE_DATA.driver.rating}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>·</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                    {LIVE_DATA.vehicle.make} {LIVE_DATA.vehicle.model} · {LIVE_DATA.vehicle.plate}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(255,76,65,0.12)',
                  border: '1px solid rgba(255,76,65,0.25)',
                  fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>📞</button>
                <button
                  onClick={() => router.push('/sos')}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(220,38,38,0.15)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    fontSize: 20, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >🆘</button>
              </div>
            </div>

            {/* Share trip */}
            <button style={{
              marginTop: 14, width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 14, padding: '12px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>📤</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>
                Compartir tracking con alguien
              </span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
