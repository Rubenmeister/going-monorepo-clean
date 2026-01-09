resource "google_compute_network" "vite_vpc" {
  name                    = "vite-vpc-${var.environment}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "vite_subnet" {
  name          = "vite-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vite_vpc.id
}

# Connector for Cloud Run to access VPC (Cloud SQL/Redis)
resource "google_vpc_access_connector" "connector" {
  name          = "vpc-conn-${var.environment}"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vite_vpc.id
}
