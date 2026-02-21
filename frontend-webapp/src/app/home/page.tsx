'use client';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@going-monorepo-clean/shared-ui';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { useState } from 'react';

const Colors = {
  primary: '#0033A0',
  secondary: '#FF6B35',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray900: '#111827',
};

const Spacing = {
  2: '8px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  20: '80px',
};

export default function HomePage() {
  const router = useRouter();
  const { auth, domain } = useMonorepoApp();
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTripSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchFrom || !searchTo || !searchDate) return;

    setLoading(true);
    try {
      // Navigate to search results
      const params = new URLSearchParams({
        from: searchFrom,
        to: searchTo,
        date: searchDate,
      });
      router.push(`/search?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        backgroundColor: Colors.gray50,
        minHeight: '100vh',
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          backgroundColor: Colors.white,
          padding: `${Spacing[4]} ${Spacing[8]}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: Colors.primary,
          }}
        >
          🌍 Going
        </div>
        <div style={{ display: 'flex', gap: Spacing[4], alignItems: 'center' }}>
          {auth.user ? (
            <>
              <span style={{ color: Colors.gray900 }}>
                Hola, {auth.user.firstName}
              </span>
              <Button variant="outline" onClick={auth.logout} size="sm">
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                size="sm"
              >
                Iniciar Sesión
              </Button>
              <Button onClick={() => router.push('/register')} size="sm">
                Registrarse
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section with Video */}
      <section
        style={{
          position: 'relative',
          height: '600px',
          overflow: 'hidden',
          backgroundColor: Colors.primary,
          color: Colors.white,
        }}
      >
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.4,
          }}
        >
          <source
            src="https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_24fps.mp4"
            type="video/mp4"
          />
        </video>

        {/* Logo Animation */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1,
            animation: 'fadeInScale 1s ease-out',
          }}
        >
          <div
            style={{
              fontSize: '120px',
              marginBottom: Spacing[6],
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            🚀
          </div>
          <h1
            style={{
              fontSize: '54px',
              fontWeight: 'bold',
              marginBottom: Spacing[4],
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            Bienvenido a Going
          </h1>
          <p
            style={{
              fontSize: '24px',
              opacity: 0.95,
              maxWidth: '600px',
              margin: '0 auto',
              textShadow: '0 1px 5px rgba(0,0,0,0.3)',
            }}
          >
            Viaja, explora experiencias, alójate en lugares increíbles. Todo en
            un lugar.
          </p>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.8);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        `}</style>
      </section>

      {/* Search Section */}
      <section
        style={{
          padding: `${Spacing[12]} ${Spacing[8]}`,
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          marginTop: `-${Spacing[12]}`,
          zIndex: 10,
        }}
      >
        <Card padding="lg">
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: Spacing[8],
              color: Colors.gray900,
              textAlign: 'center',
            }}
          >
            ¿A dónde quieres ir?
          </h2>

          <form
            onSubmit={handleTripSearch}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: Spacing[4],
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: Spacing[2],
                  fontWeight: 600,
                  color: Colors.gray900,
                }}
              >
                ¿Desde dónde? 📍
              </label>
              <input
                type="text"
                placeholder="Ciudad de origen"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: Spacing[4],
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  transition: 'all 200ms',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: Spacing[2],
                  fontWeight: 600,
                  color: Colors.gray900,
                }}
              >
                ¿Hacia dónde? ✈️
              </label>
              <input
                type="text"
                placeholder="Ciudad destino"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: Spacing[4],
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: Spacing[2],
                  fontWeight: 600,
                  color: Colors.gray900,
                }}
              >
                Fecha 📅
              </label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: Spacing[4],
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <Button type="submit" disabled={loading} fullWidth>
              {loading ? '🔍 Buscando...' : '🔍 Buscar'}
            </Button>
          </form>
        </Card>
      </section>

      {/* Services Section */}
      <section
        style={{
          padding: `${Spacing[12]} ${Spacing[8]}`,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: Spacing[12],
            textAlign: 'center',
            color: Colors.gray900,
          }}
        >
          Nuestros Servicios
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: Spacing[8],
          }}
        >
          {[
            {
              icon: '🚗',
              title: 'Transporte',
              description: 'Viaja cómodamente a donde quieras',
              color: '#FF6B35',
            },
            {
              icon: '🏨',
              title: 'Alojamiento',
              description: 'Encuentra el hospedaje perfecto',
              color: '#10B981',
            },
            {
              icon: '🎫',
              title: 'Tours',
              description: 'Explora nuevos lugares',
              color: '#3B82F6',
            },
            {
              icon: '🎭',
              title: 'Experiencias',
              description: 'Vive momentos inolvidables',
              color: '#F59E0B',
            },
            {
              icon: '📦',
              title: 'Envíos',
              description: 'Envía tus paquetes seguro',
              color: '#8B5CF6',
            },
            {
              icon: '💳',
              title: 'Pagos Seguros',
              description: 'Con las mejores opciones',
              color: '#EC4899',
            },
          ].map((service, idx) => (
            <Card
              key={idx}
              padding="lg"
              style={{
                cursor: 'pointer',
                transition: 'transform 200ms, box-shadow 200ms',
                border: `2px solid transparent`,
              }}
              onMouseEnter={(e) => {
                const card = e.currentTarget;
                card.style.transform = 'translateY(-8px)';
                card.style.boxShadow = '0 20px 25px rgba(0,0,0,0.1)';
                card.style.borderColor = service.color;
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget;
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                card.style.borderColor = 'transparent';
              }}
            >
              <div
                style={{
                  fontSize: '56px',
                  marginBottom: Spacing[4],
                  textAlign: 'center',
                }}
              >
                {service.icon}
              </div>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: Spacing[2],
                }}
              >
                {service.title}
              </h3>
              <p style={{ color: '#6B7280', lineHeight: 1.5 }}>
                {service.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          backgroundColor: Colors.primary,
          color: Colors.white,
          padding: `${Spacing[12]} ${Spacing[8]}`,
          textAlign: 'center',
          marginTop: Spacing[12],
        }}
      >
        <h2
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: Spacing[4],
          }}
        >
          ¿Listo para tu próxima aventura?
        </h2>
        <p style={{ fontSize: '18px', marginBottom: Spacing[8], opacity: 0.9 }}>
          Únete a millones de viajeros y explora el mundo con Going
        </p>
        {!auth.user && (
          <Button
            onClick={() => router.push('/register')}
            variant="outline"
            style={{ borderColor: Colors.white, color: Colors.white }}
          >
            Comenzar Ahora
          </Button>
        )}
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: Colors.gray900,
          color: Colors.white,
          padding: `${Spacing[8]} ${Spacing[8]}`,
          textAlign: 'center',
        }}
      >
        <p style={{ opacity: 0.7 }}>
          © 2025 Going. Todos los derechos reservados.
        </p>
      </footer>
    </main>
  );
}
