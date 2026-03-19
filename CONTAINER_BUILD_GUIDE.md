# Container Build & Push Guide

This guide explains how to build and push containers in parallel for the Going Platform monorepo.

## Overview

The Going Platform uses a sophisticated multi-container architecture with Docker. This guide provides tools and scripts to build and push all containers efficiently in parallel.

### Features

- **Parallel Builds**: Build multiple containers simultaneously
- **Multi-Platform Support**: Build for multiple architectures (x86_64, ARM64)
- **Registry Support**: Works with Docker Hub, GCR, ECR, and custom registries
- **Flexible Deployment**: Multiple build methods to choose from
- **Dry Run Mode**: Preview changes before executing
- **Authentication Management**: Helper scripts for registry login

## Quick Start

### Build All Containers

```bash
# Using shell script
./scripts/build.sh build

# Using Makefile
make -f Makefile.containers build

# Build with custom tag
make -f Makefile.containers build TAG=v1.0.0 REGISTRY=gcr.io NAMESPACE=my-project
```

### Build and Push to Registry

```bash
# Authenticate first
./scripts/build.sh auth docker-hub

# Then build and push
./scripts/build.sh push

# Or using Makefile
make -f Makefile.containers auth-docker-hub
make -f Makefile.containers push TAG=v1.0.0
```

### Build with Buildx (Multi-platform)

For multi-platform builds (amd64, arm64):

```bash
# Using script
./scripts/build.sh buildx

# Using Makefile
make -f Makefile.containers buildx PLATFORMS=linux/amd64,linux/arm64
```

## Installation & Setup

### Prerequisites

- Docker 19.03 or higher
- `docker-buildx` plugin (optional, for multi-platform builds)
- `jq` (optional, for status checking)

### Setup Buildx (Optional)

For efficient multi-platform builds:

```bash
# Install buildx
docker buildx create --name going-platform-builder

# Or setup automatically
./scripts/build-and-push-buildx.sh
```

## Usage

### Main Build Script

```bash
./scripts/build.sh [COMMAND] [OPTIONS]

Commands:
  build       Build containers
  push        Build and push containers
  buildx      Build with buildx (multi-platform)
  auth        Manage Docker registry authentication
  status      Show build system status
  help        Show help message

Options:
  -r, --registry REGISTRY     Docker registry (default: docker.io)
  -n, --namespace NAMESPACE   Image namespace (default: going-platform)
  -t, --tag TAG               Image tag (default: latest)
  -d, --dry-run               Show what would be done
  -s, --services SERVICES     Comma-separated service list
```

### Examples

```bash
# Build all containers
./scripts/build.sh build

# Build and push with specific tag
./scripts/build.sh push -t v1.0.0

# Build specific services only
./scripts/build.sh build -s transport-service,payment-service

# Dry run to preview
./scripts/build.sh build --dry-run

# Use different registry
./scripts/build.sh push -r gcr.io -n my-project

# Build with buildx
./scripts/build.sh buildx -p linux/amd64,linux/arm64
```

### Direct Build Script

For more control, use the individual build scripts:

```bash
# Standard parallel build
./scripts/build-and-push-containers.sh \
  -r docker.io \
  -n going-platform \
  -t latest \
  -j 4

# Buildx (multi-platform)
./scripts/build-and-push-buildx.sh \
  -r gcr.io \
  -n my-project \
  -t v1.0.0 \
  -p linux/amd64,linux/arm64

# Specific services only
./scripts/build-and-push-containers.sh \
  -s transport-service,payment-service
```

## Makefile Usage

The `Makefile.containers` provides convenient targets:

```bash
# Basic builds
make -f Makefile.containers build              # Build all
make -f Makefile.containers push               # Build and push
make -f Makefile.containers buildx             # Multi-platform build

# With options
make -f Makefile.containers build TAG=v1.0.0 REGISTRY=gcr.io

# Individual services
make -f Makefile.containers build-transport    # Build specific service
make -f Makefile.containers push-payment       # Push specific service

# Authentication
make -f Makefile.containers auth-docker-hub    # Docker Hub login
make -f Makefile.containers auth-gcr           # GCR login
make -f Makefile.containers auth-ecr           # ECR login
make -f Makefile.containers auth-status        # Check auth status

# System info
make -f Makefile.containers status              # Show system status
make -f Makefile.containers list-services       # List all services
make -f Makefile.containers docker-version      # Show Docker version
```

## Docker Registry Authentication

### Docker Hub

```bash
# Interactive login
./scripts/docker-auth.sh docker-hub

# Via script
./scripts/build.sh auth docker-hub

# Via Makefile
make -f Makefile.containers auth-docker-hub
```

### Google Container Registry (GCR)

```bash
# Using gcloud
./scripts/docker-auth.sh gcr

# Using service account key
./scripts/docker-auth.sh gcr \
  --key-file /path/to/service-account-key.json \
  --project my-gcp-project
```

### AWS ECR

```bash
# With default AWS profile
./scripts/docker-auth.sh ecr

# With specific region and profile
./scripts/docker-auth.sh ecr us-west-2 my-profile
```

### Custom Registry

```bash
./scripts/docker-auth.sh custom my-registry.com myusername mypassword
```

### Check Authentication Status

```bash
./scripts/docker-auth.sh status
make -f Makefile.containers auth-status
```

## Services

### Multi-stage Build Services

Built from the root `Dockerfile` using multi-stage targets:

- `transport-service` (port 3003)
- `payment-service` (port 3004)
- `ratings-service` (port 3005)
- `analytics-service` (port 3006)
- `chat-service` (port 3007)
- `geolocation-service` (port 3008)

### Individual Dockerfile Services

Services with their own Dockerfiles:

- `admin-dashboard` (port 3000)
- `anfitriones-service` (port 3001)
- `api-gateway` (port 3000)
- `booking-service` (port 3002)
- `envios-service` (port 3010)
- `experiencias-service` (port 3011)
- `notifications-service` (port 3012)
- `tours-service` (port 3013)
- `tracking-service` (port 3014)
- `user-auth-service` (port 3015)

### Build Specific Services

```bash
# Build only certain services
./scripts/build.sh build -s transport-service,payment-service

# Via Makefile
make -f Makefile.containers build-transport build-payment

# Push specific services
./scripts/build.sh push -s ratings-service,analytics-service
```

## Environment Variables

```bash
# Registry configuration
export REGISTRY=gcr.io
export NAMESPACE=my-project
export TAG=v1.0.0

# Build configuration
export PARALLEL_JOBS=8
export DOCKER_BUILD_ARGS="--progress=plain"

# Buildx configuration
export PLATFORMS=linux/amd64,linux/arm64

# Run builds with environment variables
./scripts/build.sh build
```

## Advanced Usage

### Dry Run (Preview)

Preview what will be built without executing:

```bash
./scripts/build.sh build --dry-run

# Via Makefile
make -f Makefile.containers build-dry
```

### Parallel Build Jobs

Control the number of concurrent builds:

```bash
# Default is 4 jobs
./scripts/build-and-push-containers.sh -j 8

# Via environment variable
PARALLEL_JOBS=8 ./scripts/build.sh build
```

### Custom Build Arguments

Pass additional arguments to Docker build:

```bash
export DOCKER_BUILD_ARGS="--progress=plain --no-cache"
./scripts/build.sh build
```

### Buildx with Load (No Push)

Build locally without pushing:

```bash
./scripts/build-and-push-buildx.sh --no-push
```

## Troubleshooting

### Docker Daemon Not Running

```bash
# Start Docker daemon
sudo systemctl start docker

# Or verify it's running
docker ps
```

### Authentication Failures

```bash
# Check authentication status
./scripts/docker-auth.sh status

# Logout and re-authenticate
./scripts/docker-auth.sh logout
./scripts/docker-auth.sh docker-hub
```

### Build Failures

Check the build logs:

```bash
# Build logs are saved to /tmp/
cat /tmp/service-name_build.log
cat /tmp/service-name_push.log
```

### Buildx Not Available

```bash
# Check if buildx is installed
docker buildx version

# Install buildx
docker buildx create --name going-platform-builder
```

### Permission Denied

Ensure Docker socket permissions:

```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect
```

## Performance Tips

1. **Use Buildx for Multi-platform Builds**: Faster and more efficient than building separately
2. **Increase Parallel Jobs**: For powerful machines, increase `PARALLEL_JOBS` (e.g., -j 8)
3. **Use BuildKit**: Enable Docker BuildKit for better caching: `export DOCKER_BUILDKIT=1`
4. **Minimize Layers**: Keep Dockerfile layers minimal to reduce build time
5. **Cache Dependencies**: Take advantage of layer caching by building dependencies first

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with more parallelism
make -f Makefile.containers push PARALLEL_JOBS=8
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Containers

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | \
            docker login -u "${{ secrets.REGISTRY_USERNAME }}" --password-stdin

      - name: Build and Push
        run: |
          ./scripts/build.sh push -t ${{ github.sha }}
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Buildx Guide](https://github.com/docker/buildx)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage)

## Support

For issues or questions:

- Check the troubleshooting section
- Review script comments for detailed explanations
- Run with `--help` flag for usage information
