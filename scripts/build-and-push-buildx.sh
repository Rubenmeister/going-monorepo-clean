#!/bin/bash

# Build and Push Containers using Docker Buildx (Multi-platform)
# Enables parallel builds with push to registry

set -e

# Configuration
REGISTRY="${REGISTRY:-docker.io}"
NAMESPACE="${NAMESPACE:-going-platform}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
PUSH="${PUSH:-true}"
DRY_RUN="${DRY_RUN:-false}"
BUILD_CONTEXT="${BUILD_CONTEXT:-.}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Services
SERVICES=(
    "transport-service"
    "payment-service"
    "ratings-service"
    "analytics-service"
    "chat-service"
    "geolocation-service"
)

ADDITIONAL_SERVICES=(
    "admin-dashboard"
    "anfitriones-service"
    "api-gateway"
    "booking-service"
    "envios-service"
    "experiencias-service"
    "notifications-service"
    "tours-service"
    "tracking-service"
    "user-auth-service"
)

# Check prerequisites
check_buildx() {
    if ! docker buildx version &> /dev/null; then
        log_error "Docker buildx is not installed"
        log_info "Install buildx: https://github.com/docker/buildx#installation"
        exit 1
    fi
    log_success "Docker buildx found: $(docker buildx version)"
}

# Create or get builder
ensure_builder() {
    local builder_name="going-platform-builder"

    if ! docker buildx inspect "$builder_name" &> /dev/null; then
        log_info "Creating buildx builder: $builder_name"
        if docker buildx create --name "$builder_name" --platform linux/amd64,linux/arm64; then
            log_success "Created builder: $builder_name"
        else
            log_error "Failed to create builder"
            return 1
        fi
    else
        log_success "Using existing builder: $builder_name"
    fi

    return 0
}

# Build a service with buildx
build_service_buildx() {
    local service=$1
    local image="${REGISTRY}/${NAMESPACE}/${service}:${IMAGE_TAG}"

    log_info "Building ${service} (${image})..."

    local dockerfile=""
    if [ -f "${service}/Dockerfile" ]; then
        dockerfile="${service}/Dockerfile"
    else
        dockerfile="Dockerfile"
    fi

    local buildx_cmd="docker buildx build"
    buildx_cmd="${buildx_cmd} --file ${dockerfile}"
    buildx_cmd="${buildx_cmd} --tag ${image}"
    buildx_cmd="${buildx_cmd} --platform ${PLATFORMS}"

    # Use multi-stage target if building from root Dockerfile
    if [ "$dockerfile" = "Dockerfile" ]; then
        buildx_cmd="${buildx_cmd} --target ${service}"
    fi

    if [ "${PUSH}" = "true" ]; then
        buildx_cmd="${buildx_cmd} --push"
    else
        buildx_cmd="${buildx_cmd} --load"
    fi

    buildx_cmd="${buildx_cmd} ${BUILD_CONTEXT}"

    if [ "${DRY_RUN}" = "true" ]; then
        log_info "[DRY RUN] Would execute: ${buildx_cmd}"
    else
        if eval "${buildx_cmd}" > "/tmp/${service}_buildx.log" 2>&1; then
            log_success "Built ${service}"
            return 0
        else
            log_error "Failed to build ${service}"
            echo "Log: /tmp/${service}_buildx.log"
            return 1
        fi
    fi
}

# Build all services in parallel using buildx
build_all_parallel() {
    local -a services=("$@")
    local failed_count=0

    log_info "Building ${#services[@]} services in parallel..."

    # Start all builds in background
    for service in "${services[@]}"; do
        (
            if ! build_service_buildx "$service"; then
                exit 1
            fi
        ) &
    done

    # Wait for all background jobs and count failures
    for job in $(jobs -p); do
        if ! wait "$job"; then
            ((failed_count++))
        fi
    done

    return ${failed_count}
}

show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -r, --registry REGISTRY       Docker registry (default: docker.io)
    -n, --namespace NAMESPACE     Image namespace (default: going-platform)
    -t, --tag TAG                 Image tag (default: latest)
    -p, --platforms PLATFORMS     Target platforms (default: linux/amd64,linux/arm64)
    --no-push                     Build only, don't push to registry
    -d, --dry-run                 Show what would be done
    -s, --services SERVICES       Comma-separated service list
    -h, --help                    Show this help message

Examples:
    # Build and push all services (multi-platform)
    $0

    # Build amd64 only
    $0 -p linux/amd64

    # Build without pushing
    $0 --no-push

    # Dry run
    $0 --dry-run

    # Specific services
    $0 -s transport-service,payment-service

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--registry) REGISTRY="$2"; shift 2 ;;
        -n|--namespace) NAMESPACE="$2"; shift 2 ;;
        -t|--tag) IMAGE_TAG="$2"; shift 2 ;;
        -p|--platforms) PLATFORMS="$2"; shift 2 ;;
        --no-push) PUSH="false"; shift ;;
        -d|--dry-run) DRY_RUN="true"; shift ;;
        -s|--services) IFS=',' read -ra REQUESTED_SERVICES <<< "$2"; shift 2 ;;
        -h|--help) show_help; exit 0 ;;
        *) log_error "Unknown option: $1"; show_help; exit 1 ;;
    esac
done

main() {
    log_info "=========================================="
    log_info "Going Platform - Buildx Container Builder"
    log_info "=========================================="
    log_info "Registry: ${REGISTRY}"
    log_info "Namespace: ${NAMESPACE}"
    log_info "Tag: ${IMAGE_TAG}"
    log_info "Platforms: ${PLATFORMS}"
    log_info "Push: ${PUSH}"
    log_info "Dry Run: ${DRY_RUN}"
    log_info "=========================================="

    check_buildx
    ensure_builder

    local services_to_build=()
    if [ -n "${REQUESTED_SERVICES:-}" ]; then
        services_to_build=("${REQUESTED_SERVICES[@]}")
    else
        services_to_build=("${SERVICES[@]}" "${ADDITIONAL_SERVICES[@]}")
    fi

    if build_all_parallel "${services_to_build[@]}"; then
        log_success "All services built successfully!"
        exit 0
    else
        log_error "Some services failed"
        exit 1
    fi
}

main
