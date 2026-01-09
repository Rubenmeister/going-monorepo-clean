resource "google_secret_manager_secret" "db_url" {
  secret_id = "DATABASE_URL-${var.environment}"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_url_val" {
  secret      = google_secret_manager_secret.db_url.id
  secret_data = "postgresql://going_user:${var.db_password}@${google_sql_database_instance.main.private_ip_address}:5432/going_db"
}

# Add other secrets here (STRIPE_KEY, JWT_SECRET, etc.)
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "JWT_SECRET-${var.environment}"
  replication {
    auto {}
  }
}
