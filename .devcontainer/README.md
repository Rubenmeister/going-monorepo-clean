# Configuración de Dev Container / Codespaces

Esta carpeta configura el entorno de desarrollo en la nube (**GitHub Codespaces**)
y local (**VS Code Dev Containers**) para el monorepo.

## Qué incluye

- **Node 18** (coincide con `.nvmrc` → `18.20.0`)
- **pnpm** habilitado vía corepack (gestor obligatorio del monorepo)
- **Docker-in-Docker** para poder levantar `docker-compose.yml` (MongoDB, Redis, etc.)
- **GitHub CLI** (`gh`) para trabajar con PRs
- Instalación automática de dependencias (`pnpm install`) al crear el contenedor
- Creación automática de `.env` a partir de `.env.example`
- Extensiones de VS Code preinstaladas (Prettier, ESLint, Jest, Playwright, Nx, Docker, Tailwind)
- Reenvío automático de puertos de desarrollo (3000, 6006, etc.)

## Cómo usarlo

### En GitHub Codespaces
1. Repo en GitHub → botón **`< > Code`** → pestaña **Codespaces** → **Create codespace**.
2. Espera a que termine `post-create.sh` (instala dependencias).
3. Ejecuta, por ejemplo, `pnpm dev:webapp`.

### En local con VS Code
1. Instala la extensión **Dev Containers** y Docker Desktop.
2. Abre el repo → `Ctrl/Cmd + Shift + P` → **Dev Containers: Reopen in Container**.

## Personalización
- Cambia recursos (CPU/RAM) en `hostRequirements` o al crear el Codespace en GitHub.
- Añade o quita puertos en `forwardPorts` dentro de `devcontainer.json`.
