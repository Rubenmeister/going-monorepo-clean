variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The default GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "The password for the Cloud SQL database user"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
  default     = "prod"
}
