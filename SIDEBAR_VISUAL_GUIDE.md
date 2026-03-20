# 🎨 Guía Visual - Sidebar y Account Page

## 📱 Vista Mobile (< 768px)

### Pantalla Principal (Inicio)

```
┌─────────────────────────────────┐
│ ☰  🌍 Going         [Inicio]    │
├─────────────────────────────────┤
│                                 │
│        CONTENIDO PRINCIPAL      │
│        (Home Page, etc)         │
│                                 │
│                                 │
└─────────────────────────────────┘

☰ = Hamburger menu (click aquí)
```

### Después de Click en Hamburger (☰)

```
┌─────────────────────────────────┐
│ ✕        [SIDEBAR ABIERTO]      │
├─────────────────────────────────┤
│ 🌍 Going                        │
│ Plataforma de Viajes            │
│                                 │
│ ┌────────────────────────────┐  │
│ │ J                          │  │ ← Avatar
│ │ Juan Silva                 │  │
│ │ juan@email.com             │  │
│ └────────────────────────────┘  │
│                                 │
│ 🏠 Inicio                       │
│ 🚗 Servicios                    │
│ 👤 Mi Cuenta                    │ ← click aquí
│ 🎫 Mis Reservas                 │
│ 📚 Academia                     │
│ 🚨 SOS                          │
│                                 │
│ ┌────────────────────────────┐  │
│ │ 🚪 Cerrar Sesión           │  │
│ └────────────────────────────┘  │
│                                 │
│ © 2026 Going Ecuador            │
└─────────────────────────────────┘
```

**Características:**
- Overlay oscuro detrás
- Botón ✕ para cerrar
- Menu items claros
- Avatar con inicial
- Logout al final

---

## 💻 Vista Desktop (> 768px)

### Estructura Layout Completo

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│ ┌─────────────────┬─────────────────────────────────────┐    │
│ │ 🌍 Going       │ CONTENIDO PRINCIPAL                 │    │
│ │ Plataforma...  │                                     │    │
│ │                │ (Responsive, ocupa el resto)        │    │
│ ├─────────────────┤                                     │    │
│ │ J              │                                     │    │
│ │ Juan Silva     │                                     │    │
│ │ juan@email.com │                                     │    │
│ │                │                                     │    │
│ ├─────────────────┤                                     │    │
│ │ 🏠 Inicio       │                                     │    │
│ │ 🚗 Servicios    │                                     │    │
│ │ 👤 Mi Cuenta    │                                     │    │
│ │ 🎫 Mis Reservas │                                     │    │
│ │ 📚 Academia     │                                     │    │
│ │ 🚨 SOS          │                                     │    │
│ │                │                                     │    │
│ ├─────────────────┤                                     │    │
│ │ 🚪 Cerrar...    │                                     │    │
│ │ © 2026...       │                                     │    │
│ └─────────────────┴─────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Sidebar Width: 264px
Content Width: Flex (ocupa el resto)
```

---

## 📄 Account Page - Vista Completa

### Desktop - Tabs Superiores

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ 👤 Mi Cuenta                                                │
│ Gestiona tu perfil, reservas y pagos                       │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 👤 Perfil  │ 🛍️ Mis Compras  │ 📄 Recibos  │ ⚙️ Config  ││
│ │             │                │              │             ││
│ │ (Tab Border Below Active)   │              │             ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [CONTENIDO DEL TAB ACTIVO]                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1: Perfil

```
┌──────────────────────────────────────┐
│ Información del Perfil               │
│                                      │
│ ┌───────────────┐                    │
│ │      J        │  Nombre            │
│ │               │  Juan Silva        │
│ └───────────────┘                    │
│                   Email              │
│                   juan@email.com     │
│                                      │
│ ┌──────────────┐ ┌──────────────┐   │
│ │ Nombre       │ │ Email        │   │
│ │ Juan Silva   │ │ juan@...     │   │
│ └──────────────┘ └──────────────┘   │
│                                      │
│ [Editar Perfil]                      │
│                                      │
└──────────────────────────────────────┘
```

### Tab 2: Mis Compras

```
┌──────────────────────────────────────────────┐
│ Historial de Compras              [5 compras]│
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ ✈️  Vuelo a Quito - Llegada...        │  │
│ │     Ref: GOING-001-2026 | 15/02/2026  │  │
│ │                          $125.50      │  │
│ │                      ✓ Completado     │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ 🏨  Hotel Amazonia Lodge               │  │
│ │     Ref: GOING-002-2026 | 10/02/2026  │  │
│ │                          $450.00      │  │
│ │                      ✓ Completado     │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ 🎭  Tour Aventura en Cotopaxi          │  │
│ │     Ref: GOING-003-2026 | 28/01/2026  │  │
│ │                          $89.99       │  │
│ │                      ✓ Completado     │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ [More items...]                              │
│                                              │
└──────────────────────────────────────────────┘
```

### Tab 3: Recibos

```
┌────────────────────────────────────────────┐
│ Mis Recibos                                │
│                                            │
│ ┌──────────────────┐ ┌──────────────────┐│
│ │                  │ │                  ││
│ │ Ref: GOING-...   │ │ Ref: GOING-...   ││
│ │ Vuelo a Quito    │ │ Hotel Amazonia   ││
│ │ 15/02/2026       │ │ 10/02/2026       ││
│ │ $125.50          │ │ $450.00          ││
│ │                  │ │                  ││
│ │ [📥 Descargar]   │ │ [📥 Descargar]   ││
│ │                  │ │                  ││
│ └──────────────────┘ └──────────────────┘│
│                                            │
│ ┌──────────────────┐ ┌──────────────────┐│
│ │                  │ │                  ││
│ │ Ref: GOING-...   │ │ Ref: GOING-...   ││
│ │ Tour Aventura    │ │ Transporte Local ││
│ │ 28/01/2026       │ │ 15/01/2026       ││
│ │ $89.99           │ │ $22.50           ││
│ │                  │ │                  ││
│ │ [📥 Descargar]   │ │ [📥 Descargar]   ││
│ │                  │ │                  ││
│ └──────────────────┘ └──────────────────┘│
│                                            │
└────────────────────────────────────────────┘
```

### Tab 4: Configuración

```
┌────────────────────────────────┐
│ Notificaciones                 │
├────────────────────────────────┤
│ ☑ Notificaciones por Email    │
│ ☑ Notificaciones por SMS      │
│ ☐ Ofertas y Promociones       │
│ ☑ Actualizaciones de Reservas │
│                                │
├────────────────────────────────┤
│ Seguridad                      │
├────────────────────────────────┤
│ [Cambiar Contraseña]       →   │
│ [Autenticación 2FA]        →   │
│                                │
├────────────────────────────────┤
│ ⚠️  Zona de Peligro           │
├────────────────────────────────┤
│ Estas acciones son irreversibles│
│ Por favor, procede con cuidado │
│                                │
│ [Eliminar Cuenta]              │
│                                │
└────────────────────────────────┘
```

---

## 🎨 Colores y Estilos

### Paleta de Colores

```
Primario:
┌───┐
│ 🔵 │ Azul #2563EB      - Botones, activos, links
└───┘

Secundarios:
┌───┐
│ ⚪ │ Blanco #FFFFFF    - Fondo tarjetas
└───┘

┌───┐
│ 🌫️ │ Gris #F9FAFB     - Fondo general
└───┘

┌───┐
│ 🟢 │ Verde #10B981     - Completado, éxito
└───┘

┌───┐
│ 🔴 │ Rojo #EF4444      - Peligro, delete
└───┘
```

### Elementos Visuales

**Botones:**
```
Normal:     [Botón Azul] - Hover: Azul oscuro
Secondary:  [Botón Gris] - Hover: Gris claro
Danger:     [Botón Rojo] - Hover: Rojo oscuro
```

**Tarjetas:**
```
┌──────────────────┐
│ Contenido...     │  - Fondo blanco
│                  │  - Shadow ligero
│                  │  - Border gris claro
└──────────────────┘
```

**States:**
```
✓ Completado    - Verde + checkmark
⏳ Pendiente    - Amarillo
❌ Cancelado    - Rojo
```

---

## 📊 Account Page - Vista Mobile

```
Ancho: 100% del viewport

┌──────────────────────┐
│ ☰ 👤 Mi Cuenta      │
├──────────────────────┤
│ Gestiona tu perfil.. │
│                      │
│ Perfil|Compras|...   │ (scrolleable)
│                      │
│ [Contenido del Tab]  │
│ Se expande full-width│
│ Con padding          │
│                      │
└──────────────────────┘
```

### Tabs en Mobile

```
┌──────────────────────────────────┐
│ 👤Perfil│🛍️Compras│📄Recibos│... │
├──────────────────────────────────┤

Tabs son:
- Scrolleable horizontalmente
- Fuente más pequeña
- Padding reducido
- Underline cuando activo
```

---

## 🔄 Interactividad

### Sidebar Open/Close Animation

```
CLOSED:                          OPENING:
┌─────┐                         ┌─────────────────┐
│ ☰   │ ──(click)──>           │ Sidebar         │
│     │                         │ (animating in)  │
└─────┘                         └─────────────────┘

Time: 300ms
Animation: Ease-in-out
Direction: Slide from left
```

### Tab Switch Animation

```
Current Tab:                     Click New Tab:
┌─────────────┐                ┌─────────────┐
│ Active Tab  │  ──(click)──>  │ New Tab     │
│ Content     │                │ Content     │
└─────────────┘                └─────────────┘

Time: Instant (CSS transition)
```

### Hover Effects

```
Menu Item:
┌──────────────────┐           ┌──────────────────┐
│ 🚗 Servicios     │ ──>       │ 🚗 Servicios     │
│ text-gray-700    │           │ bg-gray-100      │
└──────────────────┘           └──────────────────┘

Button:
┌──────────────┐               ┌──────────────┐
│ Editar       │ ──>           │ Editar       │
│ bg-blue-600  │               │ bg-blue-700  │
└──────────────┘               └──────────────┘
```

---

## 📐 Dimensiones

### Desktop
- Sidebar width: 264px (fixed)
- Content width: 100% - 264px (flexible)
- Padding: 32px (p-8)
- Max width content: 1280px

### Mobile
- Full width: 100vw
- Sidebar width: 256px
- Padding: 16px (p-4)
- Sidebar overlay with dark background

### Tablet
- Sidebar: Fixed 264px
- Content: Flexible
- Padding: 24px (p-6)

---

## ✨ Animaciones Incluidas

```
1. Sidebar entrance/exit
   Duration: 300ms
   Type: Slide
   Easing: ease-in-out

2. Tab active indicator
   Duration: Instant
   Type: Underline
   Color: Blue

3. Button hover
   Duration: 200ms
   Type: Color change

4. Card hover
   Duration: 150ms
   Type: Shadow + scale
   Amount: +4px shadow
```

---

## 🎯 User Flow

### Flow: Home → Account

```
1. Usuario hace click en ☰ (Mobile) o ve Sidebar (Desktop)
   ↓
2. Click en "👤 Mi Cuenta"
   ↓
3. Navega a /account (URL cambia)
   ↓
4. Se carga Account Page
   ↓
5. Muestra Tab "Perfil" por defecto
   ↓
6. Usuario puede cambiar de tabs
```

### Flow: Ver Compras

```
1. En Account Page
   ↓
2. Click en Tab "🛍️ Mis Compras"
   ↓
3. Se carga lista de compras
   ↓
4. Usuario ve historial completo
   ↓
5. Puede ver precios y referencias
```

### Flow: Descargar Recibo

```
1. En Tab "📄 Recibos"
   ↓
2. Click en [📥 Descargar PDF]
   ↓
3. Se descarga el recibo
   (Función lista para conectar a backend)
```

---

## 🌐 Responsive Breakpoints

```
Mobile:     0px - 767px    (Hamburger visible)
Tablet:     768px - 1023px (Sidebar starts showing)
Desktop:    1024px+        (Full sidebar visible)
```

---

¡**Así se ve tu Sidebar y Account Page!** 🎉

Toda la interfaz es **profesional, moderna, y completamente funcional**.

Para verlo en acción:
```bash
npm run dev:webapp
```

¡Que lo disfrutes! 🚀
