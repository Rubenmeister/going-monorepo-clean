# frontend-stores

This library contains all global state management stores for the frontend application using Zustand.

## Stores

### Auth Store (`useAuthStore`)

Manages authentication state including:
- JWT token and refresh token
- User profile information
- Authentication status
- Error handling
- Persistent storage with SSR-safe hydration

**Usage:**
```typescript
import { useAuthStore } from '@going-monorepo-clean/frontend-stores';

const { token, user, isAuthenticated } = useAuthStore();
const { setAuth, clearAuth } = useAuthStore();
```

### UI Store (`useUIStore`)

Manages UI state including:
- Modal management (open/close)
- Toast notifications
- Sidebar visibility
- Theme preference
- Global loading state

**Usage:**
```typescript
import { useUIStore } from '@going-monorepo-clean/frontend-stores';

const { sidebarOpen, toggleSidebar } = useUIStore();
const { addNotification, removeNotification } = useUIStore();
```

## Installation

The stores are automatically available when the frontend package is used.

## Features

- **Zustand-based**: Lightweight state management
- **Persistence**: Auth store persists to localStorage with SSR safety
- **TypeScript**: Fully typed for better developer experience
- **No boilerplate**: Minimal setup required for new stores
- **Dev tools**: Works with Zustand DevTools browser extension
