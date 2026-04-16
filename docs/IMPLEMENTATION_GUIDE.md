# 🚀 Guía de Implementación - Going Platform

## Fase 1: Setup y Configuración

### 1.1 Instalar Dependencias

```bash
# En la raíz del proyecto
npm install

# Instalar Tailwind CSS (si no está)
npm install -D tailwindcss postcss autoprefixer

# Instalar animaciones
npm install framer-motion
npm install react-hot-toast
```

### 1.2 Configurar Tailwind CSS

**Crear `tailwind.config.js` en la raíz:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend-webapp/src/**/*.{js,jsx,ts,tsx}",
    "./admin-dashboard/src/**/*.{js,jsx,ts,tsx}",
    "./libs/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#0033A0',
          600: '#001f66',
          700: '#001a52',
        },
        secondary: {
          500: '#FF6B35',
          600: '#FF5A1F',
        },
      },
      spacing: {
        0: '0px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        fadeInScale: 'fadeInScale 1s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeInScale: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
```

### 1.3 Crear `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## Fase 2: Implementar Páginas Web

### 2.1 Página de Login

**Path:** `frontend-webapp/src/app/auth/login/page.tsx`

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

export default function LoginPage() {
  const router = useRouter();
  const { domain } = useMonorepoApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await domain.auth.login({ email, password });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌍</div>
          <h1 className="text-3xl font-bold text-primary-500">Going</h1>
          <p className="text-gray-600 mt-2">Bienvenido de nuevo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white font-semibold py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          ¿No tienes cuenta?{' '}
          <button
            onClick={() => router.push('/auth/register')}
            className="text-primary-500 font-semibold hover:underline"
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}
```

### 2.2 Página de Home Mejorada

**Path:** `frontend-webapp/src/app/page.tsx`

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

export default function HomePage() {
  const router = useRouter();
  const { auth } = useMonorepoApp();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.isLoading === false && !auth.user) {
      router.push('/auth/login');
    }
  }, [auth, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !date) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, date });
      router.push(`/search?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (auth.isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-500">🌍 Going</h1>
          <div className="flex gap-4 items-center">
            {auth.user && (
              <>
                <span className="text-gray-700">Hola, {auth.user.firstName}</span>
                <button
                  onClick={auth.logout}
                  className="px-4 py-2 text-primary-500 border border-primary-500 rounded-lg hover:bg-primary-50 transition"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-700 text-white py-24 relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src="https://videos.pexels.com/video-files/3045163/3045163-sd_640_360_24fps.mp4" />
        </video>

        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <div className="text-8xl mb-6 animate-float">🚀</div>
          <h2 className="text-5xl font-bold mb-4 animate-fadeInScale">
            Bienvenido a Going
          </h2>
          <p className="text-xl opacity-90">
            Viaja, explora experiencias, alójate en lugares increíbles
          </p>
        </div>
      </section>

      {/* Search Form */}
      <section className="max-w-5xl mx-auto px-4 -mt-16 mb-20 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ¿A dónde quieres ir?
          </h3>

          <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿Desde dónde? 📍
              </label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Ciudad origen"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿Hacia dónde? ✈️
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Ciudad destino"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha 📅
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !from || !to || !date}
                className="w-full bg-primary-500 text-white font-semibold py-3 rounded-lg hover:bg-primary-600 transition disabled:opacity-50"
              >
                {loading ? '🔍 Buscando...' : '🔍 Buscar'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Nuestros Servicios
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🚗', title: 'Transporte', desc: 'Viaja cómodamente' },
            { icon: '🏨', title: 'Alojamiento', desc: 'Hospedaje perfecto' },
            { icon: '🎫', title: 'Tours', desc: 'Explora nuevos lugares' },
            { icon: '🎭', title: 'Experiencias', desc: 'Momentos inolvidables' },
            { icon: '📦', title: 'Envíos', desc: 'Paquetes seguros' },
            { icon: '💳', title: 'Pagos Seguros', desc: 'Opciones confiables' },
          ].map((service, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-xl shadow hover:shadow-lg transform hover:-translate-y-2 transition-all cursor-pointer"
            >
              <div className="text-5xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-500 text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          ¿Listo para tu próxima aventura?
        </h2>
        <p className="text-lg opacity-90 mb-8">
          Únete a millones de viajeros explorando el mundo
        </p>
      </section>
    </main>
  );
}
```

---

## Fase 3: Implementar Páginas Mobile

### 3.1 Actualizar Navigation.tsx

```typescript
// mobile/src/Navigation.tsx
// [Actualizar con nuevas pantallas y estilos]
```

### 3.2 Crear Componentes Tailwind Mobile

Para React Native, convertir a estilos nativos:

```typescript
// mobile/src/components/colors.ts
export const Colors = {
  primary: '#0033A0',
  secondary: '#FF6B35',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray900: '#111827',
};
```

---

## Fase 4: Conectar a APIs

### 4.1 Formulario de Búsqueda

```typescript
const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const results = await Promise.all([
      domain.tour.search({ locationCity: from, maxPrice: 500 }),
      domain.experience.search({ locationCity: from, maxPrice: 500 }),
    ]);

    // Guardar resultados en estado o context
    setResults(results);
    router.push('/search-results');
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    setLoading(false);
  }
};
```

### 4.2 Página de Resultados

```typescript
// frontend-webapp/src/app/search/page.tsx
export default function SearchPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const date = searchParams.get('date');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await domain.tour.search({
          locationCity: from,
        });
        setResults(data);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [from]);

  return (
    // Mostrar resultados en grid
  );
}
```

---

## Fase 5: Testing

### 5.1 Test Web

```bash
# Test E2E
npm run cypress:open

# Escribir test
describe('Home Page', () => {
  it('should search for trips', () => {
    cy.visit('/');
    cy.get('input[placeholder="Ciudad origen"]').type('Madrid');
    cy.get('input[placeholder="Ciudad destino"]').type('Barcelona');
    cy.get('input[type="date"]').type('2025-03-01');
    cy.contains('Buscar').click();
    cy.url().should('include', '/search');
  });
});
```

### 5.2 Test Mobile

```typescript
// Mobile test with Detox
describe('Home Screen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should display search form', async () => {
    await expect(element(by.text('¿A dónde quieres ir?'))).toBeVisible();
  });

  it('should search for trips', async () => {
    await element(by.placeholder('Ciudad origen')).typeText('Madrid');
    await element(by.placeholder('Ciudad destino')).typeText('Barcelona');
    await element(by.text('Buscar')).tap();
  });
});
```

---

## Fase 6: Deployment

### 6.1 Build Web

```bash
npm run build:webapp
# Genera: .next/standalone

# Servir
npm run build:webapp && npm start
```

### 6.2 Build Mobile

```bash
# iOS
npm run mobile:ios -- --release

# Android
npm run mobile:android -- --release

# EAS Build (Expo)
eas build --platform ios --release-channel production
eas build --platform android --release-channel production
```

### 6.3 Deploy Vercel/Netlify

```bash
# Vercel
vercel deploy --prod

# O configurar auto-deploy con GitHub
```

---

## ✅ Checklist de Implementación

- [ ] Instalar Tailwind CSS
- [ ] Configurar tailwind.config.js
- [ ] Implementar página Login
- [ ] Implementar página Home
- [ ] Conectar búsqueda de viajes
- [ ] Implementar página de resultados
- [ ] Estilar página Bookings
- [ ] Estilar página Profile
- [ ] Implementar mobile home
- [ ] Estilar mobile screens
- [ ] E2E tests web
- [ ] E2E tests mobile
- [ ] Build y test production
- [ ] Deploy

---

## 📊 Resumen de Archivos a Crear/Modificar

```
frontend-webapp/
├── src/app/
│   ├── page.tsx              [MODIFICAR] → Home mejorada
│   ├── auth/
│   │   ├── login/page.tsx    [CREAR]    → Login profesional
│   │   ├── register/page.tsx [CREAR]    → Register profesional
│   ├── search/
│   │   └── page.tsx          [CREAR]    → Resultados de búsqueda
│   ├── bookings/
│   │   └── page.tsx          [MODIFICAR] → Estilar con design system
│   ├── profile/
│   │   └── page.tsx          [MODIFICAR] → Estilar con design system
│   ├── layout.tsx            [MODIFICAR] → Agregar Tailwind imports
│   └── globals.css           [CREAR]    → Estilos globales
├── tailwind.config.js        [CREAR]    → Config Tailwind
└── postcss.config.js         [CREAR]    → Config PostCSS

mobile/
├── src/
│   ├── screens/
│   │   ├── home/
│   │   │   └── HomeScreenNew.tsx [REEMPLAZAR] → Con nuevos estilos
│   │   ├── search/SearchScreen.tsx [ACTUALIZAR]
│   │   ├── bookings/BookingsScreen.tsx [ACTUALIZAR]
│   │   └── profile/ProfileScreen.tsx [ACTUALIZAR]
│   └── components/
│       ├── Button.tsx        [ACTUALIZAR]
│       ├── Card.tsx          [ACTUALIZAR]
│       └── Badge.tsx         [ACTUALIZAR]
└── src/components/colors.ts  [CREAR]    → Colores centralizados
```

---

## 🚀 Próximos Pasos

1. **Crear estructura de carpetas**
2. **Instalar Tailwind**
3. **Implementar Auth Pages**
4. **Implementar Home Page**
5. **Conectar búsqueda**
6. **Estilar todas las páginas**
7. **Hacer mobile matching**
8. **Testing**
9. **Deploy**

¡Listo para empezar! 🎉
