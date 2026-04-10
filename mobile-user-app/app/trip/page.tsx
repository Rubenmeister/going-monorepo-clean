'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../components/AppShell';

// ─── Twilio Proxy — llamada enmascarada ──────────────────────────────────────
// El backend asigna un número proxy temporal cuando confirma el viaje.
// El pasajero llama a ese número, Twilio lo redirige al conductor real.
// El conductor tampoco ve el número real del pasajero.
// Número proxy recibido via /api/rides/:id/proxy-numbers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Pantalla — Current Trip / Viaje en Curso
 * Muestra PIN de seguridad, info del conductor, vehículo y estado del viaje.
 * PIN: el pasajero lo verifica con el conductor antes de subir.
 */

// Número proxy de Twilio — en producción llega de la API al confirmar el viaje
// El backend retorna: { userProxyNumber: '+1-XXX-XXX-XXXX', driverProxyNumber: '...' }
// Por ahora usamos un placeholder hasta recibir las credenciales de Twilio
const PROXY_PHONE = '+1 (555) 012-3456'; // → reemplazar con res.userProxyNumber del API

const TRIP_DATA = {
  pin: '4829',
  status: 'arriving', // 'arriving' | 'onboard' | 'completed'
  eta: '3 min',
  proxyPhone: PROXY_PHONE,
  driver: {
    name: 'Carlos Mendoza',
    rating: 4.92,
    trips: 847,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  },
  vehicle: {
    make: 'Toyota',
    model: 'RAV4',
    year: 2023,
    color: 'Gris Plata',
    plate: 'PBK-3847',
    type: 'Compartido',
  },
  route: {
    from: 'Terminal Quitumbe',
    to: 'Centro de Baños',
    distance: '182 km',
    duration: '3h 20min',
    seats: 3,
  },
  price: '$8.00',
  companions: ['Ana M.', 'Pedro L.'],
};

export default function TripPage() {
  const router = useRouter();
  const [pinRevealed, setPinRevealed] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [status, setStatus] = useState(TRIP_DATA.status);
  const [pulseActive, setPulseActive] = useState(true);

  // Simular transición de estado
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseActive(p => !p);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const handleCopyPin = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(TRIP_DATA.pin).catch(() => {});
    }
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  const statusConfig = {
    arriving: { label: 'Conductor en camino', color: '#f59e0b', dot: '#f59e0b' },
    onboard: { label: 'Viaje en curso', color: '#22c55e', dot: '#22c55e' },
    completed: { label: 'Viaje completado', color: '#6b7280', dot: '#6b7280' },
  };
  const currentStatus = statusConfig[status as keyof typeof statusConfig];

  return (
    <AppShell title="Viaje en Curso" showBack>
      <div style={{ background: '#080a0e', minHeight: '100%', paddingBottom: 32 }}>

        {/* Status bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: currentStatus.dot,
              boxShadow: `0 0 8px ${currentStatus.dot}`,
              animation: pulseActive ? 'none' : 'none',
              opacity: pulseActive ? 1 : 0.5,
            }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {currentStatus.label}
            </span>
          </div>
          <div style={{
            background: 'rgba(255,76,65,0.12)',
            border: '1px solid rgba(255,76,65,0.3)',
            borderRadius: 20,
            padding: '4px 12px',
          }}>
            <span style={{ color: '#ff4c41', fontSize: 12, fontWeight: 700 }}>
              ETA {TRIP_DATA.eta}
            </span>
          </div>
        </div>

        {/* Security PIN — Hero section */}
        <div style={{
          margin: '20px 20px 0',
          background: 'linear-gradient(135deg, #1a0a09 0%, #0f1318 100%)',
          border: '1px solid rgba(255,76,65,0.2)',
          borderRadius: 20,
          padding: '24px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120,
            background: 'radial-gradient(circle, rgba(255,76,65,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
                🔐 PIN de Seguridad
              </p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5, maxWidth: 200 }}>
                Verifica este PIN con tu conductor antes de subir al vehículo
              </p>
            </div>
            <div style={{
              background: 'rgba(255,76,65,0.1)',
              borderRadius: 12,
              padding: '6px 10px',
              border: '1px solid rgba(255,76,65,0.2)',
            }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
            </div>
          </div>

          {/* PIN display */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center',
            marginBottom: 16, marginTop: 8,
          }}>
            {TRIP_DATA.pin.split('').map((digit, i) => (
              <div key={i} style={{
                width: 56, height: 68,
                background: pinRevealed
                  ? 'linear-gradient(135deg, rgba(255,76,65,0.15) 0%, rgba(255,76,65,0.05) 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: pinRevealed
                  ? '2px solid rgba(255,76,65,0.4)'
                  : '2px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}>
                <span style={{
                  fontSize: pinRevealed ? 32 : 28,
                  fontWeight: 900,
                  color: pinRevealed ? '#ff4c41' : 'rgba(255,255,255,0.15)',
                  letterSpacing: 0,
                  fontFamily: 'monospace',
                }}>
                  {pinRevealed ? digit : '●'}
                </span>
              </div>
            ))}
          </div>

          {/* PIN actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setPinRevealed(r => !r)}
              style={{
                flex: 1, padding: '12px 0',
                background: pinRevealed ? 'rgba(255,76,65,0.15)' : '#ff4c41',
                border: pinRevealed ? '1px solid rgba(255,76,65,0.3)' : 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {pinRevealed ? '🙈 Ocultar PIN' : '👁 Mostrar PIN'}
            </button>
            {pinRevealed && (
              <button
                onClick={handleCopyPin}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: pinCopied ? '#22c55e' : '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {pinCopied ? '✓ Copiado' : '📋 Copiar'}
              </button>
            )}
          </div>
        </div>

        {/* Driver card */}
        <div style={{
          margin: '16px 20px 0',
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: '18px 20px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
            Tu Conductor
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <img
                src={TRIP_DATA.driver.photo}
                alt={TRIP_DATA.driver.name}
                style={{
                  width: 60, height: 60, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,76,65,0.4)',
                }}
              />
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 18, height: 18, borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #0d1117',
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginBottom: 3 }}>
                {TRIP_DATA.driver.name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#f59e0b', fontSize: 13 }}>★ {TRIP_DATA.driver.rating}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{TRIP_DATA.driver.trips} viajes</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{
                width: 42, height: 42,
                borderRadius: '50%',
                background: 'rgba(255,76,65,0.1)',
                border: '1px solid rgba(255,76,65,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 18,
                onClick={() => window.location.href = `tel:${TRIP_DATA.proxyPhone.replace(/\s/g,'')}`}
                title={`Llamar al conductor vía número seguro Going\n${TRIP_DATA.proxyPhone}`}
              >📞</button>
              <button style={{
                width: 42, height: 42,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 18,
              }}>💬</button>
            </div>
          </div>

          {/* Vehicle info */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                {TRIP_DATA.vehicle.make} {TRIP_DATA.vehicle.model}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>
                {TRIP_DATA.vehicle.color} · {TRIP_DATA.vehicle.year}
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,76,65,0.15), rgba(255,76,65,0.05))',
              border: '1px solid rgba(255,76,65,0.3)',
              borderRadius: 10,
              padding: '8px 14px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#ff4c41', fontWeight: 900, fontSize: 16, letterSpacing: 1.5, fontFamily: 'monospace' }}>
                {TRIP_DATA.vehicle.plate}
              </p>
              <p style={{ color: 'rgba(255,76,65,0.6)', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>
                PLACA
              </p>
            </div>
          </div>
        </div>

        {/* Route info */}
        <div style={{
          margin: '16px 20px 0',
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: '18px 20px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
            Tu Ruta
          </p>

          <div style={{ display: 'flex', gap: 14 }}>
            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4c41', boxShadow: '0 0 8px rgba(255,76,65,0.5)' }} />
              <div style={{ width: 2, height: 32, background: 'linear-gradient(to bottom, #ff4c41, rgba(255,255,255,0.15))', margin: '4px 0' }} />
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.4)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 3 }}>Origen</p>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{TRIP_DATA.route.from}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 3 }}>Destino</p>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{TRIP_DATA.route.to}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 0,
            marginTop: 18,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {[
              { icon: '📍', label: 'Distancia', value: TRIP_DATA.route.distance },
              { icon: '⏱', label: 'Duración', value: TRIP_DATA.route.duration },
              { icon: '💺', label: 'Asientos', value: `${TRIP_DATA.route.seats} ocupados` },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1, padding: '12px 8px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <p style={{ fontSize: 16, marginBottom: 4 }}>{item.icon}</p>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{item.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Companions */}
        {TRIP_DATA.companions.length > 0 && (
          <div style={{
            margin: '16px 20px 0',
            background: '#0d1117',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                Compañeros de viaje
              </p>
              <p style={{ color: '#fff', fontSize: 14 }}>
                {TRIP_DATA.companions.join(' · ')}
              </p>
            </div>
            <div style={{ display: 'flex' }}>
              {TRIP_DATA.companions.map((_, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `hsl(${i * 60 + 200}, 60%, 35%)`,
                  border: '2px solid #0d1117',
                  marginLeft: i > 0 ? -10 : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>
                    {TRIP_DATA.companions[i][0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price + SOS */}
        <div style={{ margin: '16px 20px 0', display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(255,76,65,0.12) 0%, rgba(255,76,65,0.04) 100%)',
            border: '1px solid rgba(255,76,65,0.2)',
            borderRadius: 16,
            padding: '16px',
            textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Tarifa</p>
            <p style={{ color: '#ff4c41', fontWeight: 900, fontSize: 28 }}>{TRIP_DATA.price}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>Viaje compartido</p>
          </div>
          <button
            onClick={() => router.push('/sos')}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
              border: '1px solid rgba(255,50,50,0.3)',
              borderRadius: 16,
              padding: '16px',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: 24 }}>🆘</span>
            <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: 13 }}>Emergencia</span>
            <span style={{ color: 'rgba(252,165,165,0.6)', fontSize: 10 }}>Toca para SOS</span>
          </button>
        </div>

        {/* View on map */}
        <div style={{ margin: '16px 20px 0' }}>
          <button
            onClick={() => router.push('/live')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '16px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🗺️</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Ver en mapa</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Tracking en tiempo real</p>
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>›</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
