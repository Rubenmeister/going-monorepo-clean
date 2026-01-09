locals {
  # List of all microservices to deploy
  services = [
    "api-gateway",
    "user-service",
    "transport-service",
    "parcel-service",
    "accommodation-service",
    "notification-service",
    "host-service",
    "tours-service",
    "experience-service",
    "tracking-service",
    "payment-service"
  ]
}

resource "google_cloud_run_service" "default" {
  for_each = toset(local.services)

  name     = "${each.value}-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/${each.value}:latest"
        
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
        
        # Add other common env vars here
      }
    }

    metadata {
      annotations = {
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.name
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
        "autoscaling.knative.dev/minScale"        = "0" # Scale to zero to save costs in dev/staging
        "autoscaling.knative.dev/maxScale"        = "5"
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
