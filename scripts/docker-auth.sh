#!/bin/bash

# Docker Registry Authentication Helper
# Supports Docker Hub, GCR, ECR, and custom registries

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

show_help() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

Commands:
    docker-hub              Login to Docker Hub
    gcr                     Login to Google Container Registry
    ecr                     Login to AWS ECR
    custom                  Login to custom registry
    logout                  Logout from all registries
    status                  Show authentication status

Examples:
    # Docker Hub login
    $0 docker-hub

    # GCR with service account key
    $0 gcr --key-file /path/to/key.json --project my-project

    # ECR with AWS credentials
    $0 ecr --region us-east-1 --profile my-profile

    # Custom registry
    $0 custom --registry my-registry.com --username user

EOF
}

# Docker Hub authentication
auth_docker_hub() {
    local username="${1:-}"

    if [ -z "$username" ]; then
        log_info "Enter Docker Hub credentials"
        docker login
    else
        log_info "Please provide password via stdin or interactive prompt"
        docker login -u "$username"
    fi

    if [ $? -eq 0 ]; then
        log_success "Successfully authenticated to Docker Hub"
    else
        log_error "Docker Hub authentication failed"
        return 1
    fi
}

# Google Container Registry authentication
auth_gcr() {
    local key_file="${1:-}"
    local project="${2:-}"
    local registry="gcr.io"

    if [ -z "$key_file" ]; then
        if ! command -v gcloud &> /dev/null; then
            log_error "gcloud CLI not found. Install it or provide --key-file"
            return 1
        fi

        log_info "Using gcloud authentication"
        if ! gcloud auth configure-docker "$registry"; then
            log_error "GCR authentication failed"
            return 1
        fi
    else
        if [ ! -f "$key_file" ]; then
            log_error "Service account key file not found: $key_file"
            return 1
        fi

        log_info "Using service account key: $key_file"
        cat "$key_file" | docker login -u _json_key --password-stdin "$registry"

        if [ $? -eq 0 ]; then
            log_success "Successfully authenticated to GCR"
        else
            log_error "GCR authentication failed"
            return 1
        fi
    fi
}

# AWS ECR authentication
auth_ecr() {
    local region="${1:-us-east-1}"
    local profile="${2:-default}"

    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found"
        return 1
    fi

    log_info "Authenticating to ECR in region: $region"

    if ! aws ecr get-login-password --region "$region" --profile "$profile" | \
         docker login --username AWS --password-stdin "$(aws sts get-caller-identity --profile "$profile" --query Account --output text).dkr.ecr.${region}.amazonaws.com"; then
        log_error "ECR authentication failed"
        return 1
    fi

    log_success "Successfully authenticated to ECR (region: $region)"
}

# Custom registry authentication
auth_custom() {
    local registry="${1:-}"
    local username="${2:-}"
    local password="${3:-}"

    if [ -z "$registry" ]; then
        log_error "Registry URL is required"
        return 1
    fi

    if [ -z "$username" ] || [ -z "$password" ]; then
        log_info "Enter credentials for $registry"
        docker login "$registry"
    else
        echo "$password" | docker login "$registry" -u "$username" --password-stdin
    fi

    if [ $? -eq 0 ]; then
        log_success "Successfully authenticated to $registry"
    else
        log_error "Authentication failed for $registry"
        return 1
    fi
}

# Check authentication status
check_auth_status() {
    log_info "Checking Docker authentication status..."

    if [ ! -f "$HOME/.docker/config.json" ]; then
        log_warning "Docker config not found. Not authenticated."
        return 1
    fi

    if command -v jq &> /dev/null; then
        local auths=$(jq '.auths | keys[]' "$HOME/.docker/config.json" 2>/dev/null)
        if [ -z "$auths" ]; then
            log_warning "No authenticated registries found"
            return 1
        fi

        log_success "Authenticated registries:"
        echo "$auths" | sed 's/"//g' | sed 's/^/  - /'
    else
        log_info "jq not found, cannot parse credentials"
        log_info "Check ~/.docker/config.json manually"
    fi
}

# Logout from all registries
logout_all() {
    log_info "Logging out from all registries..."
    docker logout
    log_success "Logged out"
}

# Main
main() {
    local command="${1:-help}"

    case "$command" in
        docker-hub)
            auth_docker_hub "${2:-}"
            ;;
        gcr)
            auth_gcr "${2:-}" "${3:-}"
            ;;
        ecr)
            auth_ecr "${2:-us-east-1}" "${3:-default}"
            ;;
        custom)
            auth_custom "${2:-}" "${3:-}" "${4:-}"
            ;;
        status)
            check_auth_status
            ;;
        logout)
            logout_all
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
