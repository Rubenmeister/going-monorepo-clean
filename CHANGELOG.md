# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/your-org/going-monorepo/compare/v1.1.0...v1.2.0) (2025-12-13)

## 1.1.0 (2025-12-13)


### ♻️ Refactoring

* reorganizar estructura libs/*-frontend según arquitectura DDD ([205c53a](https://github.com/your-org/going-monorepo/commit/205c53a72176274c0c3271904d7dea2ce33bfa11))


### 🐛 Bug Fixes

* UI de Login/Registro funcional y corrección de sintaxis en App.tsx ([3498a4d](https://github.com/your-org/going-monorepo/commit/3498a4d47621ce70559febe64461be700875457a))


### 🚀 Features

* add Vite configuration for the frontend web application, including React, Tailwind CSS, and PWA support. ([d6f070e](https://github.com/your-org/going-monorepo/commit/d6f070ef6baf450a777140e63e4dd9d47f727a32))
* Conversión a PWA (Manifiesto, Iconos y Configuración Vite) ([546c981](https://github.com/your-org/going-monorepo/commit/546c98107174032cbc6157e801e6b151b8e653a0))
* Despliegue exitoso de Producción con Dashboard de 9 servicios ([3e4e0fb](https://github.com/your-org/going-monorepo/commit/3e4e0fb33297542bf44e0e111b87855b7468d504))
* Establish initial monorepo project structure with prototype, web, and mobile applications, including shared UI components. ([bb238bf](https://github.com/your-org/going-monorepo/commit/bb238bfed13a567c3643e55ffb86480d446626f7))
* Implement core services, shared libraries, and frontend components within the monorepo. ([6786e72](https://github.com/your-org/going-monorepo/commit/6786e722b293c75252c3864a296131d17353f7e5))
* Implement initial mobile user and driver apps, frontend web app components, and repository reporting tools. ([e31a1a2](https://github.com/your-org/going-monorepo/commit/e31a1a2616cf1468d6d7afabd108bde97005df10))
* Implement initial monorepo structure with core services, domains, and client applications. ([e7afbc9](https://github.com/your-org/going-monorepo/commit/e7afbc94131b94a7cf1ff5d35cb9d27474b61784))
* Monorepo, login funcional conectado a Backend y diseño Tailwind base ([206dfad](https://github.com/your-org/going-monorepo/commit/206dfad127b58d5d8c5a39413bfd3f7b6c3bd822))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🚀 Features

- Initial monorepo setup with NX
- API Gateway with observability and security
- Backend microservices (user-auth, booking, tours, transport, payment, tracking, notifications, host, experience, parcel)
- Mobile apps (user, driver)
- Admin dashboard
- Frontend webapp

### 🔧 Configuration

- OpenAPI/Swagger documentation
- Health checks and structured logging
- Rate limiting and security headers
- Dependabot for dependency updates
- Module boundary enforcement
