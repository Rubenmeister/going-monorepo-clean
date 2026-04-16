# Going Platform - Design System

## 🎨 Visión General

Un design system consistente entre web (Next.js) y mobile (React Native) para garantizar una experiencia de usuario coherente en todas las plataformas.

## 📏 Design Tokens

### Colores Primarios

```typescript
const Colors = {
  primary: '#0033A0',      // Azul Going
  primaryLight: '#1a4dcc', // Azul claro para hover
  primaryDark: '#001f66',  // Azul oscuro para active

  secondary: '#FF6B35',    // Naranja Going
  white: '#FFFFFF',
  black: '#000000',
};
```

### Espaciado (8px base)

```typescript
const Spacing = {
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
};
```

### Border Radius

```typescript
const BorderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
};
```

### Tipografía

**Font Family:** Sistema nativa de cada plataforma
- Web: `-apple-system, BlinkMacSystemFont, Roboto`
- Mobile: Nativa del SO

**Tamaños:**
- xs: 12px
- sm: 14px
- base: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 30px

## 🔘 Componentes

### Button

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onClick?: () => void;
}
```

**Variantes:**
- **primary**: Azul Going, sombra, para acciones principales
- **secondary**: Naranja, para acciones secundarias
- **outline**: Borde sin fondo, para acciones alternativas
- **ghost**: Sin fondo, solo texto, para acciones sutiles

**Ejemplo Web:**
```tsx
<Button variant="primary" size="lg" fullWidth>
  Buscar Viaje
</Button>
```

**Ejemplo Mobile:**
```tsx
<Button variant="primary" size="lg" fullWidth onPress={handleSearch}>
  Buscar Viaje
</Button>
```

### Card

Contenedor con sombra y padding consistente.

**Props:**
```typescript
interface CardProps {
  padding?: 'sm' | 'md' | 'lg';
  border?: boolean;
  children: React.ReactNode;
}
```

**Ejemplo Web:**
```tsx
<Card padding="lg">
  <h2>Contenido</h2>
</Card>
```

**Ejemplo Mobile:**
```tsx
<Card padding="lg">
  <Text>Contenido</Text>
</Card>
```

### Badge

Etiqueta para estados, categorías, etc.

**Props:**
```typescript
interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}
```

**Ejemplo:**
```tsx
<Badge variant="success" size="md">Confirmada</Badge>
<Badge variant="warning" size="sm">Pendiente</Badge>
```

### Input

Campo de entrada con validación.

**Props:**
```typescript
interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}
```

**Ejemplo:**
```tsx
<Input
  label="Email"
  placeholder="tu@email.com"
  value={email}
  onChange={setEmail}
  error={emailError}
/>
```

### TripSearchForm

Formulario especializado para búsqueda de viajes.

**Props:**
```typescript
interface TripSearchFormProps {
  onSearch?: (from: string, to: string, date: string) => void;
  loading?: boolean;
}
```

**Campos:**
- ¿Desde dónde? 📍
- ¿Hacia dónde? ✈️
- Fecha 📅

**Características:**
- Validación en tiempo real
- Submit con Enter
- Estados loading/disabled
- Responsive

## 📱 Pantallas & Páginas

### Estructura Home

Idéntica en Web y Mobile:

1. **Hero Section**
   - Video de fondo con overlay
   - Logo animado (float animation)
   - Título: "Bienvenido a Going"
   - Subtítulo: "Viaja, explora, alójate..."

2. **Search Section**
   - Formulario flotante (negativo margin en web)
   - 3 inputs: Origen, Destino, Fecha
   - Botón de búsqueda destacado
   - Responde a focus/blur

3. **Services Section**
   - Grid de 6 servicios
   - Cada servicio: emoji, título, descripción
   - Animación hover en web
   - Botones CTA para cada servicio

4. **CTA Section**
   - Fondo primario
   - Título, subtítulo
   - Botón de registro

5. **Footer**
   - Copyright
   - Links (si aplica)

### Colores por Servicio

```
Transporte:    #FF6B35 (Naranja)
Alojamiento:   #10B981 (Verde)
Tours:         #3B82F6 (Azul)
Experiencias:  #F59E0B (Ámbar)
Envíos:        #8B5CF6 (Púrpura)
Pagos:         #EC4899 (Rosa)
```

## 🎬 Animaciones

### Web (CSS)

**Float (Hero logo):**
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
animation: float 3s ease-in-out infinite;
```

**Fade In Scale (Hero title):**
```css
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
animation: fadeInScale 1s ease-out;
```

**Card Hover:**
```css
transition: transform 200ms, box-shadow 200ms;
&:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px rgba(0,0,0,0.1);
}
```

### Mobile (React Native)

Las animaciones son más sutiles en mobile por rendimiento:
- `activeOpacity` en TouchableOpacity
- Transiciones suaves de propiedades
- Feedback háptico (si soporta)

## 📐 Responsividad

### Web Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Mobile

- Ancho: 100vw - padding (20px)
- Grid: responsive con `minmax()`
- Inputs: full width en forms

## 🌍 Internacionalización

Todos los textos en español e inglés:

```typescript
// Español
"¿A dónde quieres ir?"
"¿Desde dónde? 📍"
"¿Hacia dónde? ✈️"
"Fecha 📅"

// English
"Where do you want to go?"
"From where? 📍"
"To where? ✈️"
"Date 📅"
```

## ♿ Accesibilidad

- **Labels** en todos los inputs
- **Alt text** en imágenes
- **Contrast ratio** 4.5:1 mínimo
- **Focus states** visibles
- **Semantic HTML** en web
- **Roles y labels** en mobile

## 🧪 Testing

### Web (Cypress)
```typescript
cy.contains('Buscar').click();
cy.get('input[placeholder="Ciudad"]').type('Madrid');
cy.get('button[type="submit"]').click();
```

### Mobile (Detox)
```typescript
await element(by.text('Buscar')).tap();
await element(by.placeholder('Ciudad')).typeText('Madrid');
```

## 📚 Componentes en Uso

### Web
```tsx
import { Button, Card, Badge, Input } from '@going-monorepo-clean/shared-ui';

<Button variant="primary" size="lg" fullWidth>
  Buscar
</Button>
```

### Mobile
```tsx
import { Button, Card, Badge } from '../components';

<Button variant="primary" size="lg" fullWidth onPress={handleSearch}>
  Buscar
</Button>
```

## 🚀 Próximas Mejoras

- [ ] Dark mode support
- [ ] Animations con Framer Motion (web)
- [ ] Reanimated 2 (mobile)
- [ ] Design tokens desde una fuente única
- [ ] Storybook para documentación
- [ ] Temas personalizables por usuario

## 📖 Referencias

- **Color Palette:** https://tailwindcss.com/docs/customizing-colors
- **Spacing System:** Material Design 3
- **Typography:** System fonts nativos
- **Shadows:** Elevación de Material Design

---

**El design system está listo para usar en todas las plataformas.** ✅
