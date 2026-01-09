output "vpc_name" {
  value = google_compute_network.vite_vpc.name
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.name}"
}

output "db_instance_connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "api_gateway_url" {
  value = google_cloud_run_service.default["api-gateway"].status[0].url
}
