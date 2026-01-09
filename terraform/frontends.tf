resource "google_cloud_run_service" "admin_dashboard" {
  name     = "admin-dashboard-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/admin-dashboard:latest"
        
        ports {
          container_port = 3000
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        # Add public logic or authentication check here
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service" "frontend_webapp" {
  name     = "frontend-webapp-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/frontend-webapp:latest"
        
        ports {
          container_port = 80
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow public access to Frontend and Admin (assuming they implement their own auth/login)
resource "google_cloud_run_service_iam_member" "admin_public" {
  service  = google_cloud_run_service.admin_dashboard.name
  location = google_cloud_run_service.admin_dashboard.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend_webapp.name
  location = google_cloud_run_service.frontend_webapp.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "admin_dashboard_url" {
  value = google_cloud_run_service.admin_dashboard.status[0].url
}

output "frontend_webapp_url" {
  value = google_cloud_run_service.frontend_webapp.status[0].url
}
