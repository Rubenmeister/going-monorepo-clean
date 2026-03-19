#!/bin/bash

# Build and Push Containers in Parallel
# This script builds and pushes all Docker containers for the Going Platform in parallel

set -e

# Configuration
REGISTRY="${REGISTRY:-docker.io}"
NAMESPACE="${NAMESPACE:-going-platform}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKER_BUILD_ARGS="${DOCKER_BUILD_ARGS:-}"
PARALLEL_JOBS="${PARALLEL_JOBS:-4}"
DRY_RUN="${DRY_RUN:-false}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Services to build (extracted from Dockerfile stages)
SERVICES=(
    "transport-service:3003"
    "payment-service:3004"
    "ratings-service:3005"
    "analytics-service:3006"
    "chat-service:3007"
    "geolocation-service:3008"
)

# Additional services with individual Dockerfiles
ADDITIONAL_SERVICES=(
    "admin-dashboard:3000"
    "anfitriones-service:3001"
    "api-gateway:3000"
    "booking-service:3002"
    "envios-service:3010"
    "experiencias-service:3011"
    "notifications-service:3012"
    "tours-service:3013"
    "tracking-service:3014"
    "user-auth-service:3015"
)

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker found: $(docker --version)"
}

# Function to check Docker buildx support
check_buildx() {
    if docker buildx version &> /dev/null; then
        log_success "Docker buildx is available"
        return 0
    else
        log_warning "Docker buildx not available, will use standard docker build"
        return 1
    fi
}

# Function to build a service
build_service() {
    local service=$1
    local service_name=${service%:*}
    local port=${service#*:}

    log_info "Building ${service_name}..."

    local build_cmd="docker build -t ${REGISTRY}/${NAMESPACE}/${service_name}:${IMAGE_TAG}"

    # Check if service has individual Dockerfile
    if [ -f "${service_name}/Dockerfile" ]; then
        build_cmd="${build_cmd} -f ${service_name}/Dockerfile ."
    else
        # Use multi-stage build from root Dockerfile
        build_cmd="${build_cmd} --target ${service_name} ."
    fi

    if [ "${DRY_RUN}" = "true" ]; then
        log_info "[DRY RUN] Would execute: ${build_cmd}"
    else
        if eval "${build_cmd}" > "/tmp/${service_name}_build.log" 2>&1; then
            log_success "Built ${service_name}"
            return 0
        else
            log_error "Failed to build ${service_name}"
            echo "Log: /tmp/${service_name}_build.log"
            return 1
        fi
    fi
}

# Function to push a service
push_service() {
    local service=$1
    local service_name=${service%:*}

    log_info "Pushing ${service_name}..."

    local push_cmd="docker push ${REGISTRY}/${NAMESPACE}/${service_name}:${IMAGE_TAG}"

    if [ "${DRY_RUN}" = "true" ]; then
        log_info "[DRY RUN] Would execute: ${push_cmd}"
    else
        if eval "${push_cmd}" > "/tmp/${service_name}_push.log" 2>&1; then
            log_success "Pushed ${service_name}"
            return 0
        else
            log_error "Failed to push ${service_name}"
            echo "Log: /tmp/${service_name}_push.log"
            return 1
        fi
    fi
}

# Function to build and push a service
build_and_push_service() {
    local service=$1

    build_service "$service" && push_service "$service"
    return $?
}

# Function to run jobs in parallel
run_in_parallel() {
    local -a services=("$@")
    local active_jobs=0
    local failed_jobs=0

    for service in "${services[@]}"; do
        # Wait if we've reached max parallel jobs
        while [ $(jobs -r -p | wc -l) -ge ${PARALLEL_JOBS} ]; do
            sleep 0.1
        done

        # Start build and push in background
        build_and_push_service "$service" || ((failed_jobs++)) &
    done

    # Wait for all background jobs
    wait

    return ${failed_jobs}
}

# Function to display help
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -r, --registry REGISTRY       Docker registry (default: docker.io)
    -n, --namespace NAMESPACE     Image namespace (default: going-platform)
    -t, --tag TAG                 Image tag (default: latest)
    -j, --parallel JOBS           Number of parallel jobs (default: 4)
    -d, --dry-run                 Show what would be done without doing it
    -s, --services SERVICES       Comma-separated list of services to build
    -h, --help                    Show this help message

Examples:
    # Build and push all services
    $0

    # Build and push with specific registry
    $0 -r gcr.io -n my-project -t v1.0.0

    # Dry run to see what would happen
    $0 --dry-run

    # Build specific services only
    $0 -s transport-service,payment-service

    # Use 8 parallel jobs
    $0 -j 8

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -j|--parallel)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN="true"
            shift
            ;;
        -s|--services)
            IFS=',' read -ra REQUESTED_SERVICES <<< "$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "=========================================="
    log_info "Going Platform - Container Build & Push"
    log_info "=========================================="
    log_info "Registry: ${REGISTRY}"
    log_info "Namespace: ${NAMESPACE}"
    log_info "Tag: ${IMAGE_TAG}"
    log_info "Parallel Jobs: ${PARALLEL_JOBS}"
    log_info "Dry Run: ${DRY_RUN}"
    log_info "=========================================="

    # Check prerequisites
    check_docker
    check_buildx || true

    # Determine which services to build
    local services_to_build=()

    if [ -n "${REQUESTED_SERVICES:-}" ]; then
        log_info "Building requested services only..."
        services_to_build=("${REQUESTED_SERVICES[@]}")
    else
        log_info "Building all available services..."
        services_to_build=("${SERVICES[@]}" "${ADDITIONAL_SERVICES[@]}")
    fi

    # Run builds and pushes in parallel
    log_info "Starting parallel build and push with ${PARALLEL_JOBS} concurrent jobs..."

    if run_in_parallel "${services_to_build[@]}"; then
        log_success "All services built and pushed successfully!"
        exit 0
    else
        log_error "Some services failed to build or push"
        exit 1
    fi
}

# Run main function
main
