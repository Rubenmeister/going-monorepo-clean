# Private Service Access (for Cloud SQL private IP)
resource "google_compute_global_address" "private_ip_address" {
  name          = "private-ip-address-${var.environment}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vite_vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vite_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

resource "google_sql_database_instance" "main" {
  name             = "going-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = var.environment == "prod" ? "db-custom-2-4096" : "db-f1-micro"
    
    ip_configuration {
      ipv4_enabled    = false # Private IP only
      private_network = google_compute_network.vite_vpc.id
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = var.environment == "prod"
      start_time                     = "03:00" # 3 AM UTC
    }

    maintenance_window {
      day  = 7 # Sunday
      hour = 4 # 4 AM UTC
    }
  }
  
  deletion_protection = var.environment == "prod"
}

resource "google_sql_database" "database" {
  name     = "going_db"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "users" {
  name     = "going_user"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}
