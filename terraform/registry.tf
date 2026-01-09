resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "going-repo-${var.environment}"
  description   = "Docker repository for Going Superapp services"
  format        = "DOCKER"
}
