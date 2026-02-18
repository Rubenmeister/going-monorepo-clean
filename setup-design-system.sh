#!/bin/bash

echo "🚀 Configurando Going Platform Design System..."
echo ""

# Colors para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Instalar Tailwind CSS
echo -e "${BLUE}1️⃣ Instalando Tailwind CSS...${NC}"
npm install -D tailwindcss postcss autoprefixer

# 2. Crear archivos de configuración
echo -e "${BLUE}2️⃣ Creando archivos de configuración...${NC}"

# tailwind.config.js
cat > tailwind.config.js << 'EOF'
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
EOF

# postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

echo -e "${GREEN}✅ Tailwind CSS configurado${NC}"
echo ""

# 3. Crear carpetas
echo -e "${BLUE}3️⃣ Creando estructura de carpetas...${NC}"

mkdir -p frontend-webapp/src/app/auth/login
mkdir -p frontend-webapp/src/app/auth/register
mkdir -p frontend-webapp/src/app/search
mkdir -p mobile/src/components

echo -e "${GREEN}✅ Carpetas creadas${NC}"
echo ""

# 4. Crear archivo de estilos globales
echo -e "${BLUE}4️⃣ Creando estilos globales...${NC}"

cat > frontend-webapp/src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-fadeInScale {
  animation: fadeInScale 1s ease-out;
}
EOF

echo -e "${GREEN}✅ Estilos globales creados${NC}"
echo ""

# 5. Instalar dependencias adicionales
echo -e "${BLUE}5️⃣ Instalando dependencias adicionales...${NC}"
npm install framer-motion react-hot-toast next-intl

echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}🎉 Setup completado exitosamente!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Reemplaza frontend-webapp/src/app/page.tsx con la nueva home"
echo "2. Crea auth/login/page.tsx y auth/register/page.tsx"
echo "3. Crea search/page.tsx para resultados"
echo "4. Ejecuta: npm run dev:webapp"
echo ""
echo "📖 Guía completa: IMPLEMENTATION_GUIDE.md"
