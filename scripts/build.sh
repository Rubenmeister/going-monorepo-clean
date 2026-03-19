#!/bin/bash

# Convenience wrapper for building and pushing containers
# Automatically detects best build method and handles common tasks

set -e

# Configuration from environment or defaults
REGISTRY="${REGISTRY:-docker.io}"
NAMESPACE="${NAMESPACE:-going-platform}"
TAG="${TAG:-latest}"
BUILD_METHOD="${BUILD_METHOD:-auto}"
DRY_RUN="${DRY_RUN:-false}"
SERVICES="${SERVICES:-}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_section() { echo -e "\n${MAGENTA}=== $1 ===${NC}\n"; }

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

show_help() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    build           Build containers
    push            Build and push containers
    buildx          Build with buildx (multi-platform)
    auth            Manage Docker registry authentication
    status          Show build system status
    help            Show this help message

Options (Global):
    -r, --registry REGISTRY     Docker registry (default: docker.io)
    -n, --namespace NAMESPACE   Image namespace (default: going-platform)
    -t, --tag TAG               Image tag (default: latest)
    -d, --dry-run               Show what would be done
    -s, --services SERVICES     Comma-separated service list

Build Options:
    -j, --parallel N            Number of parallel jobs (default: 4)
    -p, --platforms PLATFORMS   Target platforms for buildx

Examples:
    # Build containers
    $0 build

    # Build and push with specific tag
    $0 push -t v1.0.0

    # Build with buildx (multi-platform)
    $0 buildx -p linux/amd64,linux/arm64

    # Authenticate to registry before pushing
    $0 auth docker-hub

    # Build specific services only
    $0 build -s transport-service,payment-service

    # Dry run to see what would happen
    $0 build --dry-run

Environment Variables:
    REGISTRY                Docker registry URL
    NAMESPACE               Image namespace
    TAG                     Image tag
    DOCKER_BUILD_ARGS       Additional Docker build arguments
    PARALLEL_JOBS           Number of parallel build jobs
    DRY_RUN                 Set to 'true' for dry run

EOF
}

# Detect Docker capabilities
detect_buildx() {
    if docker buildx version &> /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Show system status
show_status() {
    log_section "Build System Status"

    # Docker
    if command -v docker &> /dev/null; then
        log_success "Docker: $(docker --version)"
    else
        log_error "Docker: NOT INSTALLED"
    fi

    # Docker buildx
    if detect_buildx; then
        log_success "Docker buildx: Available"
    else
        log_warning "Docker buildx: Not available (multi-platform builds disabled)"
    fi

    # Docker authentication
    log_info "Docker authentication status:"
    if [ -f "$HOME/.docker/config.json" ]; then
        if command -v jq &> /dev/null; then
            if jq -e '.auths | length > 0' "$HOME/.docker/config.json" &> /dev/null; then
                echo "  $(jq -r '.auths | keys[]' "$HOME/.docker/config.json" | wc -l) registry/registries authenticated"
            else
                echo "  Not authenticated"
            fi
        else
            echo "  Config exists (jq needed to check details)"
        fi
    else
        echo "  Not authenticated"
    fi

    # Dockerfile detection
    log_info "Services found:"
    local count=$(find "$PROJECT_ROOT" -maxdepth 2 -name "Dockerfile" -not -path "*/node_modules/*" | wc -l)
    echo "  $count Dockerfiles"
}

# Build containers
build_containers() {
    local build_script="$SCRIPT_DIR/build-and-push-containers.sh"

    if [ ! -f "$build_script" ]; then
        log_error "Build script not found: $build_script"
        return 1
    fi

    log_section "Building Containers"

    local build_cmd="bash $build_script"
    build_cmd="${build_cmd} -r ${REGISTRY}"
    build_cmd="${build_cmd} -n ${NAMESPACE}"
    build_cmd="${build_cmd} -t ${TAG}"

    if [ "$DRY_RUN" = "true" ]; then
        build_cmd="${build_cmd} -d"
    fi

    if [ -n "$SERVICES" ]; then
        build_cmd="${build_cmd} -s ${SERVICES}"
    fi

    log_info "Executing: $build_cmd"
    eval "$build_cmd"
}

# Build with buildx
build_with_buildx() {
    local buildx_script="$SCRIPT_DIR/build-and-push-buildx.sh"

    if [ ! -f "$buildx_script" ]; then
        log_error "Buildx script not found: $buildx_script"
        return 1
    fi

    log_section "Building with Buildx (Multi-platform)"

    local build_cmd="bash $buildx_script"
    build_cmd="${build_cmd} -r ${REGISTRY}"
    build_cmd="${build_cmd} -n ${NAMESPACE}"
    build_cmd="${build_cmd} -t ${TAG}"

    if [ "$DRY_RUN" = "true" ]; then
        build_cmd="${build_cmd} -d"
    fi

    if [ -n "$SERVICES" ]; then
        build_cmd="${build_cmd} -s ${SERVICES}"
    fi

    log_info "Executing: $build_cmd"
    eval "$build_cmd"
}

# Manage authentication
manage_auth() {
    local auth_script="$SCRIPT_DIR/docker-auth.sh"

    if [ ! -f "$auth_script" ]; then
        log_error "Auth script not found: $auth_script"
        return 1
    fi

    bash "$auth_script" "$@"
}

# Parse arguments
COMMAND="${1:-help}"
shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--registry) REGISTRY="$2"; shift 2 ;;
        -n|--namespace) NAMESPACE="$2"; shift 2 ;;
        -t|--tag) TAG="$2"; shift 2 ;;
        -d|--dry-run) DRY_RUN="true"; shift ;;
        -s|--services) SERVICES="$2"; shift 2 ;;
        -j|--parallel) PARALLEL_JOBS="$2"; shift 2 ;;
        -p|--platforms) PLATFORMS="$2"; shift 2 ;;
        -h|--help) show_help; exit 0 ;;
        *) log_error "Unknown option: $1"; show_help; exit 1 ;;
    esac
done

main() {
    case "$COMMAND" in
        build)
            build_containers
            log_section "Build Complete"
            ;;
        push)
            build_containers
            log_success "All containers built and pushed!"
            ;;
        buildx)
            if ! detect_buildx; then
                log_error "Docker buildx is required for this command"
                exit 1
            fi
            build_with_buildx
            ;;
        auth)
            manage_auth "$@"
            ;;
        status)
            show_status
            ;;
        help|-h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main
