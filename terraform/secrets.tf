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

# JWT Secret for authentication
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "JWT_SECRET-${var.environment}"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "jwt_secret_val" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

# Kushki Payment Gateway Keys
resource "google_secret_manager_secret" "kushki_public_key" {
  secret_id = "KUSHKI_PUBLIC_KEY-${var.environment}"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "kushki_public_key_val" {
  secret      = google_secret_manager_secret.kushki_public_key.id
  secret_data = var.kushki_public_key
}

resource "google_secret_manager_secret" "kushki_private_key" {
  secret_id = "KUSHKI_PRIVATE_KEY-${var.environment}"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "kushki_private_key_val" {
  secret      = google_secret_manager_secret.kushki_private_key.id
  secret_data = var.kushki_private_key
}

# Twilio SMS/OTP Credentials
resource "google_secret_manager_secret" "twilio_account_sid" {
  secret_id = "TWILIO_ACCOUNT_SID-${var.environment}"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "twilio_account_sid_val" {
  secret      = google_secret_manager_secret.twilio_account_sid.id
  secret_data = var.twilio_account_sid
}

resource "google_secret_manager_secret" "twilio_auth_token" {
  secret_id = "TWILIO_AUTH_TOKEN-${var.environment}"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "twilio_auth_token_val" {
  secret      = google_secret_manager_secret.twilio_auth_token.id
  secret_data = var.twilio_auth_token
}

# Firebase Configuration
resource "google_secret_manager_secret" "firebase_project_id" {
  secret_id = "FIREBASE_PROJECT_ID-${var.environment}"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "firebase_project_id_val" {
  secret      = google_secret_manager_secret.firebase_project_id.id
  secret_data = var.firebase_project_id
}

# IAM Permission for Cloud Run to access secrets
data "google_project" "project" {}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}
