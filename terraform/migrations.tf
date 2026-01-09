resource "google_cloud_run_v2_job" "migration_job" {
  name     = "migration-job-${var.environment}"
  location = var.region

  template {
    template {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/migration-runner:latest"
        
        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret = google_secret_manager_secret.db_url.secret_id
              version = "latest"
            }
          }
        }
      }
      vpc_access {
        connector = google_vpc_access_connector.connector.id
        egress    = "ALL_TRAFFIC"
      }
    }
  }

  depends_on = [
    google_sql_database_instance.main,
    google_artifact_registry_repository.repo
  ]
}
