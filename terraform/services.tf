locals {
  # List of all microservices to deploy (must match app directory names)
  services = [
    "api-gateway",
    "user-auth-service",
    "transport-service",
    "parcel-service",
    "booking-service",
    "notifications-service",
    "host-service",
    "tours-service",
    "experience-service",
    "tracking-service",
    "payment-service"
  ]

  # Port mappings for each service (Standardized to 3000 for Cloud Run)
  service_ports = {
    "api-gateway"           = 3000
    "user-auth-service"     = 3000
    "transport-service"     = 3000
    "parcel-service"        = 3000
    "payment-service"       = 3000
    "notifications-service" = 3000
    "booking-service"       = 3000
    "tours-service"         = 3000
    "experience-service"    = 3000
    "host-service"          = 3000
    "tracking-service"      = 3000
  }

  # Service discovery URLs for API Gateway (Cloud Run internal URLs)
  service_urls = {
    USER_AUTH_SERVICE_URL    = "https://user-auth-service-${var.environment}-${var.region}.a.run.app"
    TRANSPORT_SERVICE_URL    = "https://transport-service-${var.environment}-${var.region}.a.run.app"
    PARCEL_SERVICE_URL       = "https://parcel-service-${var.environment}-${var.region}.a.run.app"
    PAYMENT_SERVICE_URL      = "https://payment-service-${var.environment}-${var.region}.a.run.app"
    NOTIFICATIONS_SERVICE_URL = "https://notifications-service-${var.environment}-${var.region}.a.run.app"
    BOOKING_SERVICE_URL      = "https://booking-service-${var.environment}-${var.region}.a.run.app"
    TOURS_SERVICE_URL        = "https://tours-service-${var.environment}-${var.region}.a.run.app"
    EXPERIENCE_SERVICE_URL   = "https://experience-service-${var.environment}-${var.region}.a.run.app"
    HOST_SERVICE_URL         = "https://host-service-${var.environment}-${var.region}.a.run.app"
    TRACKING_SERVICE_URL     = "https://tracking-service-${var.environment}-${var.region}.a.run.app"
  }
}

resource "google_cloud_run_service" "default" {
  for_each = toset(local.services)

  name     = "${each.value}-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/${each.value}:latest"
        
        ports {
          container_port = local.service_ports[each.value]
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
        
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.db_url.secret_id
              key  = "latest"
            }
          }
        }

        # JWT Secret for auth-related services
        dynamic "env" {
          for_each = contains(["api-gateway", "user-auth-service"], each.value) ? [1] : []
          content {
            name = "JWT_SECRET"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.jwt_secret.secret_id
                key  = "latest"
              }
            }
          }
        }

        # Redis URL for tracking service
        dynamic "env" {
          for_each = each.value == "tracking-service" ? [1] : []
          content {
            name  = "REDIS_HOST"
            value = google_redis_instance.cache.host
          }
        }

        dynamic "env" {
          for_each = each.value == "tracking-service" ? [1] : []
          content {
            name  = "REDIS_PORT"
            value = tostring(google_redis_instance.cache.port)
          }
        }

        # Service discovery URLs for API Gateway
        dynamic "env" {
          for_each = each.value == "api-gateway" ? local.service_urls : {}
          content {
            name  = env.key
            value = env.value
          }
        }

        # Notifications Service Credentials
        dynamic "env" {
          for_each = each.value == "notifications-service" ? [1] : []
          content {
            name = "TWILIO_ACCOUNT_SID"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.twilio_account_sid.secret_id
                key  = "latest"
              }
            }
          }
        }

        dynamic "env" {
          for_each = each.value == "notifications-service" ? [1] : []
          content {
            name = "TWILIO_AUTH_TOKEN"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.twilio_auth_token.secret_id
                key  = "latest"
              }
            }
          }
        }

        dynamic "env" {
          for_each = each.value == "notifications-service" ? [1] : []
          content {
            name = "TWILIO_FROM_NUMBER"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.twilio_from_number.secret_id
                key  = "latest"
              }
            }
          }
        }

        dynamic "env" {
          for_each = each.value == "notifications-service" ? [1] : []
          content {
            name = "RESEND_API_KEY"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.resend_api_key.secret_id
                key  = "latest"
              }
            }
          }
        }

        dynamic "env" {
          for_each = each.value == "notifications-service" ? [1] : []
          content {
            name = "META_WA_ACCESS_TOKEN"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.meta_wa_access_token.secret_id
                key  = "latest"
              }
            }
          }
        }

        dynamic "env" {
          for_each = each.value == "notifications-service" ? [1] : []
          content {
            name = "META_WA_PHONE_NUMBER_ID"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.meta_wa_phone_number_id.secret_id
                key  = "latest"
              }
            }
          }
        }

        # Payment Service Credentials
        dynamic "env" {
          for_each = each.value == "payment-service" ? [1] : []
          content {
            name = "KUSHKI_PUBLIC_KEY"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.kushki_public_key.secret_id
                key  = "latest"
              }
            }
          }
        }

        dynamic "env" {
          for_each = each.value == "payment-service" ? [1] : []
          content {
            name = "KUSHKI_PRIVATE_MERCHANT_ID"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.kushki_private_merchant_id.secret_id
                key  = "latest"
              }
            }
          }
        }
      }
    }

    metadata {
      annotations = {
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.name
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
        "autoscaling.knative.dev/minScale"        = var.environment == "prod" ? "1" : "0"
        "autoscaling.knative.dev/maxScale"        = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_artifact_registry_repository.repo]
}

# Allow unauthenticated access to API Gateway (others should be secured)
resource "google_cloud_run_service_iam_member" "api_gateway_public" {
  service  = google_cloud_run_service.default["api-gateway"].name
  location = google_cloud_run_service.default["api-gateway"].location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
