# GOING PLATFORM - COMPONENT VARIANTS GUIDE

## Component Library Reference

All components are built with Tailwind CSS and the Going design system. This guide documents all available variants and usage patterns.

---

## 📘 BUTTON COMPONENT

### Variants

#### Primary Button (Most Used)

```jsx
<button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 active:bg-primary-700 transition-colors">
  Primary Action
</button>
```

**Use Case:** Main call-to-action buttons (Book Now, Submit, Confirm)

#### Secondary Button

```jsx
<button className="bg-primary-100 text-primary-900 px-6 py-3 rounded-lg font-semibold hover:bg-primary-200 transition-colors">
  Secondary Action
</button>
```

**Use Case:** Secondary actions, alternatives

#### Accent Button (High Emphasis)

```jsx
<button className="bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-600 active:bg-accent-700 transition-colors">
  Special Action
</button>
```

**Use Case:** Highlight special actions, promotions

#### Success Button

```jsx
<button className="bg-success text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
  Confirm
</button>
```

**Use Case:** Confirmations, success actions

#### Danger Button

```jsx
<button className="bg-error text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 active:bg-red-700 transition-colors">
  Delete
</button>
```

**Use Case:** Destructive actions (delete, cancel)

#### Ghost Button

```jsx
<button className="bg-transparent text-primary px-6 py-3 rounded-lg font-semibold border border-primary-200 hover:bg-primary-50 transition-colors">
  Ghost Action
</button>
```

**Use Case:** Tertiary actions, light emphasis

#### Text-Only Button

```jsx
<button className="text-primary font-semibold hover:underline">
  Text Link
</button>
```

**Use Case:** Links, minimal emphasis

### Sizes

```jsx
// Small
<button className="px-4 py-2 text-sm rounded-md">Small</button>

// Medium (Default)
<button className="px-6 py-3 text-base rounded-lg">Medium</button>

// Large
<button className="px-8 py-4 text-lg rounded-lg">Large</button>
```

### States

```jsx
// Loading
<button className="bg-primary text-white px-6 py-3 rounded-lg opacity-70 cursor-not-allowed">
  <span className="inline-block animate-spin">⟳</span> Loading...
</button>

// Disabled
<button disabled className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed">
  Disabled
</button>

// Full Width
<button className="w-full bg-primary text-white px-6 py-3 rounded-lg">
  Full Width
</button>

// With Icon
<button className="bg-primary text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
  <span>🚗</span> Book Ride
</button>
```

---

## 🎴 CARD COMPONENT

### Basic Card

```jsx
<div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
  <h3 className="text-xl font-semibold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600">Card content goes here.</p>
</div>
```

### Card with Header and Footer

```jsx
<div className="bg-white rounded-xl shadow-md overflow-hidden">
  {/* Header */}
  <div className="bg-primary-50 px-6 py-4 border-b border-primary-200">
    <h2 className="text-lg font-semibold text-primary-900">Card Header</h2>
  </div>

  {/* Body */}
  <div className="p-6">
    <p className="text-gray-600">Card body content.</p>
  </div>

  {/* Footer */}
  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
    <button className="px-4 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100">
      Cancel
    </button>
    <button className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-600">
      Save
    </button>
  </div>
</div>
```

### Stat Card

```jsx
<div className="bg-white rounded-xl shadow-md p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-medium text-gray-600">Total Bookings</h3>
    <span className="text-2xl">📊</span>
  </div>
  <div className="flex items-baseline gap-2">
    <p className="text-3xl font-bold text-gray-900">1,234</p>
    <span className="text-sm text-green-600">↑ 12.5%</span>
  </div>
  <p className="text-xs text-gray-500 mt-4">compared to last month</p>
</div>
```

### Hover Card

```jsx
<div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer hover:bg-primary-50">
  Content that responds to hover
</div>
```

---

## ✏️ INPUT COMPONENT

### Text Input

```jsx
<div className="w-full">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input
    type="email"
    placeholder="you@example.com"
    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
  />
  <p className="text-xs text-gray-500 mt-1">We'll never share your email.</p>
</div>
```

### Input with Error

```jsx
<div className="w-full">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Password
  </label>
  <input
    type="password"
    className="w-full px-4 py-3 border-2 border-error rounded-lg text-gray-900 focus:ring-2 focus:ring-error focus:border-transparent outline-none transition"
  />
  <p className="text-xs text-error mt-1">Password must be 8+ characters</p>
</div>
```

### Textarea

```jsx
<div className="w-full">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Message
  </label>
  <textarea
    rows={4}
    placeholder="Type your message..."
    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
  />
</div>
```

### Select Dropdown

```jsx
<div className="w-full">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Service Type
  </label>
  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition">
    <option>Select a service...</option>
    <option>🚗 Transport</option>
    <option>🏨 Accommodation</option>
    <option>🗺️ Tours</option>
    <option>🎭 Experiences</option>
  </select>
</div>
```

---

## 🔔 ALERT COMPONENT

### Success Alert

```jsx
<div className="bg-success-50 border border-success-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <span className="text-xl">✅</span>
    <div>
      <h4 className="font-semibold text-success-900">Success!</h4>
      <p className="text-sm text-success-700 mt-1">
        Your ride has been booked.
      </p>
    </div>
    <button className="ml-auto text-success-600 hover:text-success-700">
      ✕
    </button>
  </div>
</div>
```

### Error Alert

```jsx
<div className="bg-error-50 border border-error-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <span className="text-xl">❌</span>
    <div>
      <h4 className="font-semibold text-error-900">Error</h4>
      <p className="text-sm text-error-700 mt-1">
        Payment failed. Please try again.
      </p>
    </div>
  </div>
</div>
```

### Warning Alert

```jsx
<div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <span className="text-xl">⚠️</span>
    <div>
      <h4 className="font-semibold text-warning-900">Warning</h4>
      <p className="text-sm text-warning-700 mt-1">
        High demand area - prices may vary.
      </p>
    </div>
  </div>
</div>
```

### Info Alert

```jsx
<div className="bg-info-50 border border-info-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <span className="text-xl">ℹ️</span>
    <div>
      <h4 className="font-semibold text-info-900">Information</h4>
      <p className="text-sm text-info-700 mt-1">Driver is 5 minutes away.</p>
    </div>
  </div>
</div>
```

---

## 🏷️ BADGE COMPONENT

### Color Variants

```jsx
// Primary
<span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
  Primary
</span>

// Success
<span className="inline-flex items-center px-3 py-1 rounded-full bg-success-100 text-success-700 text-sm font-medium">
  ✓ Completed
</span>

// Warning
<span className="inline-flex items-center px-3 py-1 rounded-full bg-warning-100 text-warning-700 text-sm font-medium">
  ⏳ Pending
</span>

// Error
<span className="inline-flex items-center px-3 py-1 rounded-full bg-error-100 text-error-700 text-sm font-medium">
  ✕ Cancelled
</span>
```

### Status Badges

```jsx
// Active
<span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
  🟢 Active
</span>

// In Progress
<span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
  🔵 In Progress
</span>

// Inactive
<span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
  ⚪ Inactive
</span>
```

---

## 🎯 MODAL COMPONENT

### Basic Modal

```jsx
{
  /* Backdrop */
}
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
  {/* Modal */}
  <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">Confirm Action</h2>
    </div>

    {/* Body */}
    <div className="px-6 py-4">
      <p className="text-gray-600">Are you sure you want to proceed?</p>
    </div>

    {/* Footer */}
    <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3 justify-end">
      <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">
        Cancel
      </button>
      <button className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-600 rounded-lg transition">
        Confirm
      </button>
    </div>
  </div>
</div>;
```

---

## ⏳ LOADING STATE

### Loading Spinner

```jsx
<div className="flex items-center justify-center p-8">
  <div className="animate-spin text-4xl">⟳</div>
  <span className="ml-4 text-gray-600">Loading...</span>
</div>
```

### Skeleton Loading

```jsx
<div className="space-y-4">
  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
  <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
</div>
```

---

## 🎨 LAYOUT PATTERNS

### Two Column Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="bg-white rounded-xl shadow-md p-6">Column 1</div>
  <div className="bg-white rounded-xl shadow-md p-6">Column 2</div>
</div>
```

### Three Column Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-white rounded-xl shadow-md p-6">Column 1</div>
  <div className="bg-white rounded-xl shadow-md p-6">Column 2</div>
  <div className="bg-white rounded-xl shadow-md p-6">Column 3</div>
</div>
```

### Flex Layout

```jsx
<div className="flex flex-col md:flex-row gap-6">
  <div className="flex-1 bg-white rounded-xl shadow-md p-6">Sidebar</div>
  <div className="flex-2 bg-white rounded-xl shadow-md p-6">Main Content</div>
</div>
```

---

## 📱 RESPONSIVE UTILITIES

```jsx
// Hidden on mobile
<div className="hidden md:block">Desktop only</div>

// Mobile menu
<nav className="md:hidden">Mobile Navigation</nav>

// Responsive text size
<h1 className="text-2xl md:text-4xl">Responsive Heading</h1>

// Responsive padding
<div className="p-4 md:p-8">Responsive padding</div>

// Responsive grid columns
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  Grid items
</div>
```

---

## ✨ ANIMATIONS

```jsx
// Fade in
<div className="animate-fadeIn">Content</div>

// Slide up
<div className="transform translate-y-4 opacity-0 transition-all duration-300 animate-slideUp">
  Content
</div>

// Scale
<div className="hover:scale-105 transition-transform">Hover to scale</div>

// Pulse
<div className="animate-pulse">Loading indicator</div>

// Spin
<div className="animate-spin">Loading...</div>
```

---

## 🎯 COLOR QUICK REFERENCE

| Color         | Hex     | Use                             |
| ------------- | ------- | ------------------------------- |
| Primary Blue  | #5B8EFF | Buttons, links, primary actions |
| Accent Orange | #FF9A5B | Highlights, special actions     |
| Success Green | #10B981 | Success states, confirmations   |
| Warning Amber | #F59E0B | Warnings, cautions              |
| Error Red     | #EF4444 | Errors, destructive actions     |
| Info Blue     | #3B82F6 | Informational content           |
| Neutral Gray  | #6B7280 | Text, borders, backgrounds      |

---

## 📝 NAMING CONVENTIONS

- **Primary**: Main brand action
- **Secondary**: Alternative action
- **Accent**: Highlight/special action
- **Success**: Positive outcome
- **Warning**: Caution needed
- **Error**: Error/destructive
- **Ghost**: Minimal emphasis
- **Disabled**: Cannot interact
- **Loading**: Processing state

---

## 🚀 IMPLEMENTATION CHECKLIST

- [ ] All buttons use unified color system
- [ ] All cards have consistent styling
- [ ] All inputs have error states
- [ ] All alerts use semantic colors
- [ ] All badges are color-coded
- [ ] All modals have backdrop
- [ ] All loading states visible
- [ ] Responsive design working
- [ ] Dark mode support added
- [ ] Accessibility tested

---

**Last Updated:** 2026-02-21  
**Design System Version:** 1.0.0  
**Compatible Apps:** All frontend applications
