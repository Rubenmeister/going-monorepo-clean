# GOING PLATFORM DESIGN SYSTEM

**Version:** 1.0.0  
**Status:** ✅ Production Ready

A unified design system for all Going platform applications, ensuring consistency across web, mobile, and admin interfaces.

---

## 🎨 Design System Components

### 1. **Color Palette**

#### Primary Blue - `#5B8EFF` (Trust & Tech)

```
primary-50:   #F0F5FF  (Lightest)
primary-100:  #E0EBFF
primary-200:  #C1D7FF
primary-300:  #A3C3FF
primary-400:  #7FA8FF
primary-500:  #5B8EFF  ← PRIMARY (Use this most)
primary-600:  #4B7AE8
primary-700:  #3B66D1
primary-800:  #2B52BA
primary-900:  #1B3EA3
primary-950:  #0B2A8C  (Darkest)
```

#### Accent Orange - `#FF9A5B` (Action & Energy)

```
accent-50:    #FFF5F0
accent-100:   #FFEBE0
accent-200:   #FFD7C1
accent-300:   #FFC3A3
accent-400:   #FFAE7F
accent-500:   #FF9A5B  ← ACCENT (Use for CTAs)
accent-600:   #E8854B
accent-700:   #D1703B
accent-800:   #BA5B2B
accent-900:   #A3461B
accent-950:   #8C310B
```

#### Semantic Colors

```
✅ Success:  #10B981 (Green)
⚠️  Warning:  #F59E0B (Amber)
❌ Error:    #EF4444 (Red)
ℹ️  Info:     #3B82F6 (Blue)
```

#### Neutral Palette (Backgrounds, Borders, Text)

```
neutral-50:   #F9FAFB  ← Lightest background
neutral-100:  #F3F4F6
neutral-200:  #E5E7EB  ← Light borders
neutral-300:  #D1D5DB
neutral-400:  #9CA3AF  ← Medium text
neutral-500:  #6B7280  ← Secondary text
neutral-600:  #4B5563  ← Dark text
neutral-700:  #374151
neutral-800:  #1F2937
neutral-900:  #111827  ← Darkest text
neutral-950:  #030712
```

---

## 📝 Typography System

### Font Stack

**Primary (Sans-serif):** Inter

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Display (Headings):** Poppins

```css
font-family: 'Poppins', 'Inter', sans-serif;
```

**Monospace (Code):** Fira Code

```css
font-family: 'Fira Code', 'Courier New', monospace;
```

### Font Sizes

```
xs:    12px (0.75rem)  - Captions, small text
sm:    14px (0.875rem) - Small labels
base:  16px (1rem)     - Body text
lg:    18px (1.125rem) - Large body
xl:    20px (1.25rem)  - Subheadings
2xl:   24px (1.5rem)   - Section titles
3xl:   30px (1.875rem) - Page titles
4xl:   36px (2.25rem)  - Large headings
5xl:   48px (3rem)     - Extra large headings
```

### Font Weights

```
thin:       100
extralight: 200
light:      300
normal:     400 (default)
medium:     500
semibold:   600 (headings)
bold:       700
extrabold:  800
black:      900
```

### Text Styles

| Style     | Size | Weight | Use Case          |
| --------- | ---- | ------ | ----------------- |
| h1        | 48px | 700    | Page title        |
| h2        | 36px | 700    | Section heading   |
| h3        | 30px | 600    | Subsection        |
| h4        | 24px | 600    | Card title        |
| h5        | 20px | 600    | Label             |
| h6        | 16px | 600    | Tertiary          |
| body      | 16px | 400    | Main content      |
| bodySmall | 14px | 400    | Secondary content |
| caption   | 12px | 500    | Captions, hints   |

---

## 📐 Spacing Scale (4px base)

```
0:   0px       (none)
1:   4px       (tiny)
2:   8px       (small)
3:   12px
4:   16px      (standard)
5:   20px
6:   24px      (component)
8:   32px      (container)
12:  48px      (section)
16:  64px
20:  80px
24:  96px
32:  128px
48:  192px
64:  256px
96:  384px
```

### Common Patterns

```
section-padding:    48px (12)
container-padding:  32px (8)
component-padding:  24px (6)
element-padding:    16px (4)
small-gap:          8px  (2)
tiny-gap:           4px  (1)
```

---

## 🎭 Shadows & Elevation

```
none:      No shadow (base level)
xs:        1px 2px at 5% opacity (subtle)
sm:        1px 3px at 10% opacity (slight)
md:        4px 6px at 10% opacity (floating)
lg:        10px 15px at 10% opacity (dropdown)
xl:        20px 25px at 10% opacity (modal)
2xl:       25px 50px at 25% opacity (overlay)
inner:     Inset shadow (depth inside)
```

### Elevation Levels

```
base:      No shadow
raised:    xs shadow
floating:  md shadow
dropdown:  lg shadow
modal:     xl shadow
tooltip:   sm shadow
```

---

## 🔧 Usage in Applications

### Option 1: Import from Design System

```typescript
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
} from '@going-monorepo-clean/design-system';

// Use in components
const boxStyle = {
  backgroundColor: COLORS.primary[500],
  padding: SPACING[6],
  borderRadius: '8px',
  boxShadow: SHADOWS.md,
  fontSize: TYPOGRAPHY.fontSize.base,
  fontWeight: TYPOGRAPHY.fontWeight.semibold,
};
```

### Option 2: Use in Tailwind Classes

```jsx
// All apps now have these utilities available
<button className="bg-primary text-white px-6 py-4 rounded-lg shadow-md hover:bg-primary-dark">
  Click me
</button>

<div className="grid grid-cols-3 gap-6 p-8 bg-bg-secondary">
  <h1 className="text-4xl font-bold text-neutral-900">Heading</h1>
  <p className="text-base text-neutral-600">Body text</p>
</div>
```

### Option 3: CSS Variables (Dark Mode)

```css
/* Automatically available via dark-mode.css */
:root {
  --color-primary: #5b8eff;
  --color-accent: #ff9a5b;
  --color-success: #10b981;
  /* ... all colors ... */
}

html.dark {
  --color-primary: #7fa8ff;
  --color-accent: #ffae7f;
  /* ... dark mode overrides ... */
}
```

```css
/* Use in components */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-md);
}
```

---

## 🎯 Application Updates

### Configuration Changes

**tailwind.config.js** (all apps):

```javascript
import baseConfig from '@going-monorepo-clean/design-system/tailwind.config.base';

export default {
  ...baseConfig,
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
};
```

**tsconfig.base.json**:

```json
{
  "paths": {
    "@going-monorepo-clean/design-system": ["libs/design-system/src/index.ts"]
  }
}
```

---

## 📋 Implementation Checklist

### Applications Updated

- [ ] frontend-webapp
- [ ] admin-dashboard
- [ ] corporate-portal
- [ ] mobile-driver-app
- [ ] mobile-user-app

### Files to Update per App

- [ ] tailwind.config.js
- [ ] Navbar/Header components
- [ ] Color usage
- [ ] Typography
- [ ] Spacing/padding

---

## 🎨 Design Principles

### 1. **Accessibility First**

- Sufficient color contrast (WCAG AA minimum)
- Semantic color meaning (not color-only)
- Keyboard navigation support

### 2. **Consistency**

- Use design tokens, not magic numbers
- One color per semantic meaning
- Standardized spacing scale

### 3. **Clarity**

- Clear visual hierarchy
- Consistent button styles
- Predictable component behavior

### 4. **Scalability**

- Tokens support future growth
- Easy to add new colors/sizes
- Works across all platforms

### 5. **Performance**

- Minimal CSS output
- No unused utilities
- Efficient theme switching

---

## 🔄 Migration Guide

### From Multiple Color Systems → Unified System

**Before:**

```javascript
// frontend-webapp
const PRIMARY = '#ff4c41';

// admin-dashboard
const PRIMARY = '#0033A0';

// corporate-portal
const PRIMARY = '#2563EB';
```

**After:**

```javascript
import { COLORS } from '@going-monorepo-clean/design-system';

const PRIMARY = COLORS.primary[500]; // #5B8EFF - Same everywhere
```

### Updating Components

**Before:**

```jsx
<button className="bg-red-500 px-4 py-3 text-white rounded">Book Now</button>
```

**After:**

```jsx
<button className="bg-primary px-6 py-4 text-white rounded-lg shadow-md hover:shadow-lg">
  Book Now
</button>
```

---

## 📚 Resources

- **Figma Design File:** [Link to design file]
- **Component Library:** Storybook at http://localhost:6006
- **CSS Variables:** `libs/shared/ui/src/styles/dark-mode.css`
- **Tailwind Config:** `libs/design-system/src/tailwind.config.base.ts`

---

## 🚀 Future Enhancements

- [ ] Theme variants (company-specific branding)
- [ ] Animated transitions library
- [ ] Icon system integration
- [ ] Component variants documentation
- [ ] RTL language support

---

**Last Updated:** 2026-02-21  
**Maintained By:** Engineering Team  
**Questions?** See `/libs/design-system/README.md`
