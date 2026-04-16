# 🚀 Going Monorepo - Setup & Development Guide

## Prerequisites

- Node.js 18+ or 20+
- pnpm (recommended) or npm

## Installation

### Using pnpm (Recommended)

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install dependencies
pnpm install
```

### Using npm

```bash
npm install
```

## Development

### Start Frontend Webapp

```bash
# Using npm scripts
npm run dev:webapp

# Or directly
cd frontend-webapp
pnpm next dev
# or
npx next dev
```

The webapp will be available at **http://localhost:3000**

### Available Scripts

```bash
# Frontend Webapp
npm run dev:webapp      # Start development server
npm run build:webapp    # Production build
npm run start:webapp    # Start production server
npm run lint:webapp     # Run ESLint

# Monorepo
npm run install:all     # Install all dependencies
npm run dev:all         # Start all services (currently webapp only)
```

## Project Structure

```
going-monorepo-clean/
├── frontend-webapp/         # Next.js web application
├── admin-dashboard/         # Admin dashboard
├── mobile-driver-app/       # React Native driver app
├── mobile-user-app/         # React Native user app
├── api-gateway/             # NestJS API Gateway
├── user-auth-service/       # Authentication service
├── booking-service/         # Booking service
├── [other services]/        # Various microservices
├── libs/                    # Shared libraries
│   ├── frontend/           # Frontend shared code
│   ├── shared/             # Shared utilities
│   └── domains/            # Domain-specific libraries
└── pnpm-workspace.yaml     # Workspace configuration
```

## Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: NestJS 11
- **Mobile**: React Native
- **Package Manager**: pnpm
- **Build Tools**: SWC, Webpack
- **Testing**: Jest, Vitest, Playwright
- **Code Quality**: ESLint, Prettier

## Known Issues & Fixes

### ✅ Fixed Issues

1. **Turbopack Configuration**: Removed from `next.config.js` (not compatible with Next.js 15.2.9)
2. **Frontend Webapp Targets**: Added build, serve, and lint targets to `project.json`
3. **Monorepo Structure**: Created `pnpm-workspace.yaml` and added `package.json` to all services
4. **Import Extensions**: Fixed TypeScript import paths with explicit extensions

### ⚠️ Nx Status

- **Issue**: Nx CLI throws SIGBUS error (system-level issue)
- **Workaround**: Using direct pnpm/npm scripts and webpack instead
- **Status**: Frontend and services work independently without Nx CLI

## Troubleshooting

### Port 3000 already in use

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
cd frontend-webapp
pnpm next dev -p 3001
```

### Build errors with @swc/core

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Import resolution errors

Make sure `tsconfig.base.json` paths are correctly configured and all referenced libraries exist.

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally: `npm run dev:webapp`
4. Commit changes with clear messages
5. Push to the branch and create a PR

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [pnpm Documentation](https://pnpm.io)
- [Nx Documentation](https://nx.dev) (for reference, CLI not currently functional)
